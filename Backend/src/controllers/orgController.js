const { portalUserHandlers } = require('../lib/portalUsers')

const users = portalUserHandlers('ORG')

exports.createOrgUser = users.create
exports.getOrgUsers = users.list
exports.getAssignableOrgUsers = users.assignable
exports.toggleOrgUser = users.toggle
exports.resetOrgUserCredentials = users.resetCredentials
exports.reissueOrgInvite = users.resetCredentials

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const orgId = req.user.orgId
    if (!orgId) return res.status(403).json({ message: 'Org scope required' })
    const { buildProjectPortalDashboard } = require('../lib/dashboardStats')
    const data = await buildProjectPortalDashboard('ORG', orgId, { role: req.user.role })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
