const { normalize, tokens } = require('./normalize')
const { LEVEL_LABEL } = require('./dataset')

/**
 * Answers Arabic questions from the portal's own data without any AI service. A question is
 * read as: what it is about (projects, goals, invoices...), whether it names a specific record,
 * which filters it asks for (status, year, level...) and what to do (count, list, total, top).
 * Every answer is computed from the records the user's portal already shows.
 */

const words = (list) => list.map(normalize)
const hasAny = (q, list) => list.some((w) => q.includes(w))

const TOPICS = {
  changeRequest: words(['طلب تغيير', 'طلبات تغيير', 'طلبات التغيير', 'طلب التغيير', 'طلبات تعديل']),
  deliverable: words(['مخرج', 'مخرجات', 'تسليمات']),
  risk: words(['خطر', 'مخاطر', 'مخاطره', 'اخطار']),
  payment: words(['فاتور', 'فواتير', 'دفعه', 'دفعات', 'مدفوع', 'سداد', 'تحصيل', 'مستحقات', 'مبالغ', 'المبلغ', 'للدفع', 'الدفع']),
  goal: words(['هدف', 'اهداف', 'استراتيج']),
  company: words(['شركه', 'شركات', 'منفذ']),
  department: words(['اداره', 'ادارات', 'قسم', 'اقسام']),
  subscription: words(['اشتراك', 'باقه', 'باقات']),
  account: words(['حسابات', 'حساب', 'الجهات', 'جهات', 'العملاء', 'عملاء', 'مستخدم']),
  contract: words(['عقد', 'عقود']),
  project: words(['مشروع', 'مشاريع', 'مشروعات', 'ميزاني']),
}

const OPS = {
  count: words(['كم عدد', 'عدد']),
  sum: words(['مبلغ', 'مبالغ', 'اجمالي', 'مجموع', 'قيمه', 'متبقي', 'باقي', 'كم دفعنا', 'كم حصلنا', 'المدفوع', 'المحصل', 'ميزانيات']),
  max: words(['اعلى', 'اكبر', 'اكثر', 'افضل']),
  min: words(['اقل', 'اصغر', 'ادنى', 'اضعف', 'اسوا']),
  soonest: words(['اقرب', 'قريب', 'قربت', 'ينتهي قريب', 'تنتهي قريب']),
  summary: words(['لخص', 'ملخص', 'نظره عامه', 'الوضع العام', 'وضع المشاريع', 'تقرير', 'كيف الوضع', 'وش الوضع']),
  detail: words(['تفاصيل', 'معلومات', 'وش عن', 'ايش عن', 'حدثني', 'اخبرني']),
}

const GREETING = words(['مرحبا', 'السلام', 'هلا', 'اهلا', 'صباح', 'مساء', 'hi', 'hello'])
const THANKS = words(['شكرا', 'يعطيك العافيه', 'مشكور', 'thanks'])
const HELP = words(['وش تقدر', 'ايش تقدر', 'ماذا تستطيع', 'ساعدني', 'مساعده', 'help', 'وش اسال', 'امثله'])

const PROJECT_STATUS_WORDS = [
  ['done', words(['مكتمل', 'منجز', 'منتهي', 'المنتهيه', 'خالص', 'انتهت', 'اكتمل'])],
  ['delay', words(['متاخر', 'تاخير', 'متوقف', 'معلق'])],
  ['blocked', words(['متعثر', 'ملغي', 'ملغا', 'تعثر'])],
  ['track', words(['على المسار', 'نشط', 'جاري', 'قيد التنفيذ', 'شغال'])],
]
const GOAL_STATUS_WORDS = [
  ['completed', words(['مكتمل', 'منجز', 'محقق', 'تحقق', 'خالص', 'اكتمل'])],
  ['delayed', words(['متاخر', 'تاخير', 'فائت', 'لم يتحقق'])],
  ['stalled', words(['متعثر', 'لم يبدا', 'ما بدا', 'تعثر'])],
  ['onTrack', words(['على المسار', 'جاري', 'قيد التنفيذ', 'نشط'])],
]
const PAYMENT_STATE_WORDS = [
  ['overdue', words(['متاخر', 'تاخير', 'فات موعد', 'تجاوز'])],
  ['paid', words(['مدفوع', 'مسدد', 'محصل', 'تم الدفع', 'دفعت', 'سددت'])],
  ['unpaid', words(['غير مدفوع', 'غير مسدد', 'مستحق', 'متبقي', 'باقي', 'لم تدفع', 'ما انسدت', 'ما دفعت'])],
]
const APPROVAL_WORDS = [
  ['PENDING', words(['بانتظار الاعتماد', 'بانتظار الموافقه', 'ينتظر', 'بانتظار', 'تحت المراجعه', 'قيد الاعتماد', 'معلق الاعتماد'])],
  ['REJECTED', words(['مرفوض', 'رفض', 'المرفوضه'])],
  ['DRAFT', words(['مسوده', 'مسودات'])],
  ['APPROVED', words(['معتمد', 'المعتمده', 'موافق عليه'])],
]
const LEVEL_WORDS = [
  [4, words(['حرج', 'حرجه', 'خطير'])],
  [3, words(['عالي', 'عاليه', 'مرتفع'])],
  [2, words(['متوسط'])],
  [1, words(['منخفض', 'بسيط'])],
]
const REVIEW_WORDS = [
  ['PENDING', words(['بانتظار', 'ينتظر', 'قيد الاعتماد', 'تحت المراجعه'])],
  ['CHANGES_REQUESTED', words(['مطلوب تعديل', 'تعديلات', 'معاد', 'مرتجع'])],
  ['APPROVED', words(['معتمد', 'المعتمده'])],
]
const REQUEST_WORDS = [
  ['UNDER_REVIEW', words(['قيد المراجعه', 'تحت المراجعه', 'بانتظار', 'مفتوح', 'معلق'])],
  ['APPROVED', words(['معتمد', 'موافق', 'مقبول'])],
  ['REJECTED', words(['مرفوض', 'رفض'])],
]

const firstMatch = (q, table) => table.find(([, list]) => hasAny(q, list))?.[0]

const money = (value) => `${Math.round(Number(value) || 0).toLocaleString('en-US')} ر.س`
/** Keeps phone numbers and emails left-to-right inside Arabic sentences. */
const ltr = (text) => `\u2066${text}\u2069`
const day = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '—')
const pct = (value) => `${Math.round(Number(value) || 0)}%`
const plural = (n, one, many) => (n === 1 ? one : many)

function listLines(items, line, limit = 12) {
  const shown = items.slice(0, limit).map((item) => `• ${line(item)}`)
  if (items.length > limit) shown.push(`… و${items.length - limit} أخرى`)
  return shown.join('\n')
}

// ── Periods ────────────────────────────────────────────────────────────────

function periodOf(q, now = new Date()) {
  const year = q.match(/\b(20\d\d)\b/)
  if (year) {
    const y = Number(year[1])
    return { from: new Date(Date.UTC(y, 0, 1)), to: new Date(Date.UTC(y + 1, 0, 1)), label: `في ${y}` }
  }
  if (hasAny(q, words(['هالربع', 'الربع الحالي', 'هذا الربع', 'الربع']))) {
    const start = Math.floor(now.getUTCMonth() / 3) * 3
    return {
      from: new Date(Date.UTC(now.getUTCFullYear(), start, 1)),
      to: new Date(Date.UTC(now.getUTCFullYear(), start + 3, 1)),
      label: 'في الربع الحالي',
    }
  }
  if (hasAny(q, words(['هالسنه', 'هذه السنه', 'السنه الحاليه', 'هذا العام', 'العام الحالي']))) {
    const y = now.getUTCFullYear()
    return { from: new Date(Date.UTC(y, 0, 1)), to: new Date(Date.UTC(y + 1, 0, 1)), label: `في ${y}` }
  }
  if (hasAny(q, words(['هالشهر', 'هذا الشهر', 'الشهر الحالي']))) {
    return {
      from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
      label: 'هذا الشهر',
    }
  }
  return null
}

const overlaps = (start, end, period) => {
  const s = start ? new Date(start) : end ? new Date(end) : null
  const e = end ? new Date(end) : s
  if (!s || !e) return false
  return s < period.to && e >= period.from
}
const within = (date, period) => Boolean(date) && new Date(date) >= period.from && new Date(date) < period.to

// ── Finding named records ──────────────────────────────────────────────────

function candidates(data) {
  return [
    ...data.projects,
    ...data.goals,
    ...(data.companies || []),
    ...(data.departments || []),
    ...(data.accounts || []),
    ...(data.payments || []).filter((p) => p.number).map((p) => ({ ...p, name: p.number, aliases: [p.name] })),
  ]
}

let vocabularyCache = null
/** Keyword and filter words: they describe what is asked, so they never identify a record by themselves. */
function vocabulary() {
  if (!vocabularyCache) {
    const lists = [
      ...Object.values(TOPICS),
      ...Object.values(OPS),
      ...Object.values(KIND_HINTS),
      ...[PROJECT_STATUS_WORDS, GOAL_STATUS_WORDS, PAYMENT_STATE_WORDS, APPROVAL_WORDS, LEVEL_WORDS, REVIEW_WORDS, REQUEST_WORDS].flatMap((t) => t.map(([, l]) => l)),
      words(['قيد', 'بانتظار', 'اعتماد', 'الاعتماد', 'مراجعه', 'مفتوحه', 'مغلقه', 'الاستراتيجيه', 'المرتبطه', 'تنتهي', 'ينتهي', 'لكل', 'حسب']),
    ]
    vocabularyCache = new Set(lists.flat().flatMap((w) => tokens(w)))
  }
  return vocabularyCache
}

/** Words in the question that say which kind of record is named, e.g. "هدف" before a goal title. */
const KIND_HINTS = {
  project: words(['مشروع']),
  goal: words(['هدف', 'الهدف']),
  company: words(['شركه', 'الشركه', 'منفذ']),
  department: words(['اداره', 'الاداره', 'قسم']),
  payment: words(['فاتوره', 'دفعه']),
  account: words(['حساب', 'جهه', 'عميل']),
}

/** The records named in the question, best match first; several when names repeat across accounts. */
function findNamed(q, data) {
  const hinted = new Set(Object.entries(KIND_HINTS).filter(([, list]) => hasAny(q, list)).map(([kind]) => kind))
  const questionTokens = new Set(tokens(q).filter((t) => !vocabulary().has(t)))
  const all = candidates(data)
  const frequency = new Map()
  for (const record of all) for (const t of new Set(tokens(record.name))) frequency.set(t, (frequency.get(t) || 0) + 1)
  const tokenMatches = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)))

  const scored = []
  for (const record of all) {
    const name = normalize(record.name)
    if (!name) continue
    if (name.length >= 4 && q.includes(name)) {
      scored.push({ record, score: 10 + name.length + (hinted.has(record.kind) ? 3 : 0) })
      continue
    }
    const nameTokens = [...new Set(tokens(record.name))]
    if (!nameTokens.length) continue
    const hits = nameTokens.filter((t) => [...questionTokens].some((qt) => tokenMatches(qt, t)))
    const unique = hits.some((t) => frequency.get(t) === 1 && t.length >= 4)
    const ratio = hits.length / nameTokens.length
    if (hits.length >= 2 || ratio >= 0.6 || unique) {
      scored.push({ record, score: hits.length * 2 + ratio + (unique ? 1 : 0) + (hinted.has(record.kind) ? 3 : 0) })
    }
  }
  if (!scored.length) return []
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  return scored.filter((s) => s.score === best.score && normalize(s.record.name) === normalize(best.record.name)).map((s) => s.record)
}

// ── Topic and operation ─────────────────────────────────────────────────────

function detectTopic(q, portal) {
  const order = ['changeRequest', 'deliverable', 'risk', 'payment', 'goal', 'subscription', 'contract', 'company', 'department', 'project', 'account']
  for (const topic of order) {
    if (topic === 'account' && portal !== 'JODAYN' && portal !== 'SUPER_ADMIN') continue
    if (hasAny(q, TOPICS[topic])) return topic
  }
  return null
}

function detectOp(q) {
  if (hasAny(q, OPS.summary)) return 'summary'
  if (hasAny(q, OPS.max)) return 'max'
  if (hasAny(q, OPS.min)) return 'min'
  if (hasAny(q, OPS.soonest)) return 'soonest'
  if (hasAny(q, OPS.sum)) return 'sum'
  if (hasAny(q, OPS.count) || /(^|\s)كم(\s|$)/.test(q)) return 'count'
  return 'list'
}

// ── Answers per topic ───────────────────────────────────────────────────────

const showOwner = (data) => data.portal === 'JODAYN'
const progressLabel = (data) => (data.portal === 'ORG' ? 'التقدم التنفيذي' : 'نسبة الإنجاز')

// ── Visual blocks ───────────────────────────────────────────────────────────
// Answers also describe themselves as cards (numbers, records with status and progress, facts)
// that the chat draws; the text reply stays for copying. Blocks are gathered per answer() call.

let blocks = null
const emit = (block) => {
  if (blocks) blocks.push(block)
}
const TONE = { track: 'success', delay: 'warning', blocked: 'danger', done: 'info', completed: 'info', delayed: 'warning', stalled: 'danger', onTrack: 'success' }
const LEVEL_TONE = { 4: 'danger', 3: 'warning', 2: 'info', 1: 'neutral' }
const LEVEL_BY_RANK = { 4: 'حرج', 3: 'عالي', 2: 'متوسط', 1: 'منخفض' }
const PAYMENT_BADGE = {
  paid: { label: 'مدفوعة', tone: 'success' },
  overdue: { label: 'متأخرة', tone: 'danger' },
  due: { label: 'مستحقة', tone: 'warning' },
  cancelled: { label: 'ملغاة', tone: 'neutral' },
}
const REQUEST_TONE = { UNDER_REVIEW: 'warning', PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

const stats = (items) => emit({ type: 'stats', items: items.filter(Boolean) })
const facts = (items) => emit({ type: 'facts', items: items.filter((item) => item && item.value !== null && item.value !== undefined && item.value !== '') })
const hero = (title, subtitle, badge, progress, progressText) => emit({ type: 'hero', title, subtitle, badge, progress, progressText })
const bars = (title, items) => emit({ type: 'bars', title, items })
function records(title, items, toRecord, limit = 12) {
  emit({ type: 'records', title, items: items.slice(0, limit).map(toRecord), more: Math.max(0, items.length - limit) })
}

const projectRecord = (data) => (p) => ({
  title: p.name,
  subtitle: [showOwner(data) ? p.owner : null, p.company || p.department].filter(Boolean).join(' · ') || undefined,
  badge: { label: p.statusLabel, tone: TONE[p.statusKey] },
  progress: p.progress,
})
const goalRecord = (data) => (g) => ({
  title: g.name,
  subtitle: showOwner(data) && g.owner ? g.owner : `${g.projects.length} مشاريع مرتبطة`,
  badge: { label: g.statusLabel, tone: TONE[g.statusKey] },
  progress: g.progress,
})
const paymentRecord = (p) => ({
  title: p.number || p.name,
  subtitle: [p.name && p.name !== p.number ? p.name : null, p.project, p.party].filter(Boolean).join(' · ') || undefined,
  badge: PAYMENT_BADGE[p.state] || PAYMENT_BADGE.due,
  value: money(p.amount),
  note: `الاستحقاق ${day(p.due)}`,
})
const riskRecord = (single) => (r) => ({
  title: r.name,
  subtitle: single ? undefined : r.project,
  badge: { label: LEVEL_BY_RANK[r.severity] || '—', tone: LEVEL_TONE[r.severity] || 'neutral' },
  note: `التأثير ${LEVEL_LABEL[r.impact] || '—'} · الاحتمالية ${LEVEL_LABEL[r.probability] || '—'} · ${r.statusLabel}`,
  contact: r.responsible ? { name: r.responsible, phone: r.phone, email: r.email } : undefined,
})
const deliverableRecord = (single) => (d) => ({
  title: d.name,
  subtitle: single ? undefined : d.project,
  badge: d.reviewLabel
    ? { label: d.reviewLabel, tone: { APPROVED: 'success', PENDING: 'warning', CHANGES_REQUESTED: 'danger' }[d.review] || 'neutral' }
    : { label: d.done ? 'مكتمل' : 'قيد التنفيذ', tone: d.done ? 'success' : 'warning' },
  progress: d.done ? 100 : d.progress,
})
const requestRecord = (single) => (c) => ({
  title: c.title,
  subtitle: single ? undefined : c.project,
  badge: { label: c.statusLabel, tone: REQUEST_TONE[c.status] || 'neutral' },
  note: [c.priority ? `الأولوية ${LEVEL_LABEL[c.priority]}` : null, c.impactOnSchedule ? `الجدول ${c.impactOnSchedule}` : null].filter(Boolean).join(' · ') || undefined,
})

function projectLine(p, data) {
  return `${p.name}${showOwner(data) && p.owner ? ` (${p.owner})` : ''}: ${p.statusLabel}، الإنجاز ${pct(p.progress)}`
}

function projectDetail(p, data) {
  const done = p.deliverables.filter((d) => d.done).length
  const approved = p.deliverables.filter((d) => d.review === 'APPROVED').length
  const openRisks = p.risks.filter((r) => r.open)
  const highRisks = openRisks.filter((r) => r.severity >= 3).length
  const openRequests = p.changeRequests.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'PENDING').length
  hero(p.name, [showOwner(data) ? p.owner : null, p.type].filter(Boolean).join(' · ') || undefined, { label: p.statusLabel, tone: TONE[p.statusKey] }, p.progress, 'نسبة الإنجاز')
  stats([
    p.budget !== null ? { label: 'الميزانية', value: money(p.budget) } : null,
    { label: 'المخرجات', value: `${done}/${p.deliverables.length}`, hint: 'مكتمل' },
    { label: 'المخاطر المفتوحة', value: String(openRisks.length), hint: highRisks ? `${highRisks} حرجة أو عالية` : undefined, tone: highRisks ? 'danger' : undefined },
    { label: 'طلبات التغيير', value: String(p.changeRequests.length), hint: openRequests ? `${openRequests} قيد المراجعة` : undefined },
  ])
  facts([
    { label: 'الاعتماد', value: p.approvalLabel },
    { label: 'المدة', value: `${day(p.start)} ← ${day(p.end)}` },
    { label: 'مدير المشروع', value: p.manager },
    { label: 'الشركة المنفذة', value: p.company },
    { label: 'الإدارة', value: p.department },
    { label: 'الأهداف المرتبطة', value: p.goals.join('، ') },
    { label: 'العقود', value: p.contracts.join('، ') },
    { label: 'الوصف', value: p.description },
  ])
  const lines = [
    `مشروع «${p.name}»`,
    showOwner(data) && p.owner ? `• الجهة: ${p.owner}` : null,
    `• الحالة: ${p.statusLabel}، الاعتماد: ${p.approvalLabel}`,
    p.approval === 'REJECTED' && p.rejectionReason ? `• سبب الرفض: ${p.rejectionReason}` : null,
    `• نسبة الإنجاز: ${pct(p.progress)}`,
    p.budget !== null ? `• الميزانية: ${money(p.budget)}` : null,
    `• المدة: من ${day(p.start)} إلى ${day(p.end)}`,
    p.type ? `• النوع: ${p.type}` : null,
    p.manager ? `• مدير المشروع: ${p.manager}` : null,
    p.company ? `• الشركة المنفذة: ${p.company}` : null,
    p.department ? `• الإدارة: ${p.department}` : null,
    `• المخرجات: ${p.deliverables.length} (مكتمل ${done}${data.portal !== 'CLIENT' ? `، معتمد ${approved}` : ''})`,
    `• المخاطر المفتوحة: ${openRisks.length}${highRisks ? ` (منها ${highRisks} حرجة أو عالية)` : ''}`,
    `• طلبات التغيير: ${p.changeRequests.length}${openRequests ? ` (${openRequests} قيد المراجعة)` : ''}`,
    p.goals.length ? `• الأهداف المرتبطة: ${p.goals.join('، ')}` : null,
    p.contracts.length ? `• العقود: ${p.contracts.join('، ')}` : null,
    p.description ? `• الوصف: ${p.description}` : null,
  ]
  return lines.filter(Boolean).join('\n')
}

function filterProjects(q, data, scope) {
  let list = scope || data.projects
  const labels = []
  const status = firstMatch(q, PROJECT_STATUS_WORDS)
  const approval = firstMatch(q, APPROVAL_WORDS)
  if (approval && (approval !== 'APPROVED' || !status)) {
    list = list.filter((p) => p.approval === approval)
    labels.push(APPROVAL_WORDS.find(([k]) => k === approval) && { PENDING: 'بانتظار الاعتماد', REJECTED: 'المرفوضة', DRAFT: 'المسودة', APPROVED: 'المعتمدة' }[approval])
  }
  if (status && !(approval === 'PENDING' && status === 'delay')) {
    list = list.filter((p) => p.statusKey === status)
    labels.push({ done: 'المكتملة', delay: 'المتأخرة', blocked: 'المتعثرة', track: 'على المسار' }[status])
  }
  const period = periodOf(q)
  if (period) {
    list = list.filter((p) => overlaps(p.start, p.end, period))
    labels.push(period.label)
  }
  return { list, label: labels.filter(Boolean).join(' ') }
}

function answerProjects(q, op, data, scope, scopeLabel = '') {
  const { list, label } = filterProjects(q, data, scope)
  const title = `المشاريع${label ? ` ${label}` : ''}${scopeLabel}`
  if (!data.projects.length) return 'لا توجد مشاريع في حسابك.'
  const wantsBudget = hasAny(q, words(['ميزاني', 'تكلف', 'قيمه']))
  if (op === 'sum' || (wantsBudget && op === 'count')) {
    const total = list.reduce((s, p) => s + (p.budget || 0), 0)
    stats([{ label: `إجمالي ميزانية ${title}`, value: money(total) }, { label: 'عدد المشاريع', value: String(list.length) }])
    records('الأعلى ميزانية', [...list].sort((a, b) => (b.budget || 0) - (a.budget || 0)), (p) => ({ ...projectRecord(data)(p), value: money(p.budget) }), 5)
    return `إجمالي ميزانية ${title} (${list.length}): ${money(total)}.`
  }
  if (op === 'max' || op === 'min') {
    const metric = wantsBudget ? 'budget' : hasAny(q, TOPICS.risk) ? 'risks' : 'progress'
    const value = (p) => (metric === 'risks' ? p.risks.filter((r) => r.open).length : p[metric] || 0)
    const sorted = [...list].sort((a, b) => (op === 'max' ? value(b) - value(a) : value(a) - value(b))).slice(0, 5)
    const metricLabel = { budget: 'الميزانية', risks: 'المخاطر المفتوحة', progress: 'نسبة الإنجاز' }[metric]
    const format = (p) => (metric === 'budget' ? money(p.budget) : metric === 'risks' ? `${value(p)} مخاطر` : pct(p.progress))
    records(`${op === 'max' ? 'أعلى' : 'أقل'} ${title} حسب ${metricLabel}`, sorted, (p) => ({ ...projectRecord(data)(p), value: metric === 'progress' ? undefined : format(p) }))
    return `${op === 'max' ? 'أعلى' : 'أقل'} ${title} حسب ${metricLabel}:\n${listLines(sorted, (p) => `${p.name}${showOwner(data) && p.owner ? ` (${p.owner})` : ''}: ${format(p)}`)}`
  }
  if (op === 'soonest') {
    const now = Date.now()
    const open = list.filter((p) => p.statusKey !== 'done' && p.end)
    const upcoming = open.filter((p) => new Date(p.end) >= now).sort((a, b) => new Date(a.end) - new Date(b.end)).slice(0, 5)
    if (upcoming.length) records(`أقرب ${title} انتهاءً`, upcoming, (p) => ({ ...projectRecord(data)(p), note: `ينتهي ${day(p.end)}` }))
    else records(`${title} التي تجاوزت تاريخ النهاية`, [...open].sort((a, b) => new Date(b.end) - new Date(a.end)), (p) => ({ ...projectRecord(data)(p), note: `انتهى موعده ${day(p.end)}` }))
    if (upcoming.length) return `أقرب ${title} انتهاءً:\n${listLines(upcoming, (p) => `${p.name}: ينتهي ${day(p.end)} (${p.statusLabel})`)}`
    const passed = open.sort((a, b) => new Date(b.end) - new Date(a.end))
    return passed.length
      ? `كل ${title} غير المكتملة تجاوزت تاريخ النهاية (${passed.length}):\n${listLines(passed, (p) => `${p.name}: انتهى موعده ${day(p.end)} (${p.statusLabel})`)}`
      : `لا توجد ${title} غير مكتملة لها تاريخ نهاية.`
  }
  if (!list.length) return `عدد ${title}: 0`
  stats([
    { label: `عدد ${title}`, value: String(list.length) },
    { label: 'متوسط الإنجاز', value: pct(list.reduce((s, p) => s + p.progress, 0) / list.length) },
    { label: 'إجمالي الميزانية', value: money(list.reduce((s, p) => s + (p.budget || 0), 0)) },
  ])
  records(title, list, projectRecord(data), 15)
  if (op === 'count') {
    return `عدد ${title}: ${list.length}${list.length <= 12 ? `\n${listLines(list, (p) => projectLine(p, data))}` : ''}`
  }
  return `${title} (${list.length}):\n${listLines(list, (p) => projectLine(p, data), 15)}`
}

function projectSubTopic(topic, q, op, p, data) {
  if (topic === 'risk') return answerRisks(q, op, data, [p], ` في «${p.name}»`)
  if (topic === 'deliverable') return answerDeliverables(q, op, data, [p], ` في «${p.name}»`)
  if (topic === 'changeRequest') return answerChangeRequests(q, op, data, [p], ` في «${p.name}»`)
  if (topic === 'payment') return answerPayments(q, op, data, (data.payments || []).filter((x) => x.project === p.name), ` لمشروع «${p.name}»`)
  if (topic === 'goal') return p.goals.length ? `الأهداف المرتبطة بـ«${p.name}»:\n${listLines(p.goals, (g) => g)}` : `«${p.name}» غير مرتبط بأي هدف استراتيجي.`
  if (topic === 'contract') return p.contracts.length ? `عقود «${p.name}»:\n${listLines(p.contracts, (c) => c)}` : `لا توجد عقود مسجلة لـ«${p.name}».`
  if (hasAny(q, words(['ميزاني', 'تكلف']))) return `ميزانية «${p.name}»: ${p.budget === null ? 'غير محددة' : money(p.budget)}.`
  if (hasAny(q, words(['تقدم', 'انجاز', 'نسبه']))) return `نسبة إنجاز «${p.name}»: ${pct(p.progress)}، والحالة ${p.statusLabel}.`
  if (hasAny(q, words(['متى', 'ينتهي', 'نهايه', 'موعد', 'تاريخ']))) return `«${p.name}» يبدأ ${day(p.start)} وينتهي ${day(p.end)}.`
  if (hasAny(q, words(['مدير', 'مسؤول']))) return p.manager ? `مدير «${p.name}»: ${p.manager}.` : `لا يوجد مدير مسجل لـ«${p.name}».`
  return projectDetail(p, data)
}

// Goals

function goalDetail(g, data) {
  const linked = data.projects.filter((p) => g.projects.includes(p.name) && (!showOwner(data) || p.owner === g.owner))
  hero(g.name, showOwner(data) ? g.owner : undefined, { label: g.statusLabel, tone: TONE[g.statusKey] }, g.progress, progressLabel(data))
  facts([
    { label: 'الفترة', value: `${day(g.start)} ← ${day(g.end)}` },
    data.portal === 'ORG' ? { label: 'الاعتماد', value: g.approved ? 'معتمد' : 'غير معتمد بعد' } : null,
    { label: 'الوصف', value: g.description },
  ])
  if (linked.length) records(`المشاريع المرتبطة (${linked.length})`, linked, projectRecord(data))
  return [
    `الهدف «${g.name}»`,
    showOwner(data) && g.owner ? `• الجهة: ${g.owner}` : null,
    `• الحالة: ${g.statusLabel}`,
    `• ${progressLabel(data)}: ${pct(g.progress)}`,
    `• الفترة: من ${day(g.start)} إلى ${day(g.end)}`,
    data.portal === 'ORG' ? `• الاعتماد: ${g.approved ? 'معتمد' : 'غير معتمد بعد'}` : null,
    linked.length
      ? `• المشاريع المرتبطة (${linked.length}):\n${listLines(linked, (p) => `${p.name}: ${p.statusLabel}، ${pct(p.progress)}`)}`
      : g.projects.length
        ? `• المشاريع المرتبطة: ${g.projects.join('، ')}`
        : '• لا توجد مشاريع مرتبطة',
    g.description ? `• الوصف: ${g.description}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

function answerGoals(q, op, data) {
  if (!data.goals.length) return 'لا توجد أهداف استراتيجية في حسابك.'
  let list = data.goals
  const labels = []
  const status = firstMatch(q, GOAL_STATUS_WORDS)
  if (status) {
    list = list.filter((g) => g.statusKey === status)
    labels.push({ completed: 'المكتملة', delayed: 'المتأخرة', stalled: 'المتعثرة', onTrack: 'على المسار' }[status])
  }
  if (data.portal === 'ORG' && hasAny(q, words(['غير معتمد', 'بانتظار', 'ما اعتمد']))) {
    list = list.filter((g) => !g.approved)
    labels.push('غير المعتمدة')
  } else if (data.portal === 'ORG' && hasAny(q, words(['معتمد']))) {
    list = list.filter((g) => g.approved)
    labels.push('المعتمدة')
  }
  const period = periodOf(q)
  if (period) {
    list = list.filter((g) => overlaps(g.start, g.end, period))
    labels.push(period.label)
  }
  const title = `الأهداف الاستراتيجية${labels.length ? ` ${labels.join(' ')}` : ''}`
  if (op === 'max' || op === 'min') {
    const sorted = [...list].sort((a, b) => (op === 'max' ? b.progress - a.progress : a.progress - b.progress)).slice(0, 5)
    records(`${op === 'max' ? 'أعلى' : 'أقل'} ${title} في ${progressLabel(data)}`, sorted, goalRecord(data))
    return `${op === 'max' ? 'أعلى' : 'أقل'} ${title} في ${progressLabel(data)}:\n${listLines(sorted, (g) => `${g.name}: ${pct(g.progress)}`)}`
  }
  if (!list.length) return `عدد ${title}: 0`
  const line = (g) => `${g.name}${showOwner(data) && g.owner ? ` (${g.owner})` : ''}: ${g.statusLabel}، ${pct(g.progress)}`
  const goalCount = (key) => list.filter((g) => g.statusKey === key).length
  stats([
    { label: `عدد ${title}`, value: String(list.length) },
    { label: `متوسط ${progressLabel(data)}`, value: pct(list.reduce((s, g) => s + g.progress, 0) / list.length) },
    { label: 'المكتملة', value: String(goalCount('completed')), tone: 'info' },
  ])
  records(title, list, goalRecord(data), 15)
  if (op === 'count') return `عدد ${title}: ${list.length}${list.length <= 12 ? `\n${listLines(list, line)}` : ''}`
  if (op === 'summary' || op === 'list') {
    const average = Math.round(list.reduce((s, g) => s + g.progress, 0) / list.length)
    return `${title} (${list.length})، متوسط ${progressLabel(data)} ${average}%:\n${listLines(list, line, 15)}`
  }
  return `${title} (${list.length}):\n${listLines(list, line, 15)}`
}

// Payments and invoices

function answerPayments(q, op, data, scope, scopeLabel = '') {
  const isJodayn = data.portal === 'JODAYN'
  const noun = isJodayn ? 'الفواتير' : 'الدفعات'
  if (!(data.payments || []).length) return data.portal === 'CLIENT' ? 'بوابة العميل لا تحتوي على فواتير.' : 'لا توجد فواتير في حسابك.'
  let list = scope || data.payments
  const labels = []
  const state = firstMatch(q, PAYMENT_STATE_WORDS)
  if (state === 'unpaid') {
    list = list.filter((p) => p.state === 'due' || p.state === 'overdue')
    labels.push('غير المدفوعة')
  } else if (state) {
    list = list.filter((p) => p.state === state)
    labels.push(state === 'paid' ? (isJodayn ? 'المحصّلة' : 'المدفوعة') : 'المتأخرة')
  }
  const period = periodOf(q)
  if (period) {
    list = list.filter((p) => within(p.due, period))
    labels.push(`المستحقة ${period.label}`)
  }
  const title = `${noun}${labels.length ? ` ${labels.join(' ')}` : ''}${scopeLabel}`
  const total = list.reduce((s, p) => s + p.amount, 0)
  const paid = list.filter((p) => p.state === 'paid').reduce((s, p) => s + p.amount, 0)
  const late = list.filter((p) => p.state === 'overdue')
  const line = (p) =>
    `${p.number || p.name}${p.name && p.number && p.name !== p.number ? ` (${p.name})` : ''}: ${money(p.amount)}، ${
      p.state === 'paid' ? 'مدفوعة' : p.state === 'overdue' ? 'متأخرة' : p.state === 'cancelled' ? 'ملغاة' : 'مستحقة'
    }، الاستحقاق ${day(p.due)}${p.project ? `، ${p.project}` : ''}${p.party ? `، ${p.party}` : ''}`
  if (!list.length) return `عدد ${title}: 0`
  stats([
    { label: 'الإجمالي', value: money(total), hint: `${list.length} ${isJodayn ? 'فاتورة' : 'دفعة'}` },
    { label: isJodayn ? 'المحصّل' : 'المدفوع', value: money(paid), tone: 'success' },
    { label: 'المتبقي', value: money(total - paid), tone: 'warning' },
    late.length ? { label: 'المتأخر', value: money(late.reduce((s, p) => s + p.amount, 0)), hint: `${late.length} متأخرة`, tone: 'danger' } : null,
  ])
  if (op === 'max' || op === 'min') {
    const sorted = [...list].sort((a, b) => (op === 'max' ? b.amount - a.amount : a.amount - b.amount)).slice(0, 5)
    records(`${op === 'max' ? 'أعلى' : 'أقل'} ${title} قيمة`, sorted, paymentRecord)
    return `${op === 'max' ? 'أعلى' : 'أقل'} ${title} قيمة:\n${listLines(sorted, line)}`
  }
  if (op === 'soonest') {
    const next = list.filter((p) => p.state !== 'paid' && p.state !== 'cancelled').sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 5)
    records(`أقرب ${title} استحقاقًا`, next, paymentRecord)
    return next.length ? `أقرب ${title} استحقاقًا:\n${listLines(next, line)}` : `كل ${title} مدفوعة.`
  }
  const totals = `الإجمالي ${money(total)}، ${isJodayn ? 'المحصّل' : 'المدفوع'} ${money(paid)}، المتبقي ${money(total - paid)}${late.length ? `، منها ${late.length} متأخرة بقيمة ${money(late.reduce((s, p) => s + p.amount, 0))}` : ''}.`
  if (op !== 'sum') records(title, list, paymentRecord)
  if (op === 'sum') return `${title}: ${list.length}. ${totals}`
  if (op === 'count') return `عدد ${title}: ${list.length}. ${totals}`
  return `${title} (${list.length}). ${totals}\n${listLines(list, line, 12)}`
}

// Risks

function answerRisks(q, op, data, scope, scopeLabel = '') {
  const projects = scope || data.projects
  let list = projects.flatMap((p) => p.risks.map((r) => ({ ...r, owner: p.owner })))
  const labels = []
  if (hasAny(q, words(['مغلق', 'المغلقه']))) {
    list = list.filter((r) => !r.open)
    labels.push('المغلقة')
  } else if (!hasAny(q, words(['كل المخاطر', 'جميع المخاطر']))) {
    list = list.filter((r) => r.open)
    labels.push('المفتوحة')
  }
  if (hasAny(q, words(['قيد المعالجه', 'تحت المعالجه']))) {
    list = list.filter((r) => r.status === 'MITIGATING')
    labels.push('قيد المعالجة')
  }
  const level = firstMatch(q, LEVEL_WORDS)
  if (level) {
    const both = level === 4 && hasAny(q, words(['عالي', 'عاليه']))
    list = list.filter((r) => (both ? r.severity >= 3 : r.severity === level))
    labels.push(both ? 'الحرجة والعالية' : { 4: 'الحرجة', 3: 'العالية', 2: 'المتوسطة', 1: 'المنخفضة' }[level])
  }
  const title = `المخاطر${labels.length ? ` ${labels.join(' ')}` : ''}${scopeLabel}`
  if (!list.length) return `عدد ${title}: 0`
  list.sort((a, b) => b.severity - a.severity)
  const line = (r) =>
    `${r.name}${scope && scope.length === 1 ? '' : ` (${r.project})`}: التأثير ${LEVEL_LABEL[r.impact] || '—'}، الاحتمالية ${LEVEL_LABEL[r.probability] || '—'}، ${r.statusLabel}${
      r.responsible ? `، المسؤول ${r.responsible}${r.phone ? ` ${ltr(r.phone)}` : ''}${r.email ? ` ${ltr(r.email)}` : ''}` : ''
    }`
  if (op === 'max' && !scope) {
    const counts = projects.map((p) => ({ p, n: p.risks.filter((r) => r.open).length })).sort((a, b) => b.n - a.n).slice(0, 5)
    bars('أكثر المشاريع مخاطر مفتوحة', counts.map(({ p, n }) => ({ label: p.name, value: n, tone: 'danger' })))
    return `أكثر المشاريع مخاطر مفتوحة:\n${listLines(counts, ({ p, n }) => `${p.name}: ${n}`)}`
  }
  const bySeverity = (rank) => list.filter((r) => r.severity === rank).length
  stats([
    { label: `عدد ${title}`, value: String(list.length) },
    { label: 'حرجة', value: String(bySeverity(4)), tone: 'danger' },
    { label: 'عالية', value: String(bySeverity(3)), tone: 'warning' },
  ])
  records(title, list, riskRecord(scope && scope.length === 1))
  if (op === 'count') return `عدد ${title}: ${list.length}${list.length <= 10 ? `\n${listLines(list, line)}` : ''}`
  return `${title} (${list.length}):\n${listLines(list, line, 12)}`
}

// Deliverables

function answerDeliverables(q, op, data, scope, scopeLabel = '') {
  const projects = scope || data.projects
  let list = projects.flatMap((p) => p.deliverables)
  const labels = []
  const review = data.portal !== 'CLIENT' ? firstMatch(q, REVIEW_WORDS) : null
  if (review) {
    list = list.filter((d) => d.review === review)
    labels.push({ PENDING: 'بانتظار الاعتماد', CHANGES_REQUESTED: 'المطلوب تعديلها', APPROVED: 'المعتمدة' }[review])
  } else if (hasAny(q, words(['غير مكتمل', 'ما اكتمل', 'قيد التنفيذ', 'متبقي', 'باقي']))) {
    list = list.filter((d) => !d.done)
    labels.push('غير المكتملة')
  } else if (hasAny(q, words(['مكتمل', 'منجز', 'خالص']))) {
    list = list.filter((d) => d.done)
    labels.push('المكتملة')
  }
  const title = `المخرجات${labels.length ? ` ${labels.join(' ')}` : ''}${scopeLabel}`
  if (!list.length) return `عدد ${title}: 0`
  const line = (d) =>
    `${d.name}${scope && scope.length === 1 ? '' : ` (${d.project})`}: ${d.done ? 'مكتمل' : `قيد التنفيذ ${pct(d.progress)}`}${d.reviewLabel ? `، ${d.reviewLabel}` : ''}`
  stats([
    { label: `عدد ${title}`, value: String(list.length) },
    { label: 'مكتملة', value: String(list.filter((d) => d.done).length), tone: 'success' },
    data.portal !== 'CLIENT' ? { label: 'بانتظار الاعتماد', value: String(list.filter((d) => d.review === 'PENDING').length), tone: 'warning' } : null,
  ])
  records(title, list, deliverableRecord(scope && scope.length === 1), 15)
  if (op === 'count') return `عدد ${title}: ${list.length}${list.length <= 10 ? `\n${listLines(list, line)}` : ''}`
  return `${title} (${list.length}):\n${listLines(list, line, 15)}`
}

// Change requests

function answerChangeRequests(q, op, data, scope, scopeLabel = '') {
  const projects = scope || data.projects
  let list = projects.flatMap((p) => p.changeRequests)
  const status = firstMatch(q, REQUEST_WORDS)
  if (status) list = list.filter((c) => c.status === status || (status === 'UNDER_REVIEW' && c.status === 'PENDING'))
  const title = `طلبات التغيير${status ? ` ${{ UNDER_REVIEW: 'قيد المراجعة', APPROVED: 'المعتمدة', REJECTED: 'المرفوضة' }[status]}` : ''}${scopeLabel}`
  if (!list.length) return `عدد ${title}: 0`
  stats([
    { label: `عدد ${title}`, value: String(list.length) },
    { label: 'قيد المراجعة', value: String(list.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'PENDING').length), tone: 'warning' },
    { label: 'معتمدة', value: String(list.filter((c) => c.status === 'APPROVED').length), tone: 'success' },
  ])
  records(title, list, requestRecord(scope && scope.length === 1))
  const line = (c) =>
    `${c.title}${scope && scope.length === 1 ? '' : ` (${c.project})`}: ${c.statusLabel}${c.priority ? `، الأولوية ${LEVEL_LABEL[c.priority]}` : ''}${
      c.impactOnCost ? `، أثر التكلفة ${c.impactOnCost}` : ''
    }`
  if (op === 'count') return `عدد ${title}: ${list.length}${list.length <= 10 ? `\n${listLines(list, line)}` : ''}`
  return `${title} (${list.length}):\n${listLines(list, line, 12)}`
}

// Companies, departments and accounts

function entityDetail(e, data) {
  const what = e.kind === 'company' ? 'الشركة المنفذة' : 'الإدارة'
  const payments = e.kind === 'company' ? (data.payments || []).filter((p) => p.party === e.name) : []
  const owed = payments.filter((p) => p.state !== 'paid').reduce((s, p) => s + p.amount, 0)
  hero(e.name, what)
  stats([
    { label: 'المشاريع', value: String(e.projects.length) },
    e.size ? { label: e.kind === 'company' ? 'حجم الفريق' : 'عدد الموظفين', value: String(e.size) } : null,
    payments.length ? { label: 'غير المدفوع', value: money(owed), tone: owed ? 'warning' : 'success' } : null,
  ])
  facts([
    { label: 'المدير', value: e.manager },
    { label: 'البريد', value: e.email, ltr: true },
    { label: 'الهاتف', value: e.phone, ltr: true },
  ])
  const entityProjects = data.projects.filter((p) => (e.kind === 'company' ? p.company : p.department) === e.name)
  if (entityProjects.length) records('المشاريع', entityProjects, projectRecord(data))
  return [
    `${what} «${e.name}»`,
    e.manager ? `• المدير: ${e.manager}` : null,
    e.email ? `• البريد: ${ltr(e.email)}` : null,
    e.phone ? `• الهاتف: ${ltr(e.phone)}` : null,
    e.size ? `• ${e.kind === 'company' ? 'حجم الفريق' : 'عدد الموظفين'}: ${e.size}` : null,
    `• المشاريع (${e.projects.length})${e.projects.length ? `:\n${listLines(e.projects, (p) => `${p.name}: ${p.statusLabel}`)}` : ''}`,
    payments.length ? `• الدفعات: ${payments.length}، غير المدفوع ${money(owed)}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

function answerEntities(kind, q, op, data) {
  const list = kind === 'company' ? data.companies : data.departments
  const noun = kind === 'company' ? 'الشركات المنفذة' : 'الإدارات'
  if (!list || !list.length) return `لا توجد ${noun} في حسابك.`
  if (op === 'max' || op === 'min') {
    const sorted = [...list].sort((a, b) => (op === 'max' ? b.projects.length - a.projects.length : a.projects.length - b.projects.length)).slice(0, 5)
    bars(`${op === 'max' ? 'أكثر' : 'أقل'} ${noun} مشاريع`, sorted.map((e) => ({ label: e.name, value: e.projects.length, tone: 'info' })))
    return `${op === 'max' ? 'أكثر' : 'أقل'} ${noun} مشاريع:\n${listLines(sorted, (e) => `${e.name}: ${e.projects.length}`)}`
  }
  const line = (e) => `${e.name}: ${e.projects.length} ${plural(e.projects.length, 'مشروع', 'مشاريع')}${e.manager ? `، المدير ${e.manager}` : ''}`
  records(`${noun} (${list.length})`, list, (e) => ({ title: e.name, subtitle: e.manager || undefined, value: `${e.projects.length} ${plural(e.projects.length, 'مشروع', 'مشاريع')}` }), 15)
  if (op === 'count') return `عدد ${noun}: ${list.length}`
  return `${noun} (${list.length}):\n${listLines(list, line, 15)}`
}

function answerAccounts(q, op, data) {
  let list = data.accounts || []
  let type = ''
  let state = ''
  if (hasAny(q, words(['جهات', 'الجهه']))) {
    list = list.filter((a) => a.type === 'جهة')
    type = ' الجهات'
  } else if (hasAny(q, words(['عملاء', 'عميل']))) {
    list = list.filter((a) => a.type === 'عميل')
    type = ' العملاء'
  }
  if (hasAny(q, words(['غير نشط', 'موقوف', 'معطل']))) {
    list = list.filter((a) => !a.active)
    state = ' غير النشطة'
  } else if (hasAny(q, words(['نشط']))) {
    list = list.filter((a) => a.active)
    state = ' النشطة'
  }
  const labels = [type, state].filter(Boolean)
  const title = type ? `حسابات${type}${state}` : `الحسابات${state}`
  const line = (a) => `${a.name} (${a.type}): ${a.active ? 'نشط' : 'غير نشط'}${a.region ? `، ${a.region}` : ''}`
  if (!list.length) return `عدد ${title}: 0`
  stats([
    { label: `عدد ${title}`, value: String(list.length) },
    { label: 'النشطة', value: String(list.filter((a) => a.active).length), tone: 'success' },
    data.portal === 'SUPER_ADMIN' ? { label: 'المستخدمون', value: String(data.userCount) } : null,
  ])
  records(title, list, (a) => ({ title: a.name, subtitle: [a.type, a.region].filter(Boolean).join(' · '), badge: a.active ? { label: 'نشط', tone: 'success' } : { label: 'غير نشط', tone: 'neutral' } }), 15)
  const extra = data.portal === 'SUPER_ADMIN' && !labels.length ? `\nعدد المستخدمين في كل الحسابات: ${data.userCount}` : ''
  if (op === 'count') return `عدد ${title}: ${list.length}${extra}`
  return `${title} (${list.length}):${extra}\n${listLines(list, line, 15)}`
}

function answerSubscriptions(q, op, data) {
  if (data.portal !== 'SUPER_ADMIN') return 'الاشتراكات تظهر في بوابة Super Admin فقط.'
  if (hasAny(q, words(['باقه', 'باقات']))) {
    records(`الباقات (${data.packages.length})`, data.packages, (p) => ({ title: p.name, subtitle: `حتى ${p.maxUsers ?? '—'} مستخدم`, value: money(p.price), badge: p.active ? undefined : { label: 'غير مفعلة', tone: 'neutral' } }))
    return `الباقات (${data.packages.length}):\n${listLines(data.packages, (p) => `${p.name}: ${money(p.price)}، حتى ${p.maxUsers ?? '—'} مستخدم${p.active ? '' : '، غير مفعلة'}`)}`
  }
  let list = data.subscriptions
  let title = 'الاشتراكات'
  if (hasAny(q, words(['تنتهي', 'ينتهي', 'قريب', 'اقرب']))) {
    list = list.filter((s) => s.expiringSoon)
    title = 'الاشتراكات التي تنتهي خلال 30 يومًا'
  } else if (hasAny(q, words(['منتهي', 'المنتهيه']))) {
    list = list.filter((s) => s.status === 'EXPIRED')
    title = 'الاشتراكات المنتهية'
  } else if (hasAny(q, words(['نشط']))) {
    list = list.filter((s) => s.status === 'ACTIVE')
    title = 'الاشتراكات النشطة'
  }
  if (!list.length) return `عدد ${title}: 0`
  records(title, list, (s) => ({ title: s.account, subtitle: s.packageName, badge: s.expiringSoon ? { label: 'ينتهي قريبًا', tone: 'warning' } : { label: s.status === 'ACTIVE' ? 'نشط' : s.status, tone: s.status === 'ACTIVE' ? 'success' : 'neutral' }, note: `ينتهي ${day(s.end)}` }))
  if (op === 'count') return `عدد ${title}: ${list.length}`
  return `${title} (${list.length}):\n${listLines(list, (s) => `${s.account}: ${s.packageName}، ${s.status}، ينتهي ${day(s.end)}`)}`
}

// ── Overview and help ───────────────────────────────────────────────────────

function overview(data) {
  if (data.portal === 'SUPER_ADMIN') {
    const active = data.accounts.filter((a) => a.active).length
    stats([
      { label: 'الحسابات', value: String(data.accounts.length), hint: `${active} نشطة` },
      { label: 'المستخدمون', value: String(data.userCount) },
      { label: 'اشتراكات نشطة', value: String(data.subscriptions.filter((s) => s.status === 'ACTIVE').length), tone: 'success' },
      { label: 'تنتهي قريبًا', value: String(data.subscriptions.filter((s) => s.expiringSoon).length), tone: 'warning' },
    ])
    return [
      'ملخص المنصة:',
      `• الحسابات: ${data.accounts.length} (النشطة ${active})`,
      `• المستخدمون: ${data.userCount}`,
      `• الاشتراكات النشطة: ${data.subscriptions.filter((s) => s.status === 'ACTIVE').length}، تنتهي قريبًا ${data.subscriptions.filter((s) => s.expiringSoon).length}`,
      `• الباقات: ${data.packages.length}`,
    ].join('\n')
  }
  const byStatus = (key) => data.projects.filter((p) => p.statusKey === key).length
  const openRisks = data.projects.flatMap((p) => p.risks).filter((r) => r.open)
  const pending = data.projects.filter((p) => p.approval === 'PENDING').length
  const pendingDeliverables = data.projects.flatMap((p) => p.deliverables).filter((d) => d.review === 'PENDING').length
  const goalAvg = data.goals.length ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / data.goals.length) : 0
  const payments = data.payments || []
  const unpaid = payments.filter((p) => p.state === 'due' || p.state === 'overdue')
  const late = payments.filter((p) => p.state === 'overdue')
  stats([
    { label: 'المشاريع', value: String(data.projects.length), hint: pending ? `${pending} بانتظار الاعتماد` : undefined },
    { label: 'المخاطر المفتوحة', value: String(openRisks.length), hint: `${openRisks.filter((r) => r.severity >= 3).length} حرجة أو عالية`, tone: 'danger' },
    data.goals.length ? { label: `متوسط ${progressLabel(data)}`, value: `${goalAvg}%`, hint: `${data.goals.length} أهداف` } : null,
    payments.length ? { label: 'غير المدفوع', value: money(unpaid.reduce((s, p) => s + p.amount, 0)), hint: late.length ? `${late.length} متأخرة` : undefined, tone: 'warning' } : null,
  ])
  bars('توزيع حالات المشاريع', [
    { label: 'على المسار', value: byStatus('track'), tone: 'success' },
    { label: 'تأخير', value: byStatus('delay'), tone: 'warning' },
    { label: 'متعثر', value: byStatus('blocked'), tone: 'danger' },
    { label: 'مكتمل', value: byStatus('done'), tone: 'info' },
  ])
  return [
    'ملخص الوضع الحالي:',
    `• المشاريع: ${data.projects.length} (على المسار ${byStatus('track')}، تأخير ${byStatus('delay')}، متعثر ${byStatus('blocked')}، مكتمل ${byStatus('done')})`,
    pending ? `• مشاريع بانتظار الاعتماد: ${pending}` : null,
    data.portal !== 'CLIENT' && pendingDeliverables ? `• مخرجات بانتظار الاعتماد: ${pendingDeliverables}` : null,
    `• المخاطر المفتوحة: ${openRisks.length} (حرجة أو عالية ${openRisks.filter((r) => r.severity >= 3).length})`,
    data.goals.length ? `• الأهداف الاستراتيجية: ${data.goals.length}، متوسط ${progressLabel(data)} ${goalAvg}%` : null,
    payments.length ? `• ${data.portal === 'JODAYN' ? 'الفواتير' : 'الدفعات'} غير المدفوعة: ${unpaid.length} بقيمة ${money(unpaid.reduce((s, p) => s + p.amount, 0))}${late.length ? `، منها ${late.length} متأخرة` : ''}` : null,
    data.accounts ? `• الحسابات: ${data.accounts.length}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

function suggestionsFor(data, focus) {
  if (focus?.kind === 'project') return [`وش مخاطر ${focus.name}؟`, `مخرجات ${focus.name}`, `كم ميزانية ${focus.name}؟`]
  if (focus?.kind === 'goal') return [`وش المشاريع المرتبطة بـ${focus.name}؟`, 'الأهداف المتأخرة', 'أقل الأهداف تقدمًا']
  if (data.portal === 'SUPER_ADMIN') return ['كم حساب نشط؟', 'الاشتراكات اللي تنتهي قريب', 'وش الباقات المتوفرة؟']
  if (data.portal === 'JODAYN') return ['لخص الوضع', 'الفواتير المتأخرة', 'كم مشروع متأخر؟']
  if (data.portal === 'CLIENT') return ['لخص الوضع', 'المخاطر الحرجة', 'أقل المشاريع إنجازًا']
  return ['لخص الوضع', 'المخاطر الحرجة والعالية', 'الدفعات المتأخرة']
}

function helpText(data) {
  const examples =
    data.portal === 'SUPER_ADMIN'
      ? ['كم حساب نشط؟', 'وش الباقات المتوفرة؟', 'الاشتراكات اللي تنتهي قريب', 'لخص المنصة']
      : [
          'لخص الوضع',
          'كم مشروع متأخر؟',
          `تفاصيل مشروع ${data.projects[0]?.name || 'البوابة'}`,
          'المخاطر الحرجة والعالية',
          'الأهداف الاستراتيجية في 2026',
          data.portal === 'CLIENT' ? 'المخرجات غير المكتملة' : data.portal === 'JODAYN' ? 'الفواتير المتأخرة' : 'كم المبلغ المتبقي للدفع؟',
          'أعلى المشاريع ميزانية',
          data.portal === 'ORG' ? 'مشاريع شركة نافذ للتقنية' : 'طلبات التغيير قيد المراجعة',
        ]
  return `أجاوب من بيانات حسابك مباشرة. أمثلة لأسئلة تقدر تسألها:\n${listLines(examples, (e) => e, 10)}`
}

const FOLLOW_UP = new RegExp(
  `(^|\\s)و?(${words(['مخاطر', 'مخرجات', 'ميزانيت', 'تفاصيل', 'معلومات', 'عقود', 'دفعات', 'فواتير', 'اهداف', 'طلبات', 'مدير', 'نسبت', 'تقدم', 'انجاز', 'موعد', 'نهايت', 'حالت', 'مشاريع']).join('|')})ت?(ه|ها|هم)(\\s|$)`,
)
const isFollowUp = (q) => FOLLOW_UP.test(q) && q.split(' ').length <= 5

// ── Entry point ─────────────────────────────────────────────────────────────

function findById(data, focus) {
  if (!focus?.id) return null
  return candidates(data).find((r) => r.id === focus.id && r.kind === focus.kind) || null
}

/**
 * @param {string} question  the user's message
 * @param {object} data      result of loadDataset for the signed-in user
 * @param {object} [focus]   the record the previous answer was about, for follow-up questions
 * @returns {{ reply: string, focus: object|null, suggestions: string[] }}
 */
function answer(question, data, focus) {
  // "غير المكتملة" reads the same as "غير مكتملة".
  const q = normalize(question).replace(/غير ال/g, 'غير ')
  blocks = []
  const reply = (text, record = null) => ({
    reply: text,
    title: text.split('\n')[0].split('. ')[0].replace(/[:.]$/, ''),
    blocks: blocks.splice(0),
    focus: record ? { kind: record.kind, id: record.id, name: record.name } : null,
    suggestions: suggestionsFor(data, record),
  })
  if (!q) return reply(helpText(data))
  if (hasAny(q, THANKS) && q.split(' ').length <= 4) return reply('العفو! إذا عندك سؤال ثاني عن مشاريعك أو أهدافك أو فواتيرك أنا حاضر.')
  if (hasAny(q, HELP)) return reply(helpText(data))
  if (hasAny(q, GREETING) && q.split(' ').length <= 3) return reply(`أهلًا! ${helpText(data)}`)

  const topic = detectTopic(q, data.portal)
  const op = detectOp(q)
  let named = findNamed(q, data)
  // Follow-up about the record just discussed, such as "وش مخاطره؟" or "ومخرجاته".
  if (!named.length && focus && isFollowUp(q)) {
    const previous = findById(data, focus)
    if (previous) named = [previous]
  }

  if (named.length) {
    const record = named[0]
    if (record.kind === 'project') {
      if (named.length > 1 && !topic) return reply(named.map((p) => projectDetail(p, data)).join('\n\n'), record)
      return reply(projectSubTopic(topic, q, op, record, data), record)
    }
    if (record.kind === 'goal') return reply(goalDetail(record, data), record)
    if (record.kind === 'company' || record.kind === 'department') {
      const scope = data.projects.filter((p) => (record.kind === 'company' ? p.company : p.department) === record.name)
      const label = ` ${record.kind === 'company' ? 'لدى' : 'في'} «${record.name}»`
      if (topic === 'payment') return reply(answerPayments(q, op, data, (data.payments || []).filter((p) => p.party === record.name), ` لـ«${record.name}»`), record)
      if (topic === 'risk') return reply(answerRisks(q, op, data, scope, label), record)
      if (topic === 'deliverable') return reply(answerDeliverables(q, op, data, scope, label), record)
      if (hasAny(q, TOPICS.project) || firstMatch(q, PROJECT_STATUS_WORDS) || op === 'count') return reply(answerProjects(q, op, data, scope, label), record)
      return reply(entityDetail(record, data), record)
    }
    if (record.kind === 'payment') {
      const p = record
      return reply(
        `الفاتورة ${p.number}${p.aliases?.[0] && p.aliases[0] !== p.number ? ` (${p.aliases[0]})` : ''}\n• المبلغ: ${money(p.amount)}\n• الحالة: ${
          p.state === 'paid' ? 'مدفوعة' : p.state === 'overdue' ? 'متأخرة' : p.state === 'cancelled' ? 'ملغاة' : 'مستحقة'
        }\n• الاستحقاق: ${day(p.due)}${p.paidAt ? `\n• تاريخ الدفع: ${day(p.paidAt)}` : ''}${p.project ? `\n• المشروع: ${p.project}` : ''}${p.party ? `\n• الطرف: ${p.party}` : ''}`,
      )
    }
    if (record.kind === 'account') {
      const owned = data.projects.filter((p) => p.owner === record.name)
      if (topic === 'project' || op === 'count') return reply(answerProjects(q, op, data, owned, ` لدى «${record.name}»`))
      if (topic === 'goal') {
        const goals = data.goals.filter((g) => g.owner === record.name)
        return reply(answerGoals(q, op, { ...data, goals }))
      }
      return reply(
        `${record.type} «${record.name}»\n• الحالة: ${record.active ? 'نشط' : 'غير نشط'}${record.region ? `\n• المنطقة: ${record.region}` : ''}${
          owned.length ? `\n• المشاريع: ${owned.length}\n${listLines(owned, (p) => projectLine(p, data))}` : ''
        }`,
      )
    }
  }

  if (op === 'summary' && (!topic || topic === 'project')) return reply(overview(data))
  if (data.portal === 'SUPER_ADMIN' && topic && !['account', 'subscription'].includes(topic)) {
    return reply('بوابة Super Admin تعرض الحسابات والمستخدمين والاشتراكات والباقات. المشاريع والأهداف والفواتير تظهر داخل بوابات الجهات والعملاء وجودين.')
  }
  switch (topic) {
    case 'project':
      return reply(answerProjects(q, op, data))
    case 'goal':
      return reply(answerGoals(q, op, data))
    case 'payment':
      return reply(answerPayments(q, op, data))
    case 'risk':
      return reply(answerRisks(q, op, data))
    case 'deliverable':
      return reply(answerDeliverables(q, op, data))
    case 'changeRequest':
      return reply(answerChangeRequests(q, op, data))
    case 'company':
    case 'department':
      return reply(answerEntities(topic, q, op, data))
    case 'account':
      return reply(answerAccounts(q, op, data))
    case 'subscription':
      return reply(answerSubscriptions(q, op, data))
    case 'contract': {
      const list = data.projects.flatMap((p) => p.contracts.map((c) => `${c} (${p.name})`))
      return reply(list.length ? `العقود (${list.length}):\n${listLines(list, (c) => c, 15)}` : 'لا توجد عقود مسجلة.')
    }
    default:
      break
  }
  // A status word alone ("وش المتأخر؟") is most often about projects.
  if (firstMatch(q, PROJECT_STATUS_WORDS) || firstMatch(q, APPROVAL_WORDS)) return reply(answerProjects(q, op, data))
  if (op === 'summary') return reply(overview(data))
  return reply(`ما قدرت أحدد المقصود من سؤالك. ${helpText(data)}`)
}

module.exports = { answer }
