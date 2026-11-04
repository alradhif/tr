import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { ChevronDown, ChevronLeft, Receipt, Trash2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createOrgPayment,
  deleteOrgPayment,
  getOrgPayments,
  setOrgPaymentPaid,
  type OrgPayment,
  type PaymentDirection,
} from '../../api/orgPayments'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { TrackFormModal } from '../../components/ui/TrackFormModal'
import { FinanceCreateButton, formatAmount, formatDate } from '../../features/jodayn-finance/FinanceParts'
import '../../features/jodayn-finance/jodayn-invoices.css'
import '../../design/org-invoices.css'

type GroupBy = 'company' | 'project'

/** The same page reads differently for who pays (government) and who collects (private sector). */
const WORDING: Record<PaymentDirection, Record<string, string>> = {
  PAY: {
    note: 'جهة حكومية: تعرض هذه الصفحة الدفعات المستحقة عليك للشركات المشغلة.',
    settled: 'المدفوع',
    remaining: 'المتبقي للدفع',
    settledState: 'مدفوعة',
    company: 'الشركة المشغلة',
    byCompany: 'حسب الشركة',
    settle: 'تسجيل الدفع',
    undo: 'إلغاء الدفع',
  },
  COLLECT: {
    note: 'قطاع خاص: تعرض هذه الصفحة الدفعات المستحقة لك من الجهات المتعاقدة.',
    settled: 'المحصّل',
    remaining: 'المتبقي للتحصيل',
    settledState: 'محصّلة',
    company: 'الجهة الدافعة',
    byCompany: 'حسب الجهة',
    settle: 'تسجيل التحصيل',
    undo: 'إلغاء التحصيل',
  },
}

const sum = (list: OrgPayment[]) => list.reduce((total, payment) => total + Number(payment.amount), 0)
const isOverdue = (payment: OrgPayment) => !payment.paidAt && new Date(payment.dueDate).getTime() < Date.now()

function remainingLabel(count: number) {
  if (count === 0) return 'مكتملة'
  if (count === 1) return 'باقي دفعة واحدة'
  if (count === 2) return 'باقي دفعتان'
  return count <= 10 ? `باقي ${count} دفعات` : `باقي ${count} دفعة`
}

export function OrgInvoicesPage() {
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [direction, setDirection] = useState<PaymentDirection>('PAY')
  const [payments, setPayments] = useState<OrgPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupBy>('company')
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [working, setWorking] = useState<string | null>(null)
  const words = WORDING[direction]
  const canSettle = isUpperManagement(role)

  const load = useCallback(async () => {
    const token = getOrgToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const data = await getOrgPayments(token)
      setDirection(data.direction)
      setPayments(data.payments)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر تحميل الدفعات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; payments: OrgPayment[] }>()
    for (const payment of payments) {
      const owner = groupBy === 'project' ? payment.project : payment.company
      const key = owner?.id ?? 'none'
      const group = map.get(key) ?? { key, name: owner?.name ?? 'بدون شركة', payments: [] }
      group.payments.push(payment)
      map.set(key, group)
    }
    const remainingOf = (list: OrgPayment[]) => sum(list.filter((payment) => !payment.paidAt))
    return [...map.values()].sort((a, b) => remainingOf(b.payments) - remainingOf(a.payments))
  }, [payments, groupBy])

  const unsettled = payments.filter((payment) => !payment.paidAt)
  const overdue = payments.filter(isOverdue)
  const cards = [
    { label: 'إجمالي الدفعات', value: formatAmount(sum(payments)), unit: 'ريال' },
    { label: words.settled, value: formatAmount(sum(payments) - sum(unsettled)), unit: 'ريال' },
    { label: words.remaining, value: formatAmount(sum(unsettled)), unit: 'ريال' },
    { label: 'دفعات متأخرة', value: formatAmount(sum(overdue)), unit: `ريال · ${overdue.length} ${overdue.length > 2 && overdue.length <= 10 ? 'دفعات' : 'دفعة'}` },
  ]

  const run = async (id: string, action: (token: string) => Promise<unknown>, done: string) => {
    const token = getOrgToken()
    if (!token) return
    setWorking(id)
    try {
      await action(token)
      message.success(done)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى')
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="finance-page jinv org-invoices" dir="rtl">
      <header className="jinv-header">
        <h1 className="jinv-header__title">الفواتير</h1>
      </header>
      <div className="jinv-body">
        <div className="org-invoices__toolbar">
          <p className="org-invoices__note">{words.note}</p>
          {canCreateDraft(role) ? <FinanceCreateButton label="إضافة دفعة" onClick={() => setAdding(true)} /> : null}
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
              ['company', words.byCompany],
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
                  <th>{groupBy === 'project' ? 'المشروع' : words.company}</th>
                  <th>الدفعات</th>
                  <th>نسبة الإنجاز</th>
                  <th>{words.settled}</th>
                  <th>{words.remaining}</th>
                  <th className="jinv-col-open" aria-label="فتح" />
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const open = openGroup === group.key
                  const left = group.payments.filter((payment) => !payment.paidAt)
                  const late = group.payments.some(isOverdue)
                  const total = sum(group.payments)
                  const settled = total - sum(left)
                  return (
                    <Fragment key={group.key}>
                      <tr
                        tabIndex={0}
                        aria-expanded={open}
                        onClick={() => setOpenGroup(open ? null : group.key)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') setOpenGroup(open ? null : group.key)
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
                                      {[
                                        groupBy === 'project' ? payment.company?.name : payment.project.name,
                                        payment.invoiceNumber,
                                      ]
                                        .filter(Boolean)
                                        .join('  ·  ')}
                                    </small>
                                  </div>
                                  <span className="org-invoices__date">استحقاق {formatDate(payment.dueDate)}</span>
                                  <span className="org-invoices__amount">{formatAmount(payment.amount)} ريال</span>
                                  <span
                                    className={`org-invoices__state${
                                      payment.paidAt ? ' is-done' : isOverdue(payment) ? ' is-late' : ''
                                    }`}
                                  >
                                    {payment.paidAt ? words.settledState : isOverdue(payment) ? 'متأخرة' : 'مستحقة'}
                                  </span>
                                  {canSettle ? (
                                    <div className="org-invoices__actions">
                                      <button
                                        type="button"
                                        disabled={working === payment.id}
                                        onClick={() =>
                                          void run(
                                            payment.id,
                                            (token) => setOrgPaymentPaid(token, payment.id, !payment.paidAt),
                                            'تم الحفظ بنجاح',
                                          )
                                        }
                                      >
                                        {payment.paidAt ? words.undo : words.settle}
                                      </button>
                                      <button
                                        type="button"
                                        className="org-invoices__delete"
                                        aria-label={`حذف ${payment.title}`}
                                        disabled={working === payment.id}
                                        onClick={() => {
                                          if (!window.confirm(`حذف ${payment.title} من ${payment.project.name}؟`)) return
                                          void run(
                                            payment.id,
                                            (token) => deleteOrgPayment(token, payment.id),
                                            'تم الحذف بنجاح',
                                          )
                                        }}
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
      </div>
      {adding ? (
        <AddPaymentModal
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false)
            message.success('تم الحفظ بنجاح')
            await load()
          }}
        />
      ) : null}
    </div>
  )
}

function AddPaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = getOrgToken()
    if (!token) return
    getProjects(token)
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
  }, [])

  async function onSubmit() {
    const token = getOrgToken()
    if (!token) return
    if (!projectId || !title.trim() || !(Number(amount) > 0) || !dueDate) {
      setError('الرجاء إدخال المشروع واسم الدفعة والمبلغ وتاريخ الاستحقاق')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createOrgPayment(token, {
        projectId,
        title: title.trim(),
        amount: Number(amount),
        dueDate,
        invoiceNumber: invoiceNumber.trim() || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إضافة الدفعة')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TrackFormModal
      title="إضافة دفعة"
      icon={<Receipt size={22} />}
      submitLabel="إضافة"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="project-output-modal__grid">
        <label>
          <span>المشروع</span>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">اختر المشروع</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>اسم الدفعة</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: الدفعة الأولى" />
        </label>
        <label>
          <span>المبلغ (ريال)</span>
          <input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label>
          <span>تاريخ الاستحقاق</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label>
          <span>رقم الفاتورة (اختياري)</span>
          <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
        </label>
      </div>
    </TrackFormModal>
  )
}
