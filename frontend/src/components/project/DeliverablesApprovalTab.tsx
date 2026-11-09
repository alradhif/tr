import { useState } from 'react'
import { message } from 'antd'
import { CheckCircle2, Circle, Clock, RotateCcw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { approveOrgDeliverable, requestOrgDeliverableChanges, submitOrgDeliverable } from '../../api/projectNested'
import { getOrgToken } from '../../auth/orgAuth'
import { SaDialog } from '../../super-admin-ui/components/ui/SaDialog'
import { RecordCard, RecordCardGrid, useViewMode, ViewToggle } from '../ui/RecordCards'
import '../../design/deliverable-review.css'

export type ReviewStatus = 'NOT_SUBMITTED' | 'PENDING' | 'CHANGES_REQUESTED' | 'APPROVED'

export const REVIEW_META: Record<ReviewStatus, { label: string; tone: string; Icon: typeof Clock }> = {
  APPROVED: { label: 'معتمد', tone: 'approved', Icon: CheckCircle2 },
  PENDING: { label: 'بانتظار الاعتماد', tone: 'pending', Icon: Clock },
  CHANGES_REQUESTED: { label: 'يحتاج تعديلًا', tone: 'changes', Icon: RotateCcw },
  NOT_SUBMITTED: { label: 'لم يُرفع', tone: 'none', Icon: Circle },
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const { label, tone, Icon } = REVIEW_META[status]
  return (
    <span className={`dr-badge dr-badge--${tone}`}>
      <Icon size={13} />
      {label}
    </span>
  )
}

type Row = {
  key: string
  name: string
  description: string
  reviewStatus: ReviewStatus
  submittedAt: string
  submittedBy: string
  /** How long ago it was submitted, as "منذ 4 أيام". */
  submittedAgo: string
  phase: string
  dueDate: string
}

type Filter = 'all' | ReviewStatus
type Decision = { kind: 'approve' | 'changes'; row: Row; reason: string }

/** The organization's deliverables with their approval state (Figma "DP"). */
export function DeliverablesApprovalTab({
  rows,
  canDecide,
  canSubmit,
  canOpen,
  reviewBase,
  onChanged,
}: {
  rows: Row[]
  canDecide: boolean
  canSubmit: boolean
  canOpen: boolean
  reviewBase: string
  onChanged: () => void | Promise<void>
}) {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [decision, setDecision] = useState<Decision | null>(null)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useViewMode('org-project-deliverables')

  const chips: Array<{ id: Filter; label: string }> = [
    { id: 'all', label: 'الكل' },
    { id: 'APPROVED', label: 'معتمد' },
    { id: 'PENDING', label: 'بانتظار الاعتماد' },
    { id: 'CHANGES_REQUESTED', label: 'يحتاج تعديلًا' },
    { id: 'NOT_SUBMITTED', label: 'لم يُرفع' },
  ]
  const countOf = (id: Filter) => (id === 'all' ? rows.length : rows.filter((row) => row.reviewStatus === id).length)
  const visible = filter === 'all' ? rows : rows.filter((row) => row.reviewStatus === filter)

  const run = async (action: (token: string) => Promise<unknown>, done: string) => {
    const token = getOrgToken()
    if (!token) return
    setBusy(true)
    try {
      await action(token)
      message.success(done)
      setDecision(null)
      await onChanged()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر حفظ القرار، لم يتغير شيء')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dr-tab">
      <div className="dr-chips" role="tablist">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={filter === chip.id}
            className={filter === chip.id ? 'is-active' : ''}
            onClick={() => setFilter(chip.id)}
          >
            {chip.label}
            <span>{countOf(chip.id)}</span>
          </button>
        ))}
      </div>

      <div className="rc-view-bar">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'cards' ? (
        <>
          {visible.length === 0 ? <p className="dr-empty">لا توجد مخرجات بهذه الحالة</p> : null}
          <RecordCardGrid>
            {visible.map((row) => (
              <RecordCard
                key={row.key}
                title={row.name}
                badges={<ReviewBadge status={row.reviewStatus} />}
                rows={[
                  { label: 'تاريخ التقديم', value: row.submittedAt },
                  { label: 'تاريخ الاستحقاق', value: row.dueDate },
                  { label: 'النشاط · المرحلة', value: [row.description, row.phase].filter((part) => part && part !== '—').join(' · ') || '—' },
                ]}
                linkLabel={canOpen ? 'عرض المخرج' : undefined}
                onOpen={canOpen ? () => navigate(`${reviewBase}/${row.key}`) : undefined}
              />
            ))}
          </RecordCardGrid>
        </>
      ) : (
      <div className="dr-table-wrap">
        <table className="dr-table">
          <thead>
            <tr>
              <th>اسم المخرج</th>
              <th>النشاط · المرحلة</th>
              <th>تاريخ التقديم</th>
              <th>قدّمه</th>
              <th>حالة الاعتماد</th>
              <th>القرار</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="dr-empty">
                  لا توجد مخرجات بهذه الحالة
                </td>
              </tr>
            ) : null}
            {visible.map((row) => (
              <tr key={row.key}>
                <td className="dr-name">
                  {canOpen ? (
                    <button type="button" onClick={() => navigate(`${reviewBase}/${row.key}`)}>
                      {row.name}
                    </button>
                  ) : (
                    row.name
                  )}
                </td>
                <td>
                  {row.description || '—'}
                  {row.phase && row.phase !== '—' ? <small className="dr-cell-sub">{row.phase}</small> : null}
                </td>
                <td>{row.submittedAt}</td>
                <td>{row.submittedAgo ? `${row.submittedBy} · ${row.submittedAgo}` : row.submittedBy}</td>
                <td>
                  <ReviewBadge status={row.reviewStatus} />
                </td>
                <td>
                  <div className="dr-actions">
                    {canDecide && row.reviewStatus === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          className="dr-btn dr-btn--solid"
                          onClick={() => setDecision({ kind: 'approve', row, reason: '' })}
                        >
                          اعتماد
                        </button>
                        <button
                          type="button"
                          className="dr-btn"
                          onClick={() => setDecision({ kind: 'changes', row, reason: '' })}
                        >
                          طلب تعديل
                        </button>
                      </>
                    ) : null}
                    {canSubmit && (row.reviewStatus === 'NOT_SUBMITTED' || row.reviewStatus === 'CHANGES_REQUESTED') ? (
                      <button
                        type="button"
                        className="dr-btn dr-btn--solid"
                        disabled={busy}
                        onClick={() =>
                          void run((token) => submitOrgDeliverable(token, projectId, row.key), 'تم تقديم المخرج للاعتماد')
                        }
                      >
                        {row.reviewStatus === 'CHANGES_REQUESTED' ? 'إعادة التقديم' : 'تقديم للاعتماد'}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      <p className="dr-note">
        الاعتماد يتم هنا على المخرج داخل مشروعه. المخرج المعتمد يُحتسب في تقدم المرحلة والمشروع والهدف، و«طلب تعديل» يعيده
        للمنفذ مع ملاحظاتك.
      </p>

      {decision?.kind === 'approve' ? (
        <SaDialog
          title="اعتماد المخرج؟"
          body={`سيُعتمد «${decision.row.name}» ويُحتسب في التقدم التنفيذي. يُسجل القرار باسمك وتاريخه، ولا يمكن إلغاء الاعتماد.`}
          confirmLabel="تأكيد الاعتماد"
          busy={busy}
          onClose={() => setDecision(null)}
          onConfirm={() =>
            void run((token) => approveOrgDeliverable(token, projectId, decision.row.key), 'تم اعتماد المخرج')
          }
        />
      ) : null}
      {decision?.kind === 'changes' ? (
        <SaDialog
          title="طلب تعديل على المخرج"
          body={`سيعود «${decision.row.name}» إلى المنفذ مع ملاحظاتك، ولن يُحتسب في التقدم حتى يُعاد تقديمه ويُعتمد.`}
          confirmLabel="إرسال طلب التعديل"
          confirmDisabled={!decision.reason.trim()}
          busy={busy}
          onClose={() => setDecision(null)}
          onConfirm={() =>
            void run(
              (token) => requestOrgDeliverableChanges(token, projectId, decision.row.key, decision.reason.trim()),
              'تم إرسال طلب التعديل',
            )
          }
        >
          <label className="sa-dialog__field">
            سبب طلب التعديل *
            <textarea
              rows={3}
              placeholder="اذكر ما يجب تعديله بوضوح"
              value={decision.reason}
              onChange={(event) => setDecision({ ...decision, reason: event.target.value })}
            />
          </label>
        </SaDialog>
      ) : null}
    </div>
  )
}
