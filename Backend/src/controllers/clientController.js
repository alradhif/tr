const { portalUserHandlers } = require('../lib/portalUsers')

const users = portalUserHandlers('CLIENT')

exports.createClientUser = users.create
exports.getClientUsers = users.list
exports.getAssignableClientUsers = users.assignable
exports.toggleClientUser = users.toggle
exports.resetClientUserCredentials = users.resetCredentials
exports.reissueClientInvite = users.resetCredentials

exports.getDashboard = async (req, res) => {
  try {
    const clientId = req.user.clientId
    if (!clientId) return res.status(403).json({ message: 'Client scope required' })
    const { buildProjectPortalDashboard } = require('../lib/dashboardStats')
    const data = await buildProjectPortalDashboard('CLIENT', clientId, { role: req.user.role })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
