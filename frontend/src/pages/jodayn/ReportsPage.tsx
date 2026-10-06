import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getReports } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceGenerator,
  FinanceHead,
  FinancePage,
  FinanceStats,
  FinanceTable,
  FinanceTabs,
  formatAmount,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'
import icon1 from '../../features/jodayn-finance/assets/icon1.svg'
import icon2 from '../../features/jodayn-finance/assets/icon2.svg'
import icon3 from '../../features/jodayn-finance/assets/icon3.svg'
import { reportTypeLabel } from './labels'

type ReportRow = {
  key: string
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
        const { reports } = await getReports(token)
        if (cancelled) return
        setRows(
          reports.map((r) => ({
            key: r.id,
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

  const remove = async (row: ReportRow) => {
    const token = getJodaynToken()
    if (!token || !window.confirm(`حذف ${row.type}؟`)) return
    try {
      await deleteJodaynRecord(token, 'reports', row.key)
      setRows((current) => current.filter((item) => item.key !== row.key))
      message.success(t('deletedSuccessfully'))
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  const totalContracts = rows.reduce((sum, row) => sum + row.totalContractsValue, 0)
  const totalProfit = rows.reduce((sum, row) => sum + row.netProfit, 0)

  return (
    <FinancePage title={t('financialReports')}>
      <FinanceHead
        title={t('financialReports')}
        subtitle="متابعة أداء العقود وتوليد التقارير المالية الخاصة بها"
        createLabel={t('generateReport')}
        onCreate={() => navigate('/jodayn/reports/new')}
      />
      <FinanceTabs active={view} onChange={setView} />

      {view === 'generator' ? (
        <FinanceGenerator
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
                    budget: rows[0].totalContractsValue,
                    budgetCurrency: 'SAR',
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.type} — ربح ${formatAmount(r.netProfit)}`),
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
            headers={['اسم التقرير', 'الفترة / الربع', 'قيمة العقود', 'صافي الربح', 'صافي التدفق النقدي', ...(isUpper ? [''] : [])]}
            loading={loading}
            empty={rows.length === 0}
          >
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.type}</td>
                <td className="finance-muted">{row.period}</td>
                <td>{formatAmount(row.totalContractsValue)}</td>
                <td>{formatAmount(row.netProfit)}</td>
                <td>{formatAmount(row.netCashFlow)}</td>
                {isUpper ? (
                  <td>
                    <span className="finance-actions">
                      <button type="button" className="is-danger" onClick={() => void remove(row)}>
                        {t('delete')}
                      </button>
                    </span>
                  </td>
                ) : null}
              </tr>
            ))}
          </FinanceTable>
        </>
      )}
    </FinancePage>
  )
}
