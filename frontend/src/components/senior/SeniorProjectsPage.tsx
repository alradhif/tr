import { useEffect, useState } from 'react';
import { FeedbackBanner } from '../ui/FeedbackBanner';
import { SeniorCreateProjectPage, type CreatedProjectData, type ProjectActivity, type ProjectOutput, type ProjectStage } from './SeniorCreateProjectPage';
import { SeniorProjectDetailPage } from './SeniorProjectDetailPage';
import { TrendKpiRow } from './TrendKpiCard';

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="#5b5e65" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 12H18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18V6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

type ProjectStatus = 'ontrack' | 'delayed' | 'struggling' | 'completed';

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  progress: number;
  details: CreatedProjectData;
}

const makeStage = (id: number, name: string, status: string, startDate: string, endDate: string, activities: ProjectActivity[]): ProjectStage => ({
  id, name, status, startDate, endDate, activities,
});

const makeActivity = (id: number, name: string, owner: string, startDate: string, endDate: string): ProjectActivity => ({
  id, name, owner, startDate, endDate,
});

function outputsFromStages(stages: ProjectStage[]) {
  return stages.flatMap((stage, stageIndex) => {
    const activities = stage.activities.length ? stage.activities : [{ id: stage.id * 100, name: `مخرج ${stageIndex + 1}`, owner: '', startDate: stage.startDate, endDate: stage.endDate }];
    return activities.map((activity, activityIndex) => ({
      id: stage.id * 1000 + activity.id + activityIndex,
      name: activity.name || `مخرج المرحلة ${stageIndex + 1}`,
      stage: stage.name || `المرحلة ${stageIndex + 1}`,
      stageNumber: stageIndex + 1,
      startDate: activity.startDate || stage.startDate,
      endDate: activity.endDate || stage.endDate,
      status: stage.status === 'مكتمل' ? 'completed' as const : 'planned' as const,
    }));
  }).slice(0, 12);
}

function makeDummyProject(
  id: number,
  name: string,
  status: ProjectStatus,
  progress: number,
  config: {
    type: string; category: string; executingEntity: string; description: string;
    startDate: string; endDate: string; contractNumber: string; contractingEntity: string;
    contractDate: string; contractEndDate: string; contractStatus: string; contractValue: string;
    contractStartDate: string; totalBudget: string; parties: string[];
    stages: ProjectStage[];
  }
): Project {
  return { id, name, status, progress, details: { name, ...config } };
}

const INITIAL_PROJECTS: Project[] = [
  makeDummyProject(1, 'إطلاق حملة تسويقية جديدة', 'delayed', 20, {
    type: 'تسويقي', category: 'التسويق الرقمي', executingEntity: 'إدارة التسويق', description: 'حملة رقمية متكاملة لإطلاق الهوية الجديدة وزيادة الوصول.',
    startDate: '2025-01-01', endDate: '2025-06-30', contractNumber: 'CT-2025-001', contractingEntity: 'شركة الحلول التقنية', contractDate: '2024-12-20', contractEndDate: '2025-06-30', contractStatus: 'ساري', contractValue: '1300000', contractStartDate: '2025-01-01', totalBudget: '1300000',
    parties: ['أحمد العمري · +966 50 4567 123 · ahmad@aljoud.com', 'سارة محمد · +966 50 4567 456 · sara@aljoud.com'],
    stages: [
      makeStage(11, 'التخطيط والتحليل', 'مكتمل', '2025-01-01', '2025-02-15', [makeActivity(111, 'تحليل الجمهور المستهدف', 'فريق التسويق', '2025-01-01', '2025-01-15'), makeActivity(112, 'إعداد خطة الحملة', 'فريق المحتوى', '2025-01-16', '2025-02-15')]),
      makeStage(12, 'الإطلاق والترويج', 'جارية', '2025-02-16', '2025-04-30', [makeActivity(121, 'إطلاق الإعلانات', 'فريق الأداء', '2025-02-16', '2025-03-15'), makeActivity(122, 'التعاون مع المؤثرين', 'العلاقات العامة', '2025-03-01', '2025-04-30')]),
      makeStage(13, 'القياس والتحسين', 'لم يبدأ', '2025-05-01', '2025-06-30', [makeActivity(131, 'تحليل نتائج الحملة', 'التحليلات', '2025-05-01', '2025-06-15')]),
    ],
  }),
  makeDummyProject(2, 'تحسين واجهة المستخدم لموقع الويب', 'struggling', 10, {
    type: 'تقني', category: 'تجربة المستخدم', executingEntity: 'فريق المنتجات', description: 'إعادة تصميم تجربة التصفح وتحسين الوصول للمحتوى والخدمات.',
    startDate: '2025-02-01', endDate: '2025-08-15', contractNumber: 'CT-2025-014', contractingEntity: 'استوديو واجهة', contractDate: '2025-01-20', contractEndDate: '2025-08-15', contractStatus: 'ساري', contractValue: '980000', contractStartDate: '2025-02-01', totalBudget: '1100000',
    parties: ['خالد العتيبي · +966 55 1122 334 · khaled@trackplus.sa', 'نورة القحطاني · +966 55 2211 443 · nora@trackplus.sa'],
    stages: [makeStage(21, 'بحث المستخدمين', 'جارية', '2025-02-01', '2025-03-15', [makeActivity(211, 'مقابلات المستخدمين', 'UX Research', '2025-02-01', '2025-02-20'), makeActivity(212, 'تحليل السلوك الرقمي', 'Analytics', '2025-02-21', '2025-03-15')]), makeStage(22, 'التصميم والنمذجة', 'لم يبدأ', '2025-03-16', '2025-05-31', [makeActivity(221, 'تصميم الواجهات', 'UI Team', '2025-03-16', '2025-04-30')]), makeStage(23, 'التطوير والاختبار', 'لم يبدأ', '2025-06-01', '2025-08-15', [makeActivity(231, 'اختبارات قابلية الاستخدام', 'QA Team', '2025-07-01', '2025-08-10')])],
  }),
  makeDummyProject(3, 'تحديث قاعدة بيانات المستخدمين', 'completed', 100, {
    type: 'تقني', category: 'البيانات', executingEntity: 'إدارة تقنية المعلومات', description: 'ترقية قاعدة البيانات وتحسين الأداء والنسخ الاحتياطي.',
    startDate: '2024-09-01', endDate: '2025-01-20', contractNumber: 'CT-2024-088', contractingEntity: 'حلول البيانات المتقدمة', contractDate: '2024-08-15', contractEndDate: '2025-01-20', contractStatus: 'منتهي', contractValue: '760000', contractStartDate: '2024-09-01', totalBudget: '820000',
    parties: ['مازن الحربي · +966 54 3344 556 · mazen@data.sa', 'ريم الشهري · +966 54 6655 443 · reem@data.sa'],
    stages: [makeStage(31, 'التقييم والترحيل', 'مكتمل', '2024-09-01', '2024-10-31', [makeActivity(311, 'تقييم المخطط الحالي', 'Database Team', '2024-09-01', '2024-09-20')]), makeStage(32, 'الترقية والتحسين', 'مكتمل', '2024-11-01', '2024-12-20', [makeActivity(321, 'ترقية المحرك', 'Infrastructure', '2024-11-01', '2024-11-30'), makeActivity(322, 'اختبارات الأداء', 'QA', '2024-12-01', '2024-12-20')]), makeStage(33, 'التشغيل النهائي', 'مكتمل', '2024-12-21', '2025-01-20', [makeActivity(331, 'المراقبة بعد الإطلاق', 'Operations', '2024-12-21', '2025-01-20')])],
  }),
  makeDummyProject(4, 'تطوير تطبيق موبايل للخدمات الداخلية', 'ontrack', 50, {
    type: 'تقني', category: 'التطبيقات', executingEntity: 'فريق التطبيقات', description: 'تطبيق موحد للخدمات الداخلية وطلبات الموظفين.',
    startDate: '2025-03-01', endDate: '2025-10-31', contractNumber: 'CT-2025-021', contractingEntity: 'شركة تطبيقات المستقبل', contractDate: '2025-02-18', contractEndDate: '2025-10-31', contractStatus: 'ساري', contractValue: '1750000', contractStartDate: '2025-03-01', totalBudget: '1900000',
    parties: ['يوسف المطيري · +966 53 7788 991 · yousef@app.sa', 'هند الزهراني · +966 53 1188 772 · hind@app.sa'],
    stages: [makeStage(41, 'تحليل المتطلبات', 'مكتمل', '2025-03-01', '2025-04-15', [makeActivity(411, 'ورش أصحاب المصلحة', 'Product Team', '2025-03-01', '2025-03-20')]), makeStage(42, 'التطوير', 'جارية', '2025-04-16', '2025-08-31', [makeActivity(421, 'تطوير نسخة iOS', 'Mobile Team', '2025-04-16', '2025-07-15'), makeActivity(422, 'تطوير نسخة Android', 'Mobile Team', '2025-05-01', '2025-08-31')]), makeStage(43, 'الإطلاق', 'لم يبدأ', '2025-09-01', '2025-10-31', [makeActivity(431, 'النشر التدريجي', 'Release Team', '2025-09-15', '2025-10-20')])],
  }),
  makeDummyProject(5, 'رقمنة إجراءات المشتريات', 'completed', 100, {
    type: 'تشغيلي', category: 'التحول الرقمي', executingEntity: 'إدارة المشتريات', description: 'تحويل دورة المشتريات إلى إجراءات رقمية قابلة للتتبع.',
    startDate: '2024-06-01', endDate: '2024-12-15', contractNumber: 'CT-2024-041', contractingEntity: 'منصة الأعمال الرقمية', contractDate: '2024-05-10', contractEndDate: '2024-12-15', contractStatus: 'منتهي', contractValue: '920000', contractStartDate: '2024-06-01', totalBudget: '1000000',
    parties: ['عبدالله القحطاني · +966 56 3322 110 · abdullah@proc.sa', 'لينا السالم · +966 56 4422 220 · lina@proc.sa'],
    stages: [makeStage(51, 'تحليل الإجراءات', 'مكتمل', '2024-06-01', '2024-07-15', [makeActivity(511, 'توثيق الدورة الحالية', 'Procurement', '2024-06-01', '2024-06-30')]), makeStage(52, 'الأتمتة', 'مكتمل', '2024-07-16', '2024-10-31', [makeActivity(521, 'بناء سير العمل', 'Automation Team', '2024-07-16', '2024-09-15')]), makeStage(53, 'التشغيل', 'مكتمل', '2024-11-01', '2024-12-15', [makeActivity(531, 'تدريب المستخدمين', 'Change Team', '2024-11-01', '2024-11-30')])],
  }),
  makeDummyProject(6, 'إنشاء مركز بيانات احتياطي', 'delayed', 35, {
    type: 'إنشائي', category: 'البنية التحتية', executingEntity: 'إدارة البنية التحتية', description: 'تجهيز موقع احتياطي لضمان استمرارية الأنظمة الحرجة.',
    startDate: '2025-01-15', endDate: '2025-11-30', contractNumber: 'CT-2025-037', contractingEntity: 'المرافق المتقدمة', contractDate: '2024-12-10', contractEndDate: '2025-11-30', contractStatus: 'ساري', contractValue: '4200000', contractStartDate: '2025-01-15', totalBudget: '4800000',
    parties: ['فهد الدوسري · +966 57 4411 223 · fahad@infra.sa', 'مها العبدالله · +966 57 5522 334 · maha@infra.sa'],
    stages: [makeStage(61, 'التصميم الهندسي', 'مكتمل', '2025-01-15', '2025-03-31', [makeActivity(611, 'اعتماد المخططات', 'Engineering', '2025-01-15', '2025-03-15')]), makeStage(62, 'التجهيز والتنفيذ', 'جارية', '2025-04-01', '2025-09-30', [makeActivity(621, 'الأعمال المدنية', 'Construction', '2025-04-01', '2025-07-31'), makeActivity(622, 'تركيب الأنظمة', 'Infrastructure', '2025-07-01', '2025-09-30')]), makeStage(63, 'التشغيل التجريبي', 'لم يبدأ', '2025-10-01', '2025-11-30', [makeActivity(631, 'اختبار التعافي', 'Operations', '2025-10-15', '2025-11-15')])],
  }),
  makeDummyProject(7, 'بوابة الخدمات الحكومية الموحدة', 'ontrack', 70, {
    type: 'استراتيجي', category: 'الخدمات الرقمية', executingEntity: 'برنامج التحول الحكومي', description: 'بوابة موحدة للوصول إلى الخدمات الحكومية الرقمية.',
    startDate: '2024-11-01', endDate: '2025-07-31', contractNumber: 'CT-2024-112', contractingEntity: 'الحلول الحكومية', contractDate: '2024-10-20', contractEndDate: '2025-07-31', contractStatus: 'ساري', contractValue: '3100000', contractStartDate: '2024-11-01', totalBudget: '3500000',
    parties: ['ناصر الشمري · +966 58 1122 889 · nasser@gov.sa', 'أمل الرشيد · +966 58 2233 778 · amal@gov.sa'],
    stages: [makeStage(71, 'تصميم الخدمة', 'مكتمل', '2024-11-01', '2025-01-15', [makeActivity(711, 'خريطة رحلة المستفيد', 'Service Design', '2024-11-01', '2024-12-10')]), makeStage(72, 'التكامل', 'جارية', '2025-01-16', '2025-05-31', [makeActivity(721, 'تكامل الأنظمة', 'Integration', '2025-01-16', '2025-04-30'), makeActivity(722, 'اختبارات الربط', 'QA', '2025-05-01', '2025-05-31')]), makeStage(73, 'الإطلاق', 'جارية', '2025-06-01', '2025-07-31', [makeActivity(731, 'الإطلاق التجريبي', 'Release', '2025-06-01', '2025-07-15')])],
  }),
  makeDummyProject(8, 'منصة التدريب والتعلم الإلكتروني', 'struggling', 25, {
    type: 'تعليمي', category: 'التطوير المؤسسي', executingEntity: 'أكاديمية الشركة', description: 'منصة تعلم رقمية لإدارة البرامج التدريبية وقياس أثرها.',
    startDate: '2025-02-15', endDate: '2025-09-15', contractNumber: 'CT-2025-052', contractingEntity: 'تعلم بلس', contractDate: '2025-02-01', contractEndDate: '2025-09-15', contractStatus: 'ساري', contractValue: '1250000', contractStartDate: '2025-02-15', totalBudget: '1450000',
    parties: ['تركي العنزي · +966 59 7788 110 · turki@learn.sa', 'غادة السبيعي · +966 59 6677 220 · ghada@learn.sa'],
    stages: [makeStage(81, 'تحليل الاحتياج', 'مكتمل', '2025-02-15', '2025-03-31', [makeActivity(811, 'تحليل المسارات التدريبية', 'L&D', '2025-02-15', '2025-03-20')]), makeStage(82, 'بناء المنصة', 'جارية', '2025-04-01', '2025-07-31', [makeActivity(821, 'تطوير بوابة المتدرب', 'Product Team', '2025-04-01', '2025-06-30'), makeActivity(822, 'تطوير إدارة المحتوى', 'Content Team', '2025-05-01', '2025-07-31')]), makeStage(83, 'الإطلاق والتقييم', 'لم يبدأ', '2025-08-01', '2025-09-15', [makeActivity(831, 'قياس رضا المتدربين', 'Analytics', '2025-08-15', '2025-09-10')])],
  }),
  makeDummyProject(9, 'نظام إدارة الأصول والمرافق', 'ontrack', 60, {
    type: 'تشغيلي', category: 'إدارة الأصول', executingEntity: 'إدارة المرافق', description: 'منظومة موحدة لمتابعة الأصول والصيانة الوقائية.',
    startDate: '2025-01-05', endDate: '2025-08-20', contractNumber: 'CT-2025-063', contractingEntity: 'حلول المرافق', contractDate: '2024-12-22', contractEndDate: '2025-08-20', contractStatus: 'ساري', contractValue: '2100000', contractStartDate: '2025-01-05', totalBudget: '2350000',
    parties: ['سلمان القحطاني · +966 50 9988 110 · salman@assets.sa', 'دانة المطيري · +966 50 8877 220 · dana@assets.sa'],
    stages: [makeStage(91, 'حصر الأصول', 'مكتمل', '2025-01-05', '2025-02-28', [makeActivity(911, 'جرد الأصول', 'Facilities', '2025-01-05', '2025-02-15')]), makeStage(92, 'النظام والتكامل', 'جارية', '2025-03-01', '2025-06-30', [makeActivity(921, 'بناء سجل الأصول', 'IT', '2025-03-01', '2025-05-15'), makeActivity(922, 'تكامل الصيانة', 'Maintenance', '2025-05-16', '2025-06-30')]), makeStage(93, 'التشغيل', 'لم يبدأ', '2025-07-01', '2025-08-20', [makeActivity(931, 'التشغيل التجريبي', 'Operations', '2025-07-01', '2025-08-10')])],
  }),
  makeDummyProject(10, 'توحيد الهوية الرقمية للموظفين', 'completed', 100, {
    type: 'استراتيجي', category: 'الأمن الرقمي', executingEntity: 'إدارة الأمن السيبراني', description: 'توحيد الدخول والهوية الرقمية للموظفين عبر الأنظمة الداخلية.',
    startDate: '2024-08-01', endDate: '2024-12-31', contractNumber: 'CT-2024-077', contractingEntity: 'أمن المعلومات المتقدم', contractDate: '2024-07-15', contractEndDate: '2024-12-31', contractStatus: 'منتهي', contractValue: '1450000', contractStartDate: '2024-08-01', totalBudget: '1500000',
    parties: ['راشد الغامدي · +966 51 3344 990 · rashid@security.sa', 'بسمة الحازمي · +966 51 4455 880 · basma@security.sa'],
    stages: [makeStage(101, 'تصميم الهوية', 'مكتمل', '2024-08-01', '2024-09-15', [makeActivity(1011, 'تصميم نموذج الدخول', 'Security', '2024-08-01', '2024-08-31')]), makeStage(102, 'التكامل', 'مكتمل', '2024-09-16', '2024-11-30', [makeActivity(1021, 'ربط الأنظمة', 'IAM Team', '2024-09-16', '2024-11-15')]), makeStage(103, 'التعميم', 'مكتمل', '2024-12-01', '2024-12-31', [makeActivity(1031, 'ترحيل المستخدمين', 'Operations', '2024-12-01', '2024-12-20')])],
  }),
  makeDummyProject(11, 'مركز خدمة العملاء الذكي', 'ontrack', 55, {
    type: 'خدمي', category: 'تجربة العميل', executingEntity: 'مركز تجربة العميل', description: 'مركز موحد للدعم مع قنوات رقمية وتحليلات ذكية.',
    startDate: '2025-02-10', endDate: '2025-10-10', contractNumber: 'CT-2025-084', contractingEntity: 'خدمات العملاء الذكية', contractDate: '2025-01-25', contractEndDate: '2025-10-10', contractStatus: 'ساري', contractValue: '1850000', contractStartDate: '2025-02-10', totalBudget: '2050000',
    parties: ['عمر الشهري · +966 52 6655 331 · omar@cx.sa', 'جود العبدالعزيز · +966 52 7744 221 · joud@cx.sa'],
    stages: [makeStage(111, 'تصميم الخدمة', 'مكتمل', '2025-02-10', '2025-03-31', [makeActivity(1111, 'تصميم قنوات الدعم', 'CX Team', '2025-02-10', '2025-03-20')]), makeStage(112, 'التطوير والتكامل', 'جارية', '2025-04-01', '2025-08-31', [makeActivity(1121, 'تطوير مركز الاتصال', 'Contact Center', '2025-04-01', '2025-07-15'), makeActivity(1122, 'ربط القنوات الرقمية', 'Integration', '2025-06-01', '2025-08-31')]), makeStage(113, 'التحسين المستمر', 'لم يبدأ', '2025-09-01', '2025-10-10', [makeActivity(1131, 'تحليل رضا العملاء', 'Analytics', '2025-09-01', '2025-10-01')])],
  }),
  makeDummyProject(12, 'أتمتة التقارير المالية الشهرية', 'delayed', 40, {
    type: 'تشغيلي', category: 'المالية', executingEntity: 'الإدارة المالية', description: 'أتمتة إعداد التقارير المالية وربط مصادر البيانات.',
    startDate: '2025-03-01', endDate: '2025-09-30', contractNumber: 'CT-2025-096', contractingEntity: 'حلول التحليلات المالية', contractDate: '2025-02-12', contractEndDate: '2025-09-30', contractStatus: 'ساري', contractValue: '1150000', contractStartDate: '2025-03-01', totalBudget: '1300000',
    parties: ['زياد السعد · +966 55 8899 110 · ziad@finance.sa', 'مشاعل العتيبي · +966 55 7788 220 · mashael@finance.sa'],
    stages: [makeStage(121, 'تجميع المتطلبات', 'مكتمل', '2025-03-01', '2025-04-15', [makeActivity(1211, 'حصر التقارير', 'Finance', '2025-03-01', '2025-03-20')]), makeStage(122, 'بناء التقارير', 'جارية', '2025-04-16', '2025-07-31', [makeActivity(1221, 'بناء لوحات المؤشرات', 'BI Team', '2025-04-16', '2025-06-30'), makeActivity(1222, 'ربط مصادر البيانات', 'Data Team', '2025-05-15', '2025-07-31')]), makeStage(123, 'الأتمتة والإطلاق', 'لم يبدأ', '2025-08-01', '2025-09-30', [makeActivity(1231, 'جدولة التقارير', 'Automation', '2025-08-01', '2025-09-15')])],
  }),
];

const InfoIcon = ({ color }: { color: string }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.67" fill={color} fillOpacity="0.5"/>
    <path d="M8 5.1667C7.586 5.1667 7.25 5.5027 7.25 5.9167C7.25 6.0493 7.1973 6.1765 7.1036 6.2702C7.0098 6.364 6.8826 6.4167 6.75 6.4167C6.6174 6.4167 6.4902 6.364 6.3964 6.2702C6.3027 6.1765 6.25 6.0493 6.25 5.9167C6.25 5.63 6.3205 5.3476 6.4552 5.0945C6.5899 4.8415 6.7847 4.6253 7.0225 4.4652C7.2603 4.305 7.5338 4.2058 7.819 4.1761C8.1042 4.1465 8.3923 4.1873 8.6579 4.2951C8.9236 4.4029 9.1587 4.5743 9.3426 4.7943C9.5265 5.0142 9.6535 5.276 9.7125 5.5566C9.7715 5.8372 9.7607 6.1279 9.681 6.4033C9.6013 6.6787 9.4551 6.9303 9.2553 7.136C9.194 7.1991 9.1353 7.2584 9.0793 7.314C8.9443 7.4434 8.8172 7.5807 8.6987 7.7253C8.552 7.9133 8.5 8.0513 8.5 8.1667V8.6667C8.5 8.7993 8.4473 8.9265 8.3536 9.0202C8.2598 9.114 8.1326 9.1667 8 9.1667C7.8674 9.1667 7.7402 9.114 7.6464 9.0202C7.5527 8.9265 7.5 8.7993 7.5 8.6667V8.1667C7.5 7.73 7.7033 7.376 7.9093 7.1113C8.062 6.9153 8.2533 6.7247 8.4093 6.5687C8.4564 6.522 8.4993 6.4789 8.538 6.4393C8.6407 6.3336 8.71 6.1999 8.7372 6.055C8.7644 5.9101 8.7483 5.7604 8.6909 5.6246C8.6335 5.4888 8.5374 5.373 8.4145 5.2915C8.2916 5.2101 8.1474 5.1666 8 5.1667ZM8 11.3333C8.1768 11.3333 8.3464 11.2631 8.4714 11.1381C8.5964 11.013 8.6667 10.8435 8.6667 10.6667C8.6667 10.4899 8.5964 10.3203 8.4714 10.1953C8.3464 10.0702 8.1768 10 8 10C7.8232 10 7.6536 10.0702 7.5286 10.1953C7.4036 10.3203 7.3333 10.4899 7.3333 10.6667C7.3333 10.8435 7.4036 11.013 7.5286 11.1381C7.6536 11.2631 7.8232 11.3333 8 11.3333Z" fill={color}/>
  </svg>
);

const STATUS_MAP: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  delayed:    { label: 'تأخير',      color: '#f79009', bg: '#fff0db' },
  struggling: { label: 'متعثر',      color: '#f04438', bg: '#feedec' },
  completed:  { label: 'مكتمل',      color: '#34c759', bg: '#ebfaef' },
  ontrack:    { label: 'على المسار', color: '#007aff', bg: '#e2eefb' },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, color, bg } = STATUS_MAP[status] ?? STATUS_MAP.ontrack;
  return (
    <div style={{
      borderRadius: 8,
      background: bg,
      display: 'flex',
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      padding: '2px 8px',
      height: 22,
      width: 'max-content',
      boxSizing: 'border-box',
    }}>
      <InfoIcon color={color} />
      <span style={{
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        fontSize: 10,
        fontWeight: 500,
        color,
        whiteSpace: 'nowrap',
      }}>{label}</span>
    </div>
  );
}

const COLOR_MAP: Record<ProjectStatus, string> = {
  delayed:    '#fabc6c',
  struggling: '#f04438',
  completed:  '#17b26a',
  ontrack:    '#2e90fa',
};

function ProgressBar({ percent, status }: { percent: number; status: ProjectStatus }) {
  const color = COLOR_MAP[status] ?? '#2e90fa';
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: -0.3,
        color: '#000',
        fontFamily: "'Inter', sans-serif",
        minWidth: 32,
        textAlign: 'right',
      }}>{percent}%</span>
      <div style={{
        borderRadius: 2,
        background: '#c5c5cc',
        width: 52,
        height: 6,
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          borderRadius: 2,
          background: color,
          width: `${width}%`,
          height: 6,
          transition: 'width 0.4s ease',
        }}/>
      </div>
    </div>
  );
}

function ProjectRow({ project, index, onOpen }: { project: Project; index: number; onOpen: (project: Project) => void }) {
  const [hovered, setHovered] = useState(false);
  const isEven = index % 2 === 0;
  const bg = isEven ? '#fafafa' : '#fff';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', width: '100%',
        background: hovered ? '#f0f9f4' : bg,
        transition: 'background 0.12s', position: 'relative',
        direction: 'rtl',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        flex: 1, height: 44, padding: '8px 24px', gap: 12,
        minWidth: 0,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, letterSpacing: 0.1, color: '#111214',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif", textAlign: 'right',
          direction: 'rtl', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{project.name}</span>
      </div>

      
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 140, height: 44, flexShrink: 0, padding: '8px 16px',
      }}>
        <ProgressBar percent={project.progress} status={project.status} />
      </div>

      
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 150, height: 44, flexShrink: 0, padding: '8px 20px',
      }}>
        <StatusBadge status={project.status} />
      </div>

      
      <button
        type="button"
        aria-label={`فتح تفاصيل ${project.name}`}
        onClick={() => onOpen(project)}
        style={{
          border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 60, height: 44, flexShrink: 0, padding: 0,
          cursor: 'pointer', transition: 'opacity 0.12s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.6')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
      >
        <div style={{ transform: 'rotate(-180deg)' }}><ChevronIcon /></div>
      </button>
    </div>
  );
}

INITIAL_PROJECTS[0].details.outputs = [
  { id: 1001, name: 'وثيقة متطلبات النظام (SRS)', stage: 'تحليل المتطلبات', stageNumber: 2, startDate: '2026-04-06', endDate: '2026-04-06', status: 'completed' },
  { id: 1002, name: 'مخطط قاعدة البيانات (ERD)', stage: 'تصميم الواجهات', stageNumber: 3, startDate: '2026-04-06', endDate: '2026-04-06', status: 'planned' },
  { id: 1003, name: 'نموذج واجهة المستخدم (Prototype)', stage: 'تصميم الواجهات', stageNumber: 1, startDate: '2026-04-06', endDate: '2026-04-06', status: 'planned' },
  { id: 1004, name: 'تصميم البنية التقنية', stage: 'تحليل المتطلبات', stageNumber: 2, startDate: '2026-04-06', endDate: '2026-04-06', status: 'completed' },
  { id: 1005, name: 'خطة اختبار الأداء', stage: 'اختبار النظام', stageNumber: 3, startDate: '2026-04-06', endDate: '2026-04-06', status: 'planned' },
  { id: 1006, name: 'تقرير فجوات الأمن السيبراني', stage: 'تدقيق الأمن', stageNumber: 2, startDate: '2026-04-06', endDate: '2026-04-06', status: 'completed' },
  { id: 1007, name: 'تصميم البنية التقنية', stage: 'تحليل المتطلبات', stageNumber: 2, startDate: '2026-04-06', endDate: '2026-04-06', status: 'completed' },
  { id: 1008, name: 'تصميم الواجهات', stage: 'تصميم الواجهات', stageNumber: 2, startDate: '2026-04-06', endDate: '2026-04-06', status: 'completed' },
  { id: 1009, name: 'خطة الترحيل للسحابة', stage: 'التحضير', stageNumber: 1, startDate: '2026-04-06', endDate: '2026-04-06', status: 'planned' },
] satisfies ProjectOutput[];

export function SeniorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectBanner, setProjectBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const handleCreateProject = (data: CreatedProjectData) => {
    const cleanName = data.name.trim() || `مشروع جديد ${projects.length + 1}`;
    const sourceStages = data.stages.length ? data.stages : [
      { id: 1, name: 'مرحلة التخطيط', status: 'جارية', startDate: data.startDate, endDate: data.endDate, activities: [] },
      { id: 2, name: 'مرحلة التنفيذ', status: 'لم يبدأ', startDate: data.startDate, endDate: data.endDate, activities: [] },
      { id: 3, name: 'مرحلة الاختبار والتسليم', status: 'لم يبدأ', startDate: data.startDate, endDate: data.endDate, activities: [] },
    ];
    const normalizedStages = sourceStages.map((stage, index) => ({
      ...stage,
      name: stage.name.trim() || `المرحلة ${index + 1}`,
      status: stage.status || (index === 0 ? 'جارية' : 'لم يبدأ'),
      activities: stage.activities.length ? stage.activities : [{ id: Date.now() + index, name: `نشاط المرحلة ${index + 1}`, owner: data.executingEntity || 'فريق المشروع', startDate: stage.startDate || data.startDate, endDate: stage.endDate || data.endDate }],
    }));
    const progress = normalizedStages.length
      ? Math.round(normalizedStages.reduce((sum, stage) => sum + (stage.status === 'مكتمل' ? 100 : stage.status === 'جارية' ? 50 : 0), 0) / normalizedStages.length)
      : 0;
    const status: ProjectStatus = progress >= 100 ? 'completed' : progress === 0 ? 'struggling' : 'ontrack';
    const normalizedData: CreatedProjectData = {
      ...data,
      name: cleanName,
      contractNumber: data.contractNumber || `CT-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
      contractingEntity: data.contractingEntity || data.executingEntity || 'الجهة المتعاقدة',
      contractStatus: data.contractStatus || 'ساري',
      contractValue: data.contractValue || data.totalBudget || '0',
      totalBudget: data.totalBudget || data.contractValue || '0',
      parties: data.parties.length ? data.parties : ['مدير المشروع · +966 50 0000 000 · project@trackplus.sa'],
      stages: normalizedStages,
      outputs: data.outputs?.length ? data.outputs : outputsFromStages(normalizedStages),
    };
    const newProject: Project = { id: Date.now(), name: cleanName, status, progress, details: normalizedData };
    setProjects((prev) => [...prev, newProject]);
    setShowCreatePage(false);
    setProjectBanner({ tone: 'success', message: 'تم إضافة المشروع بنجاح' });
  };

  useEffect(() => {
    if (!projectBanner) return;
    const timeoutId = window.setTimeout(() => setProjectBanner(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [projectBanner]);

  const handleCreateProjectValidationError = () => {
    setProjectBanner({ tone: 'error', message: 'حدث خطأ ما ، يرجى المحاولة مرة أخرى' });
    setShowCreatePage(false);
  };

  const handleDelete = (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setProjectBanner({ tone: 'success', message: 'تم حذف المشروع بنجاح' });
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((item) => item.id === updatedProject.id ? updatedProject : item));
    setSelectedProject(updatedProject);
  };

  if (selectedProject) {
    return (
      <SeniorProjectDetailPage
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onUpdateProject={handleUpdateProject}
        onDelete={(id) => {
          handleDelete(id);
          setSelectedProject(null);
        }}
      />
    );
  }

  if (showCreatePage) {
    return (
      <SeniorCreateProjectPage
        onBack={() => setShowCreatePage(false)}
        onSave={handleCreateProject}
        onValidationError={handleCreateProjectValidationError}
      />
    );
  }

  const averageProgress = 80;
  const totalOutputs = 28;

  return (
    <>
      <div
        className="senior-projects-page"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          direction: 'rtl',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #f5f5f6 0%, #d4ebd2 100%)',
        }}
      >
        
        <div style={{
          height: 88,
          minHeight: 88,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 24px',
          background: '#fafafa',
          borderTop: '3px solid #3f4144',
          borderBottom: '1px solid #e7e8eb',
          direction: 'rtl',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            color: '#0c0c0d',
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          }}>المشاريع</h1>
        </div>

        
        {projectBanner && (
          <FeedbackBanner tone={projectBanner.tone} onClose={() => setProjectBanner(null)}>
            {projectBanner.message}
          </FeedbackBanner>
        )}

        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '20px 20px 32px',
        }}>

          
          <div style={{ display: 'flex', justifyContent: 'flex-start', direction: 'ltr' }}>
            <button
              type="button"
              onClick={() => setShowCreatePage(true)}
              style={{
                background: '#111214',
                color: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                height: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                border: 'none',
                transition: 'opacity 0.15s',
                direction: 'rtl',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >
              <PlusIcon />
              <span style={{
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
              }}>إضافة مشروع جديد</span>
            </button>
          </div>

          
          <TrendKpiRow
            stats={[
              { label: 'عدد المشاريع', value: projects.length, delta: '+5%', up: true },
              { label: 'متوسط التقدم', value: `${averageProgress}%`, delta: '+5%', up: true },
              { label: 'عدد المخرجات', value: totalOutputs, delta: '+5%', up: false },
            ]}
          />

          
          <div style={{ borderRadius: 18, background: '#fff', overflow: 'hidden' }}>
            
            <div style={{
              background: '#f4f4f5',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              direction: 'rtl',
              minHeight: 40,
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px 24px' }}>
                <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 12, fontWeight: 700, color: '#585757' }}>اسم المشروع</span>
              </div>
              <div style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px' }}>
                <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 12, fontWeight: 700, color: '#585757' }}>نسبة التقدم</span>
              </div>
              <div style={{ width: 150, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px' }}>
                <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 12, fontWeight: 700, color: '#585757' }}>الحالة</span>
              </div>
              <div style={{ width: 60, flexShrink: 0 }} />
            </div>

            {projects.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                color: '#8e8f97',
                fontSize: 14,
              }}>
                لا توجد مشاريع. أضف مشروعاً جديداً للبدء.
              </div>
            ) : (
              projects.map((project, index) => (
                <div key={project.id} style={{ borderTop: index === 0 ? 'none' : '1px solid #f0f0f2' }}>
                  <ProjectRow project={project} index={index} onOpen={setSelectedProject} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
