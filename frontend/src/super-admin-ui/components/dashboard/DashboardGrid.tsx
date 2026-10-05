import { useCallback, useMemo, useRef, useState } from 'react';
import GridLayout, {
  WidthProvider,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  ALL_WIDGET_IDS,
  DEFAULT_ACTIVE_WIDGET_IDS,
  DEFAULT_LAYOUT,
  WIDGET_REGISTRY,
  type WidgetId,
} from '../../config/widgets';
import { WidgetWrapper } from '../ui/WidgetWrapper';
import './dashboard.css';

const ResponsiveGrid = WidthProvider(GridLayout);

const ROW_HEIGHT = 60;
const ROW_MARGIN_Y = 20;

function pixelsToRows(pixelHeight: number, minH: number) {
  const rows = Math.ceil((pixelHeight + ROW_MARGIN_Y) / (ROW_HEIGHT + ROW_MARGIN_Y));
  return Math.max(rows, minH);
}

interface DashboardGridProps {
  isEditMode: boolean;
  activeWidgetIds: WidgetId[];
  layout: LayoutItem[];
  onLayoutChange: (layout: LayoutItem[]) => void;
  onRemoveWidget: (id: WidgetId) => void;
}

export function DashboardGrid({
  isEditMode,
  activeWidgetIds,
  layout,
  onLayoutChange,
  onRemoveWidget,
}: DashboardGridProps) {
  const activeLayout = useMemo(() => {
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    return activeWidgetIds.map((id, index) => {
      const existing = layout.find((item) => item.i === id);
      if (existing) return existing;
      const template = DEFAULT_LAYOUT.find((item) => item.i === id);
      const def = WIDGET_REGISTRY[id];
      return {
        i: id,
        x: template?.x ?? 0,
        y: template ? maxY + index * (template.h || def.minH) : maxY,
        w: template?.w ?? def.minW,
        h: template?.h ?? def.minH,
        minW: def.minW,
        minH: def.minH,
      };
    });
  }, [layout, activeWidgetIds]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditMode) return;
      const byId = new Map(layout.map((item) => [item.i, item]));
      for (const item of newLayout) {
        byId.set(item.i, item);
      }
      onLayoutChange([...byId.values()]);
    },
    [isEditMode, layout, onLayoutChange],
  );

  
  
  
  
  
  
  
  
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const handleContentResize = useCallback(
    (id: WidgetId, contentHeightPx: number) => {
      const nextH = pixelsToRows(contentHeightPx, WIDGET_REGISTRY[id].minH);
      const current = layoutRef.current.find((item) => item.i === id);
      if (!current || current.h === nextH) return;
      onLayoutChange(layoutRef.current.map((item) => (item.i === id ? { ...item, h: nextH } : item)));
    },
    [onLayoutChange],
  );

  return (
    
    
    
    
    
    <div className="dashboard-grid">
      <ResponsiveGrid
        className="dashboard-grid__layout"
        layout={activeLayout}
        cols={12}
        rowHeight={60}
        margin={[20, 20]}
        containerPadding={[0, 0]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        draggableCancel=".widget-wrapper__remove"
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        useCSSTransforms
      >
        {activeWidgetIds.map((id) => {
          const { component: WidgetComponent, autoHeight } = WIDGET_REGISTRY[id];
          return (
            <div key={id} className="dashboard-grid__item">
              <WidgetWrapper
                isEditMode={isEditMode}
                onRemove={() => onRemoveWidget(id)}
                autoHeight={autoHeight}
                onContentResize={
                  autoHeight ? (heightPx) => handleContentResize(id, heightPx) : undefined
                }
              >
                <WidgetComponent />
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
}

export function useDashboardState(
  initialActiveWidgetIds: WidgetId[] = DEFAULT_ACTIVE_WIDGET_IDS,
  availableWidgetIds: WidgetId[] = ALL_WIDGET_IDS,
  initialLayout: LayoutItem[] = DEFAULT_LAYOUT,
) {
  const [isEditMode, setIsEditMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return import.meta.env.DEV && sessionStorage.getItem('trackplus.debug.dashboardEdit') === '1';
  });
  const [activeWidgetIds, setActiveWidgetIds] = useState<WidgetId[]>(initialActiveWidgetIds);
  const [layout, setLayout] = useState<LayoutItem[]>(initialLayout);

  const removedWidgetIds = useMemo(
    () => {
      const catalog = availableWidgetIds.length > 0 ? availableWidgetIds : ALL_WIDGET_IDS;
      return catalog.filter((id) => !activeWidgetIds.includes(id));
    },
    [activeWidgetIds, availableWidgetIds],
  );

  const removeWidget = useCallback((id: WidgetId) => {
    setActiveWidgetIds((prev) => prev.filter((w) => w !== id));
  }, []);

  const addWidget = useCallback((id: WidgetId) => {
    setActiveWidgetIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setLayout((prev) => {
      if (prev.some((item) => item.i === id)) return prev;
      const template = DEFAULT_LAYOUT.find((item) => item.i === id);
      const def = WIDGET_REGISTRY[id];
      const maxY = prev.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      return [
        ...prev,
        {
          i: id,
          x: template?.x ?? 0,
          y: maxY,
          w: template?.w ?? def.minW,
          h: template?.h ?? def.minH,
          minW: def.minW,
          minH: def.minH,
        },
      ];
    });
  }, []);

  return {
    isEditMode,
    setIsEditMode,
    activeWidgetIds,
    layout,
    setLayout,
    removedWidgetIds,
    removeWidget,
    addWidget,
  };
}
