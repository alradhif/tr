import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { Receipt } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createOrgPayment,
  deleteOrgPayment,
  getOrgPayments,
  setOrgPaymentPaid,
  type OrgPayment,
} from '../../api/orgPayments'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { PaymentsTracker, type PaymentDirection, type TrackedPayment } from '../../components/senior/PaymentsTracker'
import { TrackFormModal } from '../../components/ui/TrackFormModal'
import { FinanceCreateButton } from '../../features/jodayn-finance/FinanceParts'

function toTracked(payment: OrgPayment): TrackedPayment {
  return {
    id: payment.id,
    title: payment.title,
    reference: payment.invoiceNumber,
    amount: Number(payment.amount),
    dueDate: payment.dueDate,
    settled: Boolean(payment.paidAt),
    counterparty: payment.company?.name ?? 'بدون شركة',
    project: payment.project.name,
  }
}

export function OrgInvoicesPage() {
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [direction, setDirection] = useState<PaymentDirection>('PAY')
  const [payments, setPayments] = useState<OrgPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [working, setWorking] = useState<string | null>(null)
  const isPayer = direction === 'PAY'

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
        <PaymentsTracker
          direction={direction}
          note={
            isPayer
              ? 'جهة حكومية: تعرض هذه الصفحة الدفعات المستحقة عليك للشركات المشغلة.'
              : 'قطاع خاص: تعرض هذه الصفحة الدفعات المستحقة لك من الجهات المتعاقدة.'
          }
          counterpartyLabel={isPayer ? 'الشركة المشغلة' : 'الجهة الدافعة'}
          groupLabel={isPayer ? 'حسب الشركة' : 'حسب الجهة'}
          payments={payments.map(toTracked)}
          loading={loading}
          working={working}
          canSettle={isUpperManagement(role)}
          action={canCreateDraft(role) ? <FinanceCreateButton label="إضافة دفعة" onClick={() => setAdding(true)} /> : null}
          onToggleSettled={(payment) =>
            void run(payment.id, (token) => setOrgPaymentPaid(token, payment.id, !payment.settled), 'تم الحفظ بنجاح')
          }
          onDelete={(payment) => {
            if (!window.confirm(`حذف ${payment.title} من ${payment.project}؟`)) return
            void run(payment.id, (token) => deleteOrgPayment(token, payment.id), 'تم الحذف بنجاح')
          }}
        />
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
