import { useRef, useState } from 'react'
import { Form, message } from 'antd'
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { commonAssets } from '@/assets'
import { ApiError } from '../../api/client'
import { extractFromDocument, tokenForPath } from '../../api/me'
import { AssetIcon } from '../ui/AssetIcon'

export type AiExtractKind = 'project' | 'goal' | 'scenario' | 'contract'

export type AiUploadBannerProps = {
  title?: string
  subtitle?: string
  /** What the uploaded document describes; decides which fields the server extracts. */
  kind?: AiExtractKind
  /** Turns extracted values into form values. When set, the surrounding antd Form is filled. */
  mapFields?: (fields: Record<string, unknown>) => Record<string, unknown>
}

export function AiUploadBanner({ title, subtitle, kind = 'contract', mapFields }: AiUploadBannerProps) {
  const { t } = useTranslation()
  const form = Form.useFormInstance()
  const location = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    const token = tokenForPath(location.pathname)
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setBusy(true)
    try {
      const { fields } = await extractFromDocument(token, kind, file)
      const values = Object.fromEntries(
        Object.entries(mapFields ? mapFields(fields) : fields).filter(([, value]) => value !== undefined && value !== null && value !== ''),
      )
      const count = Object.keys(values).length
      if (count === 0) {
        message.info('لم يُعثر في الملف على بيانات يمكن تعبئتها')
        return
      }
      form?.setFieldsValue(values)
      message.success(`تمت تعبئة ${count} من الحقول من الملف، راجعها قبل الحفظ`)
    } catch (err) {
      const text = err instanceof ApiError ? err.message : t('loadError')
      if (err instanceof ApiError && err.status === 503) message.warning(text)
      else message.error(text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="ai-upload-banner"
        disabled={busy}
        aria-busy={busy}
        onClick={() => inputRef.current?.click()}
      >
        <span className="ai-upload-banner__start">
          <span className="ai-upload-banner__flash">
            <Zap size={16} strokeWidth={2.5} aria-hidden />
          </span>
          <span className="ai-upload-banner__copy">
            <span className="ai-upload-banner__title">{title ?? t('aiUploadTitle')}</span>
            <span className="ai-upload-banner__sub">{busy ? 'جاري قراءة الملف...' : (subtitle ?? t('aiUploadSubtitle'))}</span>
          </span>
        </span>
        <span className="ai-upload-banner__upload">
          <AssetIcon src={commonAssets.upload} size={18} />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.txt,.md,.csv,application/pdf,text/plain"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void handleFile(file)
        }}
      />
    </>
  )
}
