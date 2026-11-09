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
  FinanceDetails,
  FinanceCreateButton,
  FinancePage,
  FinanceRow,
  FinanceStats,
  FinanceListView,
  shortRef,
} from '../../features/jodayn-finance/FinanceParts'
import icon1 from '../../features/jodayn-finance/assets/icon1.svg'
import icon2 from '../../features/jodayn-finance/assets/icon2.svg'
import icon3 from '../../features/jodayn-finance/assets/icon3.svg'
import { contractStatusBadge } from './labels'

type OrgAccountRow = {
  key: string
  name: string
  type: string
  city: string
  sector: string
  contractStatus: string
  active: boolean
  reference: string
}

export function JodaynOrgAccountsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rows, setRows] = useState<OrgAccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState<OrgAccountRow | null>(null)

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
          [...(data.orgs ?? [])].reverse().map((o) => ({
            key: o.id,
            name: o.name,
            type: o.entityType || '—',
            city: o.region || o.branch || '—',
            sector: o.sector?.name ?? '—',
            contractStatus: contractStatusBadge(o.contractStatus).label,
            active: o.isActive,
            reference: o.crNumber || shortRef(o.id),
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
    <FinancePage title={t('orgAccounts')}>
      <div className="finance-tabs">
        <FinanceCreateButton label="إنشاء تقرير" onClick={() => navigate('/jodayn/reports/new')} />
      </div>

      <FinanceStats
        cards={[
          { label: 'إجمالي الجهات', value: String(rows.length), icon: icon1 },
          { label: 'الجهات النشطة', value: String(active), icon: icon2 },
          { label: 'الجهات غير النشطة', value: String(rows.length - active), icon: icon3 },
        ]}
      />
      <FinanceListView
        page="jodayn-org-accounts"
        cards={rows.map((row) => (
          <RecordCard
            key={row.key}
            title={row.name}
            subtitle={row.type}
            badges={<ToneBadge meta={row.active ? { label: 'نشطة', tone: 'approved' } : { label: 'غير نشطة', tone: 'none' }} />}
            rows={[
              { label: 'المدينة', value: row.city },
              { label: 'القطاع', value: row.sector },
              { label: 'المعرّف', value: row.reference },
            ]}
            linkLabel="عرض الجهة"
            onOpen={() => setOpened(row)}
          />
        ))}
        headers={['اسم الجهة', 'نوع الجهة', 'المدينة', 'الحالة', 'المعرّف']}
        loading={loading}
        empty={rows.length === 0}
      >
        {rows.map((row) => (
          <FinanceRow key={row.key} onOpen={() => setOpened(row)}>
            <td>{row.name}</td>
            <td className="finance-muted">{row.type}</td>
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
      {opened ? (
        <FinanceDetails
          title={opened.name}
          onClose={() => setOpened(null)}
          fields={[
            { label: 'نوع الجهة', value: opened.type },
            { label: 'المدينة', value: opened.city },
            { label: 'القطاع', value: opened.sector },
            { label: 'حالة العقد', value: opened.contractStatus },
            { label: 'الحالة', value: opened.active ? 'نشطة' : 'غير نشطة' },
            { label: 'المعرّف', value: opened.reference },
          ]}
        />
      ) : null}
    </FinancePage>
  )
}
