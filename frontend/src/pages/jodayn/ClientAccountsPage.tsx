import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { tenantsAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getAccounts } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { Badge, ListCard, ListCardStack, StatCard, StatGrid } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { contractStatusBadge } from './labels'

type ClientAccountRow = {
  key: string
  name: string
  managerName: string
  sector: string
  branch: string
  contractStatus: string
}

export function JodaynClientAccountsPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<ClientAccountRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAccounts(token)
        if (cancelled) return
        setRows(
          (data.clients ?? []).map((c) => ({
            key: c.id,
            name: c.name,
            managerName: c.managerName ?? '—',
            sector: c.sector?.name ?? '—',
            branch: c.branch ?? '—',
            contractStatus: c.contractStatus ?? '—',
          })),
        )
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

  return (
    <OrgCatalogShell title={t('clientAccounts')}>
      <StatGrid>
        <StatCard
          label={t('clientAccounts')}
          value={rows.length}
          icon={<AssetIcon src={tenantsAssets.tenantsMenu} size={16} />}
        />
      </StatGrid>
      <ListCardStack>
        {rows.map((row) => (
          <ListCard
            key={row.key}
            title={row.name}
            badge={<Badge variant={contractStatusBadge(row.contractStatus).variant}>{contractStatusBadge(row.contractStatus).label}</Badge>}
            metaItems={[row.managerName, row.sector, row.branch]}
          />
        ))}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {rows.length === 0 && !loading ? <EmptyState /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
