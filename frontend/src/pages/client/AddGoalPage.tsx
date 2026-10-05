import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { DatePicker, Form, Input, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import {
  createClientDocument,
  createClientGoal,
  createClientGoalLink,
  getClientDocuments,
  type ClientStrategyDocument,
} from '../../api/clientStrategy'
import { getClientProjects, type ClientProject } from '../../api/clientPortal'
import { getClientToken } from '../../auth/clientAuth'
import { AiUploadBanner, FormActions, FormPageHeader, FormSection } from '../../components/forms'

type FormValues = {
  title: string
  description?: string
  documentId?: string
  period?: [{ toISOString?: () => string } | string, { toISOString?: () => string } | string]
  priority?: string
  kpiDescription?: string
  measurementType?: string
  targetValue?: string
  currentValue?: string
}

function toDateString(value?: { toISOString?: () => string } | string) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.toISOString?.()
}

function goalFormValues(fields: Record<string, unknown>) {
  const start = typeof fields.startDate === 'string' ? dayjs(fields.startDate) : null
  const end = typeof fields.endDate === 'string' ? dayjs(fields.endDate) : null
  return {
    title: fields.title,
    description: fields.description,
    period: start?.isValid() && end?.isValid() ? [start, end] : undefined,
    kpiDescription: fields.kpiDescription,
    targetValue: fields.targetValue === undefined ? undefined : String(fields.targetValue),
    currentValue: fields.currentValue === undefined ? undefined : String(fields.currentValue),
  }
}

export function ClientAddGoalPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [documents, setDocuments] = useState<ClientStrategyDocument[]>([])
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [linkedIds, setLinkedIds] = useState<string[]>([])
  const [projectsError, setProjectsError] = useState(false)

  useEffect(() => {
    const token = getClientToken()
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const { documents: docs } = await getClientDocuments(token)
        if (!cancelled) setDocuments(docs)
      } catch (err) {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      }
      try {
        const { projects: data } = await getClientProjects(token)
        if (cancelled) return
        setProjects(data ?? [])
        setProjectsError(false)
      } catch (err) {
        if (!cancelled) {
          setProjectsError(true)
          setProjects([])
          message.error(err instanceof ApiError ? err.message : t('loadError'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const onFinish = async (values: FormValues) => {
    const token = getClientToken()
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setSubmitting(true)
    try {
      let documentId = values.documentId
      if (!documentId) {
        const created = await createClientDocument(token, {
          title: values.title,
          fileUrl: `strategy://${encodeURIComponent(values.title)}`,
          status: 'CONFIRMED',
        })
        documentId = created.document.id
      }

      const [start, end] = values.period ?? []
      const aiSummary = [values.kpiDescription, values.targetValue, values.currentValue]
        .filter(Boolean)
        .join(' | ')

      const created = await createClientGoal(token, {
        documentId,
        title: values.title,
        description: values.description,
        startDate: toDateString(start),
        endDate: toDateString(end),
        aiSummary: aiSummary || undefined,
      })
      await Promise.all(linkedIds.map((projectId) => createClientGoalLink(token, created.goal.id, projectId)))
      message.success(t('saveGoal'))
      navigate(`/client/goals/${created.goal.id}`)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  const linkedProjects = projects.filter((project) => linkedIds.includes(project.id))
  const availableProjects = projects.filter((project) => !linkedIds.includes(project.id))

  return (
    <FormPageHeader
      parentLabel={t('strategicGoals')}
      currentLabel={t('addGoalFull')}
      backTo="/client/goals"
      title={t('addGoalFull')}
    >
      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        onFinish={onFinish}
      >
        <AiUploadBanner kind="goal" mapFields={goalFormValues} />

        <FormSection title={t('goalBasicInfo')}>
          <Form.Item label={t('goalName')} name="title" rules={[{ required: true }]}>
            <Input placeholder={t('example')} />
          </Form.Item>
          <Form.Item label={t('goalDescription')} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('strategicGoals')} name="documentId">
            <Select
              allowClear
              placeholder={t('strategicGoals')}
              options={documents.map((d) => ({ value: d.id, label: d.title }))}
            />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label={t('goalPeriod')} name="period">
              <DatePicker.RangePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('priority')} name="priority" initialValue="high">
              <Select
                options={[
                  { value: 'high', label: t('highF') },
                  { value: 'medium', label: t('mediumF') },
                  { value: 'low', label: t('lowF') },
                ]}
              />
            </Form.Item>
          </div>
        </FormSection>

        <FormSection title={t('kpiSection')}>
          <Form.Item label={t('kpiDescription')} name="kpiDescription">
            <Input placeholder={t('kpiDescriptionPlaceholder')} />
          </Form.Item>
          <div className="form-grid-3">
            <Form.Item label={t('measurementType')} name="measurementType" initialValue="percent">
              <Select
                options={[
                  { value: 'percent', label: t('percentType') },
                  { value: 'number', label: t('numberType') },
                ]}
              />
            </Form.Item>
            <Form.Item label={t('targetValue')} name="targetValue">
              <Input placeholder="100%" />
            </Form.Item>
            <Form.Item label={t('currentValue')} name="currentValue">
              <Input placeholder="10" />
            </Form.Item>
          </div>
        </FormSection>

        <FormSection title={t('linkedProjects')}>
          <div className="form-linked-empty">
            {linkedProjects.length > 0 ? (
              <div className="add-goal__projects-list">
                {linkedProjects.map((project) => (
                  <div className="add-goal__project-row" key={project.id}>
                    <div className="add-goal__project-actions">
                      <button
                        type="button"
                        className="add-goal__delete-btn"
                        onClick={() => setLinkedIds((current) => current.filter((id) => id !== project.id))}
                        aria-label={t('delete')}
                      >
                        ×
                      </button>
                    </div>
                    <div className="add-goal__project-details">
                      <strong>{project.name}</strong>
                      <span>{project.client?.name || t('projects')}</span>
                    </div>
                    <span className="add-goal__status-dot" />
                  </div>
                ))}
              </div>
            ) : (
              <p>{t('noLinkedProjectsYet')}</p>
            )}
            {projectsError ? (
              <p>{t('loadError')}</p>
            ) : projects.length === 0 ? (
              <p>{t('noProjectsAvailableToLink')}</p>
            ) : (
              <label className="add-goal__field">
                <span>{t('chooseProject')}</span>
                <select
                  className="client-goal-project-select"
                  value=""
                  onChange={(event) => {
                    const id = event.target.value
                    if (id) setLinkedIds((current) => (current.includes(id) ? current : [...current, id]))
                  }}
                >
                  <option value="">{t('linkProject')}</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </FormSection>

        <FormActions cancelTo="/client/goals" submitLabel={t('saveGoal')} loading={submitting} />
      </Form>
    </FormPageHeader>
  )
}
