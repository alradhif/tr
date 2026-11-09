import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, MessageSquareText, Search, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  AppliedTags,
  MultiSelectFilter,
  PageState,
  Pagination,
  SingleSelectFilter,
} from '../ui/filters';
import { PageHeader } from '../layout/PageHeader';
import { getActivityLogs, getAuditLogs, getAuditSummary, type AuditSummary } from '../../../api/superAdmin';
import { getSuperAdminToken } from '../../../auth/superAdminAuth';
import '../layout/layout.css';
import '../dashboard/dashboard.css';
import '../tenants/tenants.css';
import './audit.css';

type Severity = 'success' | 'warning' | 'info';
type ActionKind = 'create' | 'delete' | 'status' | 'update' | 'login' | 'loginFailed';

const severityIcon: Record<Severity, typeof Clock> = {
  success: Clock,
  warning: AlertTriangle,
  info: MessageSquareText,
};

const KIND_LABEL: Record<ActionKind, string> = {
  create: 'إنشاء',
  delete: 'حذف',
  status: 'تعليق / إعادة تفعيل',
  update: 'تعديل',
  login: 'تسجيل دخول ناجح',
  loginFailed: 'محاولة دخول فاشلة',
};

const KIND_SEVERITY: Record<ActionKind, Severity> = {
  create: 'info',
  delete: 'warning',
  status: 'info',
  update: 'info',
  login: 'success',
  loginFailed: 'warning',
};

const SUBJECT_LABEL: Record<string, string> = {
  org_accounts: 'مستخدم',
  client_accounts: 'مستخدم',
  org_users: 'مستخدم',
  client_users: 'مستخدم',
  jodayn_users: 'مستخدم',
  packages: 'باقة',
  credentials: 'بيانات دخول',
};

const ACTOR_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'سوبر أدمن',
  JODAYN: 'جودين',
  ORG: 'جهة',
  CLIENT: 'عميل',
};

const PERIODS = [
  { value: '7', label: 'آخر 7 أيام' },
  { value: '30', label: 'آخر 30 يومًا' },
  { value: '90', label: 'آخر 90 يومًا' },
  { value: 'all', label: 'كل الوقت' },
];

const PAGE_SIZE = 6;

interface AuditRow {
  id: string;
  kind: ActionKind;
  title: string;
  meta: string;
  actor: string;
  performer: string;
  subject: string;
  ip: string;
  createdAt: string;
  search: string;
}

function timeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return minutes === 1 ? 'منذ دقيقة' : `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`;
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (hours < 48) return `أمس ${time}`;
  return date.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long' });
}

function auditKind(action: string, oldData: Record<string, unknown>, newData: Record<string, unknown>): ActionKind {
  if (action === 'CREATE') return 'create';
  if (action === 'DELETE') return 'delete';
  return 'isActive' in newData || 'isActive' in oldData ? 'status' : 'update';
}

function auditTitle(kind: ActionKind, table: string, subject: string, newData: Record<string, unknown>) {
  const noun = SUBJECT_LABEL[table] ?? table;
  const name = subject ? ` «${subject}»` : '';
  if (kind === 'status') return `${newData.isActive === false ? 'تعليق' : 'إعادة تفعيل'} حساب${name}`;
  const verb = kind === 'create' ? 'إنشاء' : kind === 'delete' ? 'حذف' : 'تعديل';
  return `${verb} ${noun}${name}`;
}

export function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [kinds, setKinds] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [period, setPeriod] = useState('30');
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<AuditRow | null>(null);

  useEffect(() => {
    const token = getSuperAdminToken();
    if (!token) return;
    let cancelled = false;
    Promise.all([getAuditLogs(token), getActivityLogs(token), getAuditSummary(token)])
      .then(([audit, activity, auditSummary]) => {
        if (cancelled) return;
        setSummary(auditSummary);
        const fromAudit = (audit.logs ?? []).map((log): AuditRow => {
          const newData = (log.newData ?? {}) as Record<string, unknown>;
          const oldData = (log.oldData ?? {}) as Record<string, unknown>;
          const subject = String(newData.name ?? oldData.name ?? newData.email ?? '');
          const kind = auditKind(String(log.action), oldData, newData);
          const title = auditTitle(kind, String(log.tableName), subject, newData);
          const performer = String(log.performerName ?? '—');
          const actor = ACTOR_LABEL[String(log.actorType)] ?? String(log.actorType ?? '');
          return {
            id: String(log.id),
            kind,
            title,
            meta: `${performer} · ${actor}`,
            actor,
            performer,
            subject: SUBJECT_LABEL[String(log.tableName)] ?? String(log.tableName),
            ip: '',
            createdAt: String(log.createdAt),
            search: `${title} ${performer}`.toLowerCase(),
          };
        });
        const fromActivity = (activity.logs ?? [])
          .filter((log) => ['LOGIN', 'FIRST_LOGIN', 'LOGIN_FAILED'].includes(String(log.action)))
          .map((log): AuditRow => {
            const failed = log.action === 'LOGIN_FAILED';
            const actor = ACTOR_LABEL[String(log.actorType)] ?? String(log.actorType ?? '');
            const ip = log.ipAddress ? String(log.ipAddress) : '';
            const performer = String(log.performerName ?? 'حساب غير معروف');
            const title = failed ? 'محاولة دخول فاشلة' : 'تسجيل دخول ناجح';
            return {
              id: String(log.id),
              kind: failed ? 'loginFailed' : 'login',
              title,
              meta: [`${performer} · ${actor}`, ip && `IP ${ip}`].filter(Boolean).join(' · '),
              actor,
              performer,
              subject: 'جلسة دخول',
              ip,
              createdAt: String(log.createdAt),
              search: `${title} ${performer} ${ip}`.toLowerCase(),
            };
          });
        setRows([...fromAudit, ...fromActivity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const inPeriod = useMemo(() => {
    if (period === 'all') return rows;
    const since = Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return rows.filter((row) => new Date(row.createdAt).getTime() >= since);
  }, [rows, period]);

  const query = search.trim().toLowerCase();
  const visible = inPeriod.filter(
    (row) =>
      (kinds.length === 0 || kinds.includes(row.kind)) &&
      (actors.length === 0 || actors.includes(row.actor)) &&
      (!query || row.search.includes(query)),
  );
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const today = new Date().toDateString();
  const actionsToday = rows.filter((row) => new Date(row.createdAt).toDateString() === today).length;
  const deletions = inPeriod.filter((row) => row.kind === 'delete').length;

  const kindOptions = (Object.keys(KIND_LABEL) as ActionKind[]).map((kind) => ({
    value: kind,
    label: KIND_LABEL[kind],
    count: inPeriod.filter((row) => row.kind === kind).length,
  }));
  const actorOptions = Object.values(ACTOR_LABEL).map((actor) => ({
    value: actor,
    label: actor,
    count: inPeriod.filter((row) => row.actor === actor).length,
  }));

  const clearFilters = () => {
    setSearch('');
    setKinds([]);
    setActors([]);
    setPeriod('30');
    setPage(1);
  };
  const tags = [
    ...kinds.map((kind) => ({
      key: kind,
      label: `نوع الإجراء: ${KIND_LABEL[kind as ActionKind]}`,
      onRemove: () => setKinds((current) => current.filter((item) => item !== kind)),
    })),
    ...actors.map((actor) => ({
      key: actor,
      label: `الجهة: ${actor}`,
      onRemove: () => setActors((current) => current.filter((item) => item !== actor)),
    })),
  ];

  return (
    <div className="dashboard-page">
      <PageHeader title="سجل التدقيق" />

      <div className="tenants-body" dir="rtl">
        <div className="tenants-stats">
          <Card className="tenants-stat-card">
            <p className="widget-title">إجراءات اليوم</p>
            <div className="widget-stat-block widget-stat-inline">
              <span className="widget-stat-value">{actionsToday}</span>
              <span className="widget-stat-label">إجراءات</span>
            </div>
          </Card>
          <Card className="tenants-stat-card">
            <p className="widget-title">عمليات الحذف</p>
            <div className="widget-stat-block widget-stat-inline">
              <span className="widget-stat-value">{deletions}</span>
            </div>
          </Card>
          <Card className="tenants-stat-card">
            <p className="widget-title">محاولات دخول مشبوهة</p>
            <div className="widget-bottom-row audit-suspicious">
              <span className="widget-stat-value">{summary?.failedLogins ?? 0}</span>
              <Badge variant="danger" icon={<AlertTriangle size={12} />}>
                آخر {summary?.periodDays ?? 7} أيام
              </Badge>
            </div>
          </Card>
          <Card className="tenants-stat-card">
            <p className="widget-title">أكثر جهة نشاطًا</p>
            <div>
              <span className="audit-stat-card__entity">{summary?.mostActive?.name ?? '—'}</span>
              <span className="audit-stat-card__submeta">{summary?.mostActive?.count ?? 0} إجراءات</span>
            </div>
          </Card>
        </div>

        <div className="tenants-toolbar-row">
          <div className="tenants-search">
            <Search size={16} strokeWidth={2.5} className="tenants-search__icon" />
            <input
              type="search"
              placeholder="ابحث بالإجراء أو اسم المستخدم"
              aria-label="بحث"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <MultiSelectFilter
            label="نوع الإجراء"
            options={kindOptions}
            selected={kinds}
            onApply={(values) => {
              setKinds(values);
              setPage(1);
            }}
          />
          <MultiSelectFilter
            label="الجهة"
            options={actorOptions}
            selected={actors}
            onApply={(values) => {
              setActors(values);
              setPage(1);
            }}
          />
          <SingleSelectFilter
            label="الفترة"
            options={PERIODS}
            value={period}
            onChange={(value) => {
              setPeriod(value);
              setPage(1);
            }}
          />
        </div>

        <span className="tenants-result-count">
          عرض {pageRows.length} من {visible.length} سجلًا
        </span>
        <AppliedTags tags={tags} onClearAll={clearFilters} />

        {loadError ? (
          <PageState
            tone="error"
            title="تعذّر تحميل سجل التدقيق"
            body="حدث خطأ في الاتصال بالخادم. أعد المحاولة بعد قليل."
            actionLabel="إعادة المحاولة"
            onAction={() => {
              setLoading(true);
              setReload((count) => count + 1);
            }}
          />
        ) : !loading && visible.length === 0 ? (
          <PageState
            title="لا توجد نتائج مطابقة"
            body="لم نجد إجراءات تطابق البحث أو الفلاتر الحالية."
            actionLabel="مسح البحث والفلاتر"
            onAction={clearFilters}
          />
        ) : (
          <>
            <Card className="audit-log-card">
              <div className="audit-log-card__header">
                <h2 className="audit-log-card__title">سجل الإجراءات</h2>
                <span className="audit-log-card__count">{pageRows.length}</span>
              </div>
              <div className="audit-log-list">
                {loading ? <p className="audit-loading">جاري التحميل...</p> : null}
                {pageRows.map((row) => {
                  const severity = KIND_SEVERITY[row.kind];
                  const Icon = severityIcon[severity];
                  return (
                    <button type="button" className="audit-log-row" key={row.id} onClick={() => setOpened(row)}>
                      <span className={`audit-log-row__icon audit-log-row__icon--${severity}`}>
                        <Icon size={22} strokeWidth={1.75} />
                      </span>
                      <span className="audit-log-row__text">
                        <span className="audit-log-row__title">{row.title}</span>
                        <span className="audit-log-row__meta">{row.meta}</span>
                      </span>
                      <span className="audit-log-row__time">{timeLabel(row.createdAt)}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} />
          </>
        )}
      </div>

      {opened ? (
        <div className="audit-drawer-backdrop" role="presentation" onClick={() => setOpened(null)}>
          <aside
            className="audit-drawer"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="تفاصيل الإجراء"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>تفاصيل الإجراء</h2>
              <button type="button" aria-label="إغلاق" onClick={() => setOpened(null)}>
                <X size={18} />
              </button>
            </header>
            <dl>
              {[
                ['الإجراء', opened.title],
                ['نوع العنصر', opened.subject],
                ['المنفّذ', `${opened.performer} · ${opened.actor}`],
                [
                  'الوقت',
                  new Date(opened.createdAt).toLocaleString('ar-SA-u-ca-gregory-nu-latn', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  }),
                ],
                ...(opened.ip ? [['عنوان IP', opened.ip]] : []),
                ['الرقم المرجعي', `AUD-${opened.id.slice(0, 8).toUpperCase()}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="audit-drawer__note">
              <strong>سجل للقراءة فقط</strong>
              لا يمكن تعديل سجلات التدقيق أو حذفها.
            </p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
