import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { message } from 'antd'
import { Calendar, Clock, Coins, FileWarning, Mail, Phone, ShieldAlert, Target, User } from 'lucide-react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  addOrgRecordComment,
  decideChangeRequest,
  deleteNested,
  getOrgChangeRequest,
  getOrgRisk,
  updateNested,
  type OrgChangeRequestDetail,
  type OrgRiskDetail,
  type RecordComment,
} from '../../api/projectNested'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { LEVEL_META, REQUEST_STATUS, RISK_STATUS, ToneBadge } from '../../components/project/RiskChangeTables'
import { RecordComments } from '../../components/project/RecordComments'
import { CatalogButton, SubpageHeader } from '../../components/ui'
import { SaDialog } from '../../super-admin-ui/components/ui/SaDialog'
import '../../design/deliverable-review.css'

const dateText = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB').replaceAll('/', '-')
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="dr-fact">
      {icon}
      <div>
        <dt>{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  )
}

function useRecord<T>(fetcher: (token: string) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const token = getOrgToken()
    if (!token) return
    try {
      setData(await fetcher(token))
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر تحميل البيانات')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  return { data, loading, load }
}

function RecordShell({
  projectName,
  title,
  actions,
  children,
  loading,
  onBack,
}: {
  projectName?: string
  title?: string
  actions?: ReactNode
  children: ReactNode
  loading: boolean
  onBack: () => void
}) {
  return (
    <div className="dashboard-page dr-page" dir="rtl">
      <SubpageHeader parent={projectName ?? 'المشاريع'} title={title ?? ''} onBack={onBack} actions={actions} />
      <main className="dr-body">
        {loading ? <p className="dr-empty">جاري التحميل...</p> : null}
        {children}
      </main>
    </div>
  )
}

export function OrgRiskPage() {
  const { projectId = '', riskId = '' } = useParams()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const navigate = useNavigate()
  const { data, loading, load } = useRecord<{ risk: OrgRiskDetail; comments: RecordComment[]; project: { name: string } }>((token) =>
    getOrgRisk(token, projectId, riskId),
  )
  const [confirm, setConfirm] = useState<'close' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)
  const back = () => navigate(`/org/projects/${projectId}`)
  const risk = data?.risk
  const closed = risk?.status.toUpperCase() === 'CLOSED'

  async function act(kind: 'close' | 'delete') {
    const token = getOrgToken()
    if (!token) return
    setBusy(true)
    try {
      if (kind === 'close') {
        await updateNested('org', token, projectId, 'risks', riskId, { status: 'CLOSED' })
        message.success('تم إغلاق الخطر')
        setConfirm(null)
        await load()
      } else {
        await deleteNested('org', token, projectId, 'risks', riskId)
        message.success('تم حذف الخطر')
        back()
      }
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر تنفيذ الإجراء')
    } finally {
      setBusy(false)
    }
  }

  return (
    <RecordShell
      projectName={data?.project.name}
      title={risk?.name}
      loading={loading}
      onBack={back}
      actions={
        risk ? (
          <div className="detail-actions">
            {canCreateDraft(role) && !closed ? <CatalogButton onClick={() => setConfirm('close')}>إغلاق الخطر</CatalogButton> : null}
            {isUpperManagement(role) ? (
              <CatalogButton variant="danger" onClick={() => setConfirm('delete')}>
                حذف
              </CatalogButton>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {risk ? (
        <>
          <section className="dr-card">
            <div className="dr-record-title">
              <span className="dr-record-icon dr-record-icon--danger">
                <ShieldAlert size={22} />
              </span>
              <h2>{risk.name}</h2>
            </div>
            <dl className="dr-facts dr-facts--three">
              <Fact icon={<Target size={18} />} label="التأثير">
                <ToneBadge meta={LEVEL_META[risk.impact]} />
              </Fact>
              <Fact icon={<Target size={18} />} label="الاحتمالية">
                <ToneBadge meta={LEVEL_META[risk.probability]} />
              </Fact>
              <Fact icon={<Target size={18} />} label="الحالة">
                <ToneBadge meta={RISK_STATUS[risk.status.toUpperCase()] ?? { label: risk.status, tone: 'none' }} />
              </Fact>
              <Fact icon={<User size={18} />} label="الشخص المسؤول">
                {risk.responsibleName || '—'}
              </Fact>
              <Fact icon={<Phone size={18} />} label="الهاتف">
                <span dir="ltr">{risk.responsiblePhone || '—'}</span>
              </Fact>
              <Fact icon={<Mail size={18} />} label="البريد الإلكتروني">
                {risk.responsibleEmail ? <a href={`mailto:${risk.responsibleEmail}`}>{risk.responsibleEmail}</a> : '—'}
              </Fact>
            </dl>
          </section>
          <section className="dr-card">
            <h2>وصف الخطر</h2>
            <p>{risk.description || '—'}</p>
            <h2>خطة التخفيف</h2>
            {risk.actions.length === 0 ? <p>لم تُضف خطة تخفيف بعد.</p> : null}
            <ul className="dr-bullets">
              {risk.actions.map((action) => (
                <li key={action.id}>{action.action}</li>
              ))}
            </ul>
          </section>
          <RecordComments
            title="التعليقات"
            comments={data.comments}
            onAdd={async (content) => {
              const token = getOrgToken()
              if (!token) return
              await addOrgRecordComment(token, projectId, 'risks', riskId, content)
              await load()
            }}
          />
        </>
      ) : null}
      {confirm && risk ? (
        <SaDialog
          title={confirm === 'close' ? 'إغلاق الخطر؟' : 'حذف الخطر؟'}
          body={confirm === 'close' ? `سيُغلق الخطر «${risk.name}».` : `سيُحذف الخطر «${risk.name}» نهائيًا.`}
          tone={confirm === 'delete' ? 'danger' : 'info'}
          confirmLabel={confirm === 'close' ? 'إغلاق الخطر' : 'حذف'}
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => void act(confirm)}
        />
      ) : null}
    </RecordShell>
  )
}

export function OrgChangeRequestPage() {
  const { projectId = '', requestId = '' } = useParams()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const navigate = useNavigate()
  const { data, loading, load } = useRecord<{ request: OrgChangeRequestDetail; comments: RecordComment[]; project: { name: string } }>((token) =>
    getOrgChangeRequest(token, projectId, requestId),
  )
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const back = () => navigate(`/org/projects/${projectId}`)
  const request = data?.request
  const open = request ? ['PENDING', 'UNDER_REVIEW', 'SENT_FOR_REVIEW'].includes(request.status.toUpperCase()) : false

  async function decide(kind: 'approve' | 'reject') {
    const token = getOrgToken()
    if (!token) return
    setBusy(true)
    try {
      await decideChangeRequest('org', token, projectId, requestId, kind, comment.trim() || undefined)
      message.success(kind === 'approve' ? 'تمت الموافقة على طلب التغيير' : 'تم رفض طلب التغيير')
      setDecision(null)
      setComment('')
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر حفظ القرار')
    } finally {
      setBusy(false)
    }
  }

  return (
    <RecordShell projectName={data?.project.name} title={request?.title} loading={loading} onBack={back}>
      {request ? (
        <>
          <section className="dr-card">
            <div className="dr-record-title">
              <span className="dr-record-icon">
                <FileWarning size={22} />
              </span>
              <div>
                <h2>{request.title}</h2>
                <ToneBadge meta={REQUEST_STATUS[request.status.toUpperCase()] ?? { label: request.status, tone: 'none' }} />
              </div>
            </div>
            <dl className="dr-facts">
              <Fact icon={<Clock size={18} />} label="التأثير على الجدول الزمني">
                {request.impactOnSchedule || '—'}
              </Fact>
              <Fact icon={<Coins size={18} />} label="التأثير على الميزانية">
                {request.impactOnCost || '—'}
              </Fact>
              <Fact icon={<Calendar size={18} />} label="تاريخ الطلب">
                {dateText(request.submittedDate ?? request.createdAt)}
              </Fact>
              <Fact icon={<Target size={18} />} label="الأولوية">
                <ToneBadge meta={LEVEL_META[request.priority]} />
              </Fact>
              <Fact icon={<User size={18} />} label="مقدم الطلب">
                {request.requester?.name ?? request.submittedBy ?? '—'}
              </Fact>
              <Fact icon={<Mail size={18} />} label="البريد الإلكتروني">
                {request.requester?.email ?? '—'}
              </Fact>
            </dl>
          </section>
          <section className="dr-card">
            <h2>وصف الطلب</h2>
            <p>{request.description || '—'}</p>
          </section>
          {open && isUpperManagement(role) ? (
            <div className="dr-actions dr-actions--start">
              <button type="button" className="dr-btn dr-btn--solid" onClick={() => setDecision('approve')}>
                موافقة
              </button>
              <button type="button" className="dr-btn dr-btn--danger" onClick={() => setDecision('reject')}>
                رفض
              </button>
            </div>
          ) : null}
          <RecordComments
            title="التعليقات"
            comments={data.comments}
            onAdd={async (content) => {
              const token = getOrgToken()
              if (!token) return
              await addOrgRecordComment(token, projectId, 'change-requests', requestId, content)
              await load()
            }}
          />
        </>
      ) : null}
      {decision ? (
        <SaDialog
          title="تأكيد الإجراء"
          body="هل أنت متأكد من هذا الإجراء"
          tone={decision === 'reject' ? 'danger' : 'info'}
          confirmLabel={decision === 'approve' ? 'تأكيد' : 'رفض'}
          busy={busy}
          onClose={() => setDecision(null)}
          onConfirm={() => void decide(decision)}
        >
          {decision === 'reject' ? (
            <label className="sa-dialog__field">
              سبب الرفض (اختياري)
              <textarea rows={2} value={comment} onChange={(event) => setComment(event.target.value)} />
            </label>
          ) : null}
        </SaDialog>
      ) : null}
    </RecordShell>
  )
}
