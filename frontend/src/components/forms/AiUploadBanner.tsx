import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { commonAssets } from '@/assets'
import { AssetIcon } from '../ui/AssetIcon'

export type AiUploadBannerProps = {
  title?: string
  subtitle?: string
}

export function AiUploadBanner({ title, subtitle }: AiUploadBannerProps) {
  const { t } = useTranslation()

  return (
    <button type="button" className="ai-upload-banner">
      <span className="ai-upload-banner__start">
        <span className="ai-upload-banner__flash">
          <Zap size={16} strokeWidth={2.5} aria-hidden />
        </span>
        <span className="ai-upload-banner__copy">
          <span className="ai-upload-banner__title">{title ?? t('aiUploadTitle')}</span>
          <span className="ai-upload-banner__sub">{subtitle ?? t('aiUploadSubtitle')}</span>
        </span>
      </span>
      <span className="ai-upload-banner__upload">
        <AssetIcon src={commonAssets.upload} size={18} />
      </span>
    </button>
  )
}
