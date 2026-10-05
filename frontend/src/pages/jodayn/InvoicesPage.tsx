import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { commonAssets, dashboardDataAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getInvoices, updateInvoice, type Invoice } from '../../api/jodayn'
import { downloadCsv } from '../../api/me'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import {
  Badge,
  CatalogButton,
  FilterChips,
  ListCard,
  ListCardStack,
  StatCard,
  StatGrid,
  type BadgeVariant,
} from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'

type InvoiceFilter = 'all' | 'PENDING' | 'PAID' | 'OVERDUE'

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'بانتظار السداد',
  PAID: 'مدفوعة',
  OVERDUE: 'متأخرة',
  CANCELLED: 'ملغاة',
}

function statusVariant(status: string): BadgeVariant {
  if (status === 'PAID') return 'success'
  if (status === 'OVERDUE') return 'danger'
  return 'warning'
}

export function JodaynInvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  const pending = invoices.filter((i) => i.status === 'PENDING').length
  const paid = invoices.filter((i) => i.status === 'PAID').length
  const overdue = invoices.filter((i) => i.status === 'OVERDUE').length
  const visible = useMemo(
    () => (filter === 'all' ? invoices : invoices.filter((inv) => inv.status === filter)),
    [invoices, filter],
  )

  return (
    <OrgCatalogShell title={t('invoices')}>
      <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/jodayn/invoices/new')}>
        {t('addInvoice')}
      </CatalogButton>
      <CatalogButton variant="outline" onClick={exportCsv} disabled={visible.length === 0}>
        تصدير CSV
      </CatalogButton>
      <StatGrid>
        <StatCard
          label={t('totalInvoices')}
          value={invoices.length}
          icon={<AssetIcon src={dashboardDataAssets.totalPackages} size={16} />}
        />
        <StatCard label={t('pendingInvoices')} value={pending} tone="warn" />
        <StatCard label={t('paidInvoices')} value={paid} />
        <StatCard label={t('overdueInvoices')} value={overdue} tone="warn" />
      </StatGrid>
      <FilterChips
        value={filter}
        onChange={(key) => setFilter(key as InvoiceFilter)}
        items={[
          { key: 'all', label: t('all'), count: invoices.length },
          { key: 'PENDING', label: t('pendingInvoices'), count: pending },
          { key: 'PAID', label: t('paidInvoices'), count: paid },
          { key: 'OVERDUE', label: t('overdueInvoices'), count: overdue },
        ]}
      />
      <ListCardStack>
        {visible.map((inv) => (
          <ListCard
            key={inv.id}
            title={inv.invoiceNumber}
            badge={<Badge variant={statusVariant(inv.status)}>{STATUS_LABEL[inv.status] ?? inv.status}</Badge>}
            metaItems={[
              inv.clientName,
              inv.projectName ?? '—',
              <>
                <AssetIcon src={commonAssets.clock} size={13} />
                {formatDate(inv.issueDate)} – {formatDate(inv.dueDate)}
              </>,
            ]}
            tags={
              <>
                <span className="list-card__tag">{inv.amount}</span>
                <span className="list-card__tag list-card__tag--muted">{inv.totalWithVat}</span>
                <span className="row-actions">
                  {inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
                    <button
                      type="button"
                      className="is-primary"
                      disabled={busyId === inv.id}
                      onClick={() => void act(inv.id, (token) => updateInvoice(token, inv.id, { status: 'PAID' }), 'تم تسجيل السداد')}
                    >
                      تسجيل كمدفوعة
                    </button>
                  ) : null}
                  {inv.status === 'PENDING' ? (
                    <button
                      type="button"
                      disabled={busyId === inv.id}
                      onClick={() => void act(inv.id, (token) => updateInvoice(token, inv.id, { status: 'OVERDUE' }), 'تم تحديد الفاتورة كمتأخرة')}
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
              </>
            }
          />
        ))}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {visible.length === 0 && !loading ? <EmptyState /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
