import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getInvoices, type Invoice } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceCreateButton,
  FinanceGenerator,
  FinanceTabs,
  formatAmount,
  formatDate,
  type FinanceView,
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

export function JodaynInvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<FinanceView>('list')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

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
        <FinanceTabs
          active={view}
          onChange={setView}
          extra={<FinanceCreateButton label={t('addInvoice')} onClick={() => navigate('/jodayn/invoices/new')} />}
        />

        {view === 'generator' ? (
          <FinanceGenerator
            title="مولّد العروض التقديمية - الفواتير"
            data={
              invoices[0]
                ? {
                    project: {
                      name: 'الفواتير',
                      code: invoices[0].invoiceNumber,
                      department: 'الفواتير — جودين',
                      projectManager: '—',
                      sponsor: '—',
                      statusLabel: `${invoices.length} فاتورة`,
                      budget: total(invoices),
                      spent: total(paid),
                      budgetCurrency: 'SAR',
                    },
                    outputs: invoices
                      .slice(0, 4)
                      .map((inv) => `${inv.invoiceNumber} — ${inv.clientName} — ${STATUS_LABEL[inv.status] ?? inv.status}`),
                    sourceLabel: `بيانات حية — ${invoices.length} فاتورة`,
                  }
                : null
            }
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
