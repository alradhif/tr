export const auditLogSummary = {
  actionsToday: 8,
  deletions: 5,
  suspiciousAttempts: 4,
  mostActiveEntity: {
    name: 'شركة جودين',
    actionsCount: 9,
    role: 'سوبر أدمن',
  },
};

export type AuditLogSeverity = 'success' | 'warning' | 'info';

export interface AuditLogEntry {
  id: string;
  title: string;
  meta: string;
  time: string;
  severity: AuditLogSeverity;
}

export const auditLogEntries: AuditLogEntry[] = [
  {
    id: '1',
    title: 'اشتراك شركة نافذ ينتهي خلال يومين',
    meta: 'Enterprise · حد المستخدمين 2',
    time: 'يومين',
    severity: 'success',
  },
  {
    id: '2',
    title: 'حذف حساب المستأجر «جامعة x»',
    meta: 'org_accounts · أحمد محمد · سوبر أدمن',
    time: 'منذ 3 ساعات',
    severity: 'warning',
  },
  {
    id: '3',
    title: 'إنشاء مستأجر جديد «جودين»',
    meta: 'org_accounts · أحمد محمد · سوبر أدمن',
    time: 'منذ ساعة',
    severity: 'info',
  },
  {
    id: '4',
    title: '3 محاولات دخول فاشلة متتالية',
    meta: 'IP 154.20.8.91 · حساب غير معروف',
    time: 'منذ ساعة',
    severity: 'warning',
  },
  {
    id: '5',
    title: 'تسجيل دخول ناجح',
    meta: 'IP 91.75.12.4 · سارة خالد · مؤسسة',
    time: 'منذ ساعة',
    severity: 'success',
  },
  {
    id: '6',
    title: 'تعليق حساب «شركة تطوير»',
    meta: 'org_accounts · أحمد محمد · سوبر أدمن',
    time: 'منذ ساعة',
    severity: 'info',
  },
];

export type AuditFilterId = 'all-entities' | 'all-directions' | 'all-actions';

export interface AuditFilterTab {
  id: AuditFilterId;
  label: string;
  count: number;
}

export const auditFilterTabs: AuditFilterTab[] = [
  { id: 'all-actions', label: 'كل الإجراءات', count: auditLogEntries.length },
  { id: 'all-directions', label: 'كل الجهات', count: 2 },
  { id: 'all-entities', label: 'كل الكيانات', count: 2 },
];
