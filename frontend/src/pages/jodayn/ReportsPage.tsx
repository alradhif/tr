import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getReports } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { RecordCard } from '../../components/ui/RecordCards'
import {
  FinanceCreateButton,
  FinancePage,
  FinanceRow,
  FinanceStats,
  FinanceListView,
  formatAmount,
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
      <div className="finance-tabs">
        <FinanceCreateButton label="إنشاء تقرير" onClick={() => navigate('/jodayn/reports/new')} />
      </div>

      <FinanceStats
        cards={[
          { label: 'إجمالي التقارير', value: String(rows.length), icon: icon1 },
          { label: 'إجمالي قيمة العقود', value: formatAmount(totalContracts), icon: icon2 },
          { label: 'صافي الربح الإجمالي', value: formatAmount(totalProfit), icon: icon3 },
        ]}
      />
      <FinanceListView
        page="jodayn-reports"
        cards={rows.map((row) => (
          <RecordCard
            key={row.key}
            title={row.name}
            subtitle={row.period}
            rows={[
              { label: 'قيمة العقود', value: formatAmount(row.totalContractsValue) },
              { label: 'صافي الربح', value: formatAmount(row.netProfit) },
              { label: 'صافي التدفق النقدي', value: formatAmount(row.netCashFlow) },
            ]}
            linkLabel="عرض التقرير"
            onOpen={() => navigate(`/jodayn/reports/${row.key}`)}
          />
        ))}
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
      </FinanceListView>
    </FinancePage>
  )
}
