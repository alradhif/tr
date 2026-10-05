import { useTranslation } from 'react-i18next'
import { commonAssets } from '@/assets'

type EmptyStateProps = {
  description?: string
}

export function EmptyState({ description }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="empty-state catalog-empty">
      <img
        src={commonAssets.emptyState}
        alt=""
        width={96}
        height={96}
        className="asset-icon empty-state__image"
      />
      <p>{description ?? t('noDataShort')}</p>
    </div>
  )
}
