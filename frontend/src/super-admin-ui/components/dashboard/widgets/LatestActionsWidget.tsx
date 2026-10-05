import { ChevronLeft } from 'lucide-react'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function LatestActionsWidget() {
  const latestActions = useLiveField('latestActions') ?? []

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">أحدث الإجراءات</h3>
        </div>
        <button type="button" className="widget-header__link">
          عرض الكل
        </button>
      </div>
      <WidgetBodyGate isEmpty={latestActions.length === 0}>
        <div className="list-rows">
          {latestActions.map((item) => (
            <div className="list-row" key={item.id}>
              <div className="list-row__text">
                <p className="list-row__title list-row__title--single-line">{item.title}</p>
              </div>
              <button type="button" className="list-row__nav-btn" aria-label="عرض التفاصيل">
                <ChevronLeft size={14} />
              </button>
            </div>
          ))}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
