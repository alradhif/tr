import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, CheckCircle2, Clock, LayoutGrid, ListFilter, Rows3, TriangleAlert, XCircle } from 'lucide-react'
import type { StatusClass } from '../../pages/org/orgEntityUi'
import { STATUS_META } from '../../pages/org/orgEntityUi'
import '../../design/deliverable-review.css'
import '../../design/record-cards.css'

export type ViewMode = 'table' | 'cards'

const storageKey = (page: string) => `trackplus.view.${page}`

/** The table/cards choice, remembered separately for each page as the design specifies. */
export function useViewMode(page: string) {
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(storageKey(page)) === 'cards' ? 'cards' : 'table'
    } catch {
      return 'table'
    }
  })
  const change = (next: ViewMode) => {
    setView(next)
    try {
      localStorage.setItem(storageKey(page), next)
    } catch {
      // Without storage the choice simply lasts for this visit.
    }
  }
  return [view, change] as const
}

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (next: ViewMode) => void }) {
  const options = [
    { key: 'table' as const, label: 'جدول', Icon: Rows3 },
    { key: 'cards' as const, label: 'بطاقات', Icon: LayoutGrid },
  ]
  return (
    <div className="rc-toggle" role="group" aria-label="طريقة العرض">
      {options.map(({ key, label, Icon }) => (
        <button key={key} type="button" aria-pressed={value === key} className={value === key ? 'is-active' : ''} onClick={() => onChange(key)}>
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  )
}

/** Red below 40%, amber below 80%, green from there: the same reading on tables and cards. */
export function progressColor(value: number) {
  if (value < 40) return '#f04438'
  if (value < 80) return '#f79009'
  return '#22b573'
}

const TONE_ICON: Record<string, typeof Clock> = {
  approved: CheckCircle2,
  pending: Clock,
  changes: TriangleAlert,
  none: XCircle,
}

export function ToneBadge({ meta }: { meta?: { label: string; tone: string } }) {
  const tone = meta?.tone ?? 'none'
  const Icon = TONE_ICON[tone]
  return (
    <span className={`dr-badge dr-badge--${tone}`}>
      <Icon size={13} />
      {meta?.label ?? '—'}
    </span>
  )
}

const STATUS_TONE: Record<StatusClass, string> = {
  track: 'approved',
  delay: 'pending',
  blocked: 'changes',
  done: 'approved',
}

export function StatusBadge({ status }: { status: StatusClass }) {
  return <ToneBadge meta={{ label: STATUS_META[status], tone: STATUS_TONE[status] }} />
}

export function RecordCardGrid({ children }: { children: ReactNode }) {
  return <div className="rc-grid">{children}</div>
}

export function RecordCard({
  title,
  subtitle,
  badges,
  progress,
  rows,
  actions,
  linkLabel,
  onOpen,
}: {
  title: ReactNode
  subtitle?: ReactNode
  badges?: ReactNode
  /** A null value means nothing can be measured yet, so no percentage is shown. */
  progress?: { label: string; value: number | null; note?: string }
  rows?: Array<{ label: string; value: ReactNode }>
  actions?: ReactNode
  linkLabel?: string
  onOpen?: () => void
}) {
  const percent = progress?.value === null || progress?.value === undefined ? null : Math.min(100, Math.max(0, Math.round(progress.value)))
  return (
    <article className="rc-card">
      <header className="rc-card__head">
        <div className="rc-card__title">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {badges ? <div className="rc-card__badges">{badges}</div> : null}
      </header>
      {progress ? (
        <div className="rc-card__progress">
          <div className="rc-card__progress-head">
            <span>{progress.label}</span>
            <strong style={percent === null ? undefined : { color: progressColor(percent) }}>{percent === null ? '—' : `${percent}%`}</strong>
          </div>
          <div className="rc-card__track">
            {percent === null ? null : <i style={{ width: `${percent}%`, background: progressColor(percent) }} />}
          </div>
          {progress.note ? <p className="rc-card__note">{progress.note}</p> : null}
        </div>
      ) : null}
      {rows?.length ? (
        <dl className="rc-card__rows">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? <div className="rc-card__actions">{actions}</div> : null}
      {linkLabel && onOpen ? (
        <button type="button" className="rc-card__link" onClick={onOpen}>
          {linkLabel}
        </button>
      ) : null}
    </article>
  )
}

export type StatusFilterOption<K extends string> = { key: K; label: string; count: number; dot?: string }

/** The "تصفية" button and its status menu, with the applied choice summarized beside the button. */
export function StatusFilterMenu<K extends string>({
  title,
  options,
  value,
  allKey,
  shown,
  total,
  noun,
  onChange,
}: {
  title: string
  options: Array<StatusFilterOption<K>>
  value: K
  allKey: K
  shown: number
  total: number
  noun: string
  onChange: (key: K) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const active = options.find((option) => option.key === value)
  const applied = value !== allKey

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="rc-filter" ref={root}>
      {applied ? (
        <p className="rc-filter__summary">
          عرض {shown} من {total} {noun}
          <button type="button" onClick={() => onChange(allKey)}>
            مسح التصفية
          </button>
        </p>
      ) : null}
      <button type="button" className={`rc-filter__button${applied ? ' is-applied' : ''}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <ListFilter size={17} />
        {applied ? `تصفية · ${active?.label} (${active?.count})` : 'تصفية'}
      </button>
      {open ? (
        <div className="rc-filter__menu" role="menu">
          <span className="rc-filter__title">{title}</span>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitemradio"
              aria-checked={option.key === value}
              className={option.key === value ? 'is-active' : ''}
              onClick={() => {
                onChange(option.key)
                setOpen(false)
              }}
            >
              {option.key === value ? <Check size={14} className="rc-filter__check" /> : option.dot ? <i style={{ background: option.dot }} /> : <i />}
              <span>{option.label}</span>
              <small>{option.count}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
