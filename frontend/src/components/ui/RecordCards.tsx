import { useState, type ReactNode } from 'react'
import { Tooltip } from 'antd'
import { CheckCircle2, Clock, LayoutGrid, Rows3, TriangleAlert, XCircle } from 'lucide-react'
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
      return localStorage.getItem(storageKey(page)) === 'table' ? 'table' : 'cards'
    } catch {
      return 'cards'
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
        <Tooltip key={key} title={label}>
          <button type="button" aria-label={label} aria-pressed={value === key} className={value === key ? 'is-active' : ''} onClick={() => onChange(key)}>
            <Icon size={17} aria-hidden />
          </button>
        </Tooltip>
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
  linkLabel,
  onOpen,
}: {
  title: ReactNode
  subtitle?: ReactNode
  badges?: ReactNode
  /** A null value means nothing can be measured yet, so no percentage is shown. */
  progress?: { label: string; value: number | null; note?: string }
  rows?: Array<{ label: string; value: ReactNode }>
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
      {progress?.note || (linkLabel && onOpen) ? (
        <footer className="rc-card__footer">
          {progress?.note ? <p className="rc-card__note">{progress.note}</p> : null}
          {linkLabel && onOpen ? (
            <button type="button" className="rc-card__link" onClick={onOpen}>
              {linkLabel}
            </button>
          ) : null}
        </footer>
      ) : null}
    </article>
  )
}

const CHIP_ORDER: StatusClass[] = ['track', 'delay', 'blocked', 'done']

/** Status filter shown as chips with a live count for each status. */
export function StatusChips({
  statuses,
  value,
  onChange,
}: {
  statuses: StatusClass[]
  value: StatusClass | 'all'
  onChange: (next: StatusClass | 'all') => void
}) {
  const chips: Array<{ key: StatusClass | 'all'; label: string; count: number }> = [
    { key: 'all', label: 'الكل', count: statuses.length },
    ...CHIP_ORDER.map((key) => ({ key, label: STATUS_META[key], count: statuses.filter((status) => status === key).length })),
  ]
  return (
    <div className="dr-chips" role="tablist" aria-label="تصفية حسب الحالة">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          role="tab"
          aria-selected={value === chip.key}
          className={value === chip.key ? 'is-active' : ''}
          onClick={() => onChange(chip.key)}
        >
          {chip.label}
          <span>{chip.count}</span>
        </button>
      ))}
    </div>
  )
}
