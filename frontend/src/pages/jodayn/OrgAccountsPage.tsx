import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { commonAssets, navigationAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getAccounts } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { Badge, ListCard, ListCardStack, StatCard, StatGrid } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'

type OrgAccountRow = {
  key: string
  name: string
  sector: string
  branch: string
  contractDuration: string
  contractStatus: string
}

export function JodaynOrgAccountsPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<OrgAccountRow[]>([])
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
          (data.orgs ?? []).map((o) => ({
            key: o.id,
            name: o.name,
            sector: o.sector?.name ?? '—',
            branch: o.branch ?? '—',
            contractDuration: o.contractDuration != null ? String(o.contractDuration) : '—',
            contractStatus: o.contractStatus ?? '—',
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
    <OrgCatalogShell title={t('orgAccounts')}>
      <StatGrid>
        <StatCard
          label={t('orgAccounts')}
          value={rows.length}
          icon={<AssetIcon src={navigationAssets.companies} size={16} />}
        />
      </StatGrid>
      <ListCardStack>
        {rows.map((row) => (
          <ListCard
            key={row.key}
            title={row.name}
            badge={<Badge variant="neutral">{row.contractStatus}</Badge>}
            metaItems={[
              row.sector,
              row.branch,
              <>
                <AssetIcon src={commonAssets.clock} size={13} />
                {row.contractDuration}
              </>,
            ]}
          />
        ))}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {rows.length === 0 && !loading ? <EmptyState /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
