import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getSectors } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
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
import icon4 from '../../features/jodayn-finance/assets/icon4.svg'

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
  const [view, setView] = useState<FinanceView>('list')
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
            managerName: s.managerName || '—',
            budget: Number(s.budget ?? 0),
            profit: Number(s.profit ?? 0),
            employeeCount: Number(s.employeeCount ?? 0),
            departmentCount: Number(s.departmentCount ?? 0),
            annualRevenue: Number(s.annualRevenue ?? 0),
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

  const revenue = rows.reduce((sum, row) => sum + row.annualRevenue, 0)
  const budgets = rows.reduce((sum, row) => sum + row.budget, 0)

  return (
    <FinancePage title={t('sectors')}>
      <FinanceHead
        title={t('sectors')}
        subtitle="قطاعات الأعمال وميزانياتها وأداؤها"
        createLabel={t('addSector')}
        onCreate={() => navigate('/jodayn/sectors/new')}
      />
      <FinanceTabs active={view} onChange={setView} />

      {view === 'generator' ? (
        <FinanceGenerator
          title="مولّد العروض التقديمية - القطاعات"
          data={
            rows[0]
              ? {
                  project: {
                    name: 'القطاعات',
                    code: `${rows.length}`,
                    department: 'القطاعات — جودين',
                    projectManager: rows[0].managerName,
                    sponsor: '—',
                    statusLabel: `${rows.length} قطاع`,
                    budget: budgets,
                    budgetCurrency: 'SAR',
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.name} — إيراد ${formatAmount(r.annualRevenue)}`),
                  sourceLabel: `بيانات حية — ${rows.length} قطاع`,
                }
              : null
          }
        />
      ) : (
        <>
          <FinanceStats
            cards={[
              { label: 'عدد القطاعات', value: String(rows.length), icon: icon1 },
              { label: 'الإيراد السنوي', value: formatAmount(revenue), icon: icon2 },
              { label: 'إجمالي الميزانيات', value: formatAmount(budgets), icon: icon4 },
            ]}
          />
          <FinanceTable
            headers={['اسم القطاع', 'المدير المسؤول', 'الميزانية', 'عدد الموظفين', 'عدد الإدارات', 'الربح']}
            loading={loading}
            empty={rows.length === 0}
          >
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.name}</td>
                <td>{row.managerName}</td>
                <td>{formatAmount(row.budget)}</td>
                <td>{row.employeeCount}</td>
                <td>{row.departmentCount}</td>
                <td>{formatAmount(row.profit)}</td>
              </tr>
            ))}
          </FinanceTable>
        </>
      )}
    </FinancePage>
  )
}
