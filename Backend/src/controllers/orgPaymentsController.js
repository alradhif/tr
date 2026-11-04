const prisma = require('../lib/prisma')

const PAYMENT_INCLUDE = {
  project: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
}

// A private-sector organization collects its project payments; any other entity type pays them.
function paymentDirection(entityType) {
  return /خاص/.test(entityType || '') ? 'COLLECT' : 'PAY'
}

exports.getPayments = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const [org, payments] = await Promise.all([
      prisma.orgAccount.findUnique({ where: { id: orgId }, select: { entityType: true } }),
      prisma.orgProjectPayment.findMany({
        where: { orgId },
        include: PAYMENT_INCLUDE,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      }),
    ])
    res.json({
      entityType: org?.entityType ?? null,
      direction: paymentDirection(org?.entityType),
      count: payments.length,
      payments,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createPayment = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { projectId, title, invoiceNumber, dueDate } = req.body
    const amount = Number(req.body.amount)
    const due = new Date(dueDate)
    if (!projectId || !title?.trim() || !dueDate) {
      return res.status(400).json({ message: 'Required fields: projectId, title, amount, dueDate' })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'يجب أن يكون المبلغ أكبر من صفر' })
    }
    if (Number.isNaN(due.getTime())) return res.status(400).json({ message: 'تاريخ الاستحقاق غير صحيح' })

    const project = await prisma.orgProject.findUnique({
      where: { id: projectId },
      select: { orgId: true, executingCompanyId: true },
    })
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const payment = await prisma.orgProjectPayment.create({
      data: {
        title: title.trim(),
        invoiceNumber: invoiceNumber?.trim() || null,
        amount,
        dueDate: due,
        orgId,
        projectId,
        companyId: project.executingCompanyId,
      },
      include: PAYMENT_INCLUDE,
    })
    res.status(201).json({ success: true, payment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function getOwnedPayment(req, res) {
  const payment = await prisma.orgProjectPayment.findUnique({ where: { id: req.params.id } })
  if (!payment) {
    res.status(404).json({ message: 'Payment not found' })
    return null
  }
  if (payment.orgId !== req.user.orgId) {
    res.status(403).json({ message: 'Access denied' })
    return null
  }
  return payment
}

exports.setPaymentPaid = async (req, res) => {
  try {
    const existing = await getOwnedPayment(req, res)
    if (!existing) return
    const payment = await prisma.orgProjectPayment.update({
      where: { id: existing.id },
      data: { paidAt: req.body.paid === false ? null : new Date() },
      include: PAYMENT_INCLUDE,
    })
    res.json({ success: true, payment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deletePayment = async (req, res) => {
  try {
    const existing = await getOwnedPayment(req, res)
    if (!existing) return
    await prisma.orgProjectPayment.delete({ where: { id: existing.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
