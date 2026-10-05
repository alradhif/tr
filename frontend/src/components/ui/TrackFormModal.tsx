import type { FormEvent, ReactNode } from 'react'
import { X } from 'lucide-react'

type TrackFormModalProps = {
  title: string
  icon: ReactNode
  children: ReactNode
  submitLabel: string
  submitting?: boolean
  error?: string
  onClose: () => void
  onSubmit: () => void | Promise<void>
}

export function TrackFormModal({
  title,
  icon,
  children,
  submitLabel,
  submitting = false,
  error,
  onClose,
  onSubmit,
}: TrackFormModalProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit()
  }

  return (
    <div
      className="project-output-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="project-output-modal__dialog" dir="rtl" onSubmit={handleSubmit}>
        <div className="project-output-modal__header">
          <div className="project-output-modal__title-wrap">
            <span className="project-output-modal__icon">{icon}</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="project-output-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="project-output-modal__divider" />
        {children}
        {error ? <p className="project-output-modal__error">{error}</p> : null}
        <div className="project-output-modal__actions">
          <button type="button" className="project-output-modal__cancel" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="project-output-modal__submit" disabled={submitting}>
            {submitting ? 'جاري الحفظ...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
