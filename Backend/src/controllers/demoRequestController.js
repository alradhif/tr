const prisma = require('../lib/prisma')
const { createForUsers } = require('../lib/notify')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SAUDI_PHONE_PATTERN = /^5\d{8}$/
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5
const recent = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter((at) => now - at < WINDOW_MS)
  hits.push(now)
  recent.set(ip, hits)
  return hits.length > MAX_PER_WINDOW
}

function text(value, max = 160) {
  return String(value || '').trim().slice(0, max)
}

/** Public landing-page form. Stores the request and notifies the platform administrators. */
exports.create = async (req, res) => {
  try {
    const data = {
      fullName: text(req.body?.fullName),
      phone: text(req.body?.phone, 20).replace(/\s+/g, ''),
      companyName: text(req.body?.companyName),
      businessEmail: text(req.body?.businessEmail).toLowerCase(),
      jobTitle: text(req.body?.jobTitle),
    }
    const errors = {}
    if (data.fullName.length < 3) errors.fullName = 'الاسم الكامل مطلوب'
    if (!SAUDI_PHONE_PATTERN.test(data.phone)) errors.phone = 'رقم الجوال غير صحيح'
    if (data.companyName.length < 2) errors.companyName = 'اسم الشركة مطلوب'
    if (!EMAIL_PATTERN.test(data.businessEmail)) errors.businessEmail = 'البريد الإلكتروني غير صحيح'
    if (!data.jobTitle) errors.jobTitle = 'المسمى الوظيفي مطلوب'
    if (Object.keys(errors).length) return res.status(400).json({ message: 'تحقق من البيانات المدخلة', errors })
    if (rateLimited(req.ip)) return res.status(429).json({ message: 'تم استلام عدة طلبات، حاول لاحقاً' })

    const request = await prisma.demoRequest.create({ data })
    const admins = await prisma.superAdmin.findMany({ select: { id: true } })
    await createForUsers(
      admins.map((admin) => admin.id),
      'SUPER_ADMIN',
      {
        title: 'طلب عرض تجريبي جديد',
        message: `${data.fullName} (${data.jobTitle}) من ${data.companyName} · ${data.businessEmail} · ${data.phone}`,
        type: 'SYSTEM',
        link: '/super-admin/demo-requests',
      },
    ).catch(() => {})
    res.status(201).json({ success: true, id: request.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.list = async (_req, res) => {
  try {
    const requests = await prisma.demoRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ requests })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
