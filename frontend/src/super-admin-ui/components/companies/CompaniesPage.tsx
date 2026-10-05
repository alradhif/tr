import { useEffect, useState } from 'react'
import { PageHeader } from '../layout/PageHeader'
import './companies.css'
import { PptGeneratorFrame, type PptBridgePayload } from '../../../features/portal/PptGeneratorFrame'
import { getAccounts } from '../../../api/superAdmin'
import { getSuperAdminToken } from '../../../auth/superAdminAuth'

export function CompaniesPage() {
  const [pptData, setPptData] = useState<PptBridgePayload | null>(null)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const { orgs } = await getAccounts(token)
        if (cancelled || !orgs?.length) return
        const first = orgs[0]
        const packagePrice = Number(first.subscription?.package?.price)
        setPptData({
          project: {
            name: first.name,
            code: first.id.slice(0, 8).toUpperCase(),
            department: first.region || first.entityType || 'مستأجر',
            projectManager: first.adminName || '—',
            sponsor: 'Super Admin',
            statusLabel: first.isActive ? 'نشط' : 'معلق',
            // No real completion % on OrgAccount — omit rather than invent from isActive
            ...(Number.isFinite(packagePrice)
              ? { budget: packagePrice, budgetCurrency: 'SAR' as const }
              : {}),
          },
          outputs: orgs.slice(0, 4).map((o) => o.name),
          sourceLabel: `بيانات حية — ${orgs.length} جهة`,
        })
      } catch {
        /* keep demo fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="dashboard-page companies-page">
      <PageHeader title="الشركات" />
      <div className="tenants-body" style={{ padding: 0, flex: 1, minHeight: 0 }}>
        <PptGeneratorFrame title="مولّد العروض التقديمية - الشركات" data={pptData} />
      </div>
    </div>
  )
}
