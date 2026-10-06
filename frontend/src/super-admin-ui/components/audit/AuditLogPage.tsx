import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Repeat, Search } from 'lucide-react';
import GridLayout, { WidthProvider, type Layout, type LayoutItem } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PageHeader } from '../layout/PageHeader';
import { type AuditLogEntry, type AuditLogSeverity } from '../../data/auditLog';
import { getAuditLogs, getAuditSummary, type AuditSummary } from '../../../api/superAdmin';
import { getSuperAdminToken } from '../../../auth/superAdminAuth';
import '../layout/layout.css';
import '../dashboard/dashboard.css';
import '../tenants/tenants.css';
import './audit.css';

const ResponsiveGrid = WidthProvider(GridLayout);

const severityIcon: Record<AuditLogSeverity, typeof Clock> = {
  success: Clock,
  warning: AlertTriangle,
  info: Repeat,
};

function mapSeverity(action: string): AuditLogSeverity {
  if (action === 'DELETE') return 'warning';
  if (action === 'CREATE') return 'success';
  return 'info';
}

const ACTION_LABEL: Record<string, string> = { CREATE: 'إنشاء', UPDATE: 'تعديل', DELETE: 'حذف' };
const TABLE_LABEL: Record<string, string> = {
  org_accounts: 'حساب جهة',
  client_accounts: 'حساب عميل',
  org_users: 'مستخدم جهة',
  client_users: 'مستخدم عميل',
  jodayn_users: 'مستخدم جودين',
  packages: 'باقة',
  credentials: 'بيانات الدخول',
};
const ACTOR_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'سوبر أدمن',
  JODAYN: 'جودين',
  ORG: 'جهة',
  CLIENT: 'عميل',
};

type AuditFilterId = 'all' | 'CREATE' | 'UPDATE' | 'DELETE';
type AuditRow = AuditLogEntry & { action: string; createdAt: string; search: string };

function formatTime(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('ar-SA');
}

const DEFAULT_STATS_LAYOUT: LayoutItem[] = [
  { i: 'today', x: 9, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
  { i: 'deletions', x: 6, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
  { i: 'suspicious', x: 3, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
  { i: 'mostActive', x: 0, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
];

const DEFAULT_LOG_LAYOUT: LayoutItem[] = [
  { i: 'log', x: 0, y: 0, w: 12, h: 8, minW: 6, maxW: 12, minH: 3, maxH: 20 },
];

export function AuditLogPage() {
  const [activeFilter, setActiveFilter] = useState<AuditFilterId>('all');
  const [entries, setEntries] = useState<AuditRow[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isEditMode = false;
  const [statsLayout, setStatsLayout] = useState<LayoutItem[]>(DEFAULT_STATS_LAYOUT);
  const [logLayout, setLogLayout] = useState<LayoutItem[]>(DEFAULT_LOG_LAYOUT);

  useEffect(() => {
    const token = getSuperAdminToken();
    if (!token) return;
    let cancelled = false;
    Promise.all([getAuditLogs(token), getAuditSummary(token)])
      .then(([res, sum]) => {
        if (cancelled) return;
        setSummary(sum);
        setEntries(
          (res.logs ?? []).map((log, index) => {
            const action = String(log.action ?? 'UPDATE');
            const tableName = String(log.tableName ?? '—');
            const performer = String(log.performerName ?? '—');
            const actor = ACTOR_LABEL[String(log.actorType ?? '')] ?? String(log.actorType ?? '');
            const newData = (log.newData ?? {}) as Record<string, unknown>;
            const oldData = (log.oldData ?? {}) as Record<string, unknown>;
            const subject = String(newData.name ?? oldData.name ?? newData.email ?? log.recordId ?? '');
            const title = `${ACTION_LABEL[action] ?? action} ${TABLE_LABEL[tableName] ?? tableName}${subject ? ` «${subject}»` : ''}`;
            const meta = `${tableName} · ${performer} · ${actor}`;
            return {
              id: String(log.id ?? index),
              title,
              meta,
              time: formatTime(log.createdAt),
              severity: mapSeverity(action),
              action,
              createdAt: String(log.createdAt ?? ''),
              search: `${title} ${meta}`.toLowerCase(),
            };
          }),
        );
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'تعذر تحميل سجل التدقيق');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const auditLogSummary = useMemo(() => {
    const today = new Date().toDateString();
    return {
      actionsToday: entries.filter((e) => new Date(e.createdAt).toDateString() === today).length,
      deletions: entries.filter((e) => e.action === 'DELETE').length,
      suspiciousAttempts: summary?.failedLogins ?? 0,
      mostActiveEntity: {
        name: summary?.mostActive?.name ?? '—',
        actionsCount: summary?.mostActive?.count ?? 0,
        role: summary ? `آخر ${summary.periodDays} أيام` : '',
      },
    };
  }, [entries, summary]);

  const auditFilterTabs: Array<{ id: AuditFilterId; label: string; count: number }> = [
    { id: 'all', label: 'كل الإجراءات', count: entries.length },
    { id: 'CREATE', label: 'إنشاء', count: entries.filter((e) => e.action === 'CREATE').length },
    { id: 'UPDATE', label: 'تعديل', count: entries.filter((e) => e.action === 'UPDATE').length },
    { id: 'DELETE', label: 'حذف', count: entries.filter((e) => e.action === 'DELETE').length },
  ];

  const query = search.trim().toLowerCase();
  const auditLogEntries = entries
    .filter((e) => activeFilter === 'all' || e.action === activeFilter)
    .filter((e) => !query || e.search.includes(query));

  const handleStatsLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditMode) return;
      setStatsLayout([...newLayout]);
    },
    [isEditMode],
  );

  const handleLogLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditMode) return;
      setLogLayout([...newLayout]);
    },
    [isEditMode],
  );

  return (
    <div className="dashboard-page">
      <PageHeader
        title="سجل التدقيق"
        subtitle="سجل كامل بجميع الإجراءات على المنصة"
      />

      <div className="tenants-body" dir="rtl">
        <div className="dashboard-grid tenants-stats-grid">
          <ResponsiveGrid
            className="dashboard-grid__layout"
            layout={statsLayout}
            cols={12}
            rowHeight={54}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
            onLayoutChange={handleStatsLayoutChange}
            compactType={null}
            useCSSTransforms
          >
            <div key="today" className="dashboard-grid__item">
              <div
                dir="rtl"
                className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
              >
                <Card className="audit-stat-card">
                  <p className="widget-title">إجراءات اليوم</p>
                  <div className="widget-stat-block widget-stat-inline">
                    <span className="widget-stat-value">{auditLogSummary.actionsToday}</span>
                    <span className="widget-stat-label audit-stat-card__label--bold">إجراءات</span>
                  </div>
                </Card>
              </div>
            </div>

            <div key="deletions" className="dashboard-grid__item">
              <div
                dir="rtl"
                className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
              >
                <Card className="audit-stat-card">
                  <p className="widget-title">عمليات الحذف</p>
                  <div className="widget-stat-block">
                    <span className="widget-stat-value">{auditLogSummary.deletions}</span>
                  </div>
                </Card>
              </div>
            </div>

            <div key="suspicious" className="dashboard-grid__item">
              <div
                dir="rtl"
                className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
              >
                <Card className="audit-stat-card">
                  <p className="widget-title">محاولات دخول مشبوهة</p>
                  <div className="widget-bottom-row">
                    <span className="widget-stat-value">{auditLogSummary.suspiciousAttempts}</span>
                    <Badge variant="danger" icon={<AlertTriangle size={12} />}>
                      <strong>من عناوين IP</strong>
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>

            <div key="mostActive" className="dashboard-grid__item">
              <div
                dir="rtl"
                className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
              >
                <Card className="audit-stat-card">
                  <p className="widget-title">أكثر جهة نشاطًا</p>
                  <div className="widget-stat-block">
                    <span className="audit-stat-card__entity">{auditLogSummary.mostActiveEntity.name}</span>
                    <span className="audit-stat-card__submeta">
                      {auditLogSummary.mostActiveEntity.actionsCount} إجراءات · {auditLogSummary.mostActiveEntity.role}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          </ResponsiveGrid>
        </div>

        <div className="tenants-toolbar-row">
          <div className="tenants-search">
            <Search size={16} strokeWidth={2.5} className="tenants-search__icon" />
            <input
              type="search"
              placeholder="البحث"
              aria-label="بحث"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="tenants-filter-tabs">
            {auditFilterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tenants-filter-tab ${
                  activeFilter === tab.id ? 'tenants-filter-tab--active' : ''
                }`}
                onClick={() => setActiveFilter(tab.id)}
              >
                {tab.label}({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-grid tenants-table-grid">
          <ResponsiveGrid
            className="dashboard-grid__layout"
            layout={logLayout}
            cols={12}
            rowHeight={54}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={false}
            isResizable={isEditMode}
            resizeHandles={['s', 'w', 'e', 'sw', 'se']}
            onLayoutChange={handleLogLayoutChange}
            compactType={null}
            useCSSTransforms
          >
            <div key="log" className="dashboard-grid__item">
              <div
                dir="rtl"
                className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
              >
                <Card className="audit-log-card">
                  <div className="audit-log-card__header">
                    <span className="audit-log-card__count">{auditLogEntries.length}</span>
                    <h2 className="audit-log-card__title">سجل الإجراءات</h2>
                  </div>
                  <div className="audit-log-list">
                    {loadError ? <p style={{ color: '#b91c1c', padding: 16 }}>{loadError}</p> : null}
                    {!loadError && auditLogEntries.length === 0 ? (
                      <p style={{ color: '#a1a1aa', padding: 16, textAlign: 'center' }}>لا توجد إجراءات مسجلة</p>
                    ) : null}
                    {auditLogEntries.map((entry) => {
                      const Icon = severityIcon[entry.severity];
                      return (
                        <div className="audit-log-row" key={entry.id}>
                          <div className="audit-log-row__main">
                            <span className={`audit-log-row__icon audit-log-row__icon--${entry.severity}`}>
                              <Icon size={16} strokeWidth={2.25} />
                            </span>
                            <div className="audit-log-row__text">
                              <p className="audit-log-row__title">{entry.title}</p>
                              <p className="audit-log-row__meta">{entry.meta}</p>
                            </div>
                          </div>
                          <span className="audit-log-row__time">{entry.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </ResponsiveGrid>
        </div>
      </div>
    </div>
  );
}
