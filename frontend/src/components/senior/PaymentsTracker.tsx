import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, Trash2 } from 'lucide-react'
import { formatAmount, formatDate } from '../../features/jodayn-finance/FinanceParts'
import '../../features/jodayn-finance/jodayn-invoices.css'
import '../../design/org-invoices.css'

export type PaymentDirection = 'PAY' | 'COLLECT'

/** One installment, in the terms both the organization and Jodayn pages share. */
export type TrackedPayment = {
  id: string
  title: string
  reference?: string | null
  amount: number
  dueDate: string
  settled: boolean
  counterparty: string
  project: string
}

type GroupBy = 'counterparty' | 'project'

/** The same page reads differently for who pays (government) and who collects (private sector). */
const WORDING: Record<PaymentDirection, Record<string, string>> = {
  PAY: {
    settled: 'المدفوع',
    remaining: 'المتبقي للدفع',
    settledState: 'مدفوعة',
    settle: 'تسجيل الدفع',
    undo: 'إلغاء الدفع',
  },
  COLLECT: {
    settled: 'المحصّل',
    remaining: 'المتبقي للتحصيل',
    settledState: 'محصّلة',
    settle: 'تسجيل التحصيل',
    undo: 'إلغاء التحصيل',
  },
}

const sum = (list: TrackedPayment[]) => list.reduce((total, payment) => total + payment.amount, 0)
const isOverdue = (payment: TrackedPayment) => !payment.settled && new Date(payment.dueDate).getTime() < Date.now()

function remainingLabel(count: number) {
  if (count === 0) return 'مكتملة'
  if (count === 1) return 'باقي دفعة واحدة'
  if (count === 2) return 'باقي دفعتان'
  return count <= 10 ? `باقي ${count} دفعات` : `باقي ${count} دفعة`
}

export function PaymentsTracker({
  direction,
  note,
  counterpartyLabel,
  groupLabel,
  payments,
  loading,
  action,
  working,
  canSettle,
  onToggleSettled,
  onDelete,
}: {
  direction: PaymentDirection
  note: string
  /** Column heading for who is paid or who pays. */
  counterpartyLabel: string
  groupLabel: string
  payments: TrackedPayment[]
  loading: boolean
  action?: ReactNode
  working: string | null
  canSettle: boolean
  onToggleSettled: (payment: TrackedPayment) => void
  onDelete: (payment: TrackedPayment) => void
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>('counterparty')
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const words = WORDING[direction]

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; payments: TrackedPayment[] }>()
    for (const payment of payments) {
      const name = payment[groupBy]
      const group = map.get(name) ?? { name, payments: [] }
      group.payments.push(payment)
      map.set(name, group)
    }
    const remainingOf = (list: TrackedPayment[]) => sum(list.filter((payment) => !payment.settled))
    return [...map.values()].sort((a, b) => remainingOf(b.payments) - remainingOf(a.payments))
  }, [payments, groupBy])

  const unsettled = payments.filter((payment) => !payment.settled)
  const overdue = payments.filter(isOverdue)
  const cards = [
    { label: 'إجمالي الدفعات', value: formatAmount(sum(payments)), unit: 'ريال' },
    { label: words.settled, value: formatAmount(sum(payments) - sum(unsettled)), unit: 'ريال' },
    { label: words.remaining, value: formatAmount(sum(unsettled)), unit: 'ريال' },
    {
      label: 'دفعات متأخرة',
      value: formatAmount(sum(overdue)),
      unit: `ريال · ${overdue.length} ${overdue.length > 2 && overdue.length <= 10 ? 'دفعات' : 'دفعة'}`,
    },
  ]

  return (
    <>
      <div className="org-invoices__toolbar">
        <p className={`org-invoices__note org-invoices__note--${direction === 'PAY' ? 'pay' : 'collect'}`}>{note}</p>
        {action}
      </div>

      <div className="jinv-cards">
        {cards.map((card) => (
          <div className="jinv-card" key={card.label}>
            <span className="jinv-card__label">{card.label}</span>
            <div>
              <span className="jinv-card__value">{card.value}</span>
              <span className="jinv-card__unit">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="org-invoices__tabs" role="tablist" aria-label="طريقة عرض الدفعات">
        {(
          [
            ['counterparty', groupLabel],
            ['project', 'حسب المشروع'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={groupBy === key}
            className={groupBy === key ? 'is-active' : ''}
            onClick={() => {
              setGroupBy(key)
              setOpenGroup(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="jinv-table-wrap">
        {loading ? (
          <p className="jinv-empty">جاري تحميل البيانات...</p>
        ) : groups.length === 0 ? (
          <p className="jinv-empty">لا توجد دفعات بعد.</p>
        ) : (
          <table className="jinv-table org-invoices__table">
            <thead>
              <tr>
                <th>{groupBy === 'project' ? 'المشروع' : counterpartyLabel}</th>
                <th>الدفعات</th>
                <th>نسبة الإنجاز</th>
                <th>{words.settled}</th>
                <th>{words.remaining}</th>
                <th className="jinv-col-open" aria-label="فتح" />
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const open = openGroup === group.name
                const left = group.payments.filter((payment) => !payment.settled)
                const late = group.payments.some(isOverdue)
                const total = sum(group.payments)
                const settled = total - sum(left)
                return (
                  <Fragment key={group.name}>
                    <tr
                      tabIndex={0}
                      aria-expanded={open}
                      onClick={() => setOpenGroup(open ? null : group.name)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') setOpenGroup(open ? null : group.name)
                      }}
                    >
                      <td className="jinv-strong org-invoices__name">{group.name}</td>
                      <td>
                        <span className={`org-invoices__left${left.length === 0 ? ' is-done' : late ? ' is-late' : ''}`}>
                          {remainingLabel(left.length)}
                        </span>
                        <small className="org-invoices__of">
                          {group.payments.length - left.length} من {group.payments.length}
                        </small>
                      </td>
                      <td>
                        <span className="org-invoices__bar">
                          <i style={{ width: `${total ? Math.round((settled / total) * 100) : 0}%` }} />
                        </span>
                      </td>
                      <td className="jinv-small">{formatAmount(settled)}</td>
                      <td className="jinv-strong">{formatAmount(sum(left))}</td>
                      <td className="jinv-col-open">{open ? <ChevronDown size={20} /> : <ChevronLeft size={20} />}</td>
                    </tr>
                    {open ? (
                      <tr className="org-invoices__details">
                        <td colSpan={6}>
                          <ul>
                            {group.payments.map((payment) => (
                              <li key={payment.id}>
                                <div className="org-invoices__payment">
                                  <strong>{payment.title}</strong>
                                  <small>
                                    {[groupBy === 'project' ? payment.counterparty : payment.project, payment.reference]
                                      .filter(Boolean)
                                      .join('  ·  ')}
                                  </small>
                                </div>
                                <span className="org-invoices__date">استحقاق {formatDate(payment.dueDate)}</span>
                                <span className="org-invoices__amount">{formatAmount(payment.amount)} ريال</span>
                                <span
                                  className={`org-invoices__state${
                                    payment.settled ? ' is-done' : isOverdue(payment) ? ' is-late' : ''
                                  }`}
                                >
                                  {payment.settled ? words.settledState : isOverdue(payment) ? 'متأخرة' : 'مستحقة'}
                                </span>
                                {canSettle ? (
                                  <div className="org-invoices__actions">
                                    <button
                                      type="button"
                                      disabled={working === payment.id}
                                      onClick={() => onToggleSettled(payment)}
                                    >
                                      {payment.settled ? words.undo : words.settle}
                                    </button>
                                    <button
                                      type="button"
                                      className="org-invoices__delete"
                                      aria-label={`حذف ${payment.title}`}
                                      disabled={working === payment.id}
                                      onClick={() => onDelete(payment)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
