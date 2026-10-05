import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { navigationAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getReports } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { CatalogButton, ListCard, ListCardStack, StatCard, StatGrid } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { PptGeneratorFrame } from '../../features/portal'

type ReportRow = {
  key: string
  type: string
  period: string
  totalContractsValue: number
  netProfit: number
  netCashFlow: number
}

type ViewMode = 'list' | 'ppt'

export function JodaynReportsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('list')
  const [rows, setRows] = useState<ReportRow[]>([])
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
        const { reports } = await getReports(token)
        if (cancelled) return
        setRows(
          reports.map((r) => ({
            key: r.id,
            type: r.type,
            period: r.period ?? '—',
            totalContractsValue: Number(r.totalContractsValue ?? 0),
            netProfit: Number(r.netProfit ?? 0),
            netCashFlow: Number(r.netCashFlow ?? 0),
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
    <OrgCatalogShell title={t('financialReports')}>
      {view === 'list' ? (
        <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/jodayn/reports/new')}>
          {t('generateReport')}
        </CatalogButton>
      ) : null}

      <div className="catalog-view-switch">
        <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>
          {t('listTab')}
        </button>
        <button type="button" className={view === 'ppt' ? 'is-active' : ''} onClick={() => setView('ppt')}>
          {t('pptGeneratorTab')}
        </button>
      </div>

      {view === 'ppt' ? (
        <section className="catalog-card">
          <PptGeneratorFrame
            title="مولّد العروض التقديمية - التقارير"
            data={
              rows[0]
                ? {
                    project: {
                      name: `تقرير ${rows[0].type}`,
                      code: rows[0].key.slice(0, 8).toUpperCase(),
                      department: 'التقارير المالية — جودين',
                      projectManager: '—',
                      sponsor: '—',
                      statusLabel: rows[0].period,
                      budget: Number(rows[0].totalContractsValue) || 0,
                      budgetCurrency: 'SAR',
                    },
                    outputs: rows.slice(0, 4).map((r) => `${r.type} — ربح ${r.netProfit}`),
                    sourceLabel: `بيانات حية — ${rows.length} تقرير`,
                  }
                : null
            }
          />
        </section>
      ) : (
        <>
          <StatGrid>
            <StatCard
              label={t('financialReports')}
              value={rows.length}
              icon={<AssetIcon src={navigationAssets.goals} size={16} />}
            />
          </StatGrid>
          <ListCardStack>
            {rows.map((row) => (
              <ListCard
                key={row.key}
                title={row.type}
                metaItems={[row.period, `${t('totalContractsValue')}: ${row.totalContractsValue}`]}
                tags={
                  <>
                    <span className="list-card__tag">{`${t('netProfit')}: ${row.netProfit}`}</span>
                    <span className="list-card__tag list-card__tag--muted">{`${t('netCashFlow')}: ${row.netCashFlow}`}</span>
                  </>
                }
              />
            ))}
            {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
            {rows.length === 0 && !loading ? <EmptyState /> : null}
          </ListCardStack>
        </>
      )}
    </OrgCatalogShell>
  )
}
