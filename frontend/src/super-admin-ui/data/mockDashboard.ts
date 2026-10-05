export const dashboardStats = {
  activeProjects: 8,
  avgProgress: 80,
  upcomingDeliverables: 4,
  deliverablesThisWeek: 2,
};

export const openRisks = {
  high: 3,
  medium: 5,
  low: 4,
};

export const risksByMonth = [
  { month: 'JAN', low: 4, medium: 3, high: 2 },
  { month: 'FEB', low: 5, medium: 4, high: 1 },
  { month: 'MAR', low: 3, medium: 5, high: 3 },
  { month: 'APR', low: 6, medium: 2, high: 2 },
  { month: 'MAY', low: 4, medium: 4, high: 4 },
  { month: 'JUN', low: 5, medium: 3, high: 2 },
  { month: 'JUL', low: 4, medium: 5, high: 3 },
];

export const projectStatuses = [
  { label: 'على المسار', value: 52.1, color: '#2E90FA' },
  { label: 'متأخر', value: 28.4, color: '#F79009' },
  { label: 'متعثر', value: 12.3, color: '#F04438' },
  { label: 'مكتمل', value: 7.2, color: '#17B26A' },
];

export type AlertType = 'deliverable' | 'risk' | 'approval';

export interface TodayAlert {
  id: string;
  type: AlertType;
  title: string;
  subtitle: string;
  time: string;
}

export const todayAlerts: TodayAlert[] = [
  {
    id: '1',
    type: 'deliverable',
    title: 'مخرج يستحق غداً',
    subtitle: 'وثيقة البنية التقنية – نظام المحتوى',
    time: 'غداً',
  },
  {
    id: '2',
    type: 'risk',
    title: 'خطر مرتفع جديد',
    subtitle: 'منصة الخدمات – مشكلة تأخير الخادم',
    time: 'منذ 3 ساعات',
  },
  {
    id: '3',
    type: 'approval',
    title: 'طلب مصادقة جديد',
    subtitle: 'وثيقة البنية التقنية – نظام المحتوى',
    time: 'منذ ساعة',
  },
];

export interface DeliverableItem {
  id: string;
  title: string;
  project: string;
}

export const deliverables: DeliverableItem[] = [
  {
    id: '1',
    title: 'وثيقة البنية التقنية',
    project: 'نظام إدارة المحتوى المتقدم',
  },
  {
    id: '2',
    title: 'تقرير الاختبار الأول',
    project: 'منصة الخدمات الرقمية',
  },
  {
    id: '3',
    title: 'نماذج التصميم',
    project: 'بوابة الموظفين',
  },
];

export interface ProjectItem {
  id: string;
  title: string;
  company: string;
  progress: number;
  status: 'on-track' | 'late' | 'stalled' | 'completed';
  statusLabel: string;
}

export const projects: ProjectItem[] = [
  {
    id: '1',
    title: 'نظام إدارة المحتوى المتقدم',
    company: 'شركة الحلول التقنية',
    progress: 50,
    status: 'on-track',
    statusLabel: 'على المسار',
  },
  {
    id: '2',
    title: 'منصة الخدمات الرقمية',
    company: 'أرامكو',
    progress: 20,
    status: 'late',
    statusLabel: 'تأخير',
  },
  {
    id: '3',
    title: 'تطوير بوابة الموظفين',
    company: 'شركة الاتصالات المتقدمة',
    progress: 10,
    status: 'stalled',
    statusLabel: 'متعطل',
  },
];

export const navItems = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'goals', label: 'الأهداف الإستراتيجية' },
  { id: 'projects', label: 'المشاريع' },
  { id: 'companies', label: 'الشركات' },
  { id: 'departments', label: 'الإدارات' },
];

export const userProfile = {
  name: 'أحمد محمد',
  role: 'مدير النظام',
  initial: 'أ',
};

export const tenantStats = {
  activeTenants: 8,
  totalRevenue: 800,
  subscriptionsEndingSoon: 4,
};

export const tenantStatusBreakdown = [
  { name: 'معلق', value: 3, color: '#F04438' },
  { name: 'تجربة', value: 5, color: '#F79009' },
  { name: 'نشط', value: 4, color: '#17B26A' },
];

export const subscriptionsRevenueByMonth = [
  { month: 'JAN', low: 3, medium: 1, high: 1 },
  { month: 'FEB', low: 3, medium: 1, high: 2 },
  { month: 'MAR', low: 2, medium: 1, high: 2 },
  { month: 'APR', low: 2, medium: 1, high: 4 },
  { month: 'MAY', low: 2, medium: 1, high: 3 },
  { month: 'JUN', low: 2, medium: 0, high: 1 },
  { month: 'JUL', low: 2, medium: 1, high: 2 },
];

export const tenantsByPlan = [
  { label: 'نشط', value: 61.5, color: '#2E90FA' },
  { label: 'تجربة', value: 18.4, color: '#F79009' },
  { label: 'معطل', value: 11.2, color: '#F04438' },
  { label: 'تجربة مجانية', value: 8.9, color: '#98A2B3' },
];

export type TenantAlertType = 'renewal' | 'unused-invite' | 'trial-expired';

export interface TenantAlert {
  id: string;
  type: TenantAlertType;
  title: string;
  subtitle: string;
  time: string;
}

export const tenantAlerts: TenantAlert[] = [
  {
    id: '1',
    type: 'renewal',
    title: 'اشتراك شركة نافذ ينتهي خلال يومين',
    subtitle: 'Enterprise · 2 حد المستخدمين',
    time: 'غداً',
  },
  {
    id: '2',
    type: 'unused-invite',
    title: 'دعوة تفعيل لم تُستخدم بعد',
    subtitle: 'أحمد العمري · الشركة السعودية للموارد',
    time: 'منذ 3 ساعات',
  },
  {
    id: '3',
    type: 'trial-expired',
    title: 'تجربة مؤسسة النور انتهت بدون ترقية',
    subtitle: 'Demo · باقة',
    time: 'منذ ساعة',
  },
];

export interface LatestActionItem {
  id: string;
  title: string;
}

export const latestActions: LatestActionItem[] = [
  { id: '1', title: 'إنشاء مستأجر جودين' },
  { id: '2', title: 'ترقية باقة شركة تطوير' },
  { id: '3', title: 'حذف مستخدم من الشركة السعودية' },
];

export interface LatestTenantItem {
  id: string;
  name: string;
  status: 'active' | 'trial' | 'suspended';
  statusLabel: string;
}

export const latestTenants: LatestTenantItem[] = [
  { id: '1', name: 'جودين', status: 'active', statusLabel: 'نشط' },
  { id: '2', name: 'الشركة السعودية للموارد', status: 'trial', statusLabel: 'تجربة' },
  { id: '3', name: 'مؤسسة النور', status: 'suspended', statusLabel: 'معلق' },
];
