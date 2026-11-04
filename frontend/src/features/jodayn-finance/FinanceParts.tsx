import type { ReactNode } from 'react'
import { Modal } from 'antd'
import { ChevronLeft, Plus } from 'lucide-react'
import icon1 from './assets/icon1.svg'
import icon2 from './assets/icon2.svg'
import './finance.css'

/** Page frame from the Jodayn finance design: top bar with the page title, then the body. */
export function FinancePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="finance-page" dir="rtl">
      <header className="finance-topbar">
        <h2 className="finance-topbar__title">{title}</h2>
      </header>
      <div className="finance-body">{children}</div>
    </div>
  )
}

/** Dark "+ label" button used for page create actions. */
export function FinanceCreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="finance-btn finance-btn--dark" onClick={onClick}>
      <Plus size={18} strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  )
}

export type StatCardData = { label: string; value: string; icon?: string }

export function FinanceStats({ cards }: { cards: StatCardData[] }) {
  const fallback = [icon1, icon2, icon2]
  return (
    <div className="finance-cards">
      {cards.map((card, index) => (
        <div className="finance-card" key={card.label}>
          <div className="finance-card__top">
            <span className="finance-card__icon">
              <img src={card.icon ?? fallback[index % 3]} alt="" />
            </span>
            <span className="finance-card__label">{card.label}</span>
          </div>
          <div className="finance-card__value">{card.value}</div>
        </div>
      ))}
    </div>
  )
}

export type AmountStat = { label: string; value: string; unit: string }

/** Plain amount cards (label on top, value and unit below). */
export function FinanceAmountStats({ cards }: { cards: AmountStat[] }) {
  return (
    <div className={`finance-cards${cards.length === 4 ? ' finance-cards--4' : ''}`}>
      {cards.map((card) => (
        <div className="finance-card finance-card--plain" key={card.label}>
          <div className="finance-card__top">
            <span className="finance-card__label">{card.label}</span>
          </div>
          <div className="finance-card__value-row">
            <span className="finance-card__value" style={{ marginTop: 0 }}>
              {card.value}
            </span>
            <span className="finance-card__unit">{card.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Table wrapper; shows the loading or empty message in place of rows. Adds the design's trailing open column. */
export function FinanceTable({
  headers,
  loading,
  empty,
  children,
}: {
  headers: string[]
  loading: boolean
  empty: boolean
  children: ReactNode
}) {
  return (
    <div className="finance-table-wrap">
      {loading ? (
        <p className="finance-empty">جاري تحميل البيانات...</p>
      ) : empty ? (
        <p className="finance-empty">لا توجد بيانات بعد.</p>
      ) : (
        <table className="finance-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
              <th aria-label="فتح" />
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </div>
  )
}

/** Clickable table row ending with the design's chevron; opens the record's details. */
export function FinanceRow({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  return (
    <tr
      className="finance-row--link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen()
      }}
    >
      {children}
      <td>
        <ChevronLeft size={20} className="finance-chevron" />
      </td>
    </tr>
  )
}

export type DetailField = { label: string; value: ReactNode }

/** Details panel opened from a row; holds the record's fields and its actions. */
export function FinanceDetails({
  title,
  fields,
  actions,
  onClose,
}: {
  title: string
  fields: DetailField[]
  actions?: ReactNode
  onClose: () => void
}) {
  return (
    <Modal open title={title} onCancel={onClose} footer={null} centered width={520}>
      <dl className="finance-details" dir="rtl">
        {fields.map((field) => (
          <div className="finance-details__row" key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      {actions ? <div className="finance-details__actions">{actions}</div> : null}
    </Modal>
  )
}

export function formatAmount(value: number | string | null | undefined) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0'
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB')
}

/** Short reference shown in the "المعرّف" column (first 6 characters of the record id). */
export function shortRef(id: string) {
  return id.replace(/-/g, '').slice(0, 6)
}
