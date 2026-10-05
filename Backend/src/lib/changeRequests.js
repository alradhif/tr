const prisma = require('./prisma')
const { createForUsers } = require('./notify')
const { KINDS } = require('./projectWorkflow')

const MODELS = {
  ORG: { request: () => prisma.orgChangeRequest, log: () => prisma.orgRequestLog },
  CLIENT: { request: () => prisma.clientChangeRequest, log: () => prisma.clientRequestLog },
}

const OPEN_STATUSES = ['PENDING', 'UNDER_REVIEW']

/** New change requests go to the account's upper management for a decision. */
async function notifyChangeRequestCreated(kind, project, changeRequest) {
  const cfg = KINDS[kind]
  const approvers = await cfg.user().findMany({
    where: { [cfg.scopeKey]: project[cfg.scopeKey], role: cfg.upperRole, isActive: true },
    select: { id: true },
  })
  await createForUsers(
    approvers.map((user) => user.id),
    kind,
    {
      title: 'طلب تغيير جديد',
      message: `طلب تغيير «${changeRequest.title}» على المشروع «${project.name}» بانتظار القرار`,
      type: 'REVIEW',
      link: `${cfg.basePath}/${project.id}`,
    },
  )
}

/**
 * Upper management decision on a change request: updates the status, writes the decision
 * log and tells the requester. Only open (pending / under review) requests can be decided.
 */
function changeRequestDecision(kind, decision) {
  const cfg = KINDS[kind]
  const models = MODELS[kind]
  return async (req, res) => {
    try {
      const { projectId, id } = req.params
      const project = await cfg.project().findUnique({ where: { id: projectId } })
      if (!project) return res.status(404).json({ message: 'Project not found' })
      if (project[cfg.scopeKey] !== req.user[cfg.scopeKey]) return res.status(403).json({ message: 'Access denied' })
      const existing = await models.request().findUnique({ where: { id } })
      if (!existing || existing.projectId !== projectId) {
        return res.status(404).json({ message: 'Change request not found' })
      }
      if (!OPEN_STATUSES.includes(existing.status)) {
        return res.status(400).json({ message: 'تم اتخاذ قرار بشأن هذا الطلب مسبقاً' })
      }
      const comment = req.body?.comment ? String(req.body.comment).trim() : null
      const status = decision === 'SENT_FOR_REVIEW' ? 'UNDER_REVIEW' : decision
      const [changeRequest] = await prisma.$transaction([
        models.request().update({ where: { id }, data: { status } }),
        models.log().create({ data: { action: decision, comment, requestId: id, performedBy: req.user.userId } }),
      ])
      const labels = { APPROVED: 'تمت الموافقة على', REJECTED: 'تم رفض', SENT_FOR_REVIEW: 'أُحيل للمراجعة' }
      await createForUsers([existing.requestedBy], kind, {
        title: 'قرار طلب التغيير',
        message: `${labels[decision]} طلب التغيير «${existing.title}»${comment ? `: ${comment}` : ''}`,
        type: decision === 'REJECTED' ? 'REJECTION' : decision === 'APPROVED' ? 'APPROVAL' : 'REVIEW',
        link: `${cfg.basePath}/${projectId}`,
      }).catch(() => {})
      res.json({ success: true, changeRequest })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = { changeRequestDecision, notifyChangeRequestCreated }
