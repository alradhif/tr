import { ChevronLeft } from 'lucide-react'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'
import { useWidgetLinks } from '../../../../features/portal/widgetLinks'

export function DeliverablesListWidget() {
  const deliverables = useLiveField('deliverables') ?? []
  const { links, go } = useWidgetLinks()

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">المخرجات</h3>
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
      <WidgetBodyGate isEmpty={deliverables.length === 0}>
        <div className="list-rows">
          {deliverables.map((item) => (
            <div className="list-row" key={item.id}>
              <div className="list-row__text">
                <p className="list-row__title">{item.title}</p>
                <p className="list-row__subtitle">{item.project}</p>
              </div>
              <button
                  type="button"
                  className="list-row__nav-btn"
                  aria-label="عرض التفاصيل"
                  disabled={!links.project(item.projectId)}
                  onClick={() => go(links.project(item.projectId))}
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
