import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import type { WidgetId } from '../../config/widgets';
import { WidgetPreview } from './WidgetPreview';
import './dashboard.css';

interface WidgetLibraryPanelProps {
  onClose: () => void;
  removedWidgetIds?: WidgetId[];
  onAddWidget?: (id: WidgetId) => void;
}

export function WidgetLibraryPanel({
  onClose,
  removedWidgetIds = [],
  onAddWidget,
}: WidgetLibraryPanelProps) {
  return createPortal(
    <aside className="widget-library" dir="rtl">
      <div className="widget-library__header">
        <h2 className="widget-library__title">مكتبة الودجات</h2>
        <button
          type="button"
          className="widget-library__close"
          onClick={onClose}
          aria-label="إغلاق مكتبة الودجات"
        >
          <X size={18} />
        </button>
      </div>
      {removedWidgetIds.length === 0 ? (
        <p className="widget-library__empty">جميع الودجات مضافة إلى لوحة التحكم</p>
      ) : (
        <>
          <p className="widget-library__hint">اضغط على الودجة لإضافتها إلى لوحة التحكم</p>
          <div className="widget-library__list">
            {removedWidgetIds.map((id) => (
              <button
                key={id}
                type="button"
                className="widget-library__item"
                data-widget-id={id}
                onClick={() => onAddWidget?.(id)}
              >
                <div className="widget-library__preview">
                  <WidgetPreview id={id} />
                </div>
                <div className="widget-library__item-footer">
                  <span>إضافة الودجة</span>
                  <Plus size={16} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>,
    document.body,
  );
}
