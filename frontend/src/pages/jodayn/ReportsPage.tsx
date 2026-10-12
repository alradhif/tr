import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getReports } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceGenerator,
  FinanceHead,
  FinancePage,
  FinanceRow,
  FinanceStats,
  FinanceTable,
  FinanceTabs,
  formatAmount,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'
import icon1 from '../../features/jodayn-finance/assets/icon1.svg'
import icon2 from '../../features/jodayn-finance/assets/icon2.svg'
import icon3 from '../../features/jodayn-finance/assets/icon3.svg'
import { reportName, reportTypeLabel } from './labels'

type ReportRow = {
  key: string
  name: string
  type: string
  period: string
  totalContractsValue: number
  netProfit: number
  netCashFlow: number
}

export function JodaynReportsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<FinanceView>('list')
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
        // Oldest first, as in the design (the API returns newest first).
        setRows(
          [...reports].reverse().map((r) => ({
            key: r.id,
            name: reportName(r.period, reportTypeLabel(r.type, t)),
            type: reportTypeLabel(r.type, t),
            period: r.period ?? '—',
            totalContractsValue: Number(r.totalContractsValue ?? 0),
            netProfit: Number(r.netProfit ?? 0),
            netCashFlow: Number(r.netCashFlow ?? 0),
          })),
        )
      } catch (err) {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const totalContracts = rows.reduce((sum, row) => sum + row.totalContractsValue, 0)
  const totalProfit = rows.reduce((sum, row) => sum + row.netProfit, 0)

  return (
    <FinancePage title={t('financialReports')}>
      <FinanceHead
        title={t('financialReports')}
        subtitle="متابعة أداء العقود وتوليد التقارير المالية الخاصة بها"
        createLabel="إنشاء تقرير"
        onCreate={() => navigate('/jodayn/reports/new')}
      />
      <FinanceTabs active={view} onChange={setView} withList />

      {view === 'generator' ? (
        <FinanceGenerator
          title="مولّد العروض التقديمية - التقارير"
          data={
            rows[0]
              ? {
                  project: {
                    name: rows[0].name,
                    code: rows[0].key.slice(0, 8).toUpperCase(),
                    department: 'التقارير المالية — جودين',
                    projectManager: '—',
                    sponsor: '—',
                    statusLabel: rows[0].period,
                    budget: rows[0].totalContractsValue,
                    budgetCurrency: 'SAR',
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.name} — ربح ${formatAmount(r.netProfit)}`),
                  sourceLabel: `بيانات حية — ${rows.length} تقرير`,
                }
              : null
          }
        />
      ) : (
        <>
          <FinanceStats
            cards={[
              { label: 'إجمالي التقارير', value: String(rows.length), icon: icon1 },
              { label: 'إجمالي قيمة العقود', value: formatAmount(totalContracts), icon: icon2 },
              { label: 'صافي الربح الإجمالي', value: formatAmount(totalProfit), icon: icon3 },
            ]}
          />
          <FinanceTable
            headers={['اسم التقرير', 'الفترة / الربع', 'قيمة العقود', 'صافي الربح', 'صافي التدفق النقدي']}
            loading={loading}
            empty={rows.length === 0}
          >
            {rows.map((row) => (
              <FinanceRow key={row.key} onOpen={() => navigate(`/jodayn/reports/${row.key}`)}>
                <td>{row.name}</td>
                <td className="finance-muted">{row.period}</td>
                <td>{formatAmount(row.totalContractsValue)}</td>
                <td>{formatAmount(row.netProfit)}</td>
                <td>{formatAmount(row.netCashFlow)}</td>
              </FinanceRow>
            ))}
          </FinanceTable>
        </>
      )}
    </FinancePage>
  )
}
