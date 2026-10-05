import { useTranslation } from 'react-i18next'
import type { AppRole } from '../../auth/permissions'
import { isDataEntry, isUpperManagement } from '../../auth/permissions'

type RoleBannerProps = {
  role: AppRole
}

export function RoleBanner({ role }: RoleBannerProps) {
  const { t } = useTranslation()

  if (isDataEntry(role)) {
    return <p className="role-hint">{t('dataEntryCanEdit')}</p>
  }

  if (isUpperManagement(role)) {
    return <p className="role-hint role-hint--upper">{t('upperCanApprove')}</p>
  }

  return null
}
