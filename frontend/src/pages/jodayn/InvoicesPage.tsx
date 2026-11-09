import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getInvoices, updateInvoice, type Invoice } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import { PaymentsTracker, type TrackedPayment } from '../../components/senior/PaymentsTracker'
import { RecordCard, RecordCardGrid, ToneBadge, useViewMode, ViewToggle } from '../../components/ui/RecordCards'
import {
  FinanceCreateButton,
  formatAmount,
  formatDate,
} from '../../features/jodayn-finance/FinanceParts'
import questionCircleIcon from '../../features/jodayn-finance/assets/question-circle.svg'
import arrowRightIcon from '../../features/jodayn-finance/assets/arrow-right.svg'
import '../../features/jodayn-finance/jodayn-invoices.css'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'معلق',
  PAID: 'نشط',
  OVERDUE: 'متأخر',
  CANCELLED: 'ملغى',
}

/** Status badge text: subscriptions read "اشتراك نشط" etc., as in the Figma invoices frame. */
function statusText(inv: Invoice) {
  const status = STATUS_LABEL[inv.status] ?? inv.status
  return inv.billingCycle ? `اشتراك ${status}` : status
}

/** Jodayn is private-sector, so each open invoice is an installment it still has to collect. */
function toTracked(invoice: Invoice): TrackedPayment {
  return {
    id: invoice.id,
    title: invoice.invoiceNumber,
    reference: invoice.contractReference,
    amount: Number(invoice.amount ?? 0),
    dueDate: invoice.dueDate,
    settled: invoice.status === 'PAID',
    counterparty: invoice.clientName,
    project: invoice.projectName || 'بدون مشروع',
  }
}

export function JodaynInvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'collection' | 'list'>('collection')
  const [working, setWorking] = useState<string | null>(null)
  const [listView, setListView] = useViewMode('jodayn-invoices-list')

  const load = useCallback(async () => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { invoices: data } = await getInvoices(token)
      // Oldest first, as in the design (the API returns newest first).
      setInvoices([...data].reverse())
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (id: string, action: (token: string) => Promise<unknown>, done: string) => {
    const token = getJodaynToken()
    if (!token) return
    setWorking(id)
    try {
      await action(token)
      message.success(done)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setWorking(null)
    }
  }

  const byStatus = (status: string) => invoices.filter((i) => i.status === status)
  const total = (list: Invoice[]) => list.reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
  const pending = byStatus('PENDING')
  const paid = byStatus('PAID')
  const overdue = byStatus('OVERDUE')

  const cards = [
    { label: 'إجمالي الفواتير', value: String(invoices.length), unit: 'وحده' },
    { label: 'فواتير معلقة', value: formatAmount(total(pending)), unit: 'ريال' },
    { label: 'فواتير مدفوعة', value: formatAmount(total(paid)), unit: 'ريال' },
    { label: 'فواتير متأخرة', value: formatAmount(total(overdue)), unit: 'ريال' },
  ]

  return (
    <div className="finance-page jinv" dir="rtl">
      <header className="jinv-header">
        <h1 className="jinv-header__title">{t('invoices')}</h1>
      </header>
      <div className="jinv-body">
        <div className="org-invoices__tabs" role="tablist" aria-label="طريقة عرض الفواتير">
          {(
            [
              ['collection', 'تتبع التحصيل'],
              ['list', 'كل الفواتير'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              className={view === key ? 'is-active' : ''}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'collection' ? (
          <PaymentsTracker
            direction="COLLECT"
            note="قطاع خاص: جودين تحصّل، وتعرض هذه الصفحة الدفعات المستحقة لها من العملاء."
            counterpartyLabel="العميل"
            groupLabel="حسب العميل"
            payments={invoices.filter((invoice) => invoice.status !== 'CANCELLED').map(toTracked)}
            loading={loading}
            working={working}
            canSettle={getJodaynRole() === 'upper'}
            action={<FinanceCreateButton label={t('addInvoice')} onClick={() => navigate('/jodayn/invoices/new')} />}
            onToggleSettled={(payment) =>
              void run(
                payment.id,
                (token) =>
                  updateInvoice(
                    token,
                    payment.id,
                    payment.settled
                      ? { status: 'PENDING', remainingAmount: payment.amount }
                      : { status: 'PAID', remainingAmount: 0 },
                  ),
                'تم الحفظ بنجاح',
              )
            }
            onDelete={(payment) => {
              if (!window.confirm(`حذف ${payment.title}؟`)) return
              void run(payment.id, (token) => deleteJodaynRecord(token, 'invoices', payment.id), t('deletedSuccessfully'))
            }}
          />
        ) : (
          <>
        <div className="finance-tabs">
          <FinanceCreateButton label={t('addInvoice')} onClick={() => navigate('/jodayn/invoices/new')} />
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

        <div className="rc-view-bar">
          <ViewToggle value={listView} onChange={setListView} />
        </div>

        {listView === 'cards' && !loading && invoices.length > 0 ? (
          <RecordCardGrid>
            {invoices.map((inv) => (
              <RecordCard
                key={inv.id}
                title={inv.contractReference || inv.invoiceNumber}
                subtitle={inv.projectName || '—'}
                badges={
                  <ToneBadge
                    meta={{
                      label: statusText(inv),
                      tone: inv.status === 'PAID' ? 'approved' : inv.status === 'OVERDUE' ? 'changes' : inv.status === 'PENDING' ? 'pending' : 'none',
                    }}
                  />
                }
                rows={[
                  { label: 'الجهة المرتبطة', value: inv.clientName },
                  { label: 'المبلغ الأساسي', value: formatAmount(inv.amount) },
                  { label: 'تاريخ الإصدار', value: formatDate(inv.issueDate) },
                ]}
                linkLabel="عرض الفاتورة"
                onOpen={() => navigate(`/jodayn/invoices/${inv.id}`)}
              />
            ))}
          </RecordCardGrid>
        ) : (
        <div className="jinv-table-wrap">
          {loading ? (
            <p className="jinv-empty">جاري تحميل البيانات...</p>
          ) : invoices.length === 0 ? (
            <p className="jinv-empty">لا توجد بيانات بعد.</p>
          ) : (
            <table className="jinv-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>الجهة المرتبطة (المورد)</th>
                  <th>المبلغ الأساسي</th>
                  <th>اسم المشروع</th>
                  <th>تاريخ الإصدار</th>
                  <th>الحالة</th>
                  <th className="jinv-col-open" aria-label="فتح" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    tabIndex={0}
                    onClick={() => navigate(`/jodayn/invoices/${inv.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/jodayn/invoices/${inv.id}`)
                    }}
                  >
                    <td>
                      <span className="jinv-badge jinv-badge--ref">{inv.contractReference || inv.invoiceNumber}</span>
                    </td>
                    <td className="jinv-strong">{inv.clientName}</td>
                    <td className="jinv-small">{formatAmount(inv.amount)}</td>
                    <td className="jinv-strong">{inv.projectName || '—'}</td>
                    <td className="jinv-small jinv-small--muted">{formatDate(inv.issueDate)}</td>
                    <td>
                      <span className="jinv-badge jinv-badge--status">
                        {statusText(inv)}
                        <img src={questionCircleIcon} alt="" width={16} height={16} />
                      </span>
                    </td>
                    <td className="jinv-col-open">
                      <img src={arrowRightIcon} alt="" width={24} height={24} className="jinv-arrow" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
