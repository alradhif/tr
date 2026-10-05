import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import type { JodaynRole } from '../../auth/jodaynAuth'
import { jodaynRoleLabel } from '../../auth/jodaynAuth'
import { isDataEntry } from '../../auth/permissions'
import { PortalDashboard } from '../../features/portal'

export function JodaynDashboardPage() {
  const { t } = useTranslation()
  const { role } = useOutletContext<{ role: JodaynRole }>()

  return (
    <PortalDashboard
      portal="jodayn"
      variant={isDataEntry(role) ? 'dataentry' : 'senior'}
      title={t('dashboard')}
      subtitle={`${t('jodaynPortal')} — ${jodaynRoleLabel(role)}`}
    />
  )
}
