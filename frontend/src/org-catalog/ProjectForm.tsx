import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, ChevronLeft, Plus, Trash2, Upload } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { commonAssets, projectsAssets } from '@/assets'
import { AssetIcon } from '../components/ui/AssetIcon'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { extractFromDocument } from '../api/me'
import {
  getCompanies,
  getDepartments,
  getAssignableOrgUsers,
  type Department,
  type ExecutingCompany,
} from '../api/org'
import {
  createClientNested,
  createClientProject,
  deleteClientProjectAttachment,
  getClientProjectById,
  getAssignableClientUsers,
  submitClientProject,
  updateClientNested,
  updateClientProject,
  uploadClientProjectAttachments,
  type CreateClientProjectPayload,
} from '../api/clientPortal'
import {
  createProject,
  createProjectContract,
  createProjectDeliverable,
  createProjectPhase,
  deleteProjectAttachment,
  getProjectById,
  submitProject,
  updateProject,
  updateProjectDeliverable,
  updateProjectPhase,
  uploadProjectAttachments,
  type CreateProjectPayload,
  type OrgProject,
  type ProjectAttachment,
} from '../api/orgProjects'
import { getClientRole, getClientToken } from '../auth/clientAuth'
import { getOrgRole, getOrgToken } from '../auth/orgAuth'
import { isDataEntry } from '../auth/permissions'
import { isPendingApproval } from './approvalStatus'
import { SubpageHeader } from '../components/ui'

type ProjectPortal = 'org' | 'client'
type FormUser = { id: string; name: string; email: string }

type StageDraft = {
  id: number
  backendId?: string
  name: string
  status: string
  startDate: string
  endDate: string
  activities: Array<{ id: number; name: string; owner: string; startDate: string; endDate: string }>
}

type DeliverableDraft = {
  id: number
  backendId?: string
  name: string
  stage: string
  owner: string
}

type AttachmentDraft = {
  key: string
  file?: File
  backendId?: string
  name: string
  type: string
  size: number
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  error?: string
  fileUrl?: string
}

type ProjectFormState = {
  name: string
  type: string
  classification: string
  executingCompanyId: string
  departmentId: string
  managerId: string
  description: string
  startDate: string
  endDate: string
  budget: string
  contractNumber: string
  contractingEntity: string
  contractDate: string
  contractStatus: string
  contractStartDate: string
  contractEndDate: string
  orgProjectManagerName: string
  clientProjectManagerName: string
  scopeMain: string
  scopeExcluded: string
  deliverables: DeliverableDraft[]
  assumptions: string[]
  constraints: string[]
  stages: StageDraft[]
}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.fig']
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

function emptyStage(id: number): StageDraft {
  return { id, name: '', status: '', startDate: '', endDate: '', activities: [] }
}

function toInputDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function splitLines(value?: string | null) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function fileExt(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/)
  return match ? match[0] : ''
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function attachmentsFromProject(list?: ProjectAttachment[] | unknown[]): AttachmentDraft[] {
  if (!Array.isArray(list)) return []
  return list.map((item, index) => {
    const rec = item as ProjectAttachment
    return {
      key: rec.id || `saved-${index}`,
      backendId: rec.id,
      name: rec.fileName || 'file',
      type: rec.fileType || fileExt(rec.fileName || ''),
      size: rec.fileSize ?? 0,
      status: 'uploaded' as const,
      fileUrl: rec.fileUrl,
    }
  })
}

function deliverablesFromProject(list?: unknown[]): DeliverableDraft[] {
  if (!Array.isArray(list) || list.length === 0) return []
  return list.map((item, index) => {
    const rec = item as Record<string, unknown>
    const description = String(rec.description ?? '')
    const [stage = '', owner = ''] = description.split(' | ')
    return {
      id: index + 1,
      backendId: typeof rec.id === 'string' ? rec.id : undefined,
      name: String(rec.name ?? ''),
      stage,
      owner,
    }
  })
}

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  options,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date' | 'number'
  options?: Array<{ value: string; label: string }>
  disabled?: boolean
}) {
  return (
    <label className="create-project__field">
      <span>{label}</span>
      {options ? (
        <div className="create-project__input-wrap create-project__select-wrap">
          <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronLeft size={12} className="create-project__select-chevron" />
        </div>
      ) : (
        <div className={`create-project__input-wrap ${type === 'date' ? 'create-project__date-wrap' : ''}`}>
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
          {type === 'date' ? <CalendarDays size={15} className="create-project__date-icon" aria-hidden /> : null}
        </div>
      )}
    </label>
  )
}

function ReviewField({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`create-project__review-field ${full ? 'create-project__review-field--full' : ''}`}>
      <span>{label}</span>
      <div>{value || '—'}</div>
    </div>
  )
}

function monthPosition(date: string) {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  const month = parsed.getMonth()
  const day = parsed.getDate()
  const daysInMonth = new Date(parsed.getFullYear(), month + 1, 0).getDate()
  return ((month + (day - 1) / daysInMonth) / 12) * 100
}

function Timeline({
  stages,
  title,
  emptyLabel,
}: {
  stages: StageDraft[]
  title: string
  emptyLabel: string
}) {
  const visible = stages.filter((stage) => stage.name.trim() && stage.startDate && stage.endDate)
  return (
    <section className="create-project__timeline-card">
      <div className="create-project__timeline-title-row">
        <div className="create-project__timeline-icon">▣</div>
        <h2>{title}</h2>
      </div>
      <div className="create-project__timeline-grid">
        <div className="create-project__timeline-months">
          {months.map((month) => (
            <div key={month}>{month}</div>
          ))}
        </div>
        <div className="create-project__timeline-body">
          {visible.map((stage, index) => {
            const start = monthPosition(stage.startDate)
            const end = monthPosition(stage.endDate)
            if (start === null || end === null) return null
            const left = Math.max(0, Math.min(100, start))
            const right = Math.max(left + 2, Math.min(100, end))
            const colors = ['#f9d9d7', '#ccefe0', '#d5e9fe', '#a8d6a2', '#f9e2c4']
            return (
              <div
                className="create-project__timeline-bar"
                key={stage.id}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(5, right - left)}%`,
                  top: 18 + (index % 5) * 31,
                  background: colors[index % colors.length],
                }}
              >
                <span>
                  {stage.startDate} - {stage.endDate}
                </span>
                <strong>{stage.name}</strong>
              </div>
            )
          })}
          {visible.length === 0 ? <div className="create-project__timeline-empty">{emptyLabel}</div> : null}
        </div>
      </div>
    </section>
  )
}

function fromProject(project: OrgProject): ProjectFormState {
  const phases = Array.isArray(project.phases) ? project.phases : []
  return {
    name: project.name ?? '',
    type: project.type ?? '',
    classification: project.classification ?? '',
    executingCompanyId: project.executingCompanyId ?? '',
    departmentId: project.departmentId ?? '',
    managerId: project.managerId ?? '',
    description: project.description ?? '',
    startDate: toInputDate(project.startDate),
    endDate: toInputDate(project.endDate),
    budget: project.budget != null ? String(project.budget) : '',
    contractNumber: '',
    contractingEntity: project.executingCompany?.name ?? '',
    contractDate: '',
    contractStatus: '',
    contractStartDate: '',
    contractEndDate: '',
    orgProjectManagerName: project.orgProjectManagerName ?? '',
    clientProjectManagerName: project.clientProjectManagerName ?? '',
    scopeMain: project.scopeMain ?? '',
    scopeExcluded: project.scopeExcluded ?? '',
    deliverables: deliverablesFromProject(project.deliverables),
    assumptions: splitLines(project.assumptions),
    constraints: splitLines(project.constraints),
    stages:
      phases.length > 0
        ? phases.map((phase, index) => {
            const rec = phase as Record<string, unknown>
            return {
              id: index + 1,
              backendId: typeof rec.id === 'string' ? rec.id : undefined,
              name: String(rec.title ?? ''),
              status: String(rec.scope ?? ''),
              startDate: toInputDate(typeof rec.startDate === 'string' ? rec.startDate : null),
              endDate: toInputDate(typeof rec.endDate === 'string' ? rec.endDate : null),
              activities: [],
            }
          })
        : [emptyStage(1)],
  }
}

export function ProjectForm({
  mode,
  portal = 'org',
}: {
  mode: 'create' | 'edit'
  portal?: ProjectPortal
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const isClient = portal === 'client'
  const listPath = isClient ? '/client/projects' : '/org/projects'
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedId, setSavedId] = useState<string | undefined>(mode === 'edit' ? projectId : undefined)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentsInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([])
  const [newAssumption, setNewAssumption] = useState('')
  const [newConstraint, setNewConstraint] = useState('')
  const [dragging, setDragging] = useState(false)
  const [users, setUsers] = useState<FormUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<ExecutingCompany[]>([])
  const [approvalStatus, setApprovalStatus] = useState<string>('DRAFT')
  const [rejectionReason, setRejectionReason] = useState('')
  const role = isClient ? getClientRole() : getOrgRole()
  const entryUser = role ? isDataEntry(role) : false
  const maxStep = entryUser ? 4 : 3
  const phasesStep = entryUser ? 3 : 2
  const [form, setForm] = useState<ProjectFormState>({
    name: '',
    type: '',
    classification: '',
    executingCompanyId: '',
    departmentId: '',
    managerId: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    contractNumber: '',
    contractingEntity: '',
    contractDate: '',
    contractStatus: '',
    contractStartDate: '',
    contractEndDate: '',
    orgProjectManagerName: '',
    clientProjectManagerName: '',
    scopeMain: '',
    scopeExcluded: '',
    deliverables: [],
    assumptions: [],
    constraints: [],
    stages: [emptyStage(1)],
  })

  useEffect(() => {
    const token = isClient ? getClientToken() : getOrgToken()
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        if (isClient) {
          const usersRes = await getAssignableClientUsers(token)
          if (cancelled) return
          setUsers(usersRes.users ?? [])
        } else {
          const [usersRes, deptsRes, companiesRes] = await Promise.all([
            getAssignableOrgUsers(token),
            getDepartments(token),
            getCompanies(token),
          ])
          if (cancelled) return
          setUsers(usersRes.users ?? [])
          setDepartments(deptsRes.departments ?? [])
          setCompanies(companiesRes.companies ?? [])
        }
        if (mode === 'edit' && projectId) {
          const { project } = isClient
            ? await getClientProjectById(token, projectId)
            : await getProjectById(token, projectId)
          if (cancelled) return
          if (isPendingApproval(project.approvalStatus)) {
            const currentRole = isClient ? getClientRole() : getOrgRole()
            if (currentRole && isDataEntry(currentRole)) {
              navigate(`${listPath}/${projectId}`)
              return
            }
          }
          setForm(fromProject(project as OrgProject))
          setAttachments(attachmentsFromProject((project as OrgProject).attachments))
          setApprovalStatus(project.approvalStatus ?? 'DRAFT')
          setRejectionReason(project.rejectionReason ?? '')
        }
      } catch (err) {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, projectId, t, navigate, isClient, listPath])

  const update = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const updateStage = (stageId: number, key: keyof StageDraft, value: string) => {
    update(
      'stages',
      form.stages.map((stage) => (stage.id === stageId ? { ...stage, [key]: value } : stage)),
    )
  }

  const [extracting, setExtracting] = useState(false)

  /** Reads the contract with the AI extractor and fills only the fields that are still empty. */
  async function prefillFromContract(file: File) {
    const token = isClient ? getClientToken() : getOrgToken()
    if (!token) return
    if (!/\.(pdf|txt|md)$/i.test(file.name)) {
      message.info('سيُرفق الملف مع المشروع، والتعبئة التلقائية تدعم ملفات PDF والنصوص فقط')
      return
    }
    setExtracting(true)
    try {
      const { fields } = await extractFromDocument(token, 'project', file)
      const text = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '')
      const date = (value: unknown) => (/^\d{4}-\d{2}-\d{2}/.test(text(value)) ? text(value).slice(0, 10) : '')
      const found: Partial<ProjectFormState> = {
        name: text(fields.name),
        description: text(fields.description),
        startDate: date(fields.startDate),
        endDate: date(fields.endDate),
        budget: Number.isFinite(Number(fields.budget)) && text(fields.budget) ? String(Number(fields.budget)) : '',
        orgProjectManagerName: text(fields.orgProjectManagerName),
        clientProjectManagerName: text(fields.clientProjectManagerName),
      }
      const updates = (Object.entries(found) as Array<[keyof ProjectFormState, string]>).filter(
        ([key, value]) => value && !String(form[key] ?? '').trim(),
      )
      const filled = updates.length
      if (filled) setForm((current) => ({ ...current, ...Object.fromEntries(updates) }))
      message.success(filled ? `تمت تعبئة ${filled} من الحقول من الملف، راجعها قبل الحفظ` : 'لم تُعبأ حقول جديدة من الملف')
    } catch (err) {
      const text = err instanceof ApiError ? err.message : t('loadError')
      if (err instanceof ApiError && err.status === 503) message.warning(`${text} سيُرفق الملف مع المشروع.`)
      else message.error(text)
    } finally {
      setExtracting(false)
    }
  }

  const payload = useMemo<CreateProjectPayload | CreateClientProjectPayload>(
    () => ({
      name: form.name.trim(),
      type: form.type || undefined,
      classification: form.classification || undefined,
      description: form.description || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: form.budget ? Number(form.budget) : undefined,
      managerId: form.managerId,
      ...(!isClient
        ? {
            departmentId: form.departmentId || undefined,
            executingCompanyId: form.executingCompanyId || undefined,
          }
        : {}),
      orgProjectManagerName: form.orgProjectManagerName || undefined,
      clientProjectManagerName: form.clientProjectManagerName || undefined,
      scopeMain: form.scopeMain || undefined,
      scopeExcluded: form.scopeExcluded || undefined,
      assumptions: form.assumptions.filter(Boolean).join('\n') || undefined,
      constraints: form.constraints.filter(Boolean).join('\n') || undefined,
    }),
    [form, isClient],
  )

  const persistRelated = async (token: string, id: string) => {
    const completeStages = form.stages.filter((stage) => stage.name.trim() && stage.startDate && stage.endDate)
    await Promise.all(
      completeStages.map((stage) => {
        const body = {
          title: stage.name.trim(),
          startDate: stage.startDate,
          endDate: stage.endDate,
          scope: stage.status || undefined,
          notes:
            stage.activities.length > 0
              ? stage.activities
                  .map((activity) =>
                    [activity.name, activity.owner, activity.startDate, activity.endDate].filter(Boolean).join(' | '),
                  )
                  .join('\n')
              : undefined,
        }
        if (isClient) {
          if (stage.backendId) return updateClientNested(token, id, 'phases', stage.backendId, body)
          return createClientNested(token, id, 'phases', body)
        }
        if (stage.backendId) return updateProjectPhase(token, id, stage.backendId, body)
        return createProjectPhase(token, id, body)
      }),
    )
    let contractFileUrl = ''
    if (contractFile) {
      const uploaded = isClient
        ? await uploadClientProjectAttachments(token, id, [contractFile])
        : await uploadProjectAttachments(token, id, [contractFile])
      const saved = uploaded.attachments?.[0]
      if (saved) {
        contractFileUrl = saved.downloadPath ?? ''
        setAttachments((current) => [...current, ...attachmentsFromProject([saved])])
      }
      setContractFile(null)
    }
    if (form.contractNumber.trim() && form.contractStartDate && form.contractEndDate) {
      const contractBody = {
        name: form.contractNumber.trim(),
        fileUrl: contractFileUrl,
        startDate: form.contractStartDate,
        endDate: form.contractEndDate,
      }
      if (isClient) {
        await createClientNested(token, id, 'contracts', contractBody)
      } else {
        await createProjectContract(token, id, contractBody)
      }
    }

    const namedDeliverables = form.deliverables.filter((item) => item.name.trim())
    await Promise.all(
      namedDeliverables.map((item) => {
        const body = {
          name: item.name.trim(),
          description: [item.stage, item.owner].filter(Boolean).join(' | ') || undefined,
        }
        if (isClient) {
          if (item.backendId) return updateClientNested(token, id, 'deliverables', item.backendId, body)
          return createClientNested(token, id, 'deliverables', body)
        }
        if (item.backendId) return updateProjectDeliverable(token, id, item.backendId, body)
        return createProjectDeliverable(token, id, body)
      }),
    )

    const pending = attachments.filter((item) => item.file && !item.backendId)
    if (pending.length > 0) {
      setAttachments((current) =>
        current.map((item) =>
          pending.some((entry) => entry.key === item.key) ? { ...item, status: 'uploading' } : item,
        ),
      )
      const files = pending.map((item) => item.file as File)
      try {
        const result = isClient
          ? await uploadClientProjectAttachments(token, id, files)
          : await uploadProjectAttachments(token, id, files)
        const saved = result.attachments ?? []
        setAttachments((current) =>
          current.map((item) => {
            const index = pending.findIndex((entry) => entry.key === item.key)
            if (index < 0) return item
            const rec = saved[index]
            if (!rec) return { ...item, status: 'error', error: t('uploadFailed') }
            return {
              ...item,
              file: undefined,
              backendId: rec.id,
              fileUrl: rec.fileUrl,
              status: 'uploaded' as const,
              error: undefined,
            }
          }),
        )
      } catch (err) {
        setAttachments((current) =>
          current.map((item) =>
            pending.some((entry) => entry.key === item.key)
              ? {
                  ...item,
                  status: 'error',
                  error: err instanceof ApiError && err.message.trim() ? err.message : t('uploadFailed'),
                }
              : item,
          ),
        )
        throw err
      }
    }
  }

  const validateCore = () => {
    if (!form.name.trim()) return t('projectNameRequired')
    if (!form.startDate || !form.endDate) return t('projectDatesRequired')
    if (!form.managerId) return t('projectManagerRequired')
    return null
  }

  const save = async (andSubmit = false) => {
    const validationError = validateCore()
    if (validationError) {
      setError(validationError)
      return
    }
    const token = isClient ? getClientToken() : getOrgToken()
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setSubmitting(true)
    try {
      const existingId = savedId || (mode === 'edit' ? projectId : undefined)
      const result = existingId
        ? isClient
          ? await updateClientProject(token, existingId, payload)
          : await updateProject(token, existingId, payload as CreateProjectPayload)
        : isClient
          ? await createClientProject(token, payload)
          : await createProject(token, payload as CreateProjectPayload)
      const id = result.project.id
      setSavedId(id)
      await persistRelated(token, id)
      if (andSubmit && entryUser) {
        if (isClient) await submitClientProject(token, id)
        else await submitProject(token, id)
        message.success(t('submittedForApproval'))
      } else {
        message.success(entryUser ? t('saveDraft') : t('saveProject'))
      }
      navigate(`${listPath}/${id}`)
    } catch (err) {
      const fallback = andSubmit ? t('submitForApprovalFailed') : t('saveDraftFailed')
      message.error(err instanceof ApiError && err.message.trim() ? err.message : fallback)
    } finally {
      setSubmitting(false)
    }
  }

  const next = () => {
    if (step === 1 && !form.name.trim()) {
      setError(t('projectNameRequired'))
      return
    }
    setError('')
    setStep((current) => Math.min(maxStep, current + 1))
  }

  const addSelectedFiles = (list: FileList | File[] | null) => {
    if (!list) return
    const incoming = Array.from(list)
    const additions: AttachmentDraft[] = []
    for (const file of incoming) {
      const ext = fileExt(file.name)
      if (!ACCEPTED_EXT.includes(ext)) {
        setError(t('fileTypeNotAllowed'))
        continue
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(t('fileTooLarge'))
        continue
      }
      additions.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        type: file.type || ext,
        size: file.size,
        status: 'pending',
      })
    }
    if (additions.length > 0) {
      setAttachments((current) => [...current, ...additions])
      setError('')
    }
  }

  const removeAttachment = async (item: AttachmentDraft) => {
    if (item.backendId) {
      const token = isClient ? getClientToken() : getOrgToken()
      const projectIdToUse = savedId || projectId
      if (token && projectIdToUse) {
        try {
          if (isClient) await deleteClientProjectAttachment(token, projectIdToUse, item.backendId)
          else await deleteProjectAttachment(token, projectIdToUse, item.backendId)
        } catch (err) {
          message.error(err instanceof ApiError ? err.message : t('uploadFailed'))
          return
        }
      }
    }
    setAttachments((current) => current.filter((entry) => entry.key !== item.key))
  }

  const companyLabel =
    companies.find((company) => company.id === form.executingCompanyId)?.name || form.contractingEntity || '—'
  const steps = entryUser
    ? [t('basicInfoStep'), t('stepScopeDeliverables'), t('stagesScheduleStep'), t('stepAttachmentsSubmit')]
    : [t('basicInfoStep'), t('stagesScheduleStep'), t('reviewFinalStep')]
  const progressWidth = steps.length > 1 ? `${((step - 1) / (steps.length - 1)) * 100}%` : '0%'

  return (
    <div className="dashboard-page create-project" dir="rtl">
      <SubpageHeader
        parent={t('projects')}
        title={mode === 'edit' ? t('editProject') : t('addProjectFull')}
        subtitle={t('createProjectSubtitle')}
        onBack={() => navigate(listPath)}
      />
      <div className="create-project__body">
        <div className={`create-project__steps ${entryUser ? 'create-project__steps--four' : ''}`}>
          {entryUser ? (
            <div className="create-project__steps-track">
              <div className="create-project__steps-progress" style={{ width: progressWidth }} />
            </div>
          ) : null}
          {steps.map((label, index) => {
            const number = index + 1
            return (
              <div className="create-project__step" key={label}>
                <div
                  className={`create-project__step-circle ${number === step ? 'is-active' : ''} ${
                    number < step ? 'is-complete' : ''
                  } ${number <= step ? 'is-reached' : ''}`}
                >
                  {number}
                </div>
                <span className={number === step ? 'is-active' : ''}>{label}</span>
              </div>
            )
          })}
        </div>

        <section className="create-project__upload">
          <button type="button" className="create-project__upload-button" onClick={() => fileInputRef.current?.click()}>
            <AssetIcon src={commonAssets.upload} size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              setContractFile(file)
              event.target.value = ''
              void prefillFromContract(file)
            }}
          />
          <div className="create-project__upload-copy">
            <strong>{t('aiUploadProjectTitle')}</strong>
            <span>{extracting ? 'جاري قراءة الملف...' : t('aiUploadProjectSubtitle')}</span>
            {contractFile ? (
              <small>
                <AssetIcon src={projectsAssets.contract} size={14} /> {contractFile.name}
              </small>
            ) : null}
          </div>
          <div className="create-project__upload-icon">
            <AssetIcon src={projectsAssets.contract} size={24} />
          </div>
        </section>

        {step === 1 ? (
          <>
            <section className="create-project__card">
              <h2>{t('projectBasicInfo')}</h2>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <Field label={t('projectName')} value={form.name} onChange={(value) => update('name', value)} />
                <Field label={t('projectType')} value={form.type} onChange={(value) => update('type', value)} />
                <Field
                  label={t('classification')}
                  value={form.classification}
                  onChange={(value) => update('classification', value)}
                />
                {!isClient ? (
                  <Field
                    label={t('company')}
                    value={form.executingCompanyId}
                    onChange={(value) => update('executingCompanyId', value)}
                    placeholder={t('chooseCompany')}
                    options={companies.map((company) => ({ value: company.id, label: company.name }))}
                  />
                ) : (
                  <Field
                    label={t('contractingParty')}
                    value={form.contractingEntity}
                    onChange={(value) => update('contractingEntity', value)}
                  />
                )}
              </div>
              <label className="create-project__field create-project__field--full">
                <span>{t('description')}</span>
                <textarea value={form.description} onChange={(event) => update('description', event.target.value)} />
              </label>
              <div className="create-project__grid">
                <Field
                  label={t('startDate')}
                  value={form.startDate}
                  onChange={(value) => update('startDate', value)}
                  type="date"
                />
                <Field
                  label={t('endDate')}
                  value={form.endDate}
                  onChange={(value) => update('endDate', value)}
                  type="date"
                />
              </div>
            </section>

            <section className="create-project__card">
              <h2>{t('budgetAndContract')}</h2>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <Field
                  label={t('contractNumber')}
                  value={form.contractNumber}
                  onChange={(value) => update('contractNumber', value)}
                />
                <Field
                  label={t('contractingParty')}
                  value={form.contractingEntity}
                  onChange={(value) => update('contractingEntity', value)}
                />
                <Field
                  label={t('signDate')}
                  value={form.contractDate}
                  onChange={(value) => update('contractDate', value)}
                  type="date"
                />
                <Field
                  label={t('contractStatusLabel')}
                  value={form.contractStatus}
                  onChange={(value) => update('contractStatus', value)}
                  placeholder={t('choose')}
                  options={[
                    { value: 'active', label: t('contractActive') },
                    { value: 'expired', label: t('contractExpired') },
                    { value: 'onHold', label: t('onHold') },
                  ]}
                />
                <Field
                  label={t('contractStart')}
                  value={form.contractStartDate}
                  onChange={(value) => update('contractStartDate', value)}
                  type="date"
                />
                <Field
                  label={t('contractEnd')}
                  value={form.contractEndDate}
                  onChange={(value) => update('contractEndDate', value)}
                  type="date"
                />
              </div>
              <label className="create-project__field create-project__field--full">
                <span>{t('totalBudgetSar')}</span>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(event) => update('budget', event.target.value)}
                />
              </label>
            </section>

            <section className="create-project__card create-project__parties">
              <h2>{t('projectParties')}</h2>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <Field
                  label={t('manager')}
                  value={form.managerId}
                  onChange={(value) => update('managerId', value)}
                  placeholder={t('manager')}
                  options={users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` }))}
                />
                {!isClient ? (
                  <Field
                    label={t('department')}
                    value={form.departmentId}
                    onChange={(value) => update('departmentId', value)}
                    placeholder={t('chooseDepartment')}
                    options={departments.map((department) => ({ value: department.id, label: department.name }))}
                  />
                ) : null}
              </div>
              <div className="create-project__party-list" style={{ marginTop: 12 }}>
                <div className="create-project__party">
                  <div className="create-project__party-avatar">ج</div>
                  <div className="create-project__party-copy">
                    <strong>{t('orgProjectManager')}</strong>
                    <input
                      value={form.orgProjectManagerName}
                      onChange={(event) => update('orgProjectManagerName', event.target.value)}
                      style={{ border: 0, background: 'transparent', textAlign: 'right' }}
                    />
                  </div>
                </div>
                <div className="create-project__party">
                  <div className="create-project__party-avatar">ع</div>
                  <div className="create-project__party-copy">
                    <strong>{t('clientProjectManager')}</strong>
                    <input
                      value={form.clientProjectManagerName}
                      onChange={(event) => update('clientProjectManagerName', event.target.value)}
                      style={{ border: 0, background: 'transparent', textAlign: 'right' }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {entryUser && step === 2 ? (
          <>
            <section className="create-project__card">
              <h2>{t('workScope')}</h2>
              <div className="create-project__divider" />
              <label className="create-project__field">
                <span>{t('scopeMainLabel')}</span>
                <textarea value={form.scopeMain} onChange={(event) => update('scopeMain', event.target.value)} />
              </label>
              <label className="create-project__field create-project__field--full">
                <span>{t('scopeExcludedLabel')}</span>
                <textarea value={form.scopeExcluded} onChange={(event) => update('scopeExcluded', event.target.value)} />
              </label>
            </section>

            <section className="create-project__card">
              <h2>{t('mainDeliverables')}</h2>
              <div className="create-project__divider" />
              <div className="create-project__list">
                {form.deliverables.map((item) => (
                  <div className="create-project__list-row" key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          'deliverables',
                          form.deliverables.filter((entry) => entry.id !== item.id),
                        )
                      }
                      aria-label={t('delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="create-project__list-copy">
                      <input
                        className="create-project__inline-input create-project__inline-input--title"
                        value={item.name}
                        placeholder={t('deliverableName')}
                        onChange={(event) =>
                          update(
                            'deliverables',
                            form.deliverables.map((entry) =>
                              entry.id === item.id ? { ...entry, name: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                      <div className="create-project__list-meta">
                        <input
                          className="create-project__inline-input"
                          value={item.stage}
                          placeholder={t('phase')}
                          onChange={(event) =>
                            update(
                              'deliverables',
                              form.deliverables.map((entry) =>
                                entry.id === item.id ? { ...entry, stage: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                        <span>•</span>
                        <input
                          className="create-project__inline-input"
                          value={item.owner}
                          placeholder={t('responsible')}
                          onChange={(event) =>
                            update(
                              'deliverables',
                              form.deliverables.map((entry) =>
                                entry.id === item.id ? { ...entry, owner: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                    <span className="create-project__dot create-project__dot--green" />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="create-project__add-party"
                onClick={() =>
                  update('deliverables', [
                    ...form.deliverables,
                    { id: Date.now(), name: '', stage: '', owner: '' },
                  ])
                }
              >
                {t('addDeliverableNew')} <Plus size={17} />
              </button>
            </section>

            <section className="create-project__card">
              <h2>{t('assumptionsAndConstraints')}</h2>
              <div className="create-project__divider" />
              <div className="create-project__field-label">{t('assumptionsLabel')}</div>
              <div className="create-project__list">
                {form.assumptions.map((item, index) => (
                  <div className="create-project__list-row" key={`${item}-${index}`}>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          'assumptions',
                          form.assumptions.filter((_, current) => current !== index),
                        )
                      }
                      aria-label={t('delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="create-project__list-copy">
                      <strong>{item}</strong>
                    </div>
                    <span className="create-project__dot create-project__dot--green" />
                  </div>
                ))}
              </div>
              <div className="create-project__inline-add">
                <button
                  type="button"
                  onClick={() => {
                    if (!newAssumption.trim()) return
                    update('assumptions', [...form.assumptions, newAssumption.trim()])
                    setNewAssumption('')
                  }}
                >
                  {t('add')}
                </button>
                <input
                  value={newAssumption}
                  placeholder={t('addAssumptionPlaceholder')}
                  onChange={(event) => setNewAssumption(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    if (!newAssumption.trim()) return
                    update('assumptions', [...form.assumptions, newAssumption.trim()])
                    setNewAssumption('')
                  }}
                />
              </div>
              <div className="create-project__field-label">{t('constraintsLabel')}</div>
              <div className="create-project__list">
                {form.constraints.map((item, index) => (
                  <div className="create-project__list-row" key={`${item}-${index}`}>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          'constraints',
                          form.constraints.filter((_, current) => current !== index),
                        )
                      }
                      aria-label={t('delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="create-project__list-copy">
                      <strong>{item}</strong>
                    </div>
                    <span className="create-project__dot create-project__dot--red" />
                  </div>
                ))}
              </div>
              <div className="create-project__inline-add">
                <button
                  type="button"
                  onClick={() => {
                    if (!newConstraint.trim()) return
                    update('constraints', [...form.constraints, newConstraint.trim()])
                    setNewConstraint('')
                  }}
                >
                  {t('add')}
                </button>
                <input
                  value={newConstraint}
                  placeholder={t('addConstraintPlaceholder')}
                  onChange={(event) => setNewConstraint(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    if (!newConstraint.trim()) return
                    update('constraints', [...form.constraints, newConstraint.trim()])
                    setNewConstraint('')
                  }}
                />
              </div>
            </section>
          </>
        ) : null}

        {step === phasesStep ? (
          <>
            <Timeline stages={form.stages} title={t('setTimeline')} emptyLabel={t('addStageDatesHint')} />
            <section className="create-project__stages-card">
              <h2>{t('projectPhases')}</h2>
              {form.stages.map((stage, index) => (
                <div className="create-project__stage-card" key={stage.id}>
                  <div className="create-project__stage-heading">
                    <button
                      type="button"
                      onClick={() => {
                        if (form.stages.length === 1) return
                        update(
                          'stages',
                          form.stages.filter((item) => item.id !== stage.id),
                        )
                      }}
                      disabled={form.stages.length === 1}
                      aria-label={t('delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="create-project__stage-number">{index + 1}</div>
                    <h3>{stage.name || `${t('phaseTitle')} ${index + 1}`}</h3>
                  </div>
                  <div className="create-project__grid">
                    <Field label={t('phaseTitle')} value={stage.name} onChange={(value) => updateStage(stage.id, 'name', value)} />
                    <Field
                      label={t('status')}
                      value={stage.status}
                      onChange={(value) => updateStage(stage.id, 'status', value)}
                    />
                    <Field
                      label={t('startDate')}
                      value={stage.startDate}
                      onChange={(value) => updateStage(stage.id, 'startDate', value)}
                      type="date"
                    />
                    <Field
                      label={t('endDate')}
                      value={stage.endDate}
                      onChange={(value) => updateStage(stage.id, 'endDate', value)}
                      type="date"
                    />
                  </div>
                  <div className="create-project__activities">
                    <h4>{t('activities')}</h4>
                    {stage.activities.map((activity) => (
                      <div className="create-project__activity" key={activity.id}>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              'stages',
                              form.stages.map((item) =>
                                item.id === stage.id
                                  ? {
                                      ...item,
                                      activities: item.activities.filter((entry) => entry.id !== activity.id),
                                    }
                                  : item,
                              ),
                            )
                          }
                          aria-label={t('delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                        <div className="create-project__activity-fields">
                          <Field
                            label={t('activityName')}
                            value={activity.name}
                            onChange={(value) =>
                              update(
                                'stages',
                                form.stages.map((item) =>
                                  item.id === stage.id
                                    ? {
                                        ...item,
                                        activities: item.activities.map((entry) =>
                                          entry.id === activity.id ? { ...entry, name: value } : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          <Field
                            label={t('responsible')}
                            value={activity.owner}
                            onChange={(value) =>
                              update(
                                'stages',
                                form.stages.map((item) =>
                                  item.id === stage.id
                                    ? {
                                        ...item,
                                        activities: item.activities.map((entry) =>
                                          entry.id === activity.id ? { ...entry, owner: value } : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          <Field
                            label={t('startDate')}
                            value={activity.startDate}
                            type="date"
                            onChange={(value) =>
                              update(
                                'stages',
                                form.stages.map((item) =>
                                  item.id === stage.id
                                    ? {
                                        ...item,
                                        activities: item.activities.map((entry) =>
                                          entry.id === activity.id ? { ...entry, startDate: value } : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          <Field
                            label={t('endDate')}
                            value={activity.endDate}
                            type="date"
                            onChange={(value) =>
                              update(
                                'stages',
                                form.stages.map((item) =>
                                  item.id === stage.id
                                    ? {
                                        ...item,
                                        activities: item.activities.map((entry) =>
                                          entry.id === activity.id ? { ...entry, endDate: value } : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="create-project__add-activity"
                      onClick={() =>
                        update(
                          'stages',
                          form.stages.map((item) =>
                            item.id === stage.id
                              ? {
                                  ...item,
                                  activities: [
                                    ...item.activities,
                                    { id: Date.now(), name: '', owner: '', startDate: '', endDate: '' },
                                  ],
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      {t('addActivityNew')} <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="create-project__add-stage"
                onClick={() => update('stages', [...form.stages, emptyStage(Date.now())])}
              >
                {t('addStageNew')} <Plus size={18} />
              </button>
            </section>
          </>
        ) : null}

        { !entryUser && step === 3 ? (
          <>
            <section className="create-project__review-section">
              <div className="create-project__review-section-title">
                <h2>{t('projectBasicInfo')}</h2>
              </div>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <ReviewField label={t('projectName')} value={form.name} />
                <ReviewField label={t('projectType')} value={form.type} />
                <ReviewField label={t('classification')} value={form.classification} />
                <ReviewField label={isClient ? t('contractingParty') : t('company')} value={companyLabel} />
              </div>
              <ReviewField label={t('description')} value={form.description} full />
            </section>
            <Timeline stages={form.stages} title={t('setTimeline')} emptyLabel={t('addStageDatesHint')} />
          </>
        ) : null}

        {entryUser && step === 4 ? (
          <section className="create-project__card">
            <h2>{t('uploadAttachments')}</h2>
            <div className="create-project__divider" />
            <button
              type="button"
              className={`create-project__dropzone ${dragging ? 'is-dragging' : ''}`}
              onClick={() => attachmentsInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                addSelectedFiles(event.dataTransfer.files)
              }}
            >
              <span className="create-project__dropzone-icon">
                <Upload size={20} />
              </span>
              <strong>{t('dragFilesHere')}</strong>
              <span className="create-project__dropzone-types">{t('fileFormatsHint')}</span>
            </button>
            <input
              ref={attachmentsInputRef}
              type="file"
              multiple
              hidden
              accept={ACCEPTED_EXT.join(',')}
              onChange={(event) => {
                addSelectedFiles(event.target.files)
                event.target.value = ''
              }}
            />
            {attachments.length > 0 ? (
              <div className="create-project__list create-project__list--files">
                {attachments.map((file) => (
                  <div className="create-project__list-row" key={file.key}>
                    <button
                      type="button"
                      onClick={() => void removeAttachment(file)}
                      aria-label={t('removeAttachment')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="create-project__list-copy">
                      <strong>{file.name}</strong>
                      <div className="create-project__list-meta">
                        <span>{file.type || fileExt(file.name).replace('.', '').toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span
                          className={`create-project__file-status ${
                            file.status === 'error' ? 'is-error' : file.status === 'uploaded' ? 'is-ok' : ''
                          }`}
                        >
                          {file.status === 'uploading'
                            ? t('uploadingFile')
                            : file.status === 'uploaded'
                              ? t('uploadSuccess')
                              : file.status === 'error'
                                ? file.error || t('uploadFailed')
                                : file.type}
                        </span>
                      </div>
                    </div>
                    <span className={`create-project__dot ${file.status === 'error' ? 'create-project__dot--red' : 'create-project__dot--green'}`} />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {error ? <div className="create-project__error">{error}</div> : null}
        {approvalStatus === 'REJECTED' && rejectionReason ? (
          <div className="approval-banner approval-banner--rejected">
            <p>
              <strong>{t('approvalStatusRejected')}</strong>
              {rejectionReason}
            </p>
          </div>
        ) : null}

        <footer className="create-project__actions">
          {step < maxStep ? (
            <>
              <button type="button" className="create-project__next" onClick={next} disabled={submitting}>
                {t('next')} <ArrowRight size={16} />
              </button>
              <button type="button" className="create-project__draft" onClick={() => void save(false)} disabled={submitting}>
                {t('saveDraft')}
              </button>
              {step > 1 ? (
                <button type="button" className="create-project__previous" onClick={() => setStep(step - 1)}>
                  {t('previous')}
                </button>
              ) : null}
              {!entryUser && step === 2 ? (
                <button type="button" className="create-project__cancel" onClick={() => navigate(listPath)}>
                  {t('cancel')}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button type="button" className="create-project__previous" onClick={() => setStep(step - 1)}>
                {t('previous')}
              </button>
              <button
                type="button"
                className="create-project__draft"
                onClick={() => void save(false)}
                disabled={submitting}
              >
                {t('saveDraft')}
              </button>
              {entryUser ? (
                <button
                  type="button"
                  className="create-project__next create-project__save-project"
                  onClick={() => void save(true)}
                  disabled={submitting}
                >
                  {submitting
                    ? t('submittingForApproval')
                    : approvalStatus === 'REJECTED'
                      ? t('resubmitForApproval')
                      : t('submitForApproval')}
                </button>
              ) : (
                <button
                  type="button"
                  className="create-project__next create-project__save-project"
                  onClick={() => void save(false)}
                  disabled={submitting}
                >
                  {t('saveProject')}
                </button>
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
