import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import type { OrgRole } from '../../auth/orgAuth'
import { orgRoleLabel } from '../../auth/orgAuth'
import { isDataEntry } from '../../auth/permissions'
import { PortalDashboard } from '../../features/portal'

export function OrgDashboardPage() {
  const { t } = useTranslation()
  const { role } = useOutletContext<{ role: OrgRole }>()

  return (
    <PortalDashboard
      portal="org"
      variant={isDataEntry(role) ? 'dataentry' : 'senior'}
      title={t('dashboard')}
      subtitle={`${t('orgPortal')} — ${orgRoleLabel(role)}`}
    />
  )
}
