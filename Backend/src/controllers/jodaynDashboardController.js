const { buildJodaynDashboard } = require('../lib/dashboardStats')

exports.getDashboard = async (req, res) => {
  try {
    const data = await buildJodaynDashboard()
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
