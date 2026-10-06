import { ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { ProgressBar } from '../../ui/ProgressBar'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'
import { useWidgetLinks } from '../../../../features/portal/widgetLinks'

const statusVariant = {
  'on-track': 'success',
  late: 'warning',
  stalled: 'danger',
  completed: 'success',
} as const

const statusBarTone = {
  'on-track': 'info',
  late: 'warning',
  stalled: 'danger',
  completed: 'success',
} as const

const statusIcon = {
  'on-track': CheckCircle2,
  late: AlertTriangle,
  stalled: AlertCircle,
  completed: CheckCircle2,
} as const

export function ProjectsListWidget() {
  const projects = useLiveField('projects') ?? []
  const { links, go } = useWidgetLinks()

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">المشاريع</h3>
        </div>
        <button
          type="button"
          className="widget-header__link"
          disabled={!links.projects}
          onClick={() => go(links.projects)}
        >
          عرض الكل
        </button>
      </div>
      <WidgetBodyGate isEmpty={projects.length === 0}>
        <div className="list-rows">
          {projects.map((item) => {
            const StatusIcon = statusIcon[item.status]
            return (
              <div className="list-row" key={item.id}>
                <div className="list-row__text">
                  <p className="list-row__title">{item.title}</p>
                  <p className="list-row__subtitle">{item.company}</p>
                </div>
                <ProgressBar
                  value={item.progress}
                  tone={statusBarTone[item.status]}
                  className="list-row__bar"
                />
                <span className="list-row__percentage">{item.progress}%</span>
                <Badge variant={statusVariant[item.status]} icon={<StatusIcon size={12} />}>
                  {item.statusLabel}
                </Badge>
                <button
                  type="button"
                  className="list-row__nav-btn"
                  aria-label="عرض التفاصيل"
                  disabled={!links.project(item.id)}
                  onClick={() => go(links.project(item.id))}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
