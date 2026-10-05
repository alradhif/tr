const prisma = require('../lib/prisma')
const { attachmentsForProject, deleteProjectFiles } = require('./projectAttachmentsController')
const { writeAuditLog } = require('../lib/audit')
const { notifyOrgUsers } = require('../lib/notify')
const { stripUiFields, saveOrgProjectDetails } = require('../lib/projectExtras')

function isSystemManager(role) {
  return role === 'ORG_UPPER_MGMT' || role === 'SUPER_ADMIN'
}

function isDataEntry(role) {
  return role === 'ORG_DATA_ENTRY'
}

function sameOrgOrSuperAdmin(req, recordOrgId) {
  if (req.user.role === 'SUPER_ADMIN') return true
  return Boolean(req.user.orgId) && req.user.orgId === recordOrgId
}

async function withApproverName(project) {
  if (!project?.approvedBy) return project
  const actor = await prisma.orgUser.findUnique({
    where: { id: project.approvedBy },
    select: { id: true, name: true, email: true },
  })
  return { ...project, approvedByUser: actor }
}

const PROJECT_INCLUDE = {
  manager: { select: { id: true, name: true, email: true } },
  department: { select: { id: true, name: true } },
  executingCompany: { select: { id: true, name: true } },
  phases: true,
  teamMembers: true,
  deliverables: true,
}

async function loadOrgProject(id) {
  return prisma.orgProject.findUnique({
    where: { id },
    include: PROJECT_INCLUDE,
  })
}

async function auditProject(req, action, recordId, oldData, newData) {
  try {
    await writeAuditLog({
      action,
      tableName: 'org_projects',
      recordId,
      oldData,
      newData,
      performedBy: req.user.userId,
      actorType: req.user.type || 'ORG',
    })
  } catch {
    // Approval must still succeed if audit write fails.
  }
}

exports.createProject = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const userRole = req.user.role
    const {
      name,
      type,
      classification,
      description,
      startDate,
      endDate,
      budget,
      profitMargin,
      managerId,
      departmentId,
      executingCompanyId,
      orgProjectManagerName,
      clientProjectManagerName,
      orgEmail,
      clientEmail,
      orgPhone,
      clientPhone,
    } = req.body

    const resolvedManagerId = managerId || req.user.userId
    if (!name || !startDate || !endDate || !resolvedManagerId) {
      return res.status(400).json({
        message: 'Required fields: name, startDate, endDate, managerId',
      })
    }

    if (!orgId && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Org scope required' })
    }

    const manager = await prisma.orgUser.findUnique({ where: { id: resolvedManagerId } })
    if (!manager || (orgId && manager.orgId !== orgId)) {
      return res.status(400).json({ message: 'Invalid manager: must belong to same org' })
    }

    const managerCreatesOfficial = isSystemManager(userRole)
    const project = await prisma.orgProject.create({
      data: {
        name,
        type,
        classification,
        description,
        status: 'ACTIVE',
        approvalStatus: managerCreatesOfficial ? 'APPROVED' : 'DRAFT',
        approvedBy: managerCreatesOfficial ? req.user.userId : null,
        approvedAt: managerCreatesOfficial ? new Date() : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget || 0,
        profitMargin: profitMargin || 0,
        orgId: orgId || manager.orgId,
        managerId: resolvedManagerId,
        departmentId: departmentId || undefined,
        executingCompanyId: executingCompanyId || undefined,
        orgProjectManagerName,
        clientProjectManagerName,
        orgEmail,
        clientEmail,
        orgPhone,
        clientPhone,
      },
    })

    await saveOrgProjectDetails(project.id, req.body)
    await auditProject(req, 'CREATE', project.id, null, {
      approvalStatus: project.approvalStatus,
      name: project.name,
    })

    const full = await loadOrgProject(project.id)
    res.json({
      success: true,
      project: full,
      message: managerCreatesOfficial ? 'Project created and approved' : 'Project saved as draft',
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getProjects = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { status, approvalStatus } = req.query
    const where = { orgId }
    if (status) where.status = status
    if (approvalStatus) where.approvalStatus = approvalStatus

    const projects = await prisma.orgProject.findMany({
      where,
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ count: projects.length, projects })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getPendingProjects = async (req, res) => {
  try {
    const orgId = req.user.orgId
    if (!orgId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Org scope required' })
    }
    const where = { approvalStatus: 'PENDING' }
    if (req.user.role !== 'SUPER_ADMIN') where.orgId = orgId

    const projects = await prisma.orgProject.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        executingCompany: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'asc' },
    })
    res.json({ count: projects.length, projects })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params
    const project = await prisma.orgProject.findUnique({
      where: { id },
      include: { ...PROJECT_INCLUDE, risks: true },
    })
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (!sameOrgOrSuperAdmin(req, project.orgId)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    const attachments = await attachmentsForProject('org', id)
    res.json({ project: { ...(await withApproverName(project)), attachments } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const userRole = req.user.role
    const existing = await prisma.orgProject.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Project not found' })
    if (!sameOrgOrSuperAdmin(req, existing.orgId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (isDataEntry(userRole)) {
      if (existing.approvalStatus === 'PENDING') {
        return res.status(403).json({ message: 'Cannot edit a project while it is pending approval' })
      }
      if (existing.approvalStatus === 'APPROVED') {
        return res.status(403).json({
          message: 'Cannot edit approved projects. Contact the organization system manager.',
        })
      }
    }

    const data = stripUiFields(req.body)
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.orgId
    delete data.approvalStatus
    delete data.approvedBy
    delete data.approvedAt
    delete data.rejectionReason
    delete data.id

    const updated = await prisma.orgProject.update({ where: { id }, data })
    await saveOrgProjectDetails(id, req.body)
    await auditProject(req, 'UPDATE', id, { approvalStatus: existing.approvalStatus }, data)
    res.json({ success: true, project: updated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.submitProject = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.orgProject.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Project not found' })
    if (!sameOrgOrSuperAdmin(req, existing.orgId)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    if (!isDataEntry(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only Data Entry can submit projects for approval' })
    }
    if (existing.approvalStatus !== 'DRAFT' && existing.approvalStatus !== 'REJECTED') {
      return res.status(400).json({
        message: 'Only draft or rejected projects can be submitted for approval',
      })
    }

    const updated = await prisma.orgProject.update({
      where: { id },
      data: {
        approvalStatus: 'PENDING',
        rejectionReason: null,
        approvedBy: null,
        approvedAt: null,
      },
    })
    await auditProject(req, 'UPDATE', id, { approvalStatus: existing.approvalStatus }, { approvalStatus: 'PENDING' })
    try {
      await notifyOrgUsers({
        orgId: existing.orgId,
        roles: ['ORG_UPPER_MGMT'],
        title: 'مشروع بانتظار الموافقة',
        message: `تم إرسال المشروع «${existing.name}» للموافقة`,
        type: 'APPROVAL',
      })
    } catch {
      // Status is already persisted.
    }
    res.json({ success: true, project: updated, message: 'Project submitted for approval' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.approveProject = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.orgProject.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Project not found' })
    if (!sameOrgOrSuperAdmin(req, existing.orgId)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    if (existing.approvalStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending projects can be approved' })
    }

    const updated = await prisma.orgProject.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: req.user.userId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    })
    await auditProject(req, 'UPDATE', id, { approvalStatus: existing.approvalStatus }, { approvalStatus: 'APPROVED' })
    try {
      await notifyOrgUsers({
        orgId: existing.orgId,
        roles: ['ORG_DATA_ENTRY'],
        title: 'تم اعتماد المشروع',
        message: `تم اعتماد المشروع «${existing.name}»`,
        type: 'APPROVAL',
      })
    } catch {
      // Approval is already persisted.
    }
    res.json({ success: true, project: updated, message: 'Project approved' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.rejectProject = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' })
    }

    const existing = await prisma.orgProject.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Project not found' })
    if (!sameOrgOrSuperAdmin(req, existing.orgId)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    if (existing.approvalStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending projects can be rejected' })
    }

    const updated = await prisma.orgProject.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: String(reason).trim(),
        approvedBy: req.user.userId,
        approvedAt: null,
      },
    })
    await auditProject(req, 'UPDATE', id, { approvalStatus: existing.approvalStatus }, {
      approvalStatus: 'REJECTED',
      rejectionReason: updated.rejectionReason,
    })
    try {
      await notifyOrgUsers({
        orgId: existing.orgId,
        roles: ['ORG_DATA_ENTRY'],
        title: 'تم رفض المشروع',
        message: `تم رفض المشروع «${existing.name}»: ${updated.rejectionReason}`,
        type: 'REJECTION',
      })
    } catch {
      // Rejection is already persisted.
    }
    res.json({ success: true, project: updated, message: 'Project rejected' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.orgProject.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Project not found' })
    if (!sameOrgOrSuperAdmin(req, existing.orgId)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    await prisma.orgProject.delete({ where: { id } })
    await deleteProjectFiles('org', id).catch(() => {})
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
