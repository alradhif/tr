import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import icon1 from './assets/icon1.svg'
import icon2 from './assets/icon2.svg'
import { PptGeneratorFrame, type PptBridgePayload } from '../portal'
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

export function FinanceHead({
  title,
  subtitle,
  onCreate,
  createLabel,
  actions,
}: {
  title: string
  subtitle?: string
  onCreate?: () => void
  createLabel?: string
  actions?: ReactNode
}) {
  return (
    <div className="finance-head">
      <div>
        <h1 className="finance-head__title">{title}</h1>
        {subtitle ? <p className="finance-head__subtitle">{subtitle}</p> : null}
      </div>
      <div className="finance-head__actions">
        {actions}
        {createLabel && onCreate ? (
          <button type="button" className="finance-btn finance-btn--dark" onClick={onCreate}>
            <Plus size={18} strokeWidth={2.4} />
            <span>{createLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

export type FinanceView = 'list' | 'generator'

/** List / presentation-generator switch shown under the page head. */
export function FinanceTabs({ active, onChange }: { active: FinanceView; onChange: (view: FinanceView) => void }) {
  const tabs: { id: FinanceView; label: string }[] = [
    { id: 'list', label: 'القائمة' },
    { id: 'generator', label: 'مولد العروض' },
  ]
  return (
    <div className="finance-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`finance-btn ${tab.id === active ? 'finance-btn--dark' : 'finance-btn--outline'}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
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

/** Table wrapper; shows the loading or empty message in place of rows. */
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
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </div>
  )
}

export function FinanceGenerator({ title, data }: { title: string; data: PptBridgePayload | null }) {
  return (
    <section className="finance-table-wrap finance-generator">
      <PptGeneratorFrame title={title} data={data} />
    </section>
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
