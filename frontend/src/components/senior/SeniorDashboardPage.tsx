

import { DashboardGrid, useDashboardState } from '../dashboard/DashboardGrid';
import { WidgetLibraryPanel } from '../dashboard/WidgetLibraryPanel';
import { PageHeader } from '../layout/PageHeader';
import { EditGridIcon } from '../layout/EditGridIcon';
import { ADMIN_DEFAULT_ACTIVE_WIDGET_IDS } from '../../config/widgets';
import '../dashboard/dashboard.css';
import '../layout/layout.css';

export function SeniorDashboardPage() {
  const {
    isEditMode,
    setIsEditMode,
    activeWidgetIds,
    layout,
    setLayout,
    removeWidget,
  } = useDashboardState(ADMIN_DEFAULT_ACTIVE_WIDGET_IDS);

  return (
    <div className="dashboard-page">
      <PageHeader
        className="page-header--senior"
        title="لوحة التحكم"
        subtitle="نظرة عامة على أداء المنصة"
        action={
          <button
            type="button"
            className={`header__edit-btn ${isEditMode ? 'header__edit-btn--active' : ''}`}
            onClick={() => setIsEditMode((prev) => !prev)}
          >
            <EditGridIcon size={16} className="header__edit-icon" />
            <span>{isEditMode ? 'إنهاء التحرير' : 'تحرير'}</span>
          </button>
        }
      />
      <div className="dashboard-body">
        <div className={`dashboard-body__grid-area ${isEditMode ? 'dashboard-body__grid-area--library-open' : ''}`}>
          <DashboardGrid
            isEditMode={isEditMode}
            activeWidgetIds={activeWidgetIds}
            layout={layout}
            onLayoutChange={setLayout}
            onRemoveWidget={removeWidget}
          />
        </div>
      </div>
      {isEditMode && <WidgetLibraryPanel onClose={() => setIsEditMode(false)} />}
    </div>
  );
}
