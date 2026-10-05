const crypto = require('crypto')
const path = require('path')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const storage = require('../lib/fileStorage')

const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.fig']
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 10
const DOWNLOAD_LINK_TTL = '1h'
const STORAGE_PREFIX = 'project-attachments/'

const PORTALS = {
  org: {
    attachment: () => prisma.orgProjectAttachment,
    project: () => prisma.orgProject,
    scopeField: 'orgId',
    managerRole: 'ORG_UPPER_MGMT',
    dataEntryRole: 'ORG_DATA_ENTRY',
    apiBase: '/org/projects',
  },
  client: {
    attachment: () => prisma.clientProjectAttachment,
    project: () => prisma.clientProject,
    scopeField: 'clientId',
    managerRole: 'CLIENT_UPPER_MGMT',
    dataEntryRole: 'CLIENT_DATA_ENTRY',
    apiBase: '/client/projects',
  },
}

// Download links carry their own short-lived signature so a plain <a href> works
// without the bearer token. A separate secret keeps them unusable as session tokens.
function linkSecret() {
  return `${process.env.JWT_SECRET}:attachment-download`
}

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

function handleError(res, err) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'حجم الملف يتجاوز 10 ميجابايت' })
    }
    return res.status(400).json({ message: err.message })
  }
  if (err.status) return res.status(err.status).json({ message: err.message })
  return res.status(500).json({ message: err.message })
}

function fileExt(name) {
  return path.extname(String(name || '')).toLowerCase()
}

function downloadPath(portal, attachment) {
  return `${PORTALS[portal].apiBase}/${attachment.projectId}/attachments/${attachment.id}/download`
}

function serialize(portal, attachment) {
  const sig = jwt.sign({ att: attachment.id, portal }, linkSecret(), { expiresIn: DOWNLOAD_LINK_TTL })
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    fileSize: attachment.fileSize,
    projectId: attachment.projectId,
    uploadedBy: attachment.uploadedBy,
    uploader: attachment.uploader,
    createdAt: attachment.createdAt,
    // Relative to the API root (e.g. /api); valid for DOWNLOAD_LINK_TTL.
    fileUrl: `${downloadPath(portal, attachment)}?sig=${encodeURIComponent(sig)}`,
    // Stable reference without a signature, for records such as contracts.
    downloadPath: downloadPath(portal, attachment),
  }
}

async function loadProject(portal, req, projectId) {
  const cfg = PORTALS[portal]
  const project = await cfg.project().findUnique({ where: { id: projectId } })
  if (!project) throw httpError(404, 'Project not found')
  if (req.user.role !== 'SUPER_ADMIN' && project[cfg.scopeField] !== req.user[cfg.scopeField]) {
    throw httpError(403, 'Access denied')
  }
  return project
}

// Data entry follows the same rule as project editing: only drafts and rejected projects.
function assertCanModify(portal, req, project) {
  const cfg = PORTALS[portal]
  if (req.user.role === 'SUPER_ADMIN') {
    throw httpError(403, 'Attachments are managed from the portal accounts')
  }
  if (req.user.role === cfg.dataEntryRole) {
    if (project.approvalStatus === 'PENDING') {
      throw httpError(403, 'Cannot change attachments while the project is pending approval')
    }
    if (project.approvalStatus === 'APPROVED') {
      throw httpError(403, 'Cannot change attachments on an approved project')
    }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  // Keep Arabic file names intact (busboy defaults to latin1).
  defParamCharset: 'utf8',
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_EXT.includes(fileExt(file.originalname))) {
      cb(httpError(400, 'نوع الملف غير مسموح'))
      return
    }
    cb(null, true)
  },
})

function receiveFiles(req, res, next) {
  upload.array('files', MAX_FILES)(req, res, (err) => {
    if (err) return handleError(res, err)
    next()
  })
}

function list(portal) {
  return async (req, res) => {
    try {
      const { projectId } = req.params
      await loadProject(portal, req, projectId)
      const rows = await PORTALS[portal].attachment().findMany({
        where: { projectId },
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      })
      res.json({ count: rows.length, attachments: rows.map((row) => serialize(portal, row)) })
    } catch (err) {
      handleError(res, err)
    }
  }
}

function create(portal) {
  return async (req, res) => {
    const savedKeys = []
    try {
      const { projectId } = req.params
      const project = await loadProject(portal, req, projectId)
      assertCanModify(portal, req, project)

      const files = req.files || []
      if (files.length === 0) return res.status(400).json({ message: 'No files received (field name: files)' })

      const records = []
      for (const file of files) {
        const key = `${STORAGE_PREFIX}${portal}/${projectId}/${crypto.randomUUID()}${fileExt(file.originalname)}`
        const contentType = file.mimetype || 'application/octet-stream'
        await storage.saveFile(key, file.buffer, contentType)
        savedKeys.push(key)
        records.push({
          fileName: file.originalname,
          fileType: contentType,
          fileSize: file.size,
          storageKey: key,
          projectId,
          uploadedBy: req.user.userId,
        })
      }

      const model = PORTALS[portal].attachment()
      const created = await prisma.$transaction(records.map((data) => model.create({ data })))
      res.status(201).json({ success: true, attachments: created.map((row) => serialize(portal, row)) })
    } catch (err) {
      await Promise.all(savedKeys.map((key) => storage.deleteFile(key)))
      handleError(res, err)
    }
  }
}

function remove(portal) {
  return async (req, res) => {
    try {
      const { projectId, id } = req.params
      const project = await loadProject(portal, req, projectId)
      assertCanModify(portal, req, project)

      const model = PORTALS[portal].attachment()
      const existing = await model.findUnique({ where: { id } })
      if (!existing || existing.projectId !== projectId) {
        return res.status(404).json({ message: 'Attachment not found' })
      }
      if (req.user.role === PORTALS[portal].dataEntryRole && existing.uploadedBy !== req.user.userId) {
        return res.status(403).json({ message: 'You can only remove attachments you uploaded' })
      }

      await model.delete({ where: { id } })
      await storage.deleteFile(existing.storageKey)
      res.json({ success: true, message: 'Attachment deleted' })
    } catch (err) {
      handleError(res, err)
    }
  }
}

// Accepts either a signed link (?sig=) or the normal bearer session.
function downloadAuth(portal, allowedRoles) {
  return (req, res, next) => {
    const sig = typeof req.query.sig === 'string' ? req.query.sig : ''
    if (!sig) {
      return auth(req, res, () => {
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' })
        next()
      })
    }
    try {
      const claims = jwt.verify(sig, linkSecret())
      if (claims.portal !== portal || claims.att !== req.params.id) throw new Error('mismatch')
      req.signedAttachment = true
      next()
    } catch {
      res.status(401).json({ message: 'انتهت صلاحية رابط التحميل. يرجى تحديث الصفحة' })
    }
  }
}

function download(portal) {
  return async (req, res) => {
    try {
      const { projectId, id } = req.params
      if (!req.signedAttachment) await loadProject(portal, req, projectId)

      const existing = await PORTALS[portal].attachment().findUnique({ where: { id } })
      if (!existing || existing.projectId !== projectId) {
        return res.status(404).json({ message: 'Attachment not found' })
      }
      if (!(await storage.fileExists(existing.storageKey))) {
        return res.status(404).json({ message: 'Attachment file is missing from storage' })
      }

      const asciiName = existing.fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
      res.setHeader('Content-Type', existing.fileType || 'application/octet-stream')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(existing.fileName)}`
      )
      res.setHeader('X-Content-Type-Options', 'nosniff')
      if (existing.fileSize) res.setHeader('Content-Length', String(existing.fileSize))

      const stream = storage.openReadStream(existing.storageKey)
      stream.on('error', (err) => {
        if (!res.headersSent) handleError(res, err)
        else res.destroy(err)
      })
      stream.pipe(res)
    } catch (err) {
      handleError(res, err)
    }
  }
}

async function attachmentsForProject(portal, projectId) {
  const rows = await PORTALS[portal].attachment().findMany({
    where: { projectId },
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((row) => serialize(portal, row))
}

async function deleteProjectFiles(portal, projectId) {
  await storage.deletePrefix(`${STORAGE_PREFIX}${portal}/${projectId}/`)
}

async function purgeAllAttachmentFiles() {
  await storage.deletePrefix(STORAGE_PREFIX)
}

module.exports = {
  receiveFiles,
  list,
  create,
  remove,
  download,
  downloadAuth,
  attachmentsForProject,
  deleteProjectFiles,
  purgeAllAttachmentFiles,
}
