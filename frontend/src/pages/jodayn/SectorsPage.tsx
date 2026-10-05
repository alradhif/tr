import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { dashboardDataAssets, navigationAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getSectors } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { CatalogButton, ListCard, ListCardStack, StatCard, StatGrid } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'

type SectorRow = {
  key: string
  name: string
  managerName: string
  budget: number
  profit: number
  employeeCount: number
  departmentCount: number
  annualRevenue: number
}

export function JodaynSectorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rows, setRows] = useState<SectorRow[]>([])
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
        const { sectors } = await getSectors(token)
        if (cancelled) return
        setRows(
          sectors.map((s) => ({
            key: s.id,
            name: s.name,
            managerName: s.managerName,
            budget: Number(s.budget ?? 0),
            profit: Number(s.profit ?? 0),
            employeeCount: Number(s.employeeCount ?? 0),
            departmentCount: Number(s.departmentCount ?? 0),
            annualRevenue: Number(s.annualRevenue ?? 0),
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
    <OrgCatalogShell title={t('sectors')}>
      <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/jodayn/sectors/new')}>
        {t('addSector')}
      </CatalogButton>
      <StatGrid>
        <StatCard
          label={t('sectors')}
          value={rows.length}
          icon={<AssetIcon src={navigationAssets.departments} size={16} />}
        />
        <StatCard
          label={t('annualRevenue')}
          value={rows.reduce((sum, row) => sum + row.annualRevenue, 0)}
          icon={<AssetIcon src={dashboardDataAssets.totalPackages} size={16} />}
        />
      </StatGrid>
      <ListCardStack>
        {rows.map((row) => (
          <ListCard
            key={row.key}
            title={row.name}
            metaItems={[row.managerName, `${t('budget')}: ${row.budget}`, `${t('employeeCount')}: ${row.employeeCount}`]}
            tags={
              <>
                <span className="list-card__tag">{`${t('departmentCount')}: ${row.departmentCount}`}</span>
                <span className="list-card__tag list-card__tag--muted">{`${t('profit')}: ${row.profit}`}</span>
              </>
            }
          />
        ))}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {rows.length === 0 && !loading ? <EmptyState /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
