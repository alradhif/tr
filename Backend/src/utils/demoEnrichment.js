const prisma = require('../lib/prisma')
const storage = require('../lib/fileStorage')

/**
 * Extra synthetic demo data so no screen in the demo is empty: more projects for the companies
 * that had none, contact details, teams, comments, decision logs, scenarios, goal stages and
 * KPI history. Everything here is fictional and only runs against the demo database.
 */

const DAY = 24 * 60 * 60 * 1000
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10)

/** Builds a project definition in the same shape as the baseline projects. */
function extraProject({ name, company, department, uiStatus, progress, type, category, description, budget, startOffset, months, contract, stages }) {
  const startDate = iso(startOffset)
  const endDate = iso(startOffset + months * 30)
  const span = (months * 30) / stages.length
  return {
    name,
    uiStatus,
    progress,
    type,
    category,
    executingEntity: department,
    description,
    startDate,
    endDate,
    contractNumber: contract,
    contractingEntity: company,
    contractDate: iso(startOffset - 14),
    contractEndDate: endDate,
    contractStatus: uiStatus === 'completed' ? 'منتهي' : 'ساري',
    contractValue: String(Math.round(budget * 0.9)),
    contractStartDate: startDate,
    totalBudget: String(budget),
    parties: ['مازن الغامدي · +966 55 3344 120 · mazen@partner.example', 'هيا العتيبي · +966 55 3344 121 · haya@partner.example'],
    stages: stages.map(([stageName, activities], index) => {
      const from = startOffset + Math.round(index * span)
      const to = startOffset + Math.round((index + 1) * span) - 1
      const stageDone = progress >= ((index + 1) / stages.length) * 100
      return {
        name: stageName,
        status: stageDone ? 'مكتمل' : progress > (index / stages.length) * 100 ? 'جارية' : 'لم يبدأ',
        startDate: iso(from),
        endDate: iso(to),
        activities: activities.map((activity, activityIndex) => ({
          id: 900 + index * 10 + activityIndex,
          name: activity,
          owner: 'فريق التنفيذ',
          startDate: iso(from),
          endDate: iso(to),
        })),
      }
    }),
  }
}

const EXTRA_PROJECTS = [
  extraProject({
    name: 'منصة التحليلات الذكية للقرار',
    company: 'شركة أفق للذكاء الاصطناعي',
    department: 'إدارة تقنية المعلومات',
    uiStatus: 'onTrack',
    progress: 60,
    type: 'تقني',
    category: 'الذكاء الاصطناعي',
    description: 'لوحات تحليلية تعتمد على نماذج تنبؤية لدعم قرارات الإدارة العليا.',
    budget: 2600000,
    startOffset: -150,
    months: 10,
    contract: 'CT-2026-031',
    stages: [
      ['جمع البيانات وتنظيفها', ['ربط مصادر البيانات', 'معالجة جودة البيانات']],
      ['بناء النماذج', ['نموذج التنبؤ بالطلب', 'نموذج تقييم المخاطر']],
      ['اللوحات والإطلاق', ['لوحة القيادة التنفيذية', 'تدريب المستخدمين']],
    ],
  }),
  extraProject({
    name: 'مركز العمليات الأمنية SOC',
    company: 'شركة منارة للأمن السيبراني',
    department: 'إدارة الأمن السيبراني',
    uiStatus: 'onTrack',
    progress: 45,
    type: 'أمني',
    category: 'الأمن السيبراني',
    description: 'إنشاء مركز مراقبة أمنية على مدار الساعة مع أدوات رصد واستجابة للحوادث.',
    budget: 3900000,
    startOffset: -120,
    months: 12,
    contract: 'CT-2026-034',
    stages: [
      ['التصميم والتجهيز', ['تصميم بنية المركز', 'توريد أدوات SIEM']],
      ['التشغيل التجريبي', ['ربط الأنظمة الحرجة', 'سيناريوهات الاستجابة']],
      ['التشغيل الكامل', ['تشغيل المناوبات', 'تقرير الجاهزية']],
    ],
  }),
  extraProject({
    name: 'ترقية الشبكة الداخلية للمقر الرئيسي',
    company: 'مجموعة إتقان للبنية التحتية',
    department: 'إدارة البنية التحتية',
    uiStatus: 'delayed',
    progress: 35,
    type: 'بنية تحتية',
    category: 'الشبكات',
    description: 'استبدال معدات الشبكة القديمة ورفع السعة وتحسين التغطية اللاسلكية.',
    budget: 1750000,
    startOffset: -200,
    months: 9,
    contract: 'CT-2025-077',
    stages: [
      ['المسح الميداني', ['حصر المعدات الحالية', 'خطة الترحيل']],
      ['التوريد والتركيب', ['توريد المحولات', 'تركيب نقاط الوصول']],
      ['الاختبار والتسليم', ['اختبارات الأداء', 'التسليم النهائي']],
    ],
  }),
  extraProject({
    name: 'نظام إدارة الوثائق والأرشفة',
    company: 'شركة ذروة للبرمجيات',
    department: 'تطوير البرمجيات',
    uiStatus: 'completed',
    progress: 100,
    type: 'تقني',
    category: 'إدارة المحتوى',
    description: 'أرشفة إلكترونية للمراسلات والوثائق مع صلاحيات وتتبع للنسخ.',
    budget: 1200000,
    startOffset: -330,
    months: 8,
    contract: 'CT-2025-052',
    stages: [
      ['التحليل', ['حصر أنواع الوثائق', 'تصميم شجرة الأرشفة']],
      ['التطوير', ['محرك البحث', 'سير عمل الاعتماد']],
      ['الترحيل', ['ترحيل الأرشيف الورقي', 'التدريب']],
    ],
  }),
  extraProject({
    name: 'تطبيق حجز المواعيد للمراجعين',
    company: 'شركة مسار الرقمي',
    department: 'فريق التطبيقات',
    uiStatus: 'onTrack',
    progress: 70,
    type: 'تقني',
    category: 'الخدمات الرقمية',
    description: 'تطبيق جوال لحجز مواعيد المراجعين وتذكيرهم وتقييم الخدمة.',
    budget: 850000,
    startOffset: -90,
    months: 6,
    contract: 'CT-2026-040',
    stages: [
      ['التصميم', ['رحلة المستفيد', 'تصميم الواجهات']],
      ['التطوير', ['خدمة الحجز', 'الإشعارات']],
      ['الإطلاق', ['النسخة التجريبية', 'الإطلاق العام']],
    ],
  }),
  extraProject({
    name: 'برنامج تأهيل القيادات الرقمية',
    company: 'مجموعة رواسي للحلول',
    department: 'أكاديمية الشركة',
    uiStatus: 'pending',
    progress: 0,
    type: 'تدريبي',
    category: 'رأس المال البشري',
    description: 'برنامج تدريبي لقيادات الصف الثاني في التحول الرقمي وإدارة التغيير.',
    budget: 640000,
    startOffset: 20,
    months: 6,
    contract: 'CT-2026-045',
    stages: [
      ['تصميم البرنامج', ['تحديد الكفايات', 'إعداد الحقائب']],
      ['التنفيذ', ['ورش العمل', 'المشاريع التطبيقية']],
      ['التقييم', ['قياس الأثر', 'التقرير الختامي']],
    ],
  }),
  extraProject({
    name: 'ربط الأنظمة مع منصة نفاذ',
    company: 'شركة نافذ للتقنية',
    department: 'برنامج التحول الحكومي',
    uiStatus: 'struggling',
    progress: 15,
    type: 'تكامل',
    category: 'التكامل الحكومي',
    description: 'تفعيل الدخول الموحد عبر نفاذ لجميع الخدمات الإلكترونية.',
    budget: 980000,
    startOffset: -160,
    months: 7,
    contract: 'CT-2025-090',
    stages: [
      ['المتطلبات', ['حصر الخدمات', 'وثيقة التكامل']],
      ['التطوير', ['واجهات الربط', 'اختبارات الأمان']],
      ['التشغيل', ['الإطلاق التدريجي', 'المتابعة']],
    ],
  }),
  extraProject({
    name: 'منصة التواصل الداخلي للموظفين',
    company: 'مؤسسة وصل التقنية',
    department: 'مركز تجربة العميل',
    uiStatus: 'cancelled',
    progress: 25,
    type: 'تقني',
    category: 'التواصل المؤسسي',
    description: 'بوابة أخبار وتواصل داخلي، أوقفت بعد دمج متطلباتها في منصة الموظفين.',
    budget: 540000,
    startOffset: -240,
    months: 6,
    contract: 'CT-2025-061',
    stages: [
      ['التحليل', ['متطلبات الأقسام', 'تصميم المحتوى']],
      ['التطوير', ['البوابة', 'التطبيق']],
    ],
  }),
  extraProject({
    name: 'تحسين تجربة الخدمات الإلكترونية',
    company: 'شركة جودين',
    department: 'إدارة التسويق',
    uiStatus: 'onTrack',
    progress: 80,
    type: 'تجربة مستخدم',
    category: 'تجربة المستفيد',
    description: 'قياس رضا المستفيدين وتحسين رحلاتهم في أكثر الخدمات استخدامًا.',
    budget: 720000,
    startOffset: -100,
    months: 5,
    contract: 'CT-2026-028',
    stages: [
      ['القياس', ['استبيان الرضا', 'تحليل الشكاوى']],
      ['التحسين', ['إعادة تصميم الرحلات', 'اختبارات المستخدمين']],
      ['المتابعة', ['مؤشرات الأداء', 'التقرير']],
    ],
  }),
]

// ── Contact and profile details ──────────────────────────────────────────────

const PEOPLE = ['فهد العتيبي', 'منيرة السبيعي', 'ماجد القرني', 'لمى الحربي', 'تركي الزهراني', 'أروى الشمري', 'يوسف المطيري', 'جواهر الدوسري', 'بدر الشهري', 'شهد العنزي', 'وليد الغامدي', 'دانة القحطاني']
const ROLES = ['مدير المشروع', 'محلل أعمال', 'مهندس حلول', 'مختص جودة', 'مطور رئيسي', 'منسق تنفيذ']
const SECTORS = ['تقنية المعلومات', 'الأمن السيبراني', 'البنية التحتية', 'الاستشارات', 'الذكاء الاصطناعي', 'الخدمات الرقمية']
const slug = (index) => `user${index + 1}`
const phone = (index) => `+966 5${index % 10} ${String(200 + index * 7).padStart(3, '0')} ${String(4100 + index * 13).slice(-4)}`
const person = (index) => PEOPLE[index % PEOPLE.length]

async function fillCompanies(orgId) {
  const companies = await prisma.executingCompany.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
  for (const [index, company] of companies.entries()) {
    const data = {}
    if (!company.registrationNo) data.registrationNo = `10${String(10234567 + index * 7919).slice(0, 8)}`
    if (!company.sector) data.sector = SECTORS[index % SECTORS.length]
    if (!company.managerName) data.managerName = person(index)
    if (!company.email) data.email = `info@company${index + 1}.example`
    if (!company.phone) data.phone = phone(index)
    if (!company.teamCount) data.teamCount = 6 + (index % 5) * 3
    if (!company.description || company.description.startsWith('وصف تفصيلي') || company.description.startsWith('جهة تعاقد')) {
      data.description = `شركة متخصصة في ${SECTORS[index % SECTORS.length]} تنفذ مشاريع التحول الرقمي للجهات الحكومية.`
    }
    if (Object.keys(data).length) await prisma.executingCompany.update({ where: { id: company.id }, data })
    if (!(await prisma.executingCompanyTeam.count({ where: { companyId: company.id } }))) {
      await prisma.executingCompanyTeam.createMany({
        data: [0, 1, 2].map((offset) => ({
          name: person(index + offset + 3),
          role: ROLES[(index + offset) % ROLES.length],
          email: `${slug(index * 3 + offset)}@company${index + 1}.example`,
          companyId: company.id,
        })),
      })
    }
  }
}

async function fillDepartments(orgId) {
  const departments = await prisma.department.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
  for (const [index, department] of departments.entries()) {
    const data = {}
    if (!department.responsibleName) data.responsibleName = person(index + 5)
    if (!department.email) data.email = `dept${index + 1}@acme-org.example`
    if (!department.phone) data.phone = `011 ${String(4600000 + index * 1111).slice(0, 7)}`
    if (!department.employeeCount) data.employeeCount = 8 + (index % 6) * 4
    if (!department.description || department.description === department.name) data.description = `${department.name}: تتابع تنفيذ مشاريعها وتشرف على مخرجاتها وفق الخطة الاستراتيجية.`
    if (Object.keys(data).length) await prisma.department.update({ where: { id: department.id }, data })
    if (!(await prisma.departmentEmployee.count({ where: { departmentId: department.id } }))) {
      await prisma.departmentEmployee.createMany({
        data: [0, 1, 2, 3].map((offset) => ({
          name: person(index + offset),
          role: ['رئيس القسم', 'أخصائي أول', 'محلل', 'منسق'][offset],
          email: `emp${index * 4 + offset + 1}@acme-org.example`,
          departmentId: department.id,
        })),
      })
    }
  }
}

async function fillProjects(model, phaseModel, deliverableModel, where) {
  const projects = await model.findMany({ where, orderBy: { createdAt: 'asc' } })
  for (const [index, project] of projects.entries()) {
    if (!project.orgProjectManagerName) {
      await model.update({
        where: { id: project.id },
        data: { orgProjectManagerName: person(index + 2), orgEmail: `pm${index + 1}@acme-org.example`, orgPhone: phone(index + 20) },
      })
    }
    const phases = await phaseModel.findMany({ where: { projectId: project.id, mainDeliverables: null } })
    for (const phase of phases) {
      await phaseModel.update({ where: { id: phase.id }, data: { mainDeliverables: `مخرجات مرحلة ${phase.title}`, notes: phase.notes || 'تتم المتابعة أسبوعيًا مع فريق التنفيذ.' } })
    }
    const deliverables = await deliverableModel.findMany({ where: { projectId: project.id, email: null }, orderBy: { createdAt: 'asc' } })
    for (const [position, deliverable] of deliverables.entries()) {
      await deliverableModel.update({ where: { id: deliverable.id }, data: { email: `owner${(index + position) % 12 + 1}@acme-org.example` } })
    }
  }
  return projects
}

const MITIGATIONS = ['تحصين البنية المعنية ومراجعتها', 'اختبار خطة الاستجابة', 'تجهيز خطة بديلة']

async function fillRiskActions() {
  const actions = await prisma.orgRiskAction.findMany({ where: { responsibleName: null }, include: { risk: true } })
  for (const [index, action] of actions.entries()) {
    await prisma.orgRiskAction.update({
      where: { id: action.id },
      data: { responsibleName: action.risk.responsibleName || person(index), email: action.risk.responsibleEmail || `risk.action${index + 1}@trackplus.example`, price: 5000 + (index % 6) * 2500 },
    })
  }
  const clientRisks = await prisma.clientRisk.findMany({ include: { actions: { select: { id: true } } } })
  for (const [index, risk] of clientRisks.entries()) {
    if (risk.actions.length) continue
    await prisma.clientRiskAction.createMany({
      data: MITIGATIONS.map((action, position) => ({
        action,
        responsibleName: risk.responsibleName || person(index),
        email: risk.responsibleEmail || `risk.action${index + 1}@trackplus.example`,
        price: 5000 + ((index + position) % 6) * 2500,
        riskId: risk.id,
      })),
    })
  }
}

const RISK_COMMENTS = ['تمت مراجعة الخطر مع فريق التنفيذ وتحديث خطة المعالجة.', 'نحتاج تأكيد موعد اختبار خطة الاستجابة قبل نهاية الأسبوع.']
const REQUEST_COMMENTS = ['أرفقنا تقدير التكلفة المحدث للطلب.', 'الطلب يحتاج موافقة الإدارة المالية قبل الاعتماد.']
const DELIVERABLE_COMMENTS = ['تم رفع النسخة الأخيرة للمراجعة.', 'ملاحظات المراجعة مرفقة، الرجاء التحديث.']

async function fillConversations({ orgUpper, orgEntry, clientUpper }) {
  const orgProjects = await prisma.orgProject.findMany({ include: { risks: { take: 2, orderBy: { createdAt: 'asc' } }, changeRequests: { orderBy: { createdAt: 'asc' } } } })
  for (const project of orgProjects) {
    if (await prisma.orgRecordComment.count({ where: { projectId: project.id } })) continue
    for (const risk of project.risks) {
      await prisma.orgRecordComment.createMany({
        data: RISK_COMMENTS.map((content, index) => ({ content, recordType: 'RISK', recordId: risk.id, projectId: project.id, authorId: index ? orgUpper.id : orgEntry.id })),
      })
    }
    for (const request of project.changeRequests.slice(0, 2)) {
      await prisma.orgRecordComment.createMany({
        data: REQUEST_COMMENTS.map((content, index) => ({ content, recordType: 'CHANGE_REQUEST', recordId: request.id, projectId: project.id, authorId: index ? orgUpper.id : orgEntry.id })),
      })
    }
    for (const request of project.changeRequests) {
      if (request.status === 'UNDER_REVIEW' || (await prisma.orgRequestLog.count({ where: { requestId: request.id } }))) continue
      await prisma.orgRequestLog.create({
        data: { action: request.status, comment: request.status === 'APPROVED' ? 'تمت الموافقة بعد مراجعة الأثر على الجدول الزمني.' : 'لا يتوافق مع نطاق المرحلة الحالية.', requestId: request.id, performedBy: orgUpper.id },
      })
    }
  }

  const clientRequests = await prisma.clientChangeRequest.findMany({ where: { status: { in: ['APPROVED', 'REJECTED'] } } })
  for (const request of clientRequests) {
    if (await prisma.clientRequestLog.count({ where: { requestId: request.id } })) continue
    await prisma.clientRequestLog.create({
      data: { action: request.status, comment: request.status === 'APPROVED' ? 'تمت الموافقة على الطلب.' : 'تم رفض الطلب لعدم توفر الميزانية.', requestId: request.id, performedBy: clientUpper.id },
    })
  }

  const orgDeliverables = await prisma.orgDeliverable.findMany({ where: { reviewStatus: { in: ['PENDING', 'CHANGES_REQUESTED', 'APPROVED'] } }, select: { id: true, reviewStatus: true } })
  for (const deliverable of orgDeliverables) {
    if (await prisma.orgDeliverableComment.count({ where: { deliverableId: deliverable.id } })) continue
    const comments = deliverable.reviewStatus === 'CHANGES_REQUESTED' ? DELIVERABLE_COMMENTS : DELIVERABLE_COMMENTS.slice(0, 1)
    await prisma.orgDeliverableComment.createMany({
      data: comments.map((content, index) => ({ content, deliverableId: deliverable.id, authorId: index ? orgUpper.id : orgEntry.id })),
    })
  }
  const clientDeliverables = await prisma.clientDeliverable.findMany({ select: { id: true } })
  for (const [index, deliverable] of clientDeliverables.entries()) {
    if (index % 2 || (await prisma.clientDeliverableComment.count({ where: { deliverableId: deliverable.id } }))) continue
    await prisma.clientDeliverableComment.create({ data: { content: DELIVERABLE_COMMENTS[0], deliverableId: deliverable.id, authorId: clientUpper.id } })
  }
}

async function fillScenariosAndContracts({ orgUpper, clientUpper }) {
  const scenario = (project, createdBy) => {
    const end = project.endDate ? new Date(project.endDate) : new Date()
    const budget = Number(project.budget) || 1000000
    return {
      originalDate: end,
      originalCost: budget,
      originalRiskLevel: 'MEDIUM',
      newDate: new Date(end.getTime() + 60 * DAY),
      newCost: Math.round(budget * 1.12),
      newRiskLevel: 'HIGH',
      impactOnSchedule: 'تأخير شهرين في موعد التسليم',
      impactOnCost: 'زيادة 12% على الميزانية',
      impactOnCriticalPath: 'يتأثر مسار التكامل والاختبارات',
      impactOnRiskLevel: 'يرتفع مستوى الخطر من متوسط إلى عالٍ',
      recommendations: 'إضافة فريق اختبار مساند وتقسيم الإطلاق إلى مرحلتين.',
      budgetIncrease: Math.round(budget * 0.12),
      humanResourcesReduction: 2,
      createdBy,
    }
  }
  for (const project of await prisma.orgProject.findMany({ where: { status: { in: ['ON_HOLD', 'CANCELLED'] } } })) {
    if (!(await prisma.orgScenarioAnalysis.count({ where: { orgProjectId: project.id } }))) {
      await prisma.orgScenarioAnalysis.create({ data: { ...scenario(project, orgUpper.id), orgProjectId: project.id } })
    }
  }
  for (const [index, project] of (await prisma.clientProject.findMany({ orderBy: { createdAt: 'asc' } })).entries()) {
    if (['ON_HOLD', 'CANCELLED'].includes(project.status) && !(await prisma.clientScenarioAnalysis.count({ where: { clientProjectId: project.id } }))) {
      await prisma.clientScenarioAnalysis.create({ data: { ...scenario(project, clientUpper.id), clientProjectId: project.id } })
    }
    if (!(await prisma.clientContract.count({ where: { projectId: project.id } }))) {
      await prisma.clientContract.create({
        data: { name: `CL-2026-${String(index + 101)}`, fileUrl: 'demo://file', startDate: project.startDate, endDate: project.endDate, projectId: project.id, uploadedBy: clientUpper.id },
      })
    }
  }
}

const STAGE_NAMES = ['التخطيط', 'التنفيذ', 'القياس والتحسين']
const QUARTERS = [['Q1', 2026], ['Q2', 2026], ['Q3', 2026], ['Q4', 2026]]

async function fillGoals(goalModel, stageModel, kpiModel, linkModel, where, approver) {
  const goals = await goalModel.findMany({ where, include: { projectLinks: { include: { project: { select: { status: true } } } } }, orderBy: { createdAt: 'asc' } })
  for (const [index, goal] of goals.entries()) {
    const linked = goal.projectLinks.length
    const completed = goal.projectLinks.filter((link) => link.project?.status === 'COMPLETED').length
    const allDone = linked > 0 && completed === linked
    const achievement = goal.achievementPct || (allDone ? 100 : 30 + index * 12)
    const data = {}
    if (!goal.achievementPct) Object.assign(data, { achievementPct: achievement, progressPct: achievement })
    if (allDone && goal.status !== 'ACHIEVED') {
      Object.assign(data, { status: 'ACHIEVED' })
      if (approver && 'approvedAt' in goal) Object.assign(data, { approvedAt: new Date(Date.now() - 5 * DAY), approvedByName: approver })
    }
    if (Object.keys(data).length) await goalModel.update({ where: { id: goal.id }, data })

    if (!(await stageModel.count({ where: { goalId: goal.id } }))) {
      const start = new Date(goal.startDate || '2025-01-01').getTime()
      const end = new Date(goal.endDate || '2026-12-31').getTime()
      const step = (end - start) / STAGE_NAMES.length
      await stageModel.createMany({
        data: STAGE_NAMES.map((stageName, position) => {
          const share = Math.max(0, Math.min(100, Math.round((achievement - position * 33) * 3)))
          return {
            stageName,
            startDate: new Date(start + step * position),
            endDate: new Date(start + step * (position + 1)),
            status: share >= 100 ? 'COMPLETED' : share > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
            progressPct: share,
            goalId: goal.id,
          }
        }),
      })
    }
    if (!(await kpiModel.count({ where: { goalId: goal.id } }))) {
      await kpiModel.createMany({
        data: QUARTERS.map(([quarter, year], position) => {
          const value = Math.round((achievement * (position + 1)) / QUARTERS.length)
          return {
            quarter,
            year,
            progressPct: value,
            achievementPct: value,
            linkedProjectsCount: linked,
            completedProjectsCount: Math.round((completed * (position + 1)) / QUARTERS.length),
            status: value >= 100 ? 'ACHIEVED' : value >= 25 * (position + 1) * 0.6 ? 'ON_TRACK' : 'AT_RISK',
            notes: `قراءة ${quarter} ${year} للهدف`,
            goalId: goal.id,
          }
        }),
      })
    }
    for (const link of goal.projectLinks) {
      if (link.aiNotes) continue
      await linkModel.update({
        where: { id: link.id },
        data: {
          aiNotes: 'المشروع يساهم مباشرة في مؤشر الهدف.',
          actionTaken: link.project?.status === 'COMPLETED' ? 'تم احتساب مخرجات المشروع في المؤشر' : 'متابعة شهرية لنسبة الإنجاز',
          projectStatus: link.project?.status,
        },
      })
    }
  }
}

async function fillAccounts() {
  const BRANCHES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر']
  for (const [index, account] of (await prisma.orgAccount.findMany({ orderBy: { createdAt: 'asc' } })).entries()) {
    const data = {}
    if (!account.branch) data.branch = `الفرع الرئيسي - ${account.region || BRANCHES[index % BRANCHES.length]}`
    if (!account.phone) data.phone = `011 ${String(4800000 + index * 2333).slice(0, 7)}`
    if (!account.contractDuration) data.contractDuration = `${12 + (index % 3) * 12} شهرًا`
    if (Object.keys(data).length) await prisma.orgAccount.update({ where: { id: account.id }, data })
  }
  for (const [index, account] of (await prisma.clientAccount.findMany({ include: { sector: true }, orderBy: { createdAt: 'asc' } })).entries()) {
    const data = {}
    if (!account.branch) data.branch = `الفرع الرئيسي - ${account.region || BRANCHES[index % BRANCHES.length]}`
    if (!account.phone) data.phone = `012 ${String(6100000 + index * 3111).slice(0, 7)}`
    if (!account.contractDuration) data.contractDuration = `${12 + (index % 2) * 12} شهرًا`
    if (!account.sectorName) data.sectorName = account.sector?.name || 'القطاع الخاص'
    if (!account.description) data.description = `عميل في ${account.region || 'المملكة'} يتابع مشاريعه وتسليماته عبر Track+.`
    if (Object.keys(data).length) await prisma.clientAccount.update({ where: { id: account.id }, data })
  }
  for (const invoice of await prisma.invoice.findMany()) {
    const data = {}
    if (!invoice.region) data.region = 'الرياض'
    if (!invoice.billingCycle) data.billingCycle = invoice.invoiceNumber.startsWith('SUB') ? 'QUARTERLY' : 'ONE_TIME'
    if (!invoice.assetOwner) data.assetOwner = invoice.invoiceNumber.startsWith('SUB') ? 'إدارة الاشتراكات' : 'فريق المشتريات'
    if (!invoice.nextInvoiceDate && invoice.invoiceNumber.startsWith('SUB')) data.nextInvoiceDate = new Date(new Date(invoice.dueDate).getTime() + 90 * DAY)
    if (Object.keys(data).length) await prisma.invoice.update({ where: { id: invoice.id }, data })
  }
  for (const subscription of await prisma.accountSubscription.findMany({ where: { userLimit: null }, include: { package: true } })) {
    await prisma.accountSubscription.update({
      where: { id: subscription.id },
      data: { userLimit: subscription.package?.maxUsers ?? 10, storageLimitGb: subscription.package?.storageGb ?? 5 },
    })
  }
  for (const payment of await prisma.orgProjectPayment.findMany({ where: { paidAt: { not: null }, receiptName: null } })) {
    await prisma.orgProjectPayment.update({ where: { id: payment.id }, data: { receiptName: `إيصال-${payment.invoiceNumber}.pdf`, receiptUrl: 'demo://file' } })
  }
}


// A small real PDF so attachment previews and downloads work; every project shares the same stored files.
function demoPdf(title) {
  const text = `BT /F1 18 Tf 72 720 Td (${title}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let body = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((object, index) => {
    offsets.push(body.length)
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(body, 'latin1')
}

const PROJECT_FILES = [
  { key: 'project-attachments/demo/project-charter.pdf', fileName: 'ميثاق المشروع.pdf', title: 'Track+ demo - Project charter' },
  { key: 'project-attachments/demo/progress-report.pdf', fileName: 'تقرير الإنجاز الشهري.pdf', title: 'Track+ demo - Monthly progress report' },
]

async function fillAttachments({ orgEntry, clientUpper }) {
  const files = PROJECT_FILES.map((file) => ({ ...file, buffer: demoPdf(file.title) }))
  // Each record needs its own stored file; the keys follow the project so a reset overwrites nothing else.
  const attach = async (model, portal, projects, uploadedBy) => {
    for (const project of projects) {
      if (await model.count({ where: { projectId: project.id } })) continue
      const data = []
      for (const file of files) {
        const storageKey = file.key.replace('/demo/', `/demo/${portal}/${project.id}/`)
        await storage.saveFile(storageKey, file.buffer, 'application/pdf')
        data.push({ fileName: file.fileName, fileType: 'application/pdf', fileSize: file.buffer.length, storageKey, projectId: project.id, uploadedBy })
      }
      await model.createMany({ data })
    }
  }
  await attach(prisma.orgProjectAttachment, 'org', await prisma.orgProject.findMany({ select: { id: true } }), orgEntry.id)
  await attach(prisma.clientProjectAttachment, 'client', await prisma.clientProject.findMany({ select: { id: true } }), clientUpper.id)

  const requestFile = (requestId, uploadedBy) => ({ fileUrl: 'demo://file', fileName: 'تقدير الأثر.pdf', fileType: 'application/pdf', fileSize: 240 * 1024, requestId, uploadedBy })
  for (const request of await prisma.orgChangeRequest.findMany({ where: { attachments: { none: {} } }, select: { id: true } })) {
    await prisma.orgChangeRequestAttachment.create({ data: requestFile(request.id, orgEntry.id) })
  }
  for (const request of await prisma.clientChangeRequest.findMany({ where: { attachments: { none: {} } }, select: { id: true } })) {
    await prisma.clientChangeRequestAttachment.create({ data: requestFile(request.id, clientUpper.id) })
  }
  for (const deliverable of await prisma.clientDeliverable.findMany({ where: { status: 'COMPLETED', attachments: { none: {} } }, select: { id: true, name: true } })) {
    await prisma.clientDeliverableAttachment.create({
      data: { fileUrl: 'demo://file', fileName: `${deliverable.name}.pdf`, fileType: 'application/pdf', fileSize: 1024 * 1024, deliverableId: deliverable.id, uploadedBy: clientUpper.id },
    })
  }
}

/** Runs after the baseline so every list, detail page and chart in the demo has content. */
async function enrichDemoData({ orgAccount, clientAccount, orgUpper, orgEntry, clientUpper }) {
  await fillCompanies(orgAccount.id)
  await fillDepartments(orgAccount.id)
  await fillProjects(prisma.orgProject, prisma.orgProjectPhase, prisma.orgDeliverable, { orgId: orgAccount.id })
  await fillProjects(prisma.clientProject, prisma.clientProjectPhase, prisma.clientDeliverable, { clientId: clientAccount.id })
  await fillRiskActions()
  await fillConversations({ orgUpper, orgEntry, clientUpper })
  await fillScenariosAndContracts({ orgUpper, clientUpper })
  await fillGoals(prisma.orgStrategicGoal, prisma.orgStrategicGoalStage, prisma.orgKpiSnapshot, prisma.orgGoalProjectLink, { orgId: orgAccount.id }, orgUpper.name)
  await fillGoals(prisma.clientStrategicGoal, prisma.clientStrategicGoalStage, prisma.clientKpiSnapshot, prisma.clientGoalProjectLink, { clientId: clientAccount.id }, null)
  await fillAccounts()
  await fillAttachments({ orgEntry, clientUpper })
}

module.exports = { EXTRA_PROJECTS, enrichDemoData }
