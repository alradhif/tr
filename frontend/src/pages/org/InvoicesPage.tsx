import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { CheckCircle2, ChevronDown, ChevronLeft, Clock, Info, Receipt, TriangleAlert } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createOrgPayment,
  getOrgPayments,
  recordOrgPayment,
  uploadOrgPaymentReceipt,
  type OrgPayment,
  type PaymentDirection,
} from '../../api/orgPayments'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { TrackFormModal } from '../../components/ui/TrackFormModal'
import { FinanceCreateButton, formatAmount } from '../../features/jodayn-finance/FinanceParts'
import { MultiSelectFilter, PageState, SingleSelectFilter } from '../../super-admin-ui/components/ui/filters'
import { SaDialog } from '../../super-admin-ui/components/ui/SaDialog'
import '../../features/jodayn-finance/jodayn-invoices.css'
import '../../design/org-invoices.css'

type GroupBy = 'company' | 'project'
type PaymentState = 'paid' | 'overdue' | 'due'

const sum = (list: OrgPayment[]) => list.reduce((total, payment) => total + Number(payment.amount), 0)
const stateOf = (payment: OrgPayment): PaymentState =>
  payment.paidAt ? 'paid' : new Date(payment.dueDate).getTime() < Date.now() ? 'overdue' : 'due'
const iso = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '—')

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
  const [failed, setFailed] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupBy>('company')
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [recording, setRecording] = useState<OrgPayment | null>(null)
  const [year, setYear] = useState('all')
  const [states, setStates] = useState<string[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const pay = direction === 'PAY'
  const words = pay
    ? {
        title: 'تتبع الفواتير',
        lead: 'متابعة المبالغ المستحقة للشركات المنفذة ودفعاتها. تتحول الدفعة إلى «متأخرة» تلقائيًا بعد تاريخ استحقاقها دون سداد.',
        settled: 'المدفوع',
        remaining: 'المتبقي للدفع',
        byCompany: 'حسب الشركة المنفذة',
        company: 'الشركة المنفذة',
        action: 'تسجيل الدفع',
        paidState: 'مدفوعة',
      }
    : {
        title: 'تحصيل الفواتير',
        lead: 'متابعة المبالغ المستحقة لك من الجهات المتعاقدة ودفعاتها. تتحول الدفعة إلى «متأخرة» تلقائيًا بعد تاريخ استحقاقها دون سداد.',
        settled: 'المحصّل',
        remaining: 'المتبقي للتحصيل',
        byCompany: 'حسب الجهة',
        company: 'الجهة الدافعة',
        action: 'تسجيل التحصيل',
        paidState: 'محصّلة',
      }

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
      setFailed(false)
    } catch (err) {
      setFailed(true)
      message.error(err instanceof ApiError ? err.message : 'تعذر تحميل الدفعات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const companyName = (payment: OrgPayment) => payment.company?.name ?? 'بدون شركة'
  const visible = payments.filter(
    (payment) =>
      (year === 'all' || payment.dueDate.startsWith(year)) &&
      (states.length === 0 || states.includes(stateOf(payment))) &&
      (projects.length === 0 || projects.includes(payment.project.name)) &&
      (companies.length === 0 || companies.includes(companyName(payment))),
  )

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; payments: OrgPayment[] }>()
    for (const payment of visible) {
      const name = groupBy === 'project' ? payment.project.name : companyName(payment)
      const group = map.get(name) ?? { name, payments: [] }
      group.payments.push(payment)
      map.set(name, group)
    }
    const owed = (list: OrgPayment[]) => sum(list.filter((payment) => !payment.paidAt))
    return [...map.values()].sort((a, b) => owed(b.payments) - owed(a.payments))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length, payments, groupBy, year, states, projects, companies])

  const open = visible.filter((payment) => !payment.paidAt)
  const late = visible.filter((payment) => stateOf(payment) === 'overdue')
  const unique = (values: string[]) => [...new Set(values)].map((value) => ({ value, label: value }))
  const years = [...new Set(payments.map((payment) => payment.dueDate.slice(0, 4)))].sort()

  const invoicesOf = (list: OrgPayment[]) => {
    const invoices = new Map<string, OrgPayment[]>()
    for (const payment of list) {
      const key = payment.invoiceNumber ?? payment.project.name
      invoices.set(key, [...(invoices.get(key) ?? []), payment])
    }
    return invoices
  }

  const renderInvoices = (invoices: Map<string, OrgPayment[]>) =>
    [...invoices.entries()].map(([number, list], invoiceIndex) => (
      <section key={`${number}-${invoiceIndex}`}>
        <h3>
          الفاتورة {number}
          {list[0].project.contracts?.[0] ? ` · عقد ${list[0].project.contracts[0].name}` : ''} · مشروع {list[0].project.name}
        </h3>
        <ul>
          {list.map((payment) => {
            const state = stateOf(payment)
            return (
              <li key={payment.id}>
                <strong>{payment.title}</strong>
                <span className="org-invoices__amount">{formatAmount(payment.amount)} ر.س</span>
                <span className="org-invoices__date">الاستحقاق {iso(payment.dueDate)}</span>
                <span className={`org-invoices__state is-${state}`}>
                  {state === 'paid' ? <CheckCircle2 size={12} /> : state === 'overdue' ? <TriangleAlert size={12} /> : <Clock size={12} />}
                  {state === 'paid' ? words.paidState : state === 'overdue' ? 'متأخرة' : 'مستحقة'}
                </span>
                {payment.paidAt ? (
                  <span className="org-invoices__date">
                    تاريخ التسجيل {iso(payment.paidAt)} · {payment.recordedByName ?? '—'}
                    {payment.receiptUrl ? (
                      <a href={payment.receiptUrl} download={payment.receiptName ?? 'receipt'} onClick={(event) => event.stopPropagation()}>
                        {' '}· الإيصال
                      </a>
                    ) : null}
                  </span>
                ) : isUpperManagement(role) ? (
                  <button type="button" className="org-invoices__record" onClick={() => setRecording(payment)}>
                    {words.action}
                  </button>
                ) : (
                  <span />
                )}
              </li>
            )
          })}
        </ul>
      </section>
    ))

  return (
    <div className="finance-page jinv org-invoices" dir="rtl">
      <header className="jinv-header">
        <h1 className="jinv-header__title">{words.title}</h1>
      </header>
      <div className="jinv-body">
        <div className="org-invoices__toolbar">
          <div>
            <h2 className="org-invoices__heading">{words.title}</h2>
            <p className="org-invoices__lead">{words.lead}</p>
          </div>
          {canCreateDraft(role) ? <FinanceCreateButton label="إضافة دفعة" onClick={() => setAdding(true)} /> : null}
        </div>

        <div className="org-invoices__filters">
          <div className="org-invoices__tabs" role="tablist" aria-label="طريقة التجميع">
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
          <div className="org-invoices__selects">
            <SingleSelectFilter
              label="الفترة"
              value={year}
              options={[{ value: 'all', label: 'الكل' }, ...years.map((value) => ({ value, label: value }))]}
              onChange={setYear}
            />
            <MultiSelectFilter
              label="حالة الدفعات"
              selected={states}
              options={[
                { value: 'paid', label: words.paidState },
                { value: 'due', label: 'مستحقة' },
                { value: 'overdue', label: 'متأخرة' },
              ]}
              onApply={setStates}
            />
            <MultiSelectFilter
              label="المشروع"
              selected={projects}
              options={unique(payments.map((payment) => payment.project.name))}
              onApply={setProjects}
            />
            <MultiSelectFilter
              label={words.company}
              selected={companies}
              options={unique(payments.map(companyName))}
              onApply={setCompanies}
            />
          </div>
        </div>

        <div className="jinv-cards org-invoices__cards">
          <div className="jinv-card">
            <span className="jinv-card__label">{words.settled}</span>
            <div>
              <span className="jinv-card__value">{formatAmount(sum(visible) - sum(open))}</span>
              <span className="jinv-card__unit">ر.س</span>
            </div>
            <small>من إجمالي {formatAmount(sum(visible))} ر.س</small>
          </div>
          <div className="jinv-card">
            <span className="jinv-card__label">{words.remaining}</span>
            <div>
              <span className="jinv-card__value">{formatAmount(sum(open))}</span>
              <span className="jinv-card__unit">ر.س</span>
            </div>
            <small>{open.length} دفعات لم يتم سدادها</small>
          </div>
          <div className="jinv-card org-invoices__card--late">
            <span className="jinv-card__label">المتأخر</span>
            <div>
              <span className="jinv-card__value">{formatAmount(sum(late))}</span>
              <span className="jinv-card__unit">ر.س</span>
            </div>
            <small>{late.length} دفعات تجاوزت تاريخ الاستحقاق</small>
          </div>
        </div>

        {failed ? (
          <PageState
            tone="error"
            title="تعذّر تحميل الدفعات"
            body="حدث خطأ في الاتصال بالخادم. أعد المحاولة بعد قليل."
            actionLabel="إعادة المحاولة"
            onAction={() => void load()}
          />
        ) : !loading && groups.length === 0 ? (
          <PageState title="لا توجد فواتير" body="لا توجد دفعات تطابق الفلاتر الحالية." />
        ) : (
          <div className="jinv-table-wrap">
            {loading ? <p className="jinv-empty">جاري تحميل البيانات...</p> : null}
            {!loading ? (
              <table className="jinv-table org-invoices__table">
                <thead>
                  <tr>
                    <th className="org-invoices__name">{groupBy === 'project' ? 'المشروع' : words.company}</th>
                    <th>الفواتير</th>
                    <th>الإجمالي</th>
                    <th>{words.settled}</th>
                    <th>المتبقي</th>
                    <th>الدفعات</th>
                    <th className="jinv-col-open" aria-label="فتح" />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => {
                    const isOpen = openGroup === group.name
                    const left = group.payments.filter((payment) => !payment.paidAt)
                    const hasLate = group.payments.some((payment) => stateOf(payment) === 'overdue')
                    const invoices = invoicesOf(group.payments)
                    return (
                      <Fragment key={group.name}>
                        <tr
                          tabIndex={0}
                          aria-expanded={isOpen}
                          onClick={() => setOpenGroup(isOpen ? null : group.name)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') setOpenGroup(isOpen ? null : group.name)
                          }}
                        >
                          <td className="jinv-strong org-invoices__name">{group.name}</td>
                          <td className="jinv-small">{invoices.size}</td>
                          <td className="jinv-small">{formatAmount(sum(group.payments))} ر.س</td>
                          <td className="jinv-small">{formatAmount(sum(group.payments) - sum(left))} ر.س</td>
                          <td className="jinv-strong">{formatAmount(sum(left))} ر.س</td>
                          <td>
                            <span className={`org-invoices__left${left.length === 0 ? ' is-done' : hasLate ? ' is-late' : ''}`}>
                              {remainingLabel(left.length)}
                              {hasLate ? ' · متأخرة' : ''}
                            </span>
                          </td>
                          <td className="jinv-col-open">{isOpen ? <ChevronDown size={20} /> : <ChevronLeft size={20} />}</td>
                        </tr>
                        {isOpen ? (
                          <tr className="org-invoices__details">
                            <td colSpan={7}>
                              {renderInvoices(invoices)}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            ) : null}
          </div>
        )}
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
      {recording ? (
        <RecordPaymentDialog
          payment={recording}
          siblings={payments}
          actionLabel={words.action}
          onClose={() => setRecording(null)}
          onSaved={async () => {
            setRecording(null)
            message.success(pay ? 'تم تسجيل الدفع' : 'تم تسجيل التحصيل')
            await load()
          }}
        />
      ) : null}
    </div>
  )
}

function RecordPaymentDialog({
  payment,
  siblings,
  actionLabel,
  onClose,
  onSaved,
}: {
  payment: OrgPayment
  siblings: OrgPayment[]
  actionLabel: string
  onClose: () => void
  onSaved: () => void
}) {
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const sameInvoice = siblings.filter((item) => !item.paidAt && item.id !== payment.id && item.invoiceNumber === payment.invoiceNumber)
  const remaining = sum(sameInvoice)

  async function submit() {
    const token = getOrgToken()
    if (!token) return
    setBusy(true)
    setError('')
    try {
      await recordOrgPayment(token, payment.id, { paidAt, reference: reference.trim() })
      if (receipt) await uploadOrgPaymentReceipt(token, payment.id, receipt)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر التسجيل، لم يتغير شيء')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SaDialog
      title={`${actionLabel} — ${payment.title}`}
      body={`${payment.company?.name ?? ''} · الفاتورة ${payment.invoiceNumber ?? '—'} · ${payment.project.name}. تُسجل الدفعة بمبلغها كاملًا ولا يتوفر السداد الجزئي.`}
      confirmLabel={`تأكيد ${actionLabel}`}
      confirmDisabled={!paidAt || !reference.trim()}
      busy={busy}
      onClose={onClose}
      onConfirm={() => void submit()}
    >
      <dl className="org-invoices__summary">
        <div>
          <dt>المبلغ</dt>
          <dd>{formatAmount(payment.amount)} ر.س</dd>
        </div>
        <div>
          <dt>تاريخ الاستحقاق</dt>
          <dd>{iso(payment.dueDate)}</dd>
        </div>
        <div>
          <dt>المتبقي بعد التسجيل</dt>
          <dd>
            {formatAmount(remaining)} ر.س · {remainingLabel(sameInvoice.length)}
          </dd>
        </div>
      </dl>
      <label className="sa-dialog__field">
        تاريخ الدفع *
        <input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
      </label>
      <label className="sa-dialog__field">
        رقم المرجع / الحوالة *
        <input value={reference} placeholder="مثال: TRX-2026-0457" onChange={(event) => setReference(event.target.value)} />
      </label>
      <label className="org-invoices__receipt">
        <strong>{receipt ? receipt.name : 'إرفاق إيصال الدفع (اختياري)'}</strong>
        <small>حتى 5 ميجابايت · PNG أو JPG أو PDF</small>
        <input
          type="file"
          hidden
          accept="image/png,image/jpeg,application/pdf"
          onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
        />
      </label>
      {error ? (
        <p className="org-invoices__error">
          <Info size={14} /> {error}
        </p>
      ) : null}
    </SaDialog>
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
