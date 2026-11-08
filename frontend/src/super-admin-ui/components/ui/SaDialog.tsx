import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import './sa-dialog.css';

/** The confirmation window used across the Super Admin account. */
export function SaDialog({
  title,
  body,
  tone = 'info',
  confirmLabel,
  cancelLabel = 'إلغاء',
  confirmDisabled,
  busy,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  body?: string;
  tone?: 'info' | 'danger';
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  busy?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sa-dialog-backdrop" role="presentation">
      <div className="sa-dialog" dir="rtl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sa-dialog__head">
          <h2>{title}</h2>
          <span className={`sa-dialog__icon sa-dialog__icon--${tone}`}>
            <AlertTriangle size={20} />
          </span>
        </div>
        {body ? <p className="sa-dialog__body">{body}</p> : null}
        {children}
        <div className="sa-dialog__actions">
          <button
            type="button"
            className={`sa-dialog__confirm${tone === 'danger' ? ' sa-dialog__confirm--danger' : ''}`}
            disabled={confirmDisabled || busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className="sa-dialog__cancel" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface SaToastValue {
  ok: boolean;
  title: string;
  body?: string;
}

export function SaToast({ toast, onClose }: { toast: SaToastValue; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className={`sa-toast${toast.ok ? '' : ' sa-toast--error'}`} dir="rtl" role="status">
      <span className="sa-toast__icon">{toast.ok ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}</span>
      <div>
        <strong>{toast.title}</strong>
        {toast.body ? <p>{toast.body}</p> : null}
      </div>
      <button type="button" aria-label="إغلاق" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
