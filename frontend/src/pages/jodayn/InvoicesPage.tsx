import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { commonAssets, dashboardDataAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getInvoices, type Invoice } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
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

  useEffect(() => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { invoices: data } = await getInvoices(token)
        if (!cancelled) setInvoices(data)
      } catch (err) {
        if (!cancelled) {
          message.error(err instanceof ApiError ? err.message : t('loadError'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

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
            badge={<Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>}
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
