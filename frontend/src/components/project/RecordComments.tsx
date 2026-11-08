import { useState } from 'react'
import { message } from 'antd'
import { ApiError } from '../../api/client'
import type { RecordComment } from '../../api/projectNested'
import { getOrgRole, getOrgUser, orgRoleLabel } from '../../auth/orgAuth'
import '../../design/deliverable-review.css'

function timeLabel(iso: string) {
  const date = new Date(iso)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 60) return minutes <= 1 ? 'الآن' : `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعات`
  return date.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long' })
}

const ROLE_LABEL: Record<string, string> = { ORG_UPPER_MGMT: 'إدارة عليا', ORG_DATA_ENTRY: 'مدخل بيانات' }

/** The comments thread at the foot of a deliverable, risk or change request. */
export function RecordComments({
  title,
  comments,
  onAdd,
}: {
  title: string
  comments: RecordComment[]
  onAdd: (content: string) => Promise<unknown>
}) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const me = getOrgUser()
  const role = getOrgRole()

  async function submit() {
    setBusy(true)
    try {
      await onAdd(draft.trim())
      setDraft('')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'تعذر إضافة التعليق')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="dr-card">
      <h2>{title}</h2>
      {comments.length === 0 ? <p className="dr-empty">لا توجد تعليقات بعد.</p> : null}
      <ul className="dr-comments">
        {comments.map((comment) => (
          <li key={comment.id}>
            <span className="dr-avatar">{(comment.author?.name ?? '—').charAt(0)}</span>
            <div>
              <small>{ROLE_LABEL[comment.author?.role ?? ''] ?? ''}</small>
              <strong>{comment.author?.name ?? '—'}</strong>
              <p>{comment.content}</p>
            </div>
            <time>{timeLabel(comment.createdAt)}</time>
          </li>
        ))}
      </ul>
      <div className="dr-comment-form">
        <div className="dr-comment-form__who">
          <span className="dr-avatar">{(me?.name ?? '—').charAt(0)}</span>
          <div>
            <small>{role ? orgRoleLabel(role) : ''}</small>
            <strong>{me?.name}</strong>
          </div>
        </div>
        <label>
          إضافة تعليق
          <textarea rows={3} placeholder="مثال" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <div className="dr-actions">
          <button type="button" className="dr-btn dr-btn--solid" disabled={busy || !draft.trim()} onClick={() => void submit()}>
            إرسال
          </button>
          <button type="button" className="dr-btn" disabled={busy || !draft} onClick={() => setDraft('')}>
            إلغاء
          </button>
        </div>
      </div>
    </section>
  )
}
