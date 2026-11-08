import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { FileText } from 'lucide-react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  approveOrgDeliverable,
  getOrgDeliverable,
  requestOrgDeliverableChanges,
  submitOrgDeliverable,
  type DeliverableReview,
} from '../../api/projectNested'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { isDataEntry, isUpperManagement } from '../../auth/permissions'
import { ReviewBadge } from '../../components/project/DeliverablesApprovalTab'
import { SubpageHeader } from '../../components/ui'
import { SaDialog } from '../../super-admin-ui/components/ui/SaDialog'
import '../../design/deliverable-review.css'

const dateText = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB').replaceAll('/', '-')
}

/** One deliverable with its files and the approve / request-changes decision. */
export function OrgDeliverableReviewPage() {
  const { projectId = '', deliverableId = '' } = useParams()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const navigate = useNavigate()
  const [data, setData] = useState<{ deliverable: DeliverableReview; project: { name: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<'approve' | 'changes' | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const backToProject = () => navigate(`/org/projects/${projectId}`)

  const load = useCallback(async () => {
    const token = getOrgToken()
    if (!token) return
    try {
      setData(await getOrgDeliverable(token, projectId, deliverableId))
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر تحميل المخرج')
    } finally {
      setLoading(false)
    }
  }, [projectId, deliverableId])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (action: (token: string) => Promise<unknown>, done: string) => {
    const token = getOrgToken()
    if (!token) return
    setBusy(true)
    try {
      await action(token)
      message.success(done)
      setDialog(null)
      setReason('')
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر حفظ القرار، لم يتغير شيء')
    } finally {
      setBusy(false)
    }
  }

  const deliverable = data?.deliverable
  const pending = deliverable?.reviewStatus === 'PENDING'

  return (
    <div className="dashboard-page dr-page" dir="rtl">
      <SubpageHeader parent="المشاريع" title={deliverable?.name ?? 'المخرج'} onBack={backToProject} />
      <main className="dr-body">
        {loading ? <p className="dr-empty">جاري التحميل...</p> : null}
        {!loading && !deliverable ? <p className="dr-empty">لم يتم العثور على المخرج.</p> : null}
        {deliverable ? (
          <>
            <header className="dr-head">
              <h1>{data.project.name}</h1>
              <p>{deliverable.description || '—'}</p>
            </header>

            <section className="dr-card">
              <div className="dr-card__title">
                <h2>{deliverable.name}</h2>
                <ReviewBadge status={deliverable.reviewStatus} />
              </div>
              <dl className="dr-facts">
                <div>
                  <dt>قدّمه</dt>
                  <dd>{deliverable.submittedByName || '—'}</dd>
                </div>
                <div>
                  <dt>تاريخ التقديم</dt>
                  <dd>{dateText(deliverable.submittedAt)}</dd>
                </div>
                <div>
                  <dt>الإصدار</dt>
                  <dd>الإصدار {deliverable.version}</dd>
                </div>
                {deliverable.reviewedByName ? (
                  <div>
                    <dt>{deliverable.reviewStatus === 'APPROVED' ? 'اعتمده' : 'طلب التعديل'}</dt>
                    <dd>
                      {deliverable.reviewedByName} · {dateText(deliverable.reviewedAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {deliverable.reviewNote ? (
              <section className="dr-card dr-card--warn">
                <h2>سبب طلب التعديل</h2>
                <p>{deliverable.reviewNote}</p>
              </section>
            ) : null}

            {pending && isUpperManagement(role) ? (
              <section className="dr-card dr-decision">
                <div>
                  <h2>قرار الاعتماد</h2>
                  <p>راجع الملفات قبل اتخاذ القرار. عند الاعتماد يُحتسب المخرج في التقدم التنفيذي للمشروع والهدف.</p>
                </div>
                <div className="dr-actions">
                  <button type="button" className="dr-btn dr-btn--solid" onClick={() => setDialog('approve')}>
                    اعتماد المخرج
                  </button>
                  <button type="button" className="dr-btn" onClick={() => setDialog('changes')}>
                    طلب تعديل
                  </button>
                </div>
              </section>
            ) : null}

            {isDataEntry(role) && (deliverable.reviewStatus === 'NOT_SUBMITTED' || deliverable.reviewStatus === 'CHANGES_REQUESTED') ? (
              <section className="dr-card dr-decision">
                <h2>التقديم للاعتماد</h2>
                <button
                  type="button"
                  className="dr-btn dr-btn--solid"
                  disabled={busy}
                  onClick={() =>
                    void run((token) => submitOrgDeliverable(token, projectId, deliverableId), 'تم تقديم المخرج للاعتماد')
                  }
                >
                  {deliverable.reviewStatus === 'CHANGES_REQUESTED' ? 'إعادة التقديم' : 'تقديم للاعتماد'}
                </button>
              </section>
            ) : null}

            <section className="dr-card">
              <div className="dr-card__title">
                <h2>ملفات المخرج</h2>
                <span className="dr-count">{deliverable.attachments.length} ملفات</span>
              </div>
              {deliverable.attachments.length === 0 ? <p className="dr-empty">لا توجد ملفات مرفوعة بعد.</p> : null}
              <ul className="dr-files">
                {deliverable.attachments.map((file) => (
                  <li key={file.id}>
                    <FileText size={20} />
                    <strong>{file.fileName}</strong>
                    <small>{dateText(file.createdAt)}</small>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </main>

      {dialog === 'approve' && deliverable ? (
        <SaDialog
          title="اعتماد المخرج؟"
          body={`سيُعتمد «${deliverable.name}» ويُحتسب في التقدم التنفيذي. يُسجل القرار باسمك وتاريخه، ولا يمكن إلغاء الاعتماد.`}
          confirmLabel="تأكيد الاعتماد"
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() => void run((token) => approveOrgDeliverable(token, projectId, deliverableId), 'تم اعتماد المخرج')}
        />
      ) : null}
      {dialog === 'changes' && deliverable ? (
        <SaDialog
          title="طلب تعديل على المخرج"
          body={`سيعود «${deliverable.name}» إلى المنفذ مع ملاحظاتك، ولن يُحتسب في التقدم حتى يُعاد تقديمه ويُعتمد.`}
          confirmLabel="إرسال طلب التعديل"
          confirmDisabled={!reason.trim()}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            void run((token) => requestOrgDeliverableChanges(token, projectId, deliverableId, reason.trim()), 'تم إرسال طلب التعديل')
          }
        >
          <label className="sa-dialog__field">
            سبب طلب التعديل *
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </SaDialog>
      ) : null}
    </div>
  )
}
