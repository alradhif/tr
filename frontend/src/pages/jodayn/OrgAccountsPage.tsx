import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getAccounts } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceDetails,
  FinanceGenerator,
  FinanceHead,
  FinancePage,
  FinanceRow,
  FinanceStats,
  FinanceTable,
  FinanceTabs,
  shortRef,
  type FinanceView,
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
  const [view, setView] = useState<FinanceView>('list')
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
      <FinanceHead title={t('orgAccounts')} createLabel="إنشاء تقرير" onCreate={() => navigate('/jodayn/reports/new')} />
      <FinanceTabs active={view} onChange={setView} />

      {view === 'generator' ? (
        <FinanceGenerator
          title="مولّد العروض التقديمية - حسابات الجهات"
          data={
            rows[0]
              ? {
                  project: {
                    name: 'حسابات الجهات',
                    code: shortRef(rows[0].key).toUpperCase(),
                    department: 'حسابات الجهات — جودين',
                    projectManager: '—',
                    sponsor: '—',
                    statusLabel: `${active} نشطة من ${rows.length}`,
                    progress: rows.length ? Math.round((active / rows.length) * 100) : 0,
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.name} — ${r.sector}`),
                  sourceLabel: `بيانات حية — ${rows.length} جهة`,
                }
              : null
          }
        />
      ) : (
        <>
          <FinanceStats
            cards={[
              { label: 'إجمالي الجهات', value: String(rows.length), icon: icon1 },
              { label: 'الجهات النشطة', value: String(active), icon: icon2 },
              { label: 'الجهات غير النشطة', value: String(rows.length - active), icon: icon3 },
            ]}
          />
          <FinanceTable
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
          </FinanceTable>
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
        </>
      )}
    </FinancePage>
  )
}
