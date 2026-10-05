const prisma = require('../lib/prisma')

// ============ EXECUTING COMPANIES ============

exports.getCompanies = async (req, res) => {
  try {
    const orgId = req.user.orgId

    const companies = await prisma.executingCompany.findMany({
      where: { orgId },
      include: { team: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: companies.length, companies })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createCompany = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const {
      name,
      registrationNo,
      managerName,
      email,
      phone,
      teamCount,
      description,
      isActive
    } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Required field: name' })
    }

    const company = await prisma.executingCompany.create({
      data: {
        name,
        registrationNo,
        managerName,
        email,
        phone,
        teamCount: teamCount ?? 0,
        description,
        isActive: isActive !== undefined ? isActive : true,
        orgId
      }
    })

    res.json({ success: true, company })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getCompanyById = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const company = await prisma.executingCompany.findUnique({
      where: { id },
      include: { team: true }
    })

    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }
    if (company.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({ company })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateCompany = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.executingCompany.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Company not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const data = { ...req.body }
    delete data.orgId
    delete data.id

    const company = await prisma.executingCompany.update({
      where: { id },
      data
    })

    res.json({ success: true, company })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteCompany = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.executingCompany.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Company not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    await prisma.executingCompany.delete({ where: { id } })

    res.json({ success: true, message: 'Company deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ COMPANY TEAM ============

exports.getTeam = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const company = await prisma.executingCompany.findUnique({ where: { id } })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    if (company.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const team = await prisma.executingCompanyTeam.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: team.length, team })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createTeamMember = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params
    const { name, email, role } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Required field: name' })
    }

    const company = await prisma.executingCompany.findUnique({ where: { id } })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    if (company.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const member = await prisma.executingCompanyTeam.create({
      data: {
        name,
        email,
        role,
        companyId: id
      }
    })

    await prisma.executingCompany.update({
      where: { id },
      data: { teamCount: { increment: 1 } }
    })

    res.json({ success: true, member })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateTeamMember = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id, memberId } = req.params

    const company = await prisma.executingCompany.findUnique({ where: { id } })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    if (company.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.executingCompanyTeam.findUnique({ where: { id: memberId } })
    if (!existing || existing.companyId !== id) {
      return res.status(404).json({ message: 'Team member not found' })
    }

    const data = { ...req.body }
    delete data.companyId
    delete data.id

    const member = await prisma.executingCompanyTeam.update({
      where: { id: memberId },
      data
    })

    res.json({ success: true, member })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteTeamMember = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id, memberId } = req.params

    const company = await prisma.executingCompany.findUnique({ where: { id } })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    if (company.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.executingCompanyTeam.findUnique({ where: { id: memberId } })
    if (!existing || existing.companyId !== id) {
      return res.status(404).json({ message: 'Team member not found' })
    }

    await prisma.executingCompanyTeam.delete({ where: { id: memberId } })

    await prisma.executingCompany.update({
      where: { id },
      data: { teamCount: { decrement: 1 } }
    })

    res.json({ success: true, message: 'Team member deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
