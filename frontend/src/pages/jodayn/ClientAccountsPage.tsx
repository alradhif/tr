import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { getAccounts } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceGenerator,
  FinanceHead,
  FinancePage,
  FinanceTable,
  FinanceTabs,
  shortRef,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'
import { CityDonutCard, cityDistribution } from '../../features/jodayn-finance/CityDonut'
import icon1 from '../../features/jodayn-finance/assets/icon1.svg'
import icon2 from '../../features/jodayn-finance/assets/icon2.svg'

type ClientAccountRow = {
  key: string
  name: string
  managerName: string
  city: string
  sector: string
  active: boolean
}

export function JodaynClientAccountsPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<FinanceView>('list')
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
            managerName: c.managerName || '—',
            city: c.region || c.branch || 'غير محدد',
            sector: c.sector?.name ?? '—',
            active: c.isActive,
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

  const active = rows.filter((row) => row.active).length

  return (
    <FinancePage title={t('clientAccounts')}>
      <FinanceHead title={t('clientAccounts')} subtitle="حسابات العملاء المشتركين في المنصة وحالتها" />
      <FinanceTabs active={view} onChange={setView} />

      {view === 'generator' ? (
        <FinanceGenerator
          title="مولّد العروض التقديمية - حسابات العملاء"
          data={
            rows[0]
              ? {
                  project: {
                    name: 'حسابات العملاء',
                    code: shortRef(rows[0].key).toUpperCase(),
                    department: 'حسابات العملاء — جودين',
                    projectManager: '—',
                    sponsor: '—',
                    statusLabel: `${active} نشط من ${rows.length}`,
                    progress: rows.length ? Math.round((active / rows.length) * 100) : 0,
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.name} — ${r.city}`),
                  sourceLabel: `بيانات حية — ${rows.length} حساب`,
                }
              : null
          }
        />
      ) : (
        <>
          <div className="finance-cards">
            <div className="finance-card">
              <div className="finance-card__top">
                <span className="finance-card__icon">
                  <img src={icon1} alt="" />
                </span>
                <span className="finance-card__label">إجمالي حسابات العملاء</span>
              </div>
              <div className="finance-card__value">{rows.length}</div>
            </div>
            <div className="finance-card">
              <div className="finance-card__top">
                <span className="finance-card__icon">
                  <img src={icon2} alt="" />
                </span>
                <span className="finance-card__label">العملاء النشطون (عدد)</span>
              </div>
              <div className="finance-card__value">{active}</div>
            </div>
            <CityDonutCard title="توزيع حسب المدينة" items={cityDistribution(rows.map((row) => row.city))} />
          </div>
          <FinanceTable
            headers={['اسم العميل', 'الشخص المسؤول', 'المدينة', 'القطاع', 'الحالة', 'المعرّف']}
            loading={loading}
            empty={rows.length === 0}
          >
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.name}</td>
                <td className="finance-muted">{row.managerName}</td>
                <td>{row.city}</td>
                <td className="finance-muted">{row.sector}</td>
                <td>
                  <span className={`finance-status finance-status--${row.active ? 'active' : 'inactive'}`}>
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                    {row.active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td>{shortRef(row.key)}</td>
              </tr>
            ))}
          </FinanceTable>
        </>
      )}
    </FinancePage>
  )
}
