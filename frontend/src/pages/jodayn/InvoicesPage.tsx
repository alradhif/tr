import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getInvoices, updateInvoice, type Invoice } from '../../api/jodayn'
import { downloadCsv } from '../../api/me'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceAmountStats,
  FinanceGenerator,
  FinanceHead,
  FinancePage,
  FinanceTable,
  FinanceTabs,
  formatAmount,
  formatDate,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'

type InvoiceFilter = 'all' | 'PENDING' | 'PAID' | 'OVERDUE'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'بانتظار السداد',
  PAID: 'مدفوعة',
  OVERDUE: 'متأخرة',
  CANCELLED: 'ملغاة',
}

function statusTone(status: string) {
  if (status === 'PAID') return 'active'
  if (status === 'OVERDUE') return 'danger'
  if (status === 'CANCELLED') return 'inactive'
  return 'warning'
}

export function JodaynInvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<FinanceView>('list')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<InvoiceFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const isUpper = getJodaynRole() === 'upper'

  const load = useCallback(async () => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { invoices: data } = await getInvoices(token)
      setInvoices(data)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (id: string, action: (token: string) => Promise<unknown>, done: string) => {
    const token = getJodaynToken()
    if (!token) return
    setBusyId(id)
    try {
      await action(token)
      message.success(done)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setBusyId(null)
    }
  }

  const byStatus = (status: string) => invoices.filter((i) => i.status === status)
  const total = (list: Invoice[]) => list.reduce((sum, inv) => sum + Number(inv.totalWithVat ?? 0), 0)
  const pending = byStatus('PENDING')
  const paid = byStatus('PAID')
  const overdue = byStatus('OVERDUE')
  const visible = useMemo(
    () => (filter === 'all' ? invoices : invoices.filter((inv) => inv.status === filter)),
    [invoices, filter],
  )

  const exportCsv = () =>
    downloadCsv(
      'invoices.csv',
      [
        ['invoiceNumber', 'رقم الفاتورة'],
        ['clientName', 'العميل'],
        ['projectName', 'المشروع'],
        ['amount', 'المبلغ'],
        ['totalWithVat', 'الإجمالي مع الضريبة'],
        ['status', 'الحالة'],
        ['issueDate', 'تاريخ الإصدار'],
        ['dueDate', 'تاريخ الاستحقاق'],
      ],
      visible.map((inv) => ({ ...inv, status: STATUS_LABEL[inv.status] ?? inv.status })),
    )

  const filters: { key: InvoiceFilter; label: string; count: number }[] = [
    { key: 'all', label: t('all'), count: invoices.length },
    { key: 'PENDING', label: t('pendingInvoices'), count: pending.length },
    { key: 'PAID', label: t('paidInvoices'), count: paid.length },
    { key: 'OVERDUE', label: t('overdueInvoices'), count: overdue.length },
  ]

  return (
    <FinancePage title={t('invoices')}>
      <FinanceHead
        title={t('invoices')}
        subtitle="متابعة الفواتير الصادرة وحالة سدادها"
        createLabel={t('addInvoice')}
        onCreate={() => navigate('/jodayn/invoices/new')}
        actions={
          <button
            type="button"
            className="finance-btn finance-btn--outline"
            onClick={exportCsv}
            disabled={visible.length === 0}
          >
            تصدير CSV
          </button>
        }
      />
      <FinanceTabs active={view} onChange={setView} />

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
          <div className="finance-filters">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                className={filter === item.key ? 'is-active' : ''}
                onClick={() => setFilter(item.key)}
              >
                {`${item.label} (${item.count})`}
              </button>
            ))}
          </div>
          <FinanceTable
            headers={['الفاتورة', 'العميل', 'المشروع', 'الحالة', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'القيمة', '']}
            loading={loading}
            empty={visible.length === 0}
          >
            {visible.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <span className="finance-chip">{inv.invoiceNumber}</span>
                </td>
                <td>{inv.clientName}</td>
                <td className="finance-muted">{inv.projectName || '—'}</td>
                <td>
                  <span className={`finance-status finance-status--${statusTone(inv.status)}`}>
                    {STATUS_LABEL[inv.status] ?? inv.status}
                  </span>
                </td>
                <td className="finance-muted">{formatDate(inv.issueDate)}</td>
                <td className="finance-muted">{formatDate(inv.dueDate)}</td>
                <td>
                  {formatAmount(inv.totalWithVat)}
                  <span className="finance-value__suffix">ريال</span>
                </td>
                <td>
                  <span className="finance-actions">
                    {inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
                      <button
                        type="button"
                        className="is-primary"
                        disabled={busyId === inv.id}
                        onClick={() =>
                          void act(inv.id, (token) => updateInvoice(token, inv.id, { status: 'PAID' }), 'تم تسجيل السداد')
                        }
                      >
                        تسجيل كمدفوعة
                      </button>
                    ) : null}
                    {inv.status === 'PENDING' ? (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() =>
                          void act(
                            inv.id,
                            (token) => updateInvoice(token, inv.id, { status: 'OVERDUE' }),
                            'تم تحديد الفاتورة كمتأخرة',
                          )
                        }
                      >
                        متأخرة
                      </button>
                    ) : null}
                    {isUpper ? (
                      <button
                        type="button"
                        className="is-danger"
                        disabled={busyId === inv.id}
                        onClick={() => {
                          if (!window.confirm(`حذف الفاتورة ${inv.invoiceNumber}؟`)) return
                          void act(inv.id, (token) => deleteJodaynRecord(token, 'invoices', inv.id), t('deletedSuccessfully'))
                        }}
                      >
                        {t('delete')}
                      </button>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
          </FinanceTable>
        </>
      )}
    </FinancePage>
  )
}
