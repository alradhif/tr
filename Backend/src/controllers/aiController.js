const multer = require('multer')
const prisma = require('../lib/prisma')

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

function model() {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
}

const NOT_CONFIGURED = 'المساعد الذكي غير مفعّل في هذه البيئة: لم يتم ضبط ANTHROPIC_API_KEY على الخادم.'

async function callClaude({ system, content, maxTokens = 1024 }) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: model(), max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body?.error?.message || `AI provider error (${response.status})`)
    error.status = 502
    throw error
  }
  return (body.content || []).filter((block) => block.type === 'text').map((block) => block.text).join('\n').trim()
}

function fmtDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '—'
}

/** Facts the assistant may use, limited to the signed-in user's own portal and account. */
async function portalSnapshot(user) {
  const now = new Date()
  if (user.type === 'ORG' || user.type === 'CLIENT') {
    const isOrg = user.type === 'ORG'
    const scope = isOrg ? { orgId: user.orgId } : { clientId: user.clientId }
    const projectModel = isOrg ? prisma.orgProject : prisma.clientProject
    const riskModel = isOrg ? prisma.orgRisk : prisma.clientRisk
    const crModel = isOrg ? prisma.orgChangeRequest : prisma.clientChangeRequest
    const [projects, openRisks, openRequests] = await Promise.all([
      projectModel.findMany({
        where: scope,
        select: { name: true, status: true, approvalStatus: true, progressPct: true, budget: true, startDate: true, endDate: true },
        orderBy: { createdAt: 'desc' },
        take: 60,
      }),
      riskModel.findMany({
        where: { project: scope, status: { not: 'CLOSED' } },
        select: { name: true, probability: true, impact: true, project: { select: { name: true } } },
        take: 40,
      }),
      crModel.count({ where: { project: scope, status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    ])
    const delayed = projects.filter((p) => p.status === 'ACTIVE' && p.endDate && new Date(p.endDate) < now)
    const lines = [
      `عدد المشاريع: ${projects.length}`,
      `مشاريع بانتظار الموافقة: ${projects.filter((p) => p.approvalStatus === 'PENDING').length}`,
      `مشاريع متأخرة (نشطة وتجاوزت تاريخ النهاية): ${delayed.length}${delayed.length ? ` (${delayed.map((p) => p.name).join('، ')})` : ''}`,
      `مخاطر مفتوحة: ${openRisks.length}`,
      `طلبات تغيير بانتظار القرار: ${openRequests}`,
    ]
    const details = [
      'المشاريع:',
      ...projects.map(
        (p) =>
          `- ${p.name} | الحالة ${p.status} | الاعتماد ${p.approvalStatus} | الإنجاز ${p.progressPct}% | الميزانية ${Number(p.budget || 0)} | ${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}`,
      ),
      'المخاطر المفتوحة:',
      ...openRisks.map((r) => `- ${r.name} (${r.project?.name}) احتمالية ${r.probability} أثر ${r.impact}`),
    ]
    return { summary: lines, details }
  }
  if (user.type === 'JODAYN') {
    const [orgs, clients, invoices] = await Promise.all([
      prisma.orgAccount.count(),
      prisma.clientAccount.count(),
      prisma.invoice.findMany({ select: { invoiceNumber: true, clientName: true, totalWithVat: true, status: true, dueDate: true }, take: 60 }),
    ])
    const overdue = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED' && new Date(i.dueDate) < now)
    return {
      summary: [
        `حسابات الجهات: ${orgs}`,
        `حسابات العملاء: ${clients}`,
        `الفواتير: ${invoices.length}`,
        `فواتير متأخرة السداد: ${overdue.length}`,
      ],
      details: invoices.map((i) => `- ${i.invoiceNumber} | ${i.clientName} | ${Number(i.totalWithVat)} | ${i.status} | استحقاق ${fmtDate(i.dueDate)}`),
    }
  }
  const [orgs, clients, activeOrgs, activeClients, failedLogins] = await Promise.all([
    prisma.orgAccount.count(),
    prisma.clientAccount.count(),
    prisma.orgAccount.count({ where: { isActive: true } }),
    prisma.clientAccount.count({ where: { isActive: true } }),
    prisma.activityLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ])
  return {
    summary: [
      `المستأجرون: ${orgs + clients} (جهات ${orgs}، عملاء ${clients})`,
      `المستأجرون النشطون: ${activeOrgs + activeClients}`,
      `محاولات دخول فاشلة آخر 7 أيام: ${failedLogins}`,
    ],
    details: [],
  }
}

/**
 * Assistant chat. With an API key the question is answered by Claude from the portal's own
 * data. Without one the response says so plainly and returns the factual data summary only.
 */
exports.assistant = async (req, res) => {
  try {
    const question = String(req.body?.message || '').trim()
    if (!question) return res.status(400).json({ message: 'اكتب سؤالك' })
    if (question.length > 2000) return res.status(400).json({ message: 'السؤال طويل جداً' })
    const snapshot = await portalSnapshot(req.user)
    if (!aiConfigured()) {
      return res.json({
        configured: false,
        reply: `${NOT_CONFIGURED}\n\nملخص من بيانات حسابك:\n${snapshot.summary.map((line) => `• ${line}`).join('\n')}`,
      })
    }
    const system = [
      'You are the TrackPlus project-management assistant. Answer in Arabic unless the user writes in another language.',
      'Use only the account data below. If the data does not contain the answer, say so. Keep answers short.',
      '',
      ...snapshot.summary,
      ...snapshot.details,
    ].join('\n')
    const reply = await callClaude({ system, content: question })
    res.json({ configured: true, reply })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } })
exports.receiveFile = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: err.message })
    next()
  })
}

const EXTRACT_FIELDS = {
  project: ['name', 'description', 'startDate', 'endDate', 'budget', 'orgProjectManagerName', 'clientProjectManagerName'],
  goal: ['title', 'description', 'startDate', 'endDate', 'requiredOutputsCount'],
  scenario: ['newDate', 'newCost', 'impactOnSchedule', 'impactOnCost', 'impactOnRiskLevel', 'recommendations'],
  contract: ['name', 'startDate', 'endDate', 'value', 'parties'],
}

/** Reads an uploaded PDF or text document and proposes form values. Nothing is saved here. */
exports.extract = async (req, res) => {
  try {
    const kind = String(req.body?.kind || 'project')
    const fields = EXTRACT_FIELDS[kind]
    if (!fields) return res.status(400).json({ message: 'Invalid extraction type' })
    if (!req.file) return res.status(400).json({ message: 'ارفع ملفاً' })
    if (!aiConfigured()) return res.status(503).json({ configured: false, message: NOT_CONFIGURED })
    const isPdf = req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname)
    const isText = /^text\//.test(req.file.mimetype) || /\.(txt|md|csv)$/i.test(req.file.originalname)
    if (!isPdf && !isText) {
      return res.status(415).json({ message: 'الاستخلاص الآلي يدعم ملفات PDF والنصوص فقط حالياً' })
    }
    const documentBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: req.file.buffer.toString('base64') } }
      : { type: 'text', text: req.file.buffer.toString('utf8').slice(0, 100000) }
    const text = await callClaude({
      system:
        'Extract form fields from the document. Reply with one JSON object only, no prose. ' +
        `Keys: ${fields.join(', ')}. Use ISO dates (YYYY-MM-DD) and plain numbers. Omit keys you cannot find.`,
      content: [documentBlock, { type: 'text', text: `Extract the ${kind} fields.` }],
    })
    const match = text.match(/\{[\s\S]*\}/)
    let values = {}
    try {
      values = match ? JSON.parse(match[0]) : {}
    } catch {
      values = {}
    }
    const clean = Object.fromEntries(Object.entries(values).filter(([key]) => fields.includes(key)))
    res.json({ configured: true, fields: clean })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.status = (req, res) => {
  res.json({ configured: aiConfigured() })
}
