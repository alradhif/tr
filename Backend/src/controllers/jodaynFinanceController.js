const prisma = require('../lib/prisma')

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function computeVat(amount, vatRate) {
  const amt = toNumber(amount)
  const rate = toNumber(vatRate)
  const vatAmount = (amt * rate) / 100
  const totalWithVat = amt + vatAmount
  return { vatAmount, totalWithVat }
}

function parseDate(value) {
  if (!value) return undefined
  return new Date(value)
}

// ============ INVOICES ============

const INVOICE_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']
// MONTHLY / ANNUAL are subscriptions; anything else (null) is a fixed asset.
const BILLING_CYCLES = ['MONTHLY', 'ANNUAL']

function normalizeBillingCycle(value) {
  return BILLING_CYCLES.includes(value) ? value : null
}

exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      amount,
      remainingAmount,
      vatRate,
      vatAmount,
      totalWithVat,
      clientName,
      contractReference,
      projectName,
      region,
      billingCycle,
      issueDate,
      dueDate,
      nextInvoiceDate,
      status,
      orgId,
      clientId
    } = req.body

    if (!invoiceNumber || amount === undefined || !clientName || !issueDate || !dueDate) {
      return res.status(400).json({
        message: 'Required fields: invoiceNumber, amount, clientName, issueDate, dueDate'
      })
    }

    const amt = toNumber(amount)
    const rate = toNumber(vatRate)
    let computedVat = toNumber(vatAmount)
    let computedTotal = toNumber(totalWithVat)

    if ((vatAmount === undefined || totalWithVat === undefined) && (vatRate !== undefined || amount !== undefined)) {
      const computed = computeVat(amt, rate)
      if (vatAmount === undefined) computedVat = computed.vatAmount
      if (totalWithVat === undefined) computedTotal = computed.totalWithVat
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        amount: amt,
        remainingAmount: remainingAmount !== undefined ? toNumber(remainingAmount) : 0,
        vatRate: rate,
        vatAmount: computedVat,
        totalWithVat: computedTotal,
        clientName,
        contractReference,
        projectName,
        region: region || null,
        billingCycle: normalizeBillingCycle(billingCycle),
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        nextInvoiceDate: nextInvoiceDate ? new Date(nextInvoiceDate) : null,
        status: status || 'PENDING',
        orgId: orgId || null,
        clientId: clientId || null
      }
    })

    res.json({ success: true, invoice })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getInvoices = async (req, res) => {
  try {
    const { status, orgId, clientId } = req.query
    const where = {}
    if (status) where.status = status
    if (orgId) where.orgId = orgId
    if (clientId) where.clientId = clientId

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: invoices.length, invoices })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } })
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    res.json({ invoice })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateInvoice = async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Invoice not found' })

    const {
      invoiceNumber,
      amount,
      remainingAmount,
      vatRate,
      vatAmount,
      totalWithVat,
      clientName,
      contractReference,
      projectName,
      region,
      billingCycle,
      issueDate,
      dueDate,
      nextInvoiceDate,
      status,
      orgId,
      clientId
    } = req.body

    const data = {}
    if (invoiceNumber !== undefined) data.invoiceNumber = invoiceNumber
    if (clientName !== undefined) data.clientName = clientName
    if (contractReference !== undefined) data.contractReference = contractReference
    if (projectName !== undefined) data.projectName = projectName
    if (region !== undefined) data.region = region || null
    if (billingCycle !== undefined) data.billingCycle = normalizeBillingCycle(billingCycle)
    if (issueDate !== undefined) data.issueDate = new Date(issueDate)
    if (dueDate !== undefined) data.dueDate = new Date(dueDate)
    if (nextInvoiceDate !== undefined) data.nextInvoiceDate = nextInvoiceDate ? new Date(nextInvoiceDate) : null
    if (status !== undefined) {
      if (!INVOICE_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid invoice status' })
      data.status = status
      if (status === 'PAID' && remainingAmount === undefined) data.remainingAmount = 0
    }
    if (orgId !== undefined) data.orgId = orgId || null
    if (clientId !== undefined) data.clientId = clientId || null
    if (remainingAmount !== undefined) data.remainingAmount = toNumber(remainingAmount)

    const nextAmount = amount !== undefined ? toNumber(amount) : toNumber(existing.amount)
    const nextVatRate = vatRate !== undefined ? toNumber(vatRate) : toNumber(existing.vatRate)

    if (amount !== undefined) data.amount = nextAmount
    if (vatRate !== undefined) data.vatRate = nextVatRate

    if (amount !== undefined || vatRate !== undefined) {
      if (vatAmount === undefined || totalWithVat === undefined) {
        const computed = computeVat(nextAmount, nextVatRate)
        data.vatAmount = vatAmount !== undefined ? toNumber(vatAmount) : computed.vatAmount
        data.totalWithVat = totalWithVat !== undefined ? toNumber(totalWithVat) : computed.totalWithVat
      } else {
        data.vatAmount = toNumber(vatAmount)
        data.totalWithVat = toNumber(totalWithVat)
      }
    } else {
      if (vatAmount !== undefined) data.vatAmount = toNumber(vatAmount)
      if (totalWithVat !== undefined) data.totalWithVat = toNumber(totalWithVat)
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data
    })

    res.json({ success: true, invoice })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteInvoice = async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Invoice not found' })

    await prisma.invoice.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Invoice deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ REVENUE FORECASTS ============

exports.createForecast = async (req, res) => {
  try {
    const {
      quarter,
      year,
      optimisticValue,
      optimisticProbability,
      pessimisticValue,
      pessimisticProbability,
      conservativeValue,
      conservativeProbability,
      actualValue,
      branchFilter,
      dateRangeStart,
      dateRangeEnd,
      orgId,
      clientId
    } = req.body

    if (!quarter || year === undefined) {
      return res.status(400).json({ message: 'Required fields: quarter, year' })
    }

    const forecast = await prisma.revenueForecast.create({
      data: {
        quarter,
        year: Number(year),
        optimisticValue: toNumber(optimisticValue),
        optimisticProbability: toNumber(optimisticProbability),
        pessimisticValue: toNumber(pessimisticValue),
        pessimisticProbability: toNumber(pessimisticProbability),
        conservativeValue: toNumber(conservativeValue),
        conservativeProbability: toNumber(conservativeProbability),
        actualValue: toNumber(actualValue),
        branchFilter: branchFilter || null,
        dateRangeStart: parseDate(dateRangeStart) || null,
        dateRangeEnd: parseDate(dateRangeEnd) || null,
        orgId: orgId || null,
        clientId: clientId || null
      }
    })

    res.json({ success: true, forecast })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getForecasts = async (req, res) => {
  try {
    const { year, quarter, orgId, clientId } = req.query
    const where = {}
    if (year) where.year = Number(year)
    if (quarter) where.quarter = quarter
    if (orgId) where.orgId = orgId
    if (clientId) where.clientId = clientId

    const forecasts = await prisma.revenueForecast.findMany({
      where,
      orderBy: [{ year: 'desc' }, { quarter: 'asc' }]
    })

    res.json({ count: forecasts.length, forecasts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getForecastById = async (req, res) => {
  try {
    const forecast = await prisma.revenueForecast.findUnique({ where: { id: req.params.id } })
    if (!forecast) return res.status(404).json({ message: 'Forecast not found' })
    res.json({ forecast })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateForecast = async (req, res) => {
  try {
    const existing = await prisma.revenueForecast.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Forecast not found' })

    const {
      quarter,
      year,
      optimisticValue,
      optimisticProbability,
      pessimisticValue,
      pessimisticProbability,
      conservativeValue,
      conservativeProbability,
      actualValue,
      branchFilter,
      dateRangeStart,
      dateRangeEnd,
      orgId,
      clientId
    } = req.body

    const data = {}
    if (quarter !== undefined) data.quarter = quarter
    if (year !== undefined) data.year = Number(year)
    if (optimisticValue !== undefined) data.optimisticValue = toNumber(optimisticValue)
    if (optimisticProbability !== undefined) data.optimisticProbability = toNumber(optimisticProbability)
    if (pessimisticValue !== undefined) data.pessimisticValue = toNumber(pessimisticValue)
    if (pessimisticProbability !== undefined) data.pessimisticProbability = toNumber(pessimisticProbability)
    if (conservativeValue !== undefined) data.conservativeValue = toNumber(conservativeValue)
    if (conservativeProbability !== undefined) data.conservativeProbability = toNumber(conservativeProbability)
    if (actualValue !== undefined) data.actualValue = toNumber(actualValue)
    if (branchFilter !== undefined) data.branchFilter = branchFilter || null
    if (dateRangeStart !== undefined) data.dateRangeStart = dateRangeStart ? new Date(dateRangeStart) : null
    if (dateRangeEnd !== undefined) data.dateRangeEnd = dateRangeEnd ? new Date(dateRangeEnd) : null
    if (orgId !== undefined) data.orgId = orgId || null
    if (clientId !== undefined) data.clientId = clientId || null

    const forecast = await prisma.revenueForecast.update({
      where: { id: req.params.id },
      data
    })

    res.json({ success: true, forecast })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteForecast = async (req, res) => {
  try {
    const existing = await prisma.revenueForecast.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Forecast not found' })

    await prisma.revenueForecast.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Forecast deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ FINANCIAL REPORTS ============

exports.createReport = async (req, res) => {
  try {
    const {
      type,
      totalContractsValue,
      netProfit,
      budgetVariance,
      cashFlowIn,
      cashFlowOut,
      netCashFlow,
      profitTrend,
      revenueTrend,
      sectorRevenueComparison,
      period,
      aiInsights,
      orgId,
      clientId
    } = req.body

    if (!type) {
      return res.status(400).json({ message: 'Required field: type' })
    }

    const report = await prisma.financialReport.create({
      data: {
        type,
        totalContractsValue: toNumber(totalContractsValue),
        netProfit: toNumber(netProfit),
        budgetVariance: toNumber(budgetVariance),
        cashFlowIn: toNumber(cashFlowIn),
        cashFlowOut: toNumber(cashFlowOut),
        netCashFlow: toNumber(netCashFlow),
        profitTrend: profitTrend || null,
        revenueTrend: revenueTrend || null,
        sectorRevenueComparison: sectorRevenueComparison || null,
        period: period || null,
        aiInsights: aiInsights || null,
        orgId: orgId || null,
        clientId: clientId || null
      }
    })

    res.json({ success: true, report })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getReports = async (req, res) => {
  try {
    const { type, orgId, clientId, period } = req.query
    const where = {}
    if (type) where.type = type
    if (orgId) where.orgId = orgId
    if (clientId) where.clientId = clientId
    if (period) where.period = period

    const reports = await prisma.financialReport.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: reports.length, reports })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getReportById = async (req, res) => {
  try {
    const report = await prisma.financialReport.findUnique({ where: { id: req.params.id } })
    if (!report) return res.status(404).json({ message: 'Report not found' })
    res.json({ report })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateReport = async (req, res) => {
  try {
    const existing = await prisma.financialReport.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Report not found' })

    const {
      type,
      totalContractsValue,
      netProfit,
      budgetVariance,
      cashFlowIn,
      cashFlowOut,
      netCashFlow,
      profitTrend,
      revenueTrend,
      sectorRevenueComparison,
      period,
      aiInsights,
      orgId,
      clientId
    } = req.body

    const data = {}
    if (type !== undefined) data.type = type
    if (totalContractsValue !== undefined) data.totalContractsValue = toNumber(totalContractsValue)
    if (netProfit !== undefined) data.netProfit = toNumber(netProfit)
    if (budgetVariance !== undefined) data.budgetVariance = toNumber(budgetVariance)
    if (cashFlowIn !== undefined) data.cashFlowIn = toNumber(cashFlowIn)
    if (cashFlowOut !== undefined) data.cashFlowOut = toNumber(cashFlowOut)
    if (netCashFlow !== undefined) data.netCashFlow = toNumber(netCashFlow)
    if (profitTrend !== undefined) data.profitTrend = profitTrend || null
    if (revenueTrend !== undefined) data.revenueTrend = revenueTrend || null
    if (sectorRevenueComparison !== undefined) data.sectorRevenueComparison = sectorRevenueComparison || null
    if (period !== undefined) data.period = period || null
    if (aiInsights !== undefined) data.aiInsights = aiInsights || null
    if (orgId !== undefined) data.orgId = orgId || null
    if (clientId !== undefined) data.clientId = clientId || null

    const report = await prisma.financialReport.update({
      where: { id: req.params.id },
      data
    })

    res.json({ success: true, report })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteReport = async (req, res) => {
  try {
    const existing = await prisma.financialReport.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Report not found' })

    await prisma.financialReport.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Report deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
