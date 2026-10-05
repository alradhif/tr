const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded

    const lookups = {
      SUPER_ADMIN: () => prisma.superAdmin.findUnique({ where: { id: decoded.userId } }),
      JODAYN: () => prisma.jodaynUser.findUnique({ where: { id: decoded.userId } }),
      ORG: () => prisma.orgUser.findUnique({ where: { id: decoded.userId } }),
      CLIENT: () => prisma.clientUser.findUnique({ where: { id: decoded.userId } }),
    }
    const lookup = lookups[decoded.type]
    if (lookup) {
      const liveUser = await lookup()
      if (!liveUser || liveUser.isActive === false || liveUser.pendingActivation === true) {
        return res.status(401).json({ message: 'هذا الحساب غير نشط' })
      }
    }

    next()
  } catch {
    res.status(401).json({ message: 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى' })
  }
}
