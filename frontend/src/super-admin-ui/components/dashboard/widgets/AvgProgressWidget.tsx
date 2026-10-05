import { CheckCircle2, TrendingUp } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { ProgressBar } from '../../ui/ProgressBar'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

function getProgressTone(value: number): 'danger' | 'warning' | 'success' {
  if (value < 40) return 'danger'
  if (value < 70) return 'warning'
  return 'success'
}

const toneLabels: Record<'danger' | 'warning' | 'success', string> = {
  success: 'على المسار',
  warning: 'يحتاج متابعة',
  danger: 'متأخر',
}

export function AvgProgressWidget() {
  const value = useLiveField('avgProgress')
  const tone = getProgressTone(value ?? 0)

  return (
    <Card className="widget-avg-progress">
      <div className="widget-icon-header">
        <p className="widget-title widget-avg-progress__title">متوسط تقدم المشاريع</p>
        <span className="widget-icon-badge">
          <TrendingUp size={16} aria-hidden style={{ transform: 'scaleX(-1)' }} />
        </span>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-progress-row">
          <p className="widget-stat-value widget-avg-progress__value">{value}%</p>
          <Badge variant={tone} icon={<CheckCircle2 size={14} aria-hidden />}>
            {toneLabels[tone]}
          </Badge>
        </div>
        <ProgressBar value={value ?? 0} tone={tone} className="widget-avg-progress__bar" />
      </WidgetBodyGate>
    </Card>
  )
}
