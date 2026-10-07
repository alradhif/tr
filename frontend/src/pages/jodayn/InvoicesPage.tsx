import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getInvoices, updateInvoice, type Invoice } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceAmountStats,
  FinanceCreateButton,
  FinanceDetails,
  FinanceGenerator,
  FinancePage,
  FinanceRow,
  FinanceTable,
  FinanceTabs,
  formatAmount,
  formatDate,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'معلق',
  PAID: 'نشط',
  OVERDUE: 'متأخر',
  CANCELLED: 'ملغى',
}

/** Type column: monthly / annual subscriptions, otherwise a fixed asset. */
function invoiceType(inv: Invoice) {
  if (inv.billingCycle === 'MONTHLY') return { label: 'إشتراك شهري', tone: 'subscription', suffix: 'شهري' }
  if (inv.billingCycle === 'ANNUAL') return { label: 'إشتراك سنوي', tone: 'subscription', suffix: 'سنوي' }
  return { label: 'أصل ثابت', tone: 'fixed', suffix: '' }
}

export function JodaynInvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<FinanceView>('list')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState<Invoice | null>(null)
  const [busy, setBusy] = useState(false)
  const isUpper = getJodaynRole() === 'upper'

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

  const act = async (action: (token: string) => Promise<unknown>, done: string) => {
    const token = getJodaynToken()
    if (!token) return
    setBusy(true)
    try {
      await action(token)
      message.success(done)
      setOpened(null)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setBusy(false)
    }
  }

  const byStatus = (status: string) => invoices.filter((i) => i.status === status)
  const total = (list: Invoice[]) => list.reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
  const pending = byStatus('PENDING')
  const paid = byStatus('PAID')
  const overdue = byStatus('OVERDUE')

  return (
    <FinancePage title={t('invoices')}>
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
          <FinanceAmountStats
            cards={[
              { label: 'إجمالي الفواتير', value: String(invoices.length), unit: 'فاتورة' },
              { label: 'فواتير معلقة', value: formatAmount(total(pending)), unit: 'ريال' },
              { label: 'فواتير مدفوعة', value: formatAmount(total(paid)), unit: 'ريال' },
              { label: 'فواتير متأخرة', value: formatAmount(total(overdue)), unit: 'ريال' },
            ]}
          />
          <FinanceTable
            headers={['الأصل', 'الرقم التسلسلي', 'الفاتورة', 'الحالة', 'النوع', 'الجهة المرتبطة', 'المنطقة', 'القيمة']}
            loading={loading}
            empty={invoices.length === 0}
          >
            {invoices.map((inv) => {
              const type = invoiceType(inv)
              return (
                <FinanceRow key={inv.id} onOpen={() => setOpened(inv)}>
                  <td>{inv.projectName || '—'}</td>
                  <td>
                    <span className="finance-chip">{inv.contractReference || '—'}</span>
                  </td>
                  <td className="finance-muted">{inv.invoiceNumber}</td>
                  <td>
                    <span className="finance-badge finance-badge--info">
                      <span className="finance-badge__dot">i</span>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td>
                    <span className={`finance-type finance-type--${type.tone}`}>
                      {type.label}
                      <span className="finance-type__dot" />
                    </span>
                  </td>
                  <td>{inv.clientName}</td>
                  <td className="finance-muted">{inv.region || '—'}</td>
                  <td>
                    {formatAmount(inv.amount)}
                    {type.suffix ? <span className="finance-value__suffix">{type.suffix}</span> : null}
                  </td>
                </FinanceRow>
              )
            })}
          </FinanceTable>
          {opened ? (
            <FinanceDetails
              title={`الفاتورة ${opened.invoiceNumber}`}
              onClose={() => setOpened(null)}
              fields={[
                { label: 'الأصل', value: opened.projectName || '—' },
                { label: 'الرقم التسلسلي', value: opened.contractReference || '—' },
                { label: 'الجهة المرتبطة', value: opened.clientName },
                { label: 'المنطقة', value: opened.region || '—' },
                { label: 'النوع', value: invoiceType(opened).label },
                { label: 'الحالة', value: STATUS_LABEL[opened.status] ?? opened.status },
                { label: 'القيمة', value: `${formatAmount(opened.amount)} ريال` },
                { label: 'الإجمالي مع الضريبة', value: `${formatAmount(opened.totalWithVat)} ريال` },
                { label: 'تاريخ الإصدار', value: formatDate(opened.issueDate) },
                { label: 'تاريخ الاستحقاق', value: formatDate(opened.dueDate) },
              ]}
              actions={
                <>
                  {opened.status !== 'PAID' && opened.status !== 'CANCELLED' ? (
                    <button
                      type="button"
                      className="finance-btn finance-btn--dark"
                      disabled={busy}
                      onClick={() =>
                        void act((token) => updateInvoice(token, opened.id, { status: 'PAID' }), 'تم تسجيل السداد')
                      }
                    >
                      تسجيل كمدفوعة
                    </button>
                  ) : null}
                  {opened.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="finance-btn finance-btn--outline"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          (token) => updateInvoice(token, opened.id, { status: 'OVERDUE' }),
                          'تم تحديد الفاتورة كمتأخرة',
                        )
                      }
                    >
                      تحديد كمتأخرة
                    </button>
                  ) : null}
                  {isUpper ? (
                    <button
                      type="button"
                      className="finance-btn finance-btn--danger"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`حذف الفاتورة ${opened.invoiceNumber}؟`)) return
                        void act((token) => deleteJodaynRecord(token, 'invoices', opened.id), t('deletedSuccessfully'))
                      }}
                    >
                      {t('delete')}
                    </button>
                  ) : null}
                </>
              }
            />
          ) : null}
        </>
      )}
    </FinancePage>
  )
}
