import { CheckCircle2, ChevronLeft, Clock, TrendingUp, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { ProgressBar } from '../../ui/ProgressBar'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'
import { formatAmount } from '../../../../features/jodayn-finance/FinanceParts'
import { getOrgRole } from '../../../../auth/orgAuth'

/** Upper management decides; data entry only follows what is waiting. */
const isDecider = () => getOrgRole() === 'upper'

const toneOf = (pct: number): 'danger' | 'warning' | 'success' => (pct < 40 ? 'danger' : pct < 70 ? 'warning' : 'success')

/** Share of the goals' deliverables that upper management has approved. */
export function GoalsExecutiveWidget() {
  const value = useLiveField('goalsExecutive')
  const tone = toneOf(value?.pct ?? 0)

  return (
    <Card className="widget-avg-progress">
      <div className="widget-icon-header">
        <p className="widget-title widget-avg-progress__title">التقدم التنفيذي للأهداف</p>
        <span className="widget-icon-badge">
          <TrendingUp size={16} aria-hidden style={{ transform: 'scaleX(-1)' }} />
        </span>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-progress-row">
          <p className="widget-stat-value widget-avg-progress__value">{value?.pct}%</p>
          <Badge variant={tone} icon={<CheckCircle2 size={14} aria-hidden />}>
            {value?.approved} من {value?.total} مخرجًا معتمدًا
          </Badge>
        </div>
        <ProgressBar value={value?.pct ?? 0} tone={tone} className="widget-avg-progress__bar" />
      </WidgetBodyGate>
    </Card>
  )
}

export function PendingApprovalsCountWidget() {
  const items = useLiveField('pendingDeliverables')

  return (
    <Card className="widget-kpi-compact widget-active-projects">
      <div className="widget-icon-header">
        <p className="widget-title widget-kpi-compact__title">{isDecider() ? 'بانتظار اعتمادك' : 'بانتظار الاعتماد'}</p>
      </div>
      <WidgetBodyGate isEmpty={items == null}>
        <div className="widget-stat-block widget-stat-inline org-pending-count">
          <span className="widget-stat-value">{items?.length}</span>
          <span className="widget-stat-label">مخرجات</span>
          <Badge variant="warning" icon={<Clock size={12} />}>
            {isDecider() ? 'تحتاج قرارك' : 'قيد المراجعة'}
          </Badge>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}

export function PendingApprovalsListWidget() {
  const items = useLiveField('pendingDeliverables') ?? []
  const navigate = useNavigate()

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">
            {isDecider() ? 'مخرجات بانتظار اعتمادك' : 'مخرجات بانتظار الاعتماد'} ({items.length})
          </h3>
        </div>
      </div>
      <WidgetBodyGate isEmpty={items.length === 0}>
        <div className="list-rows">
          {items.slice(0, 6).map((item) => (
            <div className="list-row" key={item.id}>
              <div className="list-row__text">
                <p className="list-row__title list-row__title--single-line">{item.name}</p>
                <p className="list-row__subtitle">
                  {item.project} · {item.submittedBy || '—'}
                </p>
              </div>
              <button
                type="button"
                className="list-row__nav-btn"
                aria-label={`مراجعة ${item.name}`}
                onClick={() => navigate(`/org/projects/${item.projectId}/deliverables/${item.id}`)}
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          ))}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}

export function InvoicesSummaryWidget() {
  const summary = useLiveField('invoiceSummary')
  const navigate = useNavigate()
  const pay = summary?.direction !== 'COLLECT'

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">{pay ? 'تتبع الفواتير' : 'تحصيل الفواتير'}</h3>
        </div>
        <button type="button" className="widget-header__link" onClick={() => navigate('/org/invoices')}>
          عرض الكل
        </button>
      </div>
      <WidgetBodyGate isEmpty={summary == null}>
        <div className="org-invoices-mini">
          <div>
            <span>{pay ? 'المدفوع' : 'المحصّل'}</span>
            <strong>{formatAmount(summary?.settled)} ر.س</strong>
          </div>
          <div>
            <span>{pay ? 'المتبقي للدفع' : 'المتبقي للتحصيل'}</span>
            <strong>{formatAmount(summary?.remaining)} ر.س</strong>
          </div>
          <div className="org-invoices-mini--late">
            <span>المتأخر</span>
            <strong>{formatAmount(summary?.overdue)} ر.س</strong>
          </div>
        </div>
        <p className="org-mini-title">دفعات تحتاج متابعة</p>
        <div className="list-rows">
          {(summary?.followUps ?? []).map((item) => (
            <div className="list-row" key={item.id}>
              <div className="list-row__text">
                <p className="list-row__title list-row__title--single-line">{item.company}</p>
                <p className="list-row__subtitle">
                  {item.project} · {item.title}
                </p>
              </div>
              <span className="list-row__percentage">{formatAmount(item.amount)} ر.س</span>
              <Badge variant={item.overdue ? 'danger' : 'warning'} icon={item.overdue ? <TriangleAlert size={12} /> : <Clock size={12} />}>
                {item.overdue ? 'متأخرة' : 'مستحقة'}
              </Badge>
            </div>
          ))}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}

export function GoalsListWidget() {
  const goals = useLiveField('goalsProgress') ?? []
  const navigate = useNavigate()

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">الأهداف الإستراتيجية</h3>
        </div>
        <button type="button" className="widget-header__link" onClick={() => navigate('/org/goals')}>
          عرض الكل
        </button>
      </div>
      <WidgetBodyGate isEmpty={goals.length === 0}>
        <div className="list-rows">
          {goals.slice(0, 4).map((goal) => (
            <button type="button" className="org-goal-row" key={goal.id} onClick={() => navigate(`/org/goals/${goal.id}`)}>
              <span className="org-goal-row__title">{goal.title}</span>
              <small>
                المعتمد {goal.approved} من {goal.total} مخرجًا
              </small>
              <span className="org-goal-row__bar">
                <ProgressBar value={goal.pct} tone={toneOf(goal.pct)} className="list-row__bar" />
                <b>{goal.pct}%</b>
              </span>
            </button>
          ))}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
