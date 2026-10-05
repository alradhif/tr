import { useState } from 'react'
import { DatePicker, Form, Input, InputNumber, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { createForecast } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { FormActions, FormPageHeader, FormSection } from '../../components/forms'

type FormValues = {
  quarter: string
  year: number
  branchFilter?: string
  dateRangeStart?: { toISOString?: () => string } | string
  dateRangeEnd?: { toISOString?: () => string } | string
  optimisticValue?: number
  optimisticProbability?: number
  pessimisticValue?: number
  pessimisticProbability?: number
  conservativeValue?: number
  conservativeProbability?: number
}

function toDateString(value?: { toISOString?: () => string } | string) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.toISOString?.()
}

export function JodaynAddForecastPage() {
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
      await createForecast(token, {
        quarter: values.quarter,
        year: values.year,
        branchFilter: values.branchFilter,
        dateRangeStart: toDateString(values.dateRangeStart),
        dateRangeEnd: toDateString(values.dateRangeEnd),
        optimisticValue: values.optimisticValue,
        optimisticProbability: values.optimisticProbability,
        pessimisticValue: values.pessimisticValue,
        pessimisticProbability: values.pessimisticProbability,
        conservativeValue: values.conservativeValue,
        conservativeProbability: values.conservativeProbability,
      })
      message.success(t('saveForecast'))
      navigate('/jodayn/forecasts')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageHeader
      parentLabel={t('revenueForecasts')}
      currentLabel={t('addForecastFull')}
      backTo="/jodayn/forecasts"
      title={t('addForecastFull')}
    >
      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        onFinish={onFinish}
      >
        <FormSection title={t('forecastBasicInfo')}>
          <div className="form-grid-2">
            <Form.Item label={t('quarter')} name="quarter" rules={[{ required: true }]}>
              <Input placeholder="Q1" />
            </Form.Item>
            <Form.Item label={t('year')} name="year" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={2000} />
            </Form.Item>
          </div>
          <Form.Item label={t('branch')} name="branchFilter">
            <Input />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label={t('dateRangeStart')} name="dateRangeStart">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('dateRangeEnd')} name="dateRangeEnd">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
        </FormSection>

        <FormSection title={t('forecastScenarios')}>
          <div className="form-grid-2">
            <Form.Item label={t('optimisticValue')} name="optimisticValue">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('optimisticProbability')} name="optimisticProbability">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label={t('pessimisticValue')} name="pessimisticValue">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('pessimisticProbability')} name="pessimisticProbability">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label={t('conservativeValue')} name="conservativeValue">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('conservativeProbability')} name="conservativeProbability">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
          </div>
        </FormSection>

        <FormActions cancelTo="/jodayn/forecasts" submitLabel={t('saveForecast')} loading={submitting} />
      </Form>
    </FormPageHeader>
  )
}
