import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { CatalogButton } from '../components/ui'

export function CatalogConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading,
  onConfirm,
  onCancel,
  confirmVariant = 'danger',
  icon,
  promptLabel,
  promptValue,
  promptPlaceholder,
  onPromptChange,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  confirmVariant?: 'primary' | 'danger' | 'outline'
  icon?: ReactNode
  promptLabel?: string
  promptValue?: string
  promptPlaceholder?: string
  onPromptChange?: (value: string) => void
}) {
  if (!open) return null

  return (
    <div
      className="catalog-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      dir="rtl"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className={`catalog-dialog${promptLabel ? ' catalog-dialog--prompt' : ''}`}>
        <div className="catalog-dialog__heading">
          <span
            className={`catalog-dialog__icon${confirmVariant === 'primary' ? ' catalog-dialog__icon--primary' : ''}`}
            aria-hidden
          >
            {icon ?? <Trash2 size={22} />}
          </span>
          <h2>{title}</h2>
        </div>
        <hr />
        <p>{message}</p>
        {promptLabel ? (
          <label className="catalog-dialog__prompt">
            <span>{promptLabel}</span>
            <textarea
              value={promptValue ?? ''}
              placeholder={promptPlaceholder}
              onChange={(event) => onPromptChange?.(event.target.value)}
              rows={4}
              autoFocus
            />
          </label>
        ) : null}
        <div className="catalog-dialog__actions">
          <CatalogButton variant={confirmVariant} disabled={loading} onClick={onConfirm}>
            {confirmLabel}
          </CatalogButton>
          <CatalogButton variant="outline" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </CatalogButton>
        </div>
      </div>
    </div>
  )
}
