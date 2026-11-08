const multer = require('multer')
const prisma = require('../lib/prisma')

const RECEIPT_TYPES = ['image/png', 'image/jpeg', 'application/pdf']
const receiptUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single('receipt')

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

// A payment is recorded whole, once: there is no partial payment and no undo.
exports.recordPayment = async (req, res) => {
  try {
    const existing = await getOwnedPayment(req, res)
    if (!existing) return
    if (existing.paidAt) return res.status(409).json({ message: 'هذه الدفعة مسجلة مسبقًا' })
    const paidAt = new Date(req.body?.paidAt)
    const reference = String(req.body?.reference || '').trim()
    if (Number.isNaN(paidAt.getTime()) || paidAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'تاريخ الدفع غير صحيح' })
    }
    if (!reference) return res.status(400).json({ message: 'رقم المرجع مطلوب' })
    const recorder = await prisma.orgUser.findUnique({ where: { id: req.user.userId }, select: { name: true } })
    const payment = await prisma.orgProjectPayment.update({
      where: { id: existing.id },
      data: { paidAt, paymentReference: reference, recordedByName: recorder?.name || null },
      include: PAYMENT_INCLUDE,
    })
    res.json({ success: true, payment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// An optional receipt, kept as a data URL beside the payment it proves.
exports.uploadReceipt = (req, res) => {
  receiptUpload(req, res, async (uploadErr) => {
    try {
      if (uploadErr) {
        return res.status(400).json({ message: uploadErr.code === 'LIMIT_FILE_SIZE' ? 'حجم الإيصال يجب ألا يتجاوز 5 ميجابايت' : uploadErr.message })
      }
      if (!req.file || !RECEIPT_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'الرجاء رفع ملف PNG أو JPG أو PDF' })
      }
      const existing = await getOwnedPayment(req, res)
      if (!existing) return
      const payment = await prisma.orgProjectPayment.update({
        where: { id: existing.id },
        data: {
          receiptUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          receiptName: req.file.originalname,
        },
        include: PAYMENT_INCLUDE,
      })
      res.json({ success: true, payment })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
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
