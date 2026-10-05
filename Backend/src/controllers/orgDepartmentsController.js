const prisma = require('../lib/prisma')

// ============ DEPARTMENTS ============

exports.getDepartments = async (req, res) => {
  try {
    const orgId = req.user.orgId

    const departments = await prisma.department.findMany({
      where: { orgId },
      include: { employees: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: departments.length, departments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createDepartment = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const {
      name,
      type,
      managerName,
      email,
      phone,
      employeeCount,
      description,
      isActive
    } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Required field: name' })
    }

    const department = await prisma.department.create({
      data: {
        name,
        type,
        managerName,
        email,
        phone,
        employeeCount: employeeCount ?? 0,
        description,
        isActive: isActive !== undefined ? isActive : true,
        orgId
      }
    })

    res.json({ success: true, department })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDepartmentById = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const department = await prisma.department.findUnique({
      where: { id },
      include: { employees: true }
    })

    if (!department) {
      return res.status(404).json({ message: 'Department not found' })
    }
    if (department.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({ department })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateDepartment = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Department not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const data = { ...req.body }
    delete data.orgId
    delete data.id

    const department = await prisma.department.update({
      where: { id },
      data
    })

    res.json({ success: true, department })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteDepartment = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Department not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    await prisma.department.delete({ where: { id } })

    res.json({ success: true, message: 'Department deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ DEPARTMENT EMPLOYEES ============

exports.getEmployees = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const department = await prisma.department.findUnique({ where: { id } })
    if (!department) return res.status(404).json({ message: 'Department not found' })
    if (department.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const employees = await prisma.departmentEmployee.findMany({
      where: { departmentId: id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: employees.length, employees })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createEmployee = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params
    const { name, email, role } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Required field: name' })
    }

    const department = await prisma.department.findUnique({ where: { id } })
    if (!department) return res.status(404).json({ message: 'Department not found' })
    if (department.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const employee = await prisma.departmentEmployee.create({
      data: {
        name,
        email,
        role,
        departmentId: id
      }
    })

    await prisma.department.update({
      where: { id },
      data: { employeeCount: { increment: 1 } }
    })

    res.json({ success: true, employee })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateEmployee = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id, empId } = req.params

    const department = await prisma.department.findUnique({ where: { id } })
    if (!department) return res.status(404).json({ message: 'Department not found' })
    if (department.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.departmentEmployee.findUnique({ where: { id: empId } })
    if (!existing || existing.departmentId !== id) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const data = { ...req.body }
    delete data.departmentId
    delete data.id

    const employee = await prisma.departmentEmployee.update({
      where: { id: empId },
      data
    })

    res.json({ success: true, employee })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteEmployee = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id, empId } = req.params

    const department = await prisma.department.findUnique({ where: { id } })
    if (!department) return res.status(404).json({ message: 'Department not found' })
    if (department.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.departmentEmployee.findUnique({ where: { id: empId } })
    if (!existing || existing.departmentId !== id) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    await prisma.departmentEmployee.delete({ where: { id: empId } })

    await prisma.department.update({
      where: { id },
      data: { employeeCount: { decrement: 1 } }
    })

    res.json({ success: true, message: 'Employee deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
