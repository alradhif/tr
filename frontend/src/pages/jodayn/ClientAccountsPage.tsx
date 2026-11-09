import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getAccounts } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { RecordCard, ToneBadge } from '../../components/ui/RecordCards'
import {
  FinancePage,
  FinanceRow,
  FinanceListView,
  shortRef,
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
  reference: string
}

export function JodaynClientAccountsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
          // Oldest first, as in the design (the API returns newest first).
          [...(data.clients ?? [])].reverse().map((c) => ({
            key: c.id,
            name: c.name,
            managerName: c.managerName || '—',
            city: c.region || c.branch || 'غير محدد',
            sector: c.sector?.name ?? '—',
            active: c.isActive,
            reference: c.crNumber || shortRef(c.id),
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
      <FinanceListView
        page="jodayn-client-accounts"
        cards={rows.map((row) => (
          <RecordCard
            key={row.key}
            title={row.name}
            subtitle={row.managerName}
            badges={<ToneBadge meta={row.active ? { label: 'نشطة', tone: 'approved' } : { label: 'غير نشطة', tone: 'none' }} />}
            rows={[
              { label: 'المدينة', value: row.city },
              { label: 'القطاع', value: row.sector },
              { label: 'المعرّف', value: row.reference },
            ]}
            linkLabel="عرض العميل"
            onOpen={() => navigate(`/jodayn/client-accounts/${row.key}`)}
          />
        ))}
        headers={['اسم العميل', 'الشخص المسؤول', 'المدينة', 'الحالة', 'المعرّف']}
        loading={loading}
        empty={rows.length === 0}
      >
        {rows.map((row) => (
          <FinanceRow key={row.key} onOpen={() => navigate(`/jodayn/client-accounts/${row.key}`)}>
            <td>{row.name}</td>
            <td className="finance-muted">{row.managerName}</td>
            <td>{row.city}</td>
            <td>
              <span className={`finance-status finance-status--${row.active ? 'active' : 'inactive'}`}>
                <CheckCircle2 size={14} strokeWidth={2.4} />
                {row.active ? 'نشطة' : 'غير نشطة'}
              </span>
            </td>
            <td>{row.reference}</td>
          </FinanceRow>
        ))}
      </FinanceListView>
    </FinancePage>
  )
}
