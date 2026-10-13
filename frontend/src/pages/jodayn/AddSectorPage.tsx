import { useState } from 'react'
import { Form, Input, InputNumber, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { createSector } from '../../api/superAdmin'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { FormActions, FormPageHeader, FormSection } from '../../components/forms'

type FormValues = {
  name: string
  managerName?: string
  budget?: number
  annualRevenue?: number
}

export function JodaynAddSectorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: FormValues) => {
    const token = getJodaynToken()
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setSubmitting(true)
    try {
      await createSector(token, {
        name: values.name,
        managerName: values.managerName || values.name,
        budget: values.budget,
        annualRevenue: values.annualRevenue,
      })
      message.success(t('saveSector'))
      navigate('/jodayn/sectors')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageHeader
      parentLabel={t('sectors')}
      currentLabel={t('addSectorFull')}
      backTo="/jodayn/sectors"
      title={t('addSectorFull')}
    >
      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        onFinish={onFinish}
      >
        <FormSection title={t('sectorBasicInfo')}>
          <Form.Item label={t('sectorName')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('manager')} name="managerName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label={t('budget')} name="budget">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('annualRevenue')} name="annualRevenue">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
        </FormSection>

        <FormActions cancelTo="/jodayn/sectors" submitLabel={t('saveSector')} loading={submitting} />
      </Form>
    </FormPageHeader>
  )
}
