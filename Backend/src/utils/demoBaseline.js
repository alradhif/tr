const prisma = require('../lib/prisma')
const { saveOrgProjectDetails, saveClientProjectDetails } = require('../lib/projectExtras')

function findOrCreateFactory() {
  return async function findOrCreate(model, where, create) {
    const existing = await model.findFirst({ where })
    if (existing) return existing
    return model.create({ data: create })
  }
}

function outputsFromStages(stages) {
  return stages.flatMap((stage, stageIndex) => {
    const activities = stage.activities?.length
      ? stage.activities
      : [{ name: `مخرج ${stageIndex + 1}` }]
    return activities.map((activity) => ({
      name: activity.name || `مخرج المرحلة ${stageIndex + 1}`,
      stage: stage.name,
      description: activity.name || stage.name,
    }))
  }).slice(0, 12)
}

function prismaStatus(uiStatus) {
  if (uiStatus === 'completed') return { status: 'COMPLETED', approvalStatus: 'APPROVED' }
  if (uiStatus === 'delayed') return { status: 'ON_HOLD', approvalStatus: 'APPROVED' }
  return { status: 'ACTIVE', approvalStatus: 'APPROVED' }
}

const ORG_PROJECTS = [
  {
    name: 'إطلاق حملة تسويقية جديدة',
    uiStatus: 'delayed',
    progress: 20,
    type: 'تسويقي',
    category: 'التسويق الرقمي',
    executingEntity: 'إدارة التسويق',
    description: 'حملة رقمية متكاملة لإطلاق الهوية الجديدة وزيادة الوصول.',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    contractNumber: 'CT-2025-001',
    contractingEntity: 'شركة الحلول التقنية',
    contractDate: '2024-12-20',
    contractEndDate: '2025-06-30',
    contractStatus: 'ساري',
    contractValue: '1300000',
    contractStartDate: '2025-01-01',
    totalBudget: '1300000',
    parties: ['أحمد العمري · +966 50 4567 123 · ahmad@aljoud.com', 'سارة محمد · +966 50 4567 456 · sara@aljoud.com'],
    stages: [
      { name: 'التخطيط والتحليل', status: 'مكتمل', startDate: '2025-01-01', endDate: '2025-02-15', activities: [{ id: 111, name: 'تحليل الجمهور المستهدف', owner: 'فريق التسويق', startDate: '2025-01-01', endDate: '2025-01-15' }, { id: 112, name: 'إعداد خطة الحملة', owner: 'فريق المحتوى', startDate: '2025-01-16', endDate: '2025-02-15' }] },
      { name: 'الإطلاق والترويج', status: 'جارية', startDate: '2025-02-16', endDate: '2025-04-30', activities: [{ id: 121, name: 'إطلاق الإعلانات', owner: 'فريق الأداء', startDate: '2025-02-16', endDate: '2025-03-15' }, { id: 122, name: 'التعاون مع المؤثرين', owner: 'العلاقات العامة', startDate: '2025-03-01', endDate: '2025-04-30' }] },
      { name: 'القياس والتحسين', status: 'لم يبدأ', startDate: '2025-05-01', endDate: '2025-06-30', activities: [{ id: 131, name: 'تحليل نتائج الحملة', owner: 'التحليلات', startDate: '2025-05-01', endDate: '2025-06-15' }] },
    ],
  },
  {
    name: 'تحسين واجهة المستخدم لموقع الويب',
    uiStatus: 'struggling',
    progress: 10,
    type: 'تقني',
    category: 'تجربة المستخدم',
    executingEntity: 'فريق المنتجات',
    description: 'إعادة تصميم تجربة التصفح وتحسين الوصول للمحتوى والخدمات.',
    startDate: '2025-02-01',
    endDate: '2025-08-15',
    contractNumber: 'CT-2025-014',
    contractingEntity: 'استوديو واجهة',
    contractDate: '2025-01-20',
    contractEndDate: '2025-08-15',
    contractStatus: 'ساري',
    contractValue: '980000',
    contractStartDate: '2025-02-01',
    totalBudget: '1100000',
    parties: ['خالد العتيبي · +966 55 1122 334 · khaled@trackplus.sa', 'نورة القحطاني · +966 55 2211 443 · nora@trackplus.sa'],
    stages: [
      { name: 'بحث المستخدمين', status: 'جارية', startDate: '2025-02-01', endDate: '2025-03-15', activities: [{ id: 211, name: 'مقابلات المستخدمين', owner: 'UX Research', startDate: '2025-02-01', endDate: '2025-02-20' }, { id: 212, name: 'تحليل السلوك الرقمي', owner: 'Analytics', startDate: '2025-02-21', endDate: '2025-03-15' }] },
      { name: 'التصميم والنمذجة', status: 'لم يبدأ', startDate: '2025-03-16', endDate: '2025-05-31', activities: [{ id: 221, name: 'تصميم الواجهات', owner: 'UI Team', startDate: '2025-03-16', endDate: '2025-04-30' }] },
      { name: 'التطوير والاختبار', status: 'لم يبدأ', startDate: '2025-06-01', endDate: '2025-08-15', activities: [{ id: 231, name: 'اختبارات قابلية الاستخدام', owner: 'QA Team', startDate: '2025-07-01', endDate: '2025-08-10' }] },
    ],
  },
  {
    name: 'تحديث قاعدة بيانات المستخدمين',
    uiStatus: 'completed',
    progress: 100,
    type: 'تقني',
    category: 'البيانات',
    executingEntity: 'إدارة تقنية المعلومات',
    description: 'ترقية قاعدة البيانات وتحسين الأداء والنسخ الاحتياطي.',
    startDate: '2024-09-01',
    endDate: '2025-01-20',
    contractNumber: 'CT-2024-088',
    contractingEntity: 'حلول البيانات المتقدمة',
    contractDate: '2024-08-15',
    contractEndDate: '2025-01-20',
    contractStatus: 'منتهي',
    contractValue: '760000',
    contractStartDate: '2024-09-01',
    totalBudget: '820000',
    parties: ['مازن الحربي · +966 54 3344 556 · mazen@data.sa', 'ريم الشهري · +966 54 6655 443 · reem@data.sa'],
    stages: [
      { name: 'التقييم والترحيل', status: 'مكتمل', startDate: '2024-09-01', endDate: '2024-10-31', activities: [{ id: 311, name: 'تقييم المخطط الحالي', owner: 'Database Team', startDate: '2024-09-01', endDate: '2024-09-20' }] },
      { name: 'الترقية والتحسين', status: 'مكتمل', startDate: '2024-11-01', endDate: '2024-12-20', activities: [{ id: 321, name: 'ترقية المحرك', owner: 'Infrastructure', startDate: '2024-11-01', endDate: '2024-11-30' }, { id: 322, name: 'اختبارات الأداء', owner: 'QA', startDate: '2024-12-01', endDate: '2024-12-20' }] },
      { name: 'التشغيل النهائي', status: 'مكتمل', startDate: '2024-12-21', endDate: '2025-01-20', activities: [{ id: 331, name: 'المراقبة بعد الإطلاق', owner: 'Operations', startDate: '2024-12-21', endDate: '2025-01-20' }] },
    ],
  },
  {
    name: 'تطوير تطبيق موبايل للخدمات الداخلية',
    uiStatus: 'ontrack',
    progress: 50,
    type: 'تقني',
    category: 'التطبيقات',
    executingEntity: 'فريق التطبيقات',
    description: 'تطبيق موحد للخدمات الداخلية وطلبات الموظفين.',
    startDate: '2025-03-01',
    endDate: '2025-10-31',
    contractNumber: 'CT-2025-021',
    contractingEntity: 'شركة تطبيقات المستقبل',
    contractDate: '2025-02-18',
    contractEndDate: '2025-10-31',
    contractStatus: 'ساري',
    contractValue: '1750000',
    contractStartDate: '2025-03-01',
    totalBudget: '1900000',
    parties: ['يوسف المطيري · +966 53 7788 991 · yousef@app.sa', 'هند الزهراني · +966 53 1188 772 · hind@app.sa'],
    stages: [
      { name: 'تحليل المتطلبات', status: 'مكتمل', startDate: '2025-03-01', endDate: '2025-04-15', activities: [{ id: 411, name: 'ورش أصحاب المصلحة', owner: 'Product Team', startDate: '2025-03-01', endDate: '2025-03-20' }] },
      { name: 'التطوير', status: 'جارية', startDate: '2025-04-16', endDate: '2025-08-31', activities: [{ id: 421, name: 'تطوير نسخة iOS', owner: 'Mobile Team', startDate: '2025-04-16', endDate: '2025-07-15' }, { id: 422, name: 'تطوير نسخة Android', owner: 'Mobile Team', startDate: '2025-05-01', endDate: '2025-08-31' }] },
      { name: 'الإطلاق', status: 'لم يبدأ', startDate: '2025-09-01', endDate: '2025-10-31', activities: [{ id: 431, name: 'النشر التدريجي', owner: 'Release Team', startDate: '2025-09-15', endDate: '2025-10-20' }] },
    ],
  },
  {
    name: 'رقمنة إجراءات المشتريات',
    uiStatus: 'completed',
    progress: 100,
    type: 'تشغيلي',
    category: 'التحول الرقمي',
    executingEntity: 'إدارة المشتريات',
    description: 'تحويل دورة المشتريات إلى إجراءات رقمية قابلة للتتبع.',
    startDate: '2024-06-01',
    endDate: '2024-12-15',
    contractNumber: 'CT-2024-041',
    contractingEntity: 'منصة الأعمال الرقمية',
    contractDate: '2024-05-10',
    contractEndDate: '2024-12-15',
    contractStatus: 'منتهي',
    contractValue: '920000',
    contractStartDate: '2024-06-01',
    totalBudget: '1000000',
    parties: ['عبدالله القحطاني · +966 56 3322 110 · abdullah@proc.sa', 'لينا السالم · +966 56 4422 220 · lina@proc.sa'],
    stages: [
      { name: 'تحليل الإجراءات', status: 'مكتمل', startDate: '2024-06-01', endDate: '2024-07-15', activities: [{ id: 511, name: 'توثيق الدورة الحالية', owner: 'Procurement', startDate: '2024-06-01', endDate: '2024-06-30' }] },
      { name: 'الأتمتة', status: 'مكتمل', startDate: '2024-07-16', endDate: '2024-10-31', activities: [{ id: 521, name: 'بناء سير العمل', owner: 'Automation Team', startDate: '2024-07-16', endDate: '2024-09-15' }] },
      { name: 'التشغيل', status: 'مكتمل', startDate: '2024-11-01', endDate: '2024-12-15', activities: [{ id: 531, name: 'تدريب المستخدمين', owner: 'Change Team', startDate: '2024-11-01', endDate: '2024-11-30' }] },
    ],
  },
  {
    name: 'إنشاء مركز بيانات احتياطي',
    uiStatus: 'delayed',
    progress: 35,
    type: 'إنشائي',
    category: 'البنية التحتية',
    executingEntity: 'إدارة البنية التحتية',
    description: 'تجهيز موقع احتياطي لضمان استمرارية الأنظمة الحرجة.',
    startDate: '2025-01-15',
    endDate: '2025-11-30',
    contractNumber: 'CT-2025-037',
    contractingEntity: 'المرافق المتقدمة',
    contractDate: '2024-12-10',
    contractEndDate: '2025-11-30',
    contractStatus: 'ساري',
    contractValue: '4200000',
    contractStartDate: '2025-01-15',
    totalBudget: '4800000',
    parties: ['فهد الدوسري · +966 57 4411 223 · fahad@infra.sa', 'مها العبدالله · +966 57 5522 334 · maha@infra.sa'],
    stages: [
      { name: 'التصميم الهندسي', status: 'مكتمل', startDate: '2025-01-15', endDate: '2025-03-31', activities: [{ id: 611, name: 'اعتماد المخططات', owner: 'Engineering', startDate: '2025-01-15', endDate: '2025-03-15' }] },
      { name: 'التجهيز والتنفيذ', status: 'جارية', startDate: '2025-04-01', endDate: '2025-09-30', activities: [{ id: 621, name: 'الأعمال المدنية', owner: 'Construction', startDate: '2025-04-01', endDate: '2025-07-31' }, { id: 622, name: 'تركيب الأنظمة', owner: 'Infrastructure', startDate: '2025-07-01', endDate: '2025-09-30' }] },
      { name: 'التشغيل التجريبي', status: 'لم يبدأ', startDate: '2025-10-01', endDate: '2025-11-30', activities: [{ id: 631, name: 'اختبار التعافي', owner: 'Operations', startDate: '2025-10-15', endDate: '2025-11-15' }] },
    ],
  },
  {
    name: 'بوابة الخدمات الحكومية الموحدة',
    uiStatus: 'ontrack',
    progress: 70,
    type: 'استراتيجي',
    category: 'الخدمات الرقمية',
    executingEntity: 'برنامج التحول الحكومي',
    description: 'بوابة موحدة للوصول إلى الخدمات الحكومية الرقمية.',
    startDate: '2024-11-01',
    endDate: '2025-07-31',
    contractNumber: 'CT-2024-112',
    contractingEntity: 'الحلول الحكومية',
    contractDate: '2024-10-20',
    contractEndDate: '2025-07-31',
    contractStatus: 'ساري',
    contractValue: '3100000',
    contractStartDate: '2024-11-01',
    totalBudget: '3500000',
    parties: ['ناصر الشمري · +966 58 1122 889 · nasser@gov.sa', 'أمل الرشيد · +966 58 2233 778 · amal@gov.sa'],
    stages: [
      { name: 'تصميم الخدمة', status: 'مكتمل', startDate: '2024-11-01', endDate: '2025-01-15', activities: [{ id: 711, name: 'خريطة رحلة المستفيد', owner: 'Service Design', startDate: '2024-11-01', endDate: '2024-12-10' }] },
      { name: 'التكامل', status: 'جارية', startDate: '2025-01-16', endDate: '2025-05-31', activities: [{ id: 721, name: 'تكامل الأنظمة', owner: 'Integration', startDate: '2025-01-16', endDate: '2025-04-30' }, { id: 722, name: 'اختبارات الربط', owner: 'QA', startDate: '2025-05-01', endDate: '2025-05-31' }] },
      { name: 'الإطلاق', status: 'جارية', startDate: '2025-06-01', endDate: '2025-07-31', activities: [{ id: 731, name: 'الإطلاق التجريبي', owner: 'Release', startDate: '2025-06-01', endDate: '2025-07-15' }] },
    ],
  },
  {
    name: 'منصة التدريب والتعلم الإلكتروني',
    uiStatus: 'struggling',
    progress: 25,
    type: 'تعليمي',
    category: 'التطوير المؤسسي',
    executingEntity: 'أكاديمية الشركة',
    description: 'منصة تعلم رقمية لإدارة البرامج التدريبية وقياس أثرها.',
    startDate: '2025-02-15',
    endDate: '2025-09-15',
    contractNumber: 'CT-2025-052',
    contractingEntity: 'تعلم بلس',
    contractDate: '2025-02-01',
    contractEndDate: '2025-09-15',
    contractStatus: 'ساري',
    contractValue: '1250000',
    contractStartDate: '2025-02-15',
    totalBudget: '1450000',
    parties: ['تركي العنزي · +966 59 7788 110 · turki@learn.sa', 'غادة السبيعي · +966 59 6677 220 · ghada@learn.sa'],
    stages: [
      { name: 'تحليل الاحتياج', status: 'مكتمل', startDate: '2025-02-15', endDate: '2025-03-31', activities: [{ id: 811, name: 'تحليل المسارات التدريبية', owner: 'L&D', startDate: '2025-02-15', endDate: '2025-03-20' }] },
      { name: 'بناء المنصة', status: 'جارية', startDate: '2025-04-01', endDate: '2025-07-31', activities: [{ id: 821, name: 'تطوير بوابة المتدرب', owner: 'Product Team', startDate: '2025-04-01', endDate: '2025-06-30' }, { id: 822, name: 'تطوير إدارة المحتوى', owner: 'Content Team', startDate: '2025-05-01', endDate: '2025-07-31' }] },
      { name: 'الإطلاق والتقييم', status: 'لم يبدأ', startDate: '2025-08-01', endDate: '2025-09-15', activities: [{ id: 831, name: 'قياس رضا المتدربين', owner: 'Analytics', startDate: '2025-08-15', endDate: '2025-09-10' }] },
    ],
  },
  {
    name: 'نظام إدارة الأصول والمرافق',
    uiStatus: 'ontrack',
    progress: 60,
    type: 'تشغيلي',
    category: 'إدارة الأصول',
    executingEntity: 'إدارة المرافق',
    description: 'منظومة موحدة لمتابعة الأصول والصيانة الوقائية.',
    startDate: '2025-01-05',
    endDate: '2025-08-20',
    contractNumber: 'CT-2025-063',
    contractingEntity: 'حلول المرافق',
    contractDate: '2024-12-22',
    contractEndDate: '2025-08-20',
    contractStatus: 'ساري',
    contractValue: '2100000',
    contractStartDate: '2025-01-05',
    totalBudget: '2350000',
    parties: ['سلمان القحطاني · +966 50 9988 110 · salman@assets.sa', 'دانة المطيري · +966 50 8877 220 · dana@assets.sa'],
    stages: [
      { name: 'حصر الأصول', status: 'مكتمل', startDate: '2025-01-05', endDate: '2025-02-28', activities: [{ id: 911, name: 'جرد الأصول', owner: 'Facilities', startDate: '2025-01-05', endDate: '2025-02-15' }] },
      { name: 'النظام والتكامل', status: 'جارية', startDate: '2025-03-01', endDate: '2025-06-30', activities: [{ id: 921, name: 'بناء سجل الأصول', owner: 'IT', startDate: '2025-03-01', endDate: '2025-05-15' }, { id: 922, name: 'تكامل الصيانة', owner: 'Maintenance', startDate: '2025-05-16', endDate: '2025-06-30' }] },
      { name: 'التشغيل', status: 'لم يبدأ', startDate: '2025-07-01', endDate: '2025-08-20', activities: [{ id: 931, name: 'التشغيل التجريبي', owner: 'Operations', startDate: '2025-07-01', endDate: '2025-08-10' }] },
    ],
  },
  {
    name: 'توحيد الهوية الرقمية للموظفين',
    uiStatus: 'completed',
    progress: 100,
    type: 'استراتيجي',
    category: 'الأمن الرقمي',
    executingEntity: 'إدارة الأمن السيبراني',
    description: 'توحيد الدخول والهوية الرقمية للموظفين عبر الأنظمة الداخلية.',
    startDate: '2024-08-01',
    endDate: '2024-12-31',
    contractNumber: 'CT-2024-077',
    contractingEntity: 'أمن المعلومات المتقدم',
    contractDate: '2024-07-15',
    contractEndDate: '2024-12-31',
    contractStatus: 'منتهي',
    contractValue: '1450000',
    contractStartDate: '2024-08-01',
    totalBudget: '1500000',
    parties: ['راشد الغامدي · +966 51 3344 990 · rashid@security.sa', 'بسمة الحازمي · +966 51 4455 880 · basma@security.sa'],
    stages: [
      { name: 'تصميم الهوية', status: 'مكتمل', startDate: '2024-08-01', endDate: '2024-09-15', activities: [{ id: 1011, name: 'تصميم نموذج الدخول', owner: 'Security', startDate: '2024-08-01', endDate: '2024-08-31' }] },
      { name: 'التكامل', status: 'مكتمل', startDate: '2024-09-16', endDate: '2024-11-30', activities: [{ id: 1021, name: 'ربط الأنظمة', owner: 'IAM Team', startDate: '2024-09-16', endDate: '2024-11-15' }] },
      { name: 'التعميم', status: 'مكتمل', startDate: '2024-12-01', endDate: '2024-12-31', activities: [{ id: 1031, name: 'ترحيل المستخدمين', owner: 'Operations', startDate: '2024-12-01', endDate: '2024-12-20' }] },
    ],
  },
  {
    name: 'مركز خدمة العملاء الذكي',
    uiStatus: 'ontrack',
    progress: 55,
    type: 'خدمي',
    category: 'تجربة العميل',
    executingEntity: 'مركز تجربة العميل',
    description: 'مركز موحد للدعم مع قنوات رقمية وتحليلات ذكية.',
    startDate: '2025-02-10',
    endDate: '2025-10-10',
    contractNumber: 'CT-2025-084',
    contractingEntity: 'خدمات العملاء الذكية',
    contractDate: '2025-01-25',
    contractEndDate: '2025-10-10',
    contractStatus: 'ساري',
    contractValue: '1850000',
    contractStartDate: '2025-02-10',
    totalBudget: '2050000',
    parties: ['عمر الشهري · +966 52 6655 331 · omar@cx.sa', 'جود العبدالعزيز · +966 52 7744 221 · joud@cx.sa'],
    stages: [
      { name: 'تصميم الخدمة', status: 'مكتمل', startDate: '2025-02-10', endDate: '2025-03-31', activities: [{ id: 1111, name: 'تصميم قنوات الدعم', owner: 'CX Team', startDate: '2025-02-10', endDate: '2025-03-20' }] },
      { name: 'التطوير والتكامل', status: 'جارية', startDate: '2025-04-01', endDate: '2025-08-31', activities: [{ id: 1121, name: 'تطوير مركز الاتصال', owner: 'Contact Center', startDate: '2025-04-01', endDate: '2025-07-15' }, { id: 1122, name: 'ربط القنوات الرقمية', owner: 'Integration', startDate: '2025-06-01', endDate: '2025-08-31' }] },
      { name: 'التحسين المستمر', status: 'لم يبدأ', startDate: '2025-09-01', endDate: '2025-10-10', activities: [{ id: 1131, name: 'تحليل رضا العملاء', owner: 'Analytics', startDate: '2025-09-01', endDate: '2025-10-01' }] },
    ],
  },
  {
    name: 'أتمتة التقارير المالية الشهرية',
    uiStatus: 'delayed',
    progress: 40,
    type: 'تشغيلي',
    category: 'المالية',
    executingEntity: 'الإدارة المالية',
    description: 'أتمتة إعداد التقارير المالية وربط مصادر البيانات.',
    startDate: '2025-03-01',
    endDate: '2025-09-30',
    contractNumber: 'CT-2025-096',
    contractingEntity: 'حلول التحليلات المالية',
    contractDate: '2025-02-12',
    contractEndDate: '2025-09-30',
    contractStatus: 'ساري',
    contractValue: '1150000',
    contractStartDate: '2025-03-01',
    totalBudget: '1300000',
    parties: ['زياد السعد · +966 55 8899 110 · ziad@finance.sa', 'مشاعل العتيبي · +966 55 7788 220 · mashael@finance.sa'],
    stages: [
      { name: 'تجميع المتطلبات', status: 'مكتمل', startDate: '2025-03-01', endDate: '2025-04-15', activities: [{ id: 1211, name: 'حصر التقارير', owner: 'Finance', startDate: '2025-03-01', endDate: '2025-03-20' }] },
      { name: 'بناء التقارير', status: 'جارية', startDate: '2025-04-16', endDate: '2025-07-31', activities: [{ id: 1221, name: 'بناء لوحات المؤشرات', owner: 'BI Team', startDate: '2025-04-16', endDate: '2025-06-30' }, { id: 1222, name: 'ربط مصادر البيانات', owner: 'Data Team', startDate: '2025-05-15', endDate: '2025-07-31' }] },
      { name: 'الأتمتة والإطلاق', status: 'لم يبدأ', startDate: '2025-08-01', endDate: '2025-09-30', activities: [{ id: 1231, name: 'جدولة التقارير', owner: 'Automation', startDate: '2025-08-01', endDate: '2025-09-15' }] },
    ],
  },
]

const COMPANIES = [
  { name: 'شركة جودين', description: 'وصف تفصيلي للشركة' },
  { name: 'شركة نافذ للتقنية', description: 'وصف تفصيلي للشركة' },
  { name: 'مجموعة رواسي للحلول', description: 'وصف تفصيلي للشركة' },
  { name: 'شركة مسار الرقمي', description: 'وصف تفصيلي للشركة' },
  { name: 'شركة ذروة للبرمجيات', description: 'وصف تفصيلي للشركة' },
  { name: 'مؤسسة وصل التقنية', description: 'وصف تفصيلي للشركة' },
  { name: 'شركة منارة للأمن السيبراني', description: 'وصف تفصيلي للشركة' },
  { name: 'مجموعة إتقان للبنية التحتية', description: 'وصف تفصيلي للشركة' },
  { name: 'شركة أفق للذكاء الاصطناعي', description: 'وصف تفصيلي للشركة' },
  { name: 'شركة الحلول التقنية', description: 'شركة منفذة للمشاريع التجريبية' },
]

const MOCK_RISKS = [
  { name: 'انقطاع الخدمة أثناء الإطلاق', description: 'بنية تحتية • المرحلة 3', probability: 'HIGH', impact: 'HIGH', status: 'ACTIVE', responsibleName: 'سارة خالد' },
  { name: 'ثغرات أمنية في الـ API', description: 'أمن سيبراني • المرحلة 2', probability: 'HIGH', impact: 'HIGH', status: 'MITIGATING', responsibleName: 'أحمد خالد' },
  { name: 'تجاوز الميزانية في مرحلة التطوير', description: 'مالي • المرحلة 2', probability: 'MEDIUM', impact: 'MEDIUM', status: 'ACTIVE', responsibleName: 'نواف محمد' },
  { name: 'تأخر اعتماد متطلبات المرحلة 2', description: 'إداري • المرحلة 2', probability: 'LOW', impact: 'LOW', status: 'CLOSED', responsibleName: 'سارة خالد' },
  { name: 'تعارض إصدارات المكتبات التقنية', description: 'تقني • المرحلة 2', probability: 'HIGH', impact: 'HIGH', status: 'MITIGATING', responsibleName: 'رهف احمد' },
  { name: 'تغيير متطلبات واجهة المستخدم', description: 'نطاق العمل • المرحلة 1', probability: 'MEDIUM', impact: 'MEDIUM', status: 'ACTIVE', responsibleName: 'محمد عبدالله' },
  { name: 'انتهاء عقد أحد أعضاء الفريق', description: 'موارد بشرية • المرحلة 1', probability: 'LOW', impact: 'LOW', status: 'CLOSED', responsibleName: 'سارة خالد' },
]

const MOCK_CHANGE_REQUESTS = [
  { title: 'إضافة تقارير تحليلية للوحة التحكم', priority: 'HIGH', status: 'UNDER_REVIEW', submittedBy: 'سارة خالد' },
  { title: 'تغيير هوية الواجهة الرسمية', priority: 'MEDIUM', status: 'APPROVED', submittedBy: 'أحمد خالد' },
  { title: 'تأجيل تسليم المرحلة الثانية', priority: 'HIGH', status: 'REJECTED', submittedBy: 'نواف محمد' },
  { title: 'دعم تسجيل الدخول الموحد', priority: 'MEDIUM', status: 'UNDER_REVIEW', submittedBy: 'رهف احمد' },
  { title: 'إضافة لغة إضافية للنظام', priority: 'LOW', status: 'APPROVED', submittedBy: 'محمد عبدالله' },
  { title: 'تعديل صلاحيات المستخدمين', priority: 'LOW', status: 'UNDER_REVIEW', submittedBy: 'سارة خالد' },
]

const GOALS = [
  { title: 'تطوير البنية التحتية الرقمية', description: 'نظام تقني متكامل لإدارة المحتوى الرقمي مع واجهات متعددة', aiSummary: 'نسبة الخدمات المرقمنة', achievementPct: 77, progressPct: 77 },
  { title: 'رفع نسبة الخدمات الحكومية الرقمية', description: 'برنامج لتقليص زمن إنجاز الخدمات الحكومية الرقمية وتحسين تجربة المستفيدين', aiSummary: 'من 5 أيام إلى يوم واحد', achievementPct: 34, progressPct: 34 },
  { title: 'تحقيق اعتماد الأمن السيبراني ISO 27001', description: 'خطة الوصول لاعتماد ISO 27001 عبر تعزيز الضوابط الأمنية ورفع الوعي الداخلي', aiSummary: 'من 5 أيام إلى يوم واحد', achievementPct: 40, progressPct: 40 },
]

const SECTORS = [
  { name: 'القطاع الحكومي', managerName: 'عبدالله الحربي', budget: 1200000, employeeCount: 45, departmentCount: 6, profit: 210000, annualRevenue: 210000 },
  { name: 'قطاع الرعاية الصحية', managerName: 'هناء القحطاني', budget: 950000, employeeCount: 38, departmentCount: 5, profit: 175500, annualRevenue: 175500 },
  { name: 'قطاع التعليم', managerName: 'فيصل الدوسري', budget: 700000, employeeCount: 29, departmentCount: 4, profit: 132300, annualRevenue: 132300 },
  { name: 'القطاع الخاص', managerName: 'ريم العنزي', budget: 480000, employeeCount: 21, departmentCount: 3, profit: 98750, annualRevenue: 98750 },
]

const ENTITY_ACCOUNTS = [
  { name: 'وزارة التعليم', entityType: 'حكومية', region: 'الرياض', isActive: true, crNumber: 'e1a2b3' },
  { name: 'هيئة الصحة العامة', entityType: 'حكومية', region: 'جدة', isActive: true, crNumber: 'f4c5d6' },
  { name: 'شركة نماء للتقنية', entityType: 'خاصة', region: 'الدمام', isActive: true, crNumber: 'g7h8i9' },
  { name: 'جامعة الملك سعود', entityType: 'تعليمية', region: 'الرياض', isActive: true, crNumber: 'j1k2l3' },
  { name: 'بلدية جدة', entityType: 'حكومية', region: 'جدة', isActive: true, crNumber: 'm4n5o6' },
  { name: 'مؤسسة الوقف الخيري', entityType: 'غير ربحية', region: 'مكة المكرمة', isActive: false, crNumber: 'p7q8r9' },
  { name: 'شركة ألفا للاستشارات', entityType: 'خاصة', region: 'الخبر', isActive: false, crNumber: 's1t2u3' },
]

const CLIENT_ACCOUNTS = [
  { name: 'شركة نجم الخليج', managerName: 'سعيد الزهراني', region: 'الرياض', isActive: true, crNumber: 'a1b2c3' },
  { name: 'مؤسسة روافد التجارية', managerName: 'منى الشهري', region: 'جدة', isActive: true, crNumber: 'd4e5f6' },
  { name: 'مجموعة السلام الطبية', managerName: 'طارق العمري', region: 'الدمام', isActive: true, crNumber: 'g7h8i9c' },
  { name: 'شركة الأفق للمقاولات', managerName: 'لينا الغامدي', region: 'مكة المكرمة', isActive: true, crNumber: 'j1k2l3c' },
  { name: 'مؤسسة الرواد للاستشارات', managerName: 'بندر السبيعي', region: 'المدينة المنورة', isActive: false, crNumber: 'm4n5o6c' },
]

const INVOICES = [
  { invoiceNumber: 'INV-4521', amount: 250, remainingAmount: 0, status: 'PAID', clientName: 'شركة نافذ التقنية', projectName: 'خادم Dell PowerEdge R750', contractReference: 'SRV-2025-001', region: 'الرياض', billingCycle: 'MONTHLY' },
  { invoiceNumber: 'INV-4522', amount: 45000, remainingAmount: 0, status: 'PAID', clientName: 'مؤسسة الاتصال الحديث', projectName: 'مبدل شبكة Cisco Catalyst', contractReference: 'SRV-2025-014', region: 'جدة' },
  { invoiceNumber: 'INV-4530', amount: 18000, remainingAmount: 18000, status: 'PENDING', clientName: 'شركة البيانات الذكية', projectName: 'نظام تخزين NetApp', contractReference: 'SRV-2025-027', region: 'الدمام', billingCycle: 'ANNUAL' },
  { invoiceNumber: 'INV-4538', amount: 3200, remainingAmount: 3200, status: 'OVERDUE', clientName: 'مجموعة المكتب الحديث', projectName: 'طابعة HP LaserJet Enterprise', contractReference: 'SRV-2025-041', region: 'مكة المكرمة' },
]

const FORECASTS = [
  { quarter: 'Q1', year: 2026, optimisticValue: 270000, conservativeValue: 250000, pessimisticValue: 180000, actualValue: 230000, branchFilter: 'وزارة التعليم' },
  { quarter: 'Q2', year: 2026, optimisticValue: 330000, conservativeValue: 300000, pessimisticValue: 120000, actualValue: 180000, branchFilter: 'هيئة الصحة العامة' },
  { quarter: 'H2', year: 2026, optimisticValue: 240000, conservativeValue: 220000, pessimisticValue: 150000, actualValue: 210000, branchFilter: 'جامعة الملك سعود' },
]

const REPORTS = [
  { type: 'EXECUTIVE', period: 'Q1 2026', totalContractsValue: 320000, netProfit: 84500, netCashFlow: 61200 },
  { type: 'PROFIT_LOSS', period: 'Q2 2026', totalContractsValue: 410000, netProfit: 97300, netCashFlow: 72800 },
  { type: 'RISK', period: 'النصف الأول 2026', totalContractsValue: 265000, netProfit: 58900, netCashFlow: 40150 },
]

const ALERTS = [
  { title: 'طلب اعتماد ميزانية محفظة المشاريع', message: '3 شركات بانتظار الموافقة', type: 'APPROVAL' },
  { title: 'ارتفاع نسبة المخاطر المرتفعة هذا الشهر', message: 'عبر 4 شركات عميلة', type: 'REVIEW' },
  { title: 'اعتماد التقرير الفصلي للمحفظة', message: 'إدارة المحفظة الاستراتيجية', type: 'APPROVAL' },
]

const CLIENT_PROJECT_NAMES = [
  'تحديث قاعدة بيانات المستخدمين',
  'تطوير تطبيق موبايل للخدمات الداخلية',
  'رقمنة إجراءات المشتريات',
  'بوابة الخدمات الحكومية الموحدة',
  'نظام إدارة الأصول والمرافق',
  'توحيد الهوية الرقمية للموظفين',
]

function projectBody(def) {
  return {
    uiStatus: def.uiStatus,
    startDate: def.startDate,
    endDate: def.endDate,
    executingEntity: def.executingEntity,
    contractNumber: def.contractNumber,
    contractingEntity: def.contractingEntity,
    contractDate: def.contractDate,
    contractEndDate: def.contractEndDate,
    contractStatus: def.contractStatus,
    contractValue: def.contractValue,
    contractStartDate: def.contractStartDate,
    totalBudget: def.totalBudget,
    parties: def.parties,
    stages: def.stages,
    outputs: outputsFromStages(def.stages),
    scopeMain: def.description,
  }
}

async function seedMockBaseline({ admin, sector, orgAccount, clientAccount, orgUpper, orgEntry, clientUpper, department, company }) {
  const findOrCreate = findOrCreateFactory()
  const departmentsByName = new Map([[department.name, department]])
  const companiesByName = new Map([[company.name, company]])

  for (const sectorRow of SECTORS) {
    await findOrCreate(prisma.sector, { name: sectorRow.name }, sectorRow)
  }

  for (const deptName of [...new Set(ORG_PROJECTS.map((row) => row.executingEntity))]) {
    const created = await findOrCreate(
      prisma.department,
      { orgId: orgAccount.id, name: deptName },
      { name: deptName, type: 'تشغيلي', managerName: 'عبدالعزيز سالم', description: deptName, orgId: orgAccount.id },
    )
    departmentsByName.set(deptName, created)
  }

  const extraCompanies = [...COMPANIES, ...ORG_PROJECTS.map((row) => ({ name: row.contractingEntity, description: 'جهة تعاقد من بيانات العرض التجريبي' }))]
  for (const row of extraCompanies) {
    const created = await findOrCreate(
      prisma.executingCompany,
      { orgId: orgAccount.id, name: row.name },
      { name: row.name, description: row.description, orgId: orgAccount.id },
    )
    companiesByName.set(row.name, created)
  }

  const defaultDept = departmentsByName.get('تطوير البرمجيات') || department
  const defaultCompany = companiesByName.get('شركة الحلول التقنية') || company
  const orgProjectsByName = new Map()

  for (const def of ORG_PROJECTS) {
    const flags = prismaStatus(def.uiStatus)
    const dept = departmentsByName.get(def.executingEntity) || defaultDept
    const exec = companiesByName.get(def.contractingEntity) || defaultCompany
    let project = await prisma.orgProject.findFirst({ where: { orgId: orgAccount.id, name: def.name } })
    if (!project) {
      project = await prisma.orgProject.create({
        data: {
          name: def.name,
          type: def.type,
          classification: def.category,
          description: def.description,
          status: flags.status,
          approvalStatus: flags.approvalStatus,
          approvedBy: flags.approvalStatus === 'APPROVED' ? orgUpper.id : null,
          approvedAt: flags.approvalStatus === 'APPROVED' ? new Date() : null,
          startDate: new Date(def.startDate),
          endDate: new Date(def.endDate),
          budget: Number(def.totalBudget) || 0,
          progressPct: def.progress,
          orgId: orgAccount.id,
          managerId: def.uiStatus === 'completed' ? orgUpper.id : orgEntry.id,
          departmentId: dept.id,
          executingCompanyId: exec.id,
        },
      })
    } else if (!project.departmentId || !project.executingCompanyId || !project.startDate || !project.endDate) {
      project = await prisma.orgProject.update({
        where: { id: project.id },
        data: {
          departmentId: project.departmentId || dept.id,
          executingCompanyId: project.executingCompanyId || exec.id,
          startDate: project.startDate || new Date(def.startDate),
          endDate: project.endDate || new Date(def.endDate),
        },
      })
    }
    await saveOrgProjectDetails(project.id, projectBody(def))
    orgProjectsByName.set(def.name, project)

    for (const risk of MOCK_RISKS) {
      const existing = await prisma.orgRisk.findFirst({ where: { projectId: project.id, name: risk.name } })
      if (!existing) await prisma.orgRisk.create({ data: { ...risk, projectId: project.id } })
    }
    for (const request of MOCK_CHANGE_REQUESTS) {
      const existing = await prisma.orgChangeRequest.findFirst({ where: { projectId: project.id, title: request.title } })
      if (!existing) {
        await prisma.orgChangeRequest.create({
          data: {
            ...request,
            description: 'طلب إضافة تقارير تحليلية جديدة إلى لوحة التحكم تتضمن مؤشرات الأداء ونسب الإنجاز لكل مرحلة.',
            impactOnSchedule: '+ 5 أيام',
            impactOnCost: '+ 25,000 ريال',
            submittedDate: new Date('2026-04-12'),
            projectId: project.id,
            requestedBy: orgEntry.id,
          },
        })
      }
    }
  }

  const clientProjectsByName = new Map()
  for (const def of ORG_PROJECTS) {
    const flags = prismaStatus(def.uiStatus)
    let project = await prisma.clientProject.findFirst({ where: { clientId: clientAccount.id, name: def.name } })
    if (!project) {
      project = await prisma.clientProject.create({
        data: {
          name: def.name,
          type: def.type,
          classification: def.category,
          description: def.description,
          status: flags.status,
          startDate: new Date(def.startDate),
          endDate: new Date(def.endDate),
          budget: Number(def.totalBudget) || 0,
          progressPct: def.progress,
          approvalStatus: flags.approvalStatus,
          approvedBy: flags.approvalStatus === 'APPROVED' ? clientUpper.id : null,
          approvedAt: flags.approvalStatus === 'APPROVED' ? new Date() : null,
          clientId: clientAccount.id,
          managerId: clientUpper.id,
        },
      })
    }
    await saveClientProjectDetails(project.id, projectBody(def))
    clientProjectsByName.set(def.name, project)

    for (const risk of MOCK_RISKS) {
      const existing = await prisma.clientRisk.findFirst({ where: { projectId: project.id, name: risk.name } })
      if (!existing) await prisma.clientRisk.create({ data: { ...risk, projectId: project.id } })
    }
    for (const request of MOCK_CHANGE_REQUESTS) {
      const existing = await prisma.clientChangeRequest.findFirst({ where: { projectId: project.id, title: request.title } })
      if (!existing) {
        await prisma.clientChangeRequest.create({
          data: {
            ...request,
            description: 'طلب إضافة تقارير تحليلية جديدة إلى لوحة التحكم تتضمن مؤشرات الأداء ونسب الإنجاز لكل مرحلة.',
            impactOnSchedule: '+ 5 أيام',
            impactOnCost: '+ 25,000 ريال',
            submittedDate: new Date('2026-04-12'),
            projectId: project.id,
            requestedBy: clientUpper.id,
          },
        })
      }
    }
  }

  const orgStrategy = await findOrCreate(
    prisma.orgStrategyDocument,
    { orgId: orgAccount.id, title: 'الخطة الاستراتيجية' },
    { title: 'الخطة الاستراتيجية', fileUrl: 'demo://strategy', fileType: 'demo', status: 'EXTRACTED', orgId: orgAccount.id, uploadedBy: orgUpper.id },
  )
  const clientStrategy = await findOrCreate(
    prisma.clientStrategyDocument,
    { clientId: clientAccount.id, title: 'الخطة الاستراتيجية' },
    { title: 'الخطة الاستراتيجية', fileUrl: 'demo://strategy', fileType: 'demo', status: 'EXTRACTED', clientId: clientAccount.id, uploadedBy: clientUpper.id },
  )

  const linkedOrgNames = ['بوابة الخدمات الحكومية الموحدة', 'تطوير تطبيق موبايل للخدمات الداخلية', 'توحيد الهوية الرقمية للموظفين']
  for (const goal of GOALS) {
    let row = await prisma.orgStrategicGoal.findFirst({ where: { orgId: orgAccount.id, title: goal.title } })
    if (!row) {
      row = await prisma.orgStrategicGoal.create({
        data: {
          ...goal,
          status: 'IN_PROGRESS',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-12-31'),
          documentId: orgStrategy.id,
          orgId: orgAccount.id,
        },
      })
    }
    for (const projectName of linkedOrgNames) {
      const project = orgProjectsByName.get(projectName)
      if (!project) continue
      const existing = await prisma.orgGoalProjectLink.findFirst({ where: { goalId: row.id, projectId: project.id } })
      if (!existing) await prisma.orgGoalProjectLink.create({ data: { goalId: row.id, projectId: project.id, relevanceScore: 80, projectStatus: project.status } })
    }

    let clientGoal = await prisma.clientStrategicGoal.findFirst({ where: { clientId: clientAccount.id, title: goal.title } })
    if (!clientGoal) {
      clientGoal = await prisma.clientStrategicGoal.create({
        data: {
          ...goal,
          status: 'IN_PROGRESS',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-12-31'),
          documentId: clientStrategy.id,
          clientId: clientAccount.id,
        },
      })
    }
  }

  const fallbackSector = sector
  const sectorByType = {
    حكومية: await prisma.sector.findFirst({ where: { name: 'القطاع الحكومي' } }) || fallbackSector,
    تعليمية: await prisma.sector.findFirst({ where: { name: 'قطاع التعليم' } }) || fallbackSector,
    خاصة: await prisma.sector.findFirst({ where: { name: 'القطاع الخاص' } }) || fallbackSector,
  }

  for (const row of ENTITY_ACCOUNTS) {
    await findOrCreate(prisma.orgAccount, { name: row.name }, {
      name: row.name,
      entityType: row.entityType,
      region: row.region,
      isActive: row.isActive,
      crNumber: row.crNumber,
      domain: `${row.crNumber}.demo.trackplus`,
      sectorId: (sectorByType[row.entityType] || fallbackSector).id,
      createdBy: admin.id,
    })
  }

  for (const row of CLIENT_ACCOUNTS) {
    await findOrCreate(prisma.clientAccount, { name: row.name }, {
      name: row.name,
      managerName: row.managerName,
      region: row.region,
      isActive: row.isActive,
      crNumber: row.crNumber,
      entityType: 'خاصة',
      sectorId: fallbackSector.id,
      createdBy: admin.id,
    })
  }

  for (const invoice of INVOICES) {
    const vatAmount = Math.round(invoice.amount * 0.15)
    await findOrCreate(prisma.invoice, { invoiceNumber: invoice.invoiceNumber }, {
      ...invoice,
      vatRate: 15,
      vatAmount,
      totalWithVat: invoice.amount + vatAmount,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      orgId: orgAccount.id,
      clientId: clientAccount.id,
    })
  }

  for (const forecast of FORECASTS) {
    await findOrCreate(prisma.revenueForecast, { quarter: forecast.quarter, year: forecast.year, orgId: orgAccount.id }, {
      ...forecast,
      orgId: orgAccount.id,
      clientId: clientAccount.id,
    })
  }

  for (const report of REPORTS) {
    await findOrCreate(prisma.financialReport, { period: report.period, orgId: orgAccount.id }, {
      ...report,
      orgId: orgAccount.id,
      clientId: clientAccount.id,
    })
  }

  for (const user of [orgUpper, orgEntry]) {
    for (const alert of ALERTS) {
      const existing = await prisma.notification.findFirst({ where: { userId: user.id, title: alert.title } })
      if (!existing) {
        await prisma.notification.create({
          data: { ...alert, userId: user.id, actorType: 'ORG' },
        })
      }
    }
  }

  console.log('Mock baseline seeded:', {
    orgProjects: ORG_PROJECTS.length,
    clientProjects: ORG_PROJECTS.length,
    companies: COMPANIES.length,
    departments: departmentsByName.size,
    goals: GOALS.length,
    invoices: INVOICES.length,
    forecasts: FORECASTS.length,
    reports: REPORTS.length,
    sectors: SECTORS.length,
    entityAccounts: ENTITY_ACCOUNTS.length,
    clientAccounts: CLIENT_ACCOUNTS.length,
    risksPerProject: MOCK_RISKS.length,
    changeRequestsPerProject: MOCK_CHANGE_REQUESTS.length,
  })
}

module.exports = {
  seedMockBaseline,
  seedSharedDemoRecords: seedMockBaseline,
  ORG_PROJECTS,
  GOALS,
  INVOICES,
  COMPANIES,
  CLIENT_PROJECT_NAMES,
}
