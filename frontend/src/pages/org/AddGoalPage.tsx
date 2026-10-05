import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { commonAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import {
  createDocument,
  createGoal,
  createGoalLink,
  getDocuments,
  getGoalById,
  updateGoal,
  type StrategyDocument,
} from '../../api/orgStrategy'
import { getOrgToken } from '../../auth/orgAuth'
import { SubpageHeader } from '../../components/ui'

function periodToDates(period: string): { startDate?: string; endDate?: string } {
  if (period === '2026') return { startDate: '2026-01-01', endDate: '2026-12-31' }
  if (period === '2027') return { startDate: '2027-01-01', endDate: '2027-12-31' }
  if (period === '2028') return { startDate: '2028-01-01', endDate: '2028-12-31' }
  if (period === '2026-2028') return { startDate: '2026-01-01', endDate: '2028-12-31' }
  return {}
}

function datesToPeriod(start?: string | null, end?: string | null) {
  const startYear = start ? new Date(start).getFullYear() : null
  const endYear = end ? new Date(end).getFullYear() : null
  if (startYear === 2026 && endYear === 2028) return '2026-2028'
  if (startYear && startYear === endYear) return String(startYear)
  return ''
}

export function OrgGoalFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { goalId } = useParams()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [priority, setPriority] = useState('high')
  const [period, setPeriod] = useState('')
  const [kpiDescription, setKpiDescription] = useState('')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [measurement, setMeasurement] = useState('percent')
  const [documents, setDocuments] = useState<StrategyDocument[]>([])
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [linkedIds, setLinkedIds] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = getOrgToken()
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const [docsRes, projectsRes] = await Promise.all([getDocuments(token), getProjects(token)])
        if (cancelled) return
        setDocuments(docsRes.documents ?? [])
        setProjects(projectsRes.projects ?? [])
        if (mode === 'edit' && goalId) {
          const { goal } = await getGoalById(token, goalId)
          if (cancelled) return
          setTitle(goal.title)
          setDescription(goal.description ?? '')
          setDocumentId(goal.documentId)
          setPeriod(datesToPeriod(goal.startDate, goal.endDate))
          setLinkedIds((goal.projectLinks ?? []).map((link) => link.projectId))
          const summary = goal.aiSummary ?? ''
          const [kpi, targetValue, currentValue] = summary.split(' | ')
          if (kpi) setKpiDescription(kpi)
          if (targetValue) setTarget(targetValue)
          if (currentValue) setBaseline(currentValue)
        }
      } catch (err) {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [goalId, mode, t])

  const save = async () => {
    if (!title.trim()) {
      setError(t('goalNameRequired'))
      return
    }
    const token = getOrgToken()
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setSubmitting(true)
    try {
      let resolvedDocumentId = documentId
      if (!resolvedDocumentId) {
        const created = await createDocument(token, {
          title: title.trim(),
          fileUrl: `strategy://${encodeURIComponent(title.trim())}`,
          status: 'CONFIRMED',
        })
        resolvedDocumentId = created.document.id
      }
      const dates = periodToDates(period)
      const aiSummary = [kpiDescription, target, baseline].filter(Boolean).join(' | ')
      if (mode === 'edit' && goalId) {
        await updateGoal(token, goalId, {
          title: title.trim(),
          description: description || undefined,
          startDate: dates.startDate,
          endDate: dates.endDate,
          aiSummary: aiSummary || undefined,
        })
        const existing = new Set(
          ((await getGoalById(token, goalId)).goal.projectLinks ?? []).map((link) => link.projectId),
        )
        await Promise.all(
          linkedIds
            .filter((id) => !existing.has(id))
            .map((id) => createGoalLink(token, goalId, id)),
        )
        message.success(t('saveGoal'))
        navigate(`/org/goals/${goalId}`)
      } else {
        const created = await createGoal(token, {
          documentId: resolvedDocumentId,
          title: title.trim(),
          description: description || undefined,
          startDate: dates.startDate,
          endDate: dates.endDate,
          aiSummary: aiSummary || undefined,
        })
        await Promise.all(linkedIds.map((id) => createGoalLink(token, created.goal.id, id)))
        message.success(t('saveGoal'))
        navigate('/org/goals')
      }
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  const linkedProjects = projects.filter((project) => linkedIds.includes(project.id))

  return (
    <div className="dashboard-page" dir="rtl">
      <SubpageHeader
        parent={t('strategicGoals')}
        title={mode === 'edit' ? t('editGoal') : t('addGoalFull')}
        onBack={() => navigate(mode === 'edit' && goalId ? `/org/goals/${goalId}` : '/org/goals')}
      />
      <div className="add-goal__scroll">
        <div className="add-goal__heading">
          <h1>{mode === 'edit' ? t('editGoal') : t('addGoalFull')}</h1>
        </div>

        <section className="add-goal__upload">
          <button type="button" className="add-goal__upload-btn" onClick={() => document.getElementById('goal-file')?.click()}>
            <AssetIcon src={commonAssets.upload} size={20} />
          </button>
          <input
            id="goal-file"
            type="file"
            accept=".pdf,.doc,.docx"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              setFileName(file.name)
              if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
            }}
          />
          <div className="add-goal__upload-copy">
            <strong>{t('aiUploadTitle')}</strong>
            <span>
              {t('aiUploadSubtitle')}
              {fileName ? ` · ${fileName}` : ''}
            </span>
          </div>
          <div className="add-goal__upload-icon" aria-hidden>
            <Zap size={26} strokeWidth={2} />
          </div>
        </section>

        {error ? <div className="create-project__error">{error}</div> : null}

        <section className="add-goal__card">
          <div className="add-goal__card-title">{t('goalBasicInfo')}</div>
          <div className="add-goal__divider" />
          <label className="add-goal__field">
            <span>{t('goalName')}</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('example')} />
          </label>
          <label className="add-goal__field">
            <span>{t('goalDescription')}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('goalDescriptionPlaceholder')}
            />
          </label>
          <div className="add-goal__field-row">
            <label className="add-goal__field">
              <span>{t('priority')}</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="high">{t('highF')}</option>
                <option value="medium">{t('mediumF')}</option>
                <option value="low">{t('lowF')}</option>
              </select>
            </label>
            <label className="add-goal__field">
              <span>{t('goalPeriod')}</span>
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="">{t('choosePeriod')}</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2026-2028">2026 - 2028</option>
              </select>
            </label>
          </div>
          <label className="add-goal__field">
            <span>{t('strategicGoals')}</span>
            <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
              <option value="">{t('strategicGoals')}</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="add-goal__card">
          <div className="add-goal__card-title">{t('kpiSection')}</div>
          <div className="add-goal__divider" />
          <label className="add-goal__field">
            <span>{t('kpiDescription')}</span>
            <input
              value={kpiDescription}
              onChange={(event) => setKpiDescription(event.target.value)}
              placeholder={t('kpiDescriptionPlaceholder')}
            />
          </label>
          <div className="add-goal__field-row add-goal__kpi-row">
            <label className="add-goal__field add-goal__field--compact">
              <span>{t('currentValue')}</span>
              <input value={baseline} onChange={(event) => setBaseline(event.target.value)} />
            </label>
            <label className="add-goal__field add-goal__field--compact">
              <span>{t('targetValue')}</span>
              <input value={target} onChange={(event) => setTarget(event.target.value)} />
            </label>
            <label className="add-goal__field">
              <span>{t('measurementType')}</span>
              <select value={measurement} onChange={(event) => setMeasurement(event.target.value)}>
                <option value="percent">{t('percentType')}</option>
                <option value="number">{t('numberType')}</option>
                <option value="rate">{t('rateType')}</option>
                <option value="amount">{t('amountType')}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="add-goal__card">
          <div className="add-goal__card-title">{t('linkedProjects')}</div>
          <div className="add-goal__divider" />
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
                  <span>{project.executingCompany?.name || project.department?.name || t('projects')}</span>
                </div>
                <span className="add-goal__status-dot" />
              </div>
            ))}
          </div>
          {linkedProjects.length === 0 ? <p className="goals-empty">{t('noLinkedProjectsYet')}</p> : null}
          <label className="add-goal__field">
            <span>{t('chooseProject')}</span>
            <select
              value=""
              onChange={(event) => {
                const id = event.target.value
                if (id) setLinkedIds((current) => (current.includes(id) ? current : [...current, id]))
              }}
            >
              <option value="">{t('linkProject')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className="add-goal__actions">
          <button type="button" className="add-goal__save-draft" onClick={() => navigate('/org/goals')}>
            {t('cancel')}
          </button>
          <button type="button" className="add-goal__save-primary" onClick={save} disabled={submitting}>
            {t('saveGoal')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrgAddGoalPage() {
  return <OrgGoalFormPage mode="create" />
}

export function OrgEditGoalPage() {
  return <OrgGoalFormPage mode="edit" />
}
