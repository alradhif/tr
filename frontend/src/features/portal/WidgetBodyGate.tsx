import type { ReactNode } from 'react'
import { commonAssets } from '@/assets'
import { useDashboardLoadState } from './DashboardLiveContext'

type WidgetBodyGateProps = {
  isEmpty?: boolean
  emptyLabel?: string
  children: ReactNode
}

export function WidgetBodyGate({
  isEmpty = false,
  emptyLabel = 'لا توجد بيانات',
  children,
}: WidgetBodyGateProps) {
  const loadState = useDashboardLoadState()

  if (loadState === 'loading') {
    return <div className="widget-live-skeleton" aria-busy="true" />
  }

  if (loadState === 'error') {
    return <p className="widget-live-error">تعذر تحميل البيانات</p>
  }

  if (isEmpty) {
    return (
      <div className="widget-live-empty">
        <img src={commonAssets.emptyState} alt="" width={72} height={72} />
        <p>{emptyLabel}</p>
      </div>
    )
  }

  return <>{children}</>
}
