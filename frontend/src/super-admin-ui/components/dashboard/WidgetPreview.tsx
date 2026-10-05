import type { ReactElement } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock, Tag, TrendingUp } from 'lucide-react';
import { WIDGET_REGISTRY, type WidgetId } from '../../config/widgets';
import {
  useDashboardLive,
  useDashboardLoadState,
  type LiveDashboardData,
} from '../../../features/portal/DashboardLiveContext';
import './dashboard.css';

function Donut({ segments }: { segments: { color: string; value: number }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <div className="wlp-donut" style={{ background: `conic-gradient(${stops})` }}>
      <div className="wlp-donut__hole" />
    </div>
  );
}

function LegendRows({ rows }: { rows: { color: string; label: string; value: number | string }[] }) {
  return (
    <div className="wlp-legend">
      {rows.map((row) => (
        <div className="wlp-legend__row" key={row.label}>
          <span className="wlp-legend__left">
            <span className="wlp-legend__dot" style={{ background: row.color }} />
            {row.label}
          </span>
          <span className="wlp-legend__value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function Dash({ label }: { label: string }) {
  return (
    <div className="wlp-stat-inline">
      <span className="wlp-stat__value">—</span>
      <span className="wlp-stat__label">{label}</span>
    </div>
  );
}

function StatInline({ value, label }: { value: number | undefined; label: string }) {
  if (value == null) return <Dash label={label} />;
  return (
    <div className="wlp-stat-inline">
      <span className="wlp-stat__value">{value}</span>
      <span className="wlp-stat__label">{label}</span>
    </div>
  );
}

function usePreviewLive() {
  const live = useDashboardLive();
  const loadState = useDashboardLoadState();
  if (loadState !== 'ready' || !live?.live) return null;
  return live;
}

const AVG_PROGRESS_TONE_LABELS: Record<'danger' | 'warning' | 'success', string> = {
  success: 'على المسار',
  warning: 'يحتاج متابعة',
  danger: 'متأخر',
};

function ActiveProjectsPreview({ live }: { live: LiveDashboardData | null }) {
  return <StatInline value={live?.activeProjects} label="مشاريع" />;
}

function AvgProgressPreview({ live }: { live: LiveDashboardData | null }) {
  const value = live?.avgProgress;
  if (value == null) return <Dash label="متوسط التقدم" />;
  const tone = value < 40 ? 'danger' : value < 70 ? 'warning' : 'success';
  const fillClass = tone === 'danger' ? '#F04438' : tone === 'warning' ? '#F79009' : '#17B26A';
  return (
    <div className="wlp-progress">
      <div className="wlp-bottom-row">
        <span className="wlp-stat__value wlp-stat__value--tight">{value}%</span>
        <span className={`wlp-badge wlp-badge--${tone}`}>
          <CheckCircle2 size={11} />
          {AVG_PROGRESS_TONE_LABELS[tone]}
        </span>
      </div>
      <div className="wlp-track">
        <div className="wlp-track__fill" style={{ width: `${value}%`, background: fillClass }} />
      </div>
    </div>
  );
}

function UpcomingDeliverablesPreview({ live }: { live: LiveDashboardData | null }) {
  return (
    <div className="wlp-bottom-row">
      <StatInline value={live?.upcomingDeliverables} label="مخرجات" />
      {live?.deliverablesThisWeek != null ? (
        <span className="wlp-badge wlp-badge--warning">
          <Bell size={11} />
          {live.deliverablesThisWeek} خلال أسبوع
        </span>
      ) : null}
    </div>
  );
}

function OpenRisksDonutPreview({ live }: { live: LiveDashboardData | null }) {
  const openRisks = live?.openRisks;
  if (!openRisks) return <Dash label="مخاطر" />;
  const segments = [
    { color: '#F04438', value: openRisks.high },
    { color: '#F79009', value: openRisks.medium },
    { color: '#17B26A', value: openRisks.low },
  ];
  return (
    <div className="wlp-donut-row">
      <LegendRows
        rows={[
          { color: '#F04438', label: 'مرتفع', value: openRisks.high },
          { color: '#F79009', label: 'متوسط', value: openRisks.medium },
          { color: '#17B26A', label: 'منخفض', value: openRisks.low },
        ]}
      />
      <Donut segments={segments} />
    </div>
  );
}

function ProjectStatusDonutPreview({ live }: { live: LiveDashboardData | null }) {
  const projectStatuses = live?.projectStatuses ?? [];
  if (projectStatuses.length === 0) return <Dash label="حالات المشاريع" />;
  return (
    <div className="wlp-donut-row">
      <LegendRows
        rows={projectStatuses.map((s) => ({
          color: s.color,
          label: s.label,
          value: `${s.value}%`,
        }))}
      />
      <Donut segments={projectStatuses.map((s) => ({ color: s.color, value: s.value }))} />
    </div>
  );
}

function RisksByLevelPreview({ live }: { live: LiveDashboardData | null }) {
  const sample = (live?.risksByMonth ?? []).slice(0, 5);
  if (sample.length === 0) return <Dash label="مخاطر شهرية" />;
  const maxTotal = Math.max(...sample.map((m) => m.low + m.medium + m.high), 1);
  return (
    <div className="wlp-bars">
      {sample.map((m) => {
        const total = m.low + m.medium + m.high;
        const height = Math.max(24, Math.round((total / maxTotal) * 56));
        return (
          <div className="wlp-bars__col" key={m.month} style={{ height }}>
            <div className="wlp-bars__seg" style={{ flex: Math.max(m.low, 0.01), background: '#17B26A' }} />
            <div className="wlp-bars__seg" style={{ flex: Math.max(m.medium, 0.01), background: '#F79009' }} />
            <div className="wlp-bars__seg" style={{ flex: Math.max(m.high, 0.01), background: '#F04438' }} />
          </div>
        );
      })}
    </div>
  );
}

function TodayAlertsPreview({ live }: { live: LiveDashboardData | null }) {
  const sample = (live?.todayAlerts ?? []).slice(0, 2);
  if (sample.length === 0) return <Dash label="تنبيهات" />;
  return (
    <div className="wlp-alerts">
      {sample.map((alert) => (
        <div className="wlp-alerts__row" key={alert.id}>
          <span className={`wlp-alerts__icon wlp-alerts__icon--${alert.type}`}>
            {alert.type === 'risk' ? <AlertTriangle size={12} /> : <Clock size={12} />}
          </span>
          <span className="wlp-alerts__title">{alert.title}</span>
        </div>
      ))}
    </div>
  );
}

function DeliverablesListPreview({ live }: { live: LiveDashboardData | null }) {
  const item = live?.deliverables?.[0];
  if (!item) return <Dash label="مخرج" />;
  return (
    <div className="wlp-list-item">
      <p className="wlp-list-item__title">{item.title}</p>
      <p className="wlp-list-item__subtitle">{item.project}</p>
    </div>
  );
}

function ProjectsListPreview({ live }: { live: LiveDashboardData | null }) {
  const item = live?.projects?.[0];
  if (!item) return <Dash label="مشروع" />;
  return (
    <div className="wlp-list-item">
      <p className="wlp-list-item__title">{item.title}</p>
      <div className="wlp-track wlp-track--sm">
        <div className="wlp-track__fill" style={{ width: `${item.progress ?? 0}%` }} />
      </div>
    </div>
  );
}

function ActiveTenantsPreview({ live }: { live: LiveDashboardData | null }) {
  return <StatInline value={live?.activeTenants} label="جهات" />;
}

function SubscriptionsEndingPreview({ live }: { live: LiveDashboardData | null }) {
  return <StatInline value={live?.subscriptionsEndingSoon} label="حسابات" />;
}

function TotalRevenuePreview() {
  return <Dash label="ريال/شهري" />;
}

function TenantStatusDonutPreview({ live }: { live: LiveDashboardData | null }) {
  const tenantStatusBreakdown = live?.tenantStatusBreakdown ?? [];
  if (tenantStatusBreakdown.length === 0) return <Dash label="المستأجرون" />;
  return (
    <div className="wlp-donut-row">
      <LegendRows
        rows={tenantStatusBreakdown.map((s) => ({
          color: s.color,
          label: s.name,
          value: s.value,
        }))}
      />
      <Donut segments={tenantStatusBreakdown.map((s) => ({ color: s.color, value: s.value }))} />
    </div>
  );
}

function SubscriptionsRevenueChartPreview() {
  return <Dash label="إيرادات" />;
}

function TenantsByPlanDonutPreview({ live }: { live: LiveDashboardData | null }) {
  const tenantsByPlan = live?.tenantsByPlan ?? [];
  if (tenantsByPlan.length === 0) return <Dash label="الباقات" />;
  return (
    <div className="wlp-donut-row">
      <LegendRows
        rows={tenantsByPlan.map((s) => ({
          color: s.color,
          label: s.label,
          value: `${s.value}%`,
        }))}
      />
      <Donut segments={tenantsByPlan.map((s) => ({ color: s.color, value: s.value }))} />
    </div>
  );
}

function TenantAlertsPreview({ live }: { live: LiveDashboardData | null }) {
  const sample = (live?.tenantAlerts ?? []).slice(0, 2);
  if (sample.length === 0) return <Dash label="تنبيهات" />;
  const iconClass: Record<string, string> = {
    renewal: 'deliverable',
    'unused-invite': 'risk',
    'trial-expired': 'approval',
  };
  return (
    <div className="wlp-alerts">
      {sample.map((alert) => (
        <div className="wlp-alerts__row" key={alert.id}>
          <span className={`wlp-alerts__icon wlp-alerts__icon--${iconClass[alert.type] ?? 'deliverable'}`}>
            {alert.type === 'unused-invite' ? (
              <AlertTriangle size={12} />
            ) : alert.type === 'trial-expired' ? (
              <Tag size={12} />
            ) : (
              <Clock size={12} />
            )}
          </span>
          <span className="wlp-alerts__title">{alert.title}</span>
        </div>
      ))}
    </div>
  );
}

function LatestActionsPreview({ live }: { live: LiveDashboardData | null }) {
  const item = live?.latestActions?.[0];
  if (!item) return <Dash label="إجراء" />;
  return (
    <div className="wlp-list-item">
      <p className="wlp-list-item__title">{item.title}</p>
    </div>
  );
}

function LatestTenantsPreview({ live }: { live: LiveDashboardData | null }) {
  const item = live?.latestTenants?.[0];
  if (!item) return <Dash label="مستأجر" />;
  return (
    <div className="wlp-list-item">
      <p className="wlp-list-item__title">{item.name}</p>
      <p className="wlp-list-item__subtitle">{item.statusLabel}</p>
    </div>
  );
}

type PreviewProps = { live: LiveDashboardData | null };

const PREVIEWS: Record<WidgetId, (props: PreviewProps) => ReactElement> = {
  'active-tenants': ActiveTenantsPreview,
  'total-revenue': () => <TotalRevenuePreview />,
  'subscriptions-ending': SubscriptionsEndingPreview,
  'tenant-status-donut': TenantStatusDonutPreview,
  'subscriptions-revenue-chart': () => <SubscriptionsRevenueChartPreview />,
  'tenant-plan-donut': TenantsByPlanDonutPreview,
  'tenant-alerts': TenantAlertsPreview,
  'latest-actions': LatestActionsPreview,
  'latest-tenants': LatestTenantsPreview,
  'active-projects': ActiveProjectsPreview,
  'avg-progress': AvgProgressPreview,
  'upcoming-deliverables': UpcomingDeliverablesPreview,
  'open-risks-donut': OpenRisksDonutPreview,
  'risks-by-level': RisksByLevelPreview,
  'project-status-donut': ProjectStatusDonutPreview,
  'today-alerts': TodayAlertsPreview,
  'deliverables-list': DeliverablesListPreview,
  'projects-list': ProjectsListPreview,
};

const PREVIEW_ICONS: Partial<Record<WidgetId, ReactElement>> = {
  'avg-progress': <TrendingUp size={13} aria-hidden style={{ transform: 'scaleX(-1)' }} />,
  'total-revenue': <TrendingUp size={13} aria-hidden />,
};

export function WidgetPreview({ id }: { id: WidgetId }) {
  const live = usePreviewLive();
  const Preview = PREVIEWS[id];
  const icon = PREVIEW_ICONS[id];
  return (
    <div className="wlp-card">
      <div className="wlp-header">
        <p className="wlp-title">{WIDGET_REGISTRY[id].title}</p>
        {icon && <span className="wlp-icon-badge">{icon}</span>}
      </div>
      <Preview live={live} />
    </div>
  );
}
