

const PROJECT = {
  name: 'مشروع تطوير منظومة المتابعة الرقمية',
  code: 'PRJ-2025-001',
  department: 'إدارة المشاريع الاستراتيجية',
  projectManager: 'م. فهد العتيبي',
  sponsor: 'وكيل الوزارة للشؤون التنفيذية',
  startDate: '2025-02-01',
  endDate: '2026-12-31',
  budget: 8500000,
  budgetCurrency: 'SAR',
  statusLabel: 'قيد التنفيذ',
  progress: 42
};

const PRESETS = {
  ministry:  { font: 'Reem Kufi',            primary: '#0B3D2E', secondary: '#C9A961', accent: '#E8DCC4' },
  authority: { font: 'Cairo',                primary: '#5B2C6F', secondary: '#00C9A7', accent: '#F39C12' },
  corporate: { font: 'IBM Plex Sans Arabic', primary: '#1A1F36', secondary: '#4F46E5', accent: '#F59E0B' }
};

const AVAILABLE_SECTIONS = [
  { id: 'overview',   label: 'نظرة عامة',            core: true,  slideBuilder: 'buildOverviewSlide',
    fields: [
      { id: 'manager',   label: 'مدير المشروع' },
      { id: 'sponsor',   label: 'الراعي' },
      { id: 'startDate', label: 'تاريخ البدء' },
      { id: 'endDate',   label: 'تاريخ الانتهاء' },
      { id: 'budget',    label: 'الميزانية' },
      { id: 'status',    label: 'الحالة' }
    ] },
  { id: 'milestones', label: 'مراحل المشروع',         core: true,  slideBuilder: 'buildMilestonesSlide',
    fields: [
      { id: 'phase1', label: 'المرحلة الأولى' },
      { id: 'phase2', label: 'المرحلة الثانية' },
      { id: 'phase3', label: 'المرحلة الثالثة' },
      { id: 'phase4', label: 'المرحلة الرابعة' }
    ] },
  { id: 'outputs',    label: 'المخرجات',              core: true,  slideBuilder: 'buildOutputsSlide',
    fields: [
      { id: 'platform',     label: 'منصة المتابعة الرقمية — الإصدار الأول' },
      { id: 'reqReport',    label: 'تقرير تحليل المتطلبات' },
      { id: 'userGuide',    label: 'دليل المستخدم النهائي' },
      { id: 'dashboardDoc', label: 'لوحة مؤشرات الأداء (Dashboard)' }
    ] },
  { id: 'timeline',   label: 'الجدول الزمني',         core: false, slideBuilder: 'buildTimelineSlide',
    fields: [
      { id: 'kickoff',         label: 'بدء المشروع' },
      { id: 'scope',           label: 'اعتماد النطاق' },
      { id: 'partialDelivery', label: 'التسليم الجزئي' },
      { id: 'launch',          label: 'الإطلاق النهائي' }
    ] },
  { id: 'changes',    label: 'طلبات التغيير',         core: false, slideBuilder: 'buildChangeRequestsSlide',
    fields: [
      { id: 'approved', label: 'طلبات معتمدة' },
      { id: 'inReview', label: 'طلبات قيد المراجعة' },
      { id: 'rejected', label: 'طلبات مرفوضة' }
    ] },
  { id: 'risks',      label: 'المخاطر',               core: false, slideBuilder: 'buildRisksSlide',
    fields: [
      { id: 'high',   label: 'مخاطر مرتفعة' },
      { id: 'medium', label: 'مخاطر متوسطة' },
      { id: 'low',    label: 'مخاطر منخفضة' }
    ] },
  { id: 'whatif',     label: 'ماذا لو ؟',             core: false, slideBuilder: 'buildWhatIfSlide',
    fields: [
      { id: 'supplyDelay',     label: 'تأخر التوريد' },
      { id: 'budgetIncrease',  label: 'زيادة الميزانية المطلوبة' },
      { id: 'scopeChange',     label: 'تغيّر نطاق المشروع' }
    ] },
  { id: 'finance',    label: 'الأصول والمالية',        core: false, slideBuilder: 'buildFinanceSlide',
    fields: [
      { id: 'totalBudget', label: 'الميزانية الإجمالية' },
      { id: 'spent',       label: 'المصروف' },
      { id: 'remaining',   label: 'المتبقي' }
    ] }
];

const PLACEHOLDER_METRICS = {
  phaseProgress: { labels: ['المرحلة 1', 'المرحلة 2', 'المرحلة 3', 'المرحلة 4'], values: [100, 76, 40, 5] },
  budgetSplit:   { labels: ['مصروف', 'متبقي'], values: [3400000, 5100000] }
};

const AVAILABLE_CHARTS = [
  {
    id: 'projectStatus',
    label: 'توزيع حالات المشاريع',
    type: 'doughnut',
    colors: ['2E90FA', 'F79009', 'F04438', '17B26A'],
    sampleData: [
      { name: 'حالات المشاريع', labels: ['على المسار', 'متأخر', 'متعثر', 'مكتمل'], values: [52.1, 28.4, 12.3, 7.2] }
    ]
  },
  {
    id: 'openRisks',
    label: 'المخاطر المفتوحة',
    type: 'doughnut',
    colors: ['F04438', 'F79009', '17B26A'],
    sampleData: [
      { name: 'المخاطر المفتوحة', labels: ['مرتفع', 'متوسط', 'منخفض'], values: [3, 5, 4] }
    ]
  },
  {
    id: 'risksByLevel',
    label: 'المخاطر المفتوحة حسب المستوى',
    type: 'bar',
    stacked: true,
    colors: ['17B26A', 'F79009', 'F04438'],
    sampleData: [
      { name: 'منخفض', labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'], values: [4, 5, 3, 6, 4, 5, 4] },
      { name: 'متوسط', labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'], values: [3, 4, 5, 2, 4, 3, 5] },
      { name: 'مرتفع', labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'], values: [2, 1, 3, 2, 4, 2, 3] }
    ]
  },
  {
    
    
    
    
    id: 'avgProgress',
    label: 'متوسط تقدم المشاريع',
    type: 'doughnut',
    colors: ['17B26A', 'E7E8EB'],
    sampleData: [
      { name: 'متوسط تقدم المشاريع', labels: ['التقدم', 'المتبقي'], values: [80, 20] }
    ]
  }
];
