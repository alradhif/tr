import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import type { ClientRole } from '../../auth/clientAuth'
import { clientRoleLabel } from '../../auth/clientAuth'
import { isDataEntry } from '../../auth/permissions'
import { PortalDashboard } from '../../features/portal'

export function ClientDashboardPage() {
  const { t } = useTranslation()
  const { role } = useOutletContext<{ role: ClientRole }>()

  return (
    <PortalDashboard
      portal="client"
      variant={isDataEntry(role) ? 'dataentry' : 'senior'}
      title={t('dashboard')}
      subtitle={`${t('clientPortal')} — ${clientRoleLabel(role)}`}
    />
  )
}
