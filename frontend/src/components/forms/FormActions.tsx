import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../ui'

export type FormActionsProps = {
  cancelTo: string
  submitLabel: string
  loading?: boolean
}

export function FormActions({ cancelTo, submitLabel, loading }: FormActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="form-actions">
      <Button className="form-actions__cancel" onClick={() => navigate(cancelTo)}>
        {t('cancel')}
      </Button>
      <PrimaryButton htmlType="submit" loading={loading}>
        {submitLabel}
      </PrimaryButton>
    </div>
  )
}
