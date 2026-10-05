import { useState } from 'react'
import dayjs from 'dayjs'
import { DatePicker, Form, Input, InputNumber, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../api/client'
import { createClientNested } from '../../../api/clientPortal'
import { createProjectScenario } from '../../../api/orgProjects'
import { getClientToken } from '../../../auth/clientAuth'
import { getOrgToken } from '../../../auth/orgAuth'
import { AiUploadBanner, FormActions, FormSection } from '../../../components/forms'
import { CatalogFormWrap } from './CatalogFormWrap'
import { useProjectFormNav } from './useProjectFormNav'

const riskOpts = (t: (k: string) => string) => [
  { value: 'LOW', label: t('low') },
  { value: 'MEDIUM', label: t('medium') },
  { value: 'HIGH', label: t('high') },
  { value: 'CRITICAL', label: t('critical') },
]

type FormValues = {
  originalDate?: { toISOString?: () => string } | string
  originalCost?: number
  originalRiskLevel?: string
  newDate?: { toISOString?: () => string } | string
  newCost?: number
  newRiskLevel?: string
  impactOnSchedule?: string
  impactOnCost?: string
  impactOnCriticalPath?: string
  recommendations?: string
}

function toDateString(value?: { toISOString?: () => string } | string) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.toISOString?.()
}

function dateValue(value: unknown) {
  const parsed = typeof value === 'string' ? dayjs(value) : null
  return parsed?.isValid() ? parsed : undefined
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return value !== undefined && value !== '' && Number.isFinite(parsed) ? parsed : undefined
}

function scenarioFormValues(fields: Record<string, unknown>) {
  return {
    originalDate: dateValue(fields.originalDate),
    originalCost: numberValue(fields.originalCost),
    newDate: dateValue(fields.newDate),
    newCost: numberValue(fields.newCost),
    impactOnSchedule: fields.impactOnSchedule,
    impactOnCost: fields.impactOnCost,
    impactOnCriticalPath: fields.impactOnCriticalPath,
    recommendations: fields.recommendations,
  }
}

export function AddScenarioPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const payload = {
        originalDate: toDateString(values.originalDate),
        originalCost: values.originalCost,
        originalRiskLevel: values.originalRiskLevel,
        newDate: toDateString(values.newDate),
        newCost: values.newCost,
        newRiskLevel: values.newRiskLevel,
        impactOnSchedule: values.impactOnSchedule,
        impactOnCost: values.impactOnCost,
        impactOnCriticalPath: values.impactOnCriticalPath,
        recommendations: values.recommendations,
      }
      if (portal === 'client') {
        const token = getClientToken()
        if (!token) throw new Error(t('loadError'))
        await createClientNested(token, projectId, 'scenarios', payload)
      } else {
        const token = getOrgToken()
        if (!token) throw new Error(t('loadError'))
        await createProjectScenario(token, projectId, payload)
      }
      message.success(t('saveScenario'))
      navigate(backTo)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CatalogFormWrap portal={portal} parent={t('whatIf')} title={t('addScenarioFull')} backTo={backTo}>

      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        onFinish={onFinish}
      >
        <AiUploadBanner
          title={t('aiUploadScenarioTitle')}
          subtitle={t('aiUploadScenarioSubtitle')}
          kind="scenario"
          mapFields={scenarioFormValues}
        />

        <FormSection title={t('scenarioCurrent')}>
          <div className="form-grid-2">
            <Form.Item label={t('originalDate')} name="originalDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('originalCost')} name="originalCost">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <Form.Item label={t('originalRiskLevel')} name="originalRiskLevel">
            <Select options={riskOpts(t)} allowClear />
          </Form.Item>
        </FormSection>

        <FormSection title={t('scenarioProposed')}>
          <div className="form-grid-2">
            <Form.Item label={t('newDate')} name="newDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('newCost')} name="newCost">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <Form.Item label={t('newRiskLevel')} name="newRiskLevel">
            <Select options={riskOpts(t)} allowClear />
          </Form.Item>
          <Form.Item label={t('impactOnSchedule')} name="impactOnSchedule">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label={t('impactOnCost')} name="impactOnCost">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label={t('impactOnCriticalPath')} name="impactOnCriticalPath">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label={t('recommendations')} name="recommendations">
            <Input.TextArea rows={3} />
          </Form.Item>
        </FormSection>

        <FormActions cancelTo={backTo} submitLabel={t('saveScenario')} loading={submitting} />
      </Form>
    </CatalogFormWrap>
  )
}
