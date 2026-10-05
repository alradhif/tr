import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { dashboardDataAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getForecasts } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import { deleteJodaynRecord } from '../../api/jodayn'
import { CatalogButton, ListCard, ListCardStack, StatCard, StatGrid } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'

type ForecastRow = {
  key: string
  quarter: string
  year: number
  optimisticValue: number
  pessimisticValue: number
  conservativeValue: number
  branchFilter: string
}

export function JodaynForecastsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ForecastRow[]>([])
  const [loading, setLoading] = useState(true)
  const isUpper = getJodaynRole() === 'upper'

  useEffect(() => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { forecasts } = await getForecasts(token)
        if (cancelled) return
        setRows(
          forecasts.map((f) => ({
            key: f.id,
            quarter: f.quarter,
            year: f.year,
            optimisticValue: Number(f.optimisticValue ?? 0),
            pessimisticValue: Number(f.pessimisticValue ?? 0),
            conservativeValue: Number(f.conservativeValue ?? 0),
            branchFilter: f.branchFilter ?? '—',
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
    <OrgCatalogShell title={t('revenueForecasts')}>
      <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/jodayn/forecasts/new')}>
        {t('addForecast')}
      </CatalogButton>
      <StatGrid>
        <StatCard
          label={t('revenueForecasts')}
          value={rows.length}
          icon={<AssetIcon src={dashboardDataAssets.active} size={16} />}
        />
      </StatGrid>
      <ListCardStack>
        {rows.map((row) => (
          <ListCard
            key={row.key}
            title={`${row.quarter} ${row.year}`}
            metaItems={[row.branchFilter, `${t('optimisticValue')}: ${row.optimisticValue}`]}
            tags={
              <>
                <span className="list-card__tag">{`${t('conservativeValue')}: ${row.conservativeValue}`}</span>
                <span className="list-card__tag list-card__tag--muted">
                  {`${t('pessimisticValue')}: ${row.pessimisticValue}`}
                </span>
                {isUpper ? (
                  <span className="row-actions">
                    <button
                      type="button"
                      className="is-danger"
                      onClick={async () => {
                        const token = getJodaynToken()
                        if (!token || !window.confirm(t('delete') + '؟')) return
                        try {
                          await deleteJodaynRecord(token, 'forecasts', row.key)
                          setRows((current) => current.filter((item) => item.key !== row.key))
                          message.success(t('deletedSuccessfully'))
                        } catch (err) {
                          message.error(err instanceof ApiError ? err.message : t('loadError'))
                        }
                      }}
                    >
                      {t('delete')}
                    </button>
                  </span>
                ) : null}
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
