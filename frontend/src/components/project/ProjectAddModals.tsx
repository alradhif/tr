import { useRef, useState } from 'react'
import { FilePlus2, FileSignature, FileText, Layers, Upload, UserPlus } from 'lucide-react'
import { ApiError } from '../../api/client'
import { createClientNested } from '../../api/clientPortal'
import {
  createProjectChangeRequest,
  createProjectDeliverable,
  createProjectPhase,
  createProjectRisk,
  createProjectTeamMember,
} from '../../api/orgProjects'
import { getClientToken } from '../../auth/clientAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { TrackFormModal } from '../ui/TrackFormModal'

export type ProjectAddKind = 'deliverable' | 'phase' | 'risk' | 'changeRequest' | 'team'

type PhaseOption = { id: string; title: string }

type SharedProps = {
  projectId: string
  portal: 'org' | 'client'
  phases?: PhaseOption[]
  onClose: () => void
  onSaved: () => void
}

async function postNested(
  portal: 'org' | 'client',
  projectId: string,
  clientResource: string,
  orgCreate: (token: string) => Promise<unknown>,
  clientPayload: Record<string, unknown>,
) {
  if (portal === 'client') {
    const token = getClientToken()
    if (!token) throw new Error('missing token')
    await createClientNested(token, projectId, clientResource, clientPayload)
    return
  }
  const token = getOrgToken()
  if (!token) throw new Error('missing token')
  await orgCreate(token)
}

export function AddDeliverableModal({ projectId, portal, phases = [], onClose, onSaved }: SharedProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [stageId, setStageId] = useState('')
  const [outputType, setOutputType] = useState('')
  const [description, setDescription] = useState('')
  const [riskOwner, setRiskOwner] = useState('')
  const [email, setEmail] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!name.trim() || !emailOk) {
      setError('الرجاء إدخال اسم المخرج وبريد صحيح')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const stage = phases.find((item) => item.id === stageId)
      await postNested(
        portal,
        projectId,
        'deliverables',
        (token) =>
          createProjectDeliverable(token, projectId, {
            name: name.trim(),
            description: [outputType, description].filter(Boolean).join(' — ') || undefined,
            email: email.trim() || undefined,
            status: 'ACTIVE',
            phase: stage?.title,
          }),
        {
          name: name.trim(),
          description: [outputType, description].filter(Boolean).join(' — ') || undefined,
          email: email.trim() || undefined,
          status: 'ACTIVE',
        },
      )
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إضافة المخرج')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TrackFormModal
      title="إضافة مخرج"
      icon={<FilePlus2 size={22} />}
      submitLabel="إضافة"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="project-output-modal__grid">
        <label>
          <span>اسم المخرج</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </label>
        <label>
          <span>المرحلة</span>
          <select value={stageId} onChange={(event) => setStageId(event.target.value)}>
            <option value="">اختر المرحلة</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>نوع المخرج</span>
          <input value={outputType} onChange={(event) => setOutputType(event.target.value)} />
        </label>
        <label>
          <span>وصف المخرج</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          <span>مسؤول المخاطر</span>
          <input value={riskOwner} onChange={(event) => setRiskOwner(event.target.value)} />
        </label>
        <label>
          <span>البريد الإلكتروني</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      </div>
      <div className="project-output-modal__files">
        <span className="project-output-modal__files-label">إضافة ملفات المخرج</span>
        <button
          type="button"
          className="project-output-modal__dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            setFiles((current) => [...current, ...Array.from(event.dataTransfer.files)])
          }}
        >
          <span className="project-output-modal__upload-icon">
            <Upload size={20} />
          </span>
          <strong>اسحب الملفات هنا أو انقر للاختيار</strong>
          <small>PDF,DOCS,XLSX,PNG,JPG,FIG</small>
        </button>
        <input
          ref={fileInputRef}
          className="project-output-modal__file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.fig"
          onChange={(event) => {
            setFiles((current) => [...current, ...Array.from(event.target.files ?? [])])
            event.currentTarget.value = ''
          }}
        />
        {files.length > 0 ? (
          <div className="project-output-modal__file-list">
            {files.map((file, index) => (
              <span key={`${file.name}-${index}`}>{file.name}</span>
            ))}
          </div>
        ) : null}
      </div>
    </TrackFormModal>
  )
}

export function AddPhaseModal({ projectId, portal, onClose, onSaved }: SharedProps) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [scope, setScope] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    if (!title.trim() || !startDate || !endDate) {
      setError('الرجاء إدخال اسم المرحلة وتواريخها')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = { title: title.trim(), startDate, endDate, scope: scope.trim() || undefined }
      await postNested(
        portal,
        projectId,
        'phases',
        (token) => createProjectPhase(token, projectId, payload),
        payload,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إضافة المرحلة')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TrackFormModal
      title="إضافة مرحلة"
      icon={<Layers size={22} />}
      submitLabel="إضافة"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="project-output-modal__grid">
        <label>
          <span>اسم المرحلة</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <label>
          <span>تاريخ البداية</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          <span>تاريخ النهاية</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label>
          <span>النطاق</span>
          <input value={scope} onChange={(event) => setScope(event.target.value)} />
        </label>
      </div>
    </TrackFormModal>
  )
}

export function AddRiskModal({ projectId, portal, onClose, onSaved }: SharedProps) {
  const [name, setName] = useState('')
  const [probability, setProbability] = useState('MEDIUM')
  const [impact, setImpact] = useState('MEDIUM')
  const [responsibleName, setResponsibleName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    if (!name.trim()) {
      setError('الرجاء إدخال اسم الخطر')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        probability,
        impact,
        status: 'ACTIVE',
        responsibleName: responsibleName.trim() || undefined,
      }
      await postNested(
        portal,
        projectId,
        'risks',
        (token) => createProjectRisk(token, projectId, payload),
        payload,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إضافة الخطر')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TrackFormModal
      title="إضافة خطر"
      icon={<FileText size={22} />}
      submitLabel="إضافة"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="project-output-modal__grid">
        <label>
          <span>اسم الخطر</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </label>
        <label>
          <span>الاحتمالية</span>
          <select value={probability} onChange={(event) => setProbability(event.target.value)}>
            <option value="LOW">منخفض</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">مرتفع</option>
            <option value="CRITICAL">حرج</option>
          </select>
        </label>
        <label>
          <span>الأثر</span>
          <select value={impact} onChange={(event) => setImpact(event.target.value)}>
            <option value="LOW">منخفض</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">مرتفع</option>
            <option value="CRITICAL">حرج</option>
          </select>
        </label>
        <label>
          <span>المسؤول</span>
          <input value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} />
        </label>
      </div>
      <div className="project-output-modal__files">
        <span className="project-output-modal__files-label">وصف الخطر</span>
        <textarea
          className="project-output-modal__textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
    </TrackFormModal>
  )
}

export function AddChangeRequestModal({ projectId, portal, onClose, onSaved }: SharedProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [submittedBy, setSubmittedBy] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    if (!title.trim()) {
      setError('الرجاء إدخال عنوان الطلب')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status: 'PENDING',
        submittedBy: submittedBy.trim() || undefined,
        submittedDate: new Date().toISOString(),
      }
      await postNested(
        portal,
        projectId,
        'change-requests',
        (token) => createProjectChangeRequest(token, projectId, payload),
        payload,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إرسال الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TrackFormModal
      title="إضافة طلب تغيير"
      icon={<FileSignature size={22} />}
      submitLabel="إرسال"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="project-output-modal__grid">
        <label>
          <span>عنوان الطلب</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <label>
          <span>الأولوية</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="LOW">منخفض</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">مرتفع</option>
          </select>
        </label>
        <label>
          <span>مقدم الطلب</span>
          <input value={submittedBy} onChange={(event) => setSubmittedBy(event.target.value)} />
        </label>
      </div>
      <div className="project-output-modal__files">
        <span className="project-output-modal__files-label">وصف الطلب</span>
        <textarea
          className="project-output-modal__textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
    </TrackFormModal>
  )
}

export function AddTeamMemberModal({ projectId, portal, onClose, onSaved }: SharedProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    if (!name.trim()) {
      setError('الرجاء إدخال اسم العضو')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = { name: name.trim(), email: email.trim() || undefined, role: role.trim() || undefined, source: 'MANUAL' }
      await postNested(
        portal,
        projectId,
        'team-members',
        (token) => createProjectTeamMember(token, projectId, payload),
        payload,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إضافة العضو')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TrackFormModal
      title="إضافة عضو"
      icon={<UserPlus size={22} />}
      submitLabel="إضافة"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="project-output-modal__grid">
        <label>
          <span>الاسم</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </label>
        <label>
          <span>البريد الإلكتروني</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>الدور</span>
          <input value={role} onChange={(event) => setRole(event.target.value)} />
        </label>
      </div>
    </TrackFormModal>
  )
}

export function ProjectAddModal({
  kind,
  ...props
}: SharedProps & { kind: ProjectAddKind }) {
  if (kind === 'deliverable') return <AddDeliverableModal {...props} />
  if (kind === 'phase') return <AddPhaseModal {...props} />
  if (kind === 'risk') return <AddRiskModal {...props} />
  if (kind === 'changeRequest') return <AddChangeRequestModal {...props} />
  return <AddTeamMemberModal {...props} />
}
