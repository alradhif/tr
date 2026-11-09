import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getSectors } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { RecordCard } from '../../components/ui/RecordCards'
import {
  FinanceDetails,
  FinanceCreateButton,
  FinancePage,
  FinanceRow,
  FinanceStats,
  FinanceListView,
  formatAmount,
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
  const [rows, setRows] = useState<SectorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState<SectorRow | null>(null)

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
        // Largest budget first, as in the design.
        setRows(
          [...sectors].sort((a, b) => Number(b.budget ?? 0) - Number(a.budget ?? 0)).map((s) => ({
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
      <div className="finance-tabs">
        <FinanceCreateButton label={t('addSector')} onClick={() => navigate('/jodayn/sectors/new')} />
      </div>

      <FinanceStats
        cards={[
          { label: 'عدد القطاعات', value: String(rows.length), icon: icon1 },
          { label: 'الإيراد السنوي', value: formatAmount(revenue), icon: icon2 },
          { label: 'إجمالي الميزانيات', value: formatAmount(budgets), icon: icon4 },
        ]}
      />
      <FinanceListView
        page="jodayn-sectors"
        cards={rows.map((row) => (
          <RecordCard
            key={row.key}
            title={row.name}
            rows={[
              { label: 'المدير المسؤول', value: row.managerName },
              { label: 'الميزانية', value: formatAmount(row.budget) },
              { label: 'عدد الموظفين', value: row.employeeCount },
              { label: 'عدد الإدارات', value: row.departmentCount },
              { label: 'الربح', value: formatAmount(row.profit) },
            ]}
            linkLabel="عرض القطاع"
            onOpen={() => setOpened(row)}
          />
        ))}
        headers={['اسم القطاع', 'المدير المسؤول', 'الميزانية', 'عدد الموظفين', 'عدد الإدارات', 'الربح']}
        loading={loading}
        empty={rows.length === 0}
      >
        {rows.map((row) => (
          <FinanceRow key={row.key} onOpen={() => setOpened(row)}>
            <td>{row.name}</td>
            <td>{row.managerName}</td>
            <td>{formatAmount(row.budget)}</td>
            <td>{row.employeeCount}</td>
            <td>{row.departmentCount}</td>
            <td>{formatAmount(row.profit)}</td>
          </FinanceRow>
        ))}
      </FinanceListView>
      {opened ? (
        <FinanceDetails
          title={opened.name}
          onClose={() => setOpened(null)}
          fields={[
            { label: 'المدير المسؤول', value: opened.managerName },
            { label: 'الميزانية', value: formatAmount(opened.budget) },
            { label: 'الإيراد السنوي', value: formatAmount(opened.annualRevenue) },
            { label: 'الربح', value: formatAmount(opened.profit) },
            { label: 'عدد الموظفين', value: opened.employeeCount },
            { label: 'عدد الإدارات', value: opened.departmentCount },
          ]}
        />
      ) : null}
    </FinancePage>
  )
}
