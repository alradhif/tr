import { useState } from 'react'
import type { PortalKind } from '../../features/portal/PortalDashboard'

export type AccessLevel = 'UPPER' | 'DATA_ENTRY'

export type InviteUserPayload = {
  name: string
  email: string
  department: string
  accessLevel: AccessLevel
}

type InviteUserModalProps = {
  portal: PortalKind
  submitting?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (payload: InviteUserPayload) => void
}

const PORTAL_LABEL: Record<PortalKind, string> = {
  org: 'Organization',
  client: 'Client',
  jodayn: 'Jodayn',
}

export function InviteUserModal({
  portal,
  submitting = false,
  error,
  onClose,
  onSubmit,
}: InviteUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [accessLevel, setAccessLevel] = useState<AccessLevel | ''>('')
  const [localError, setLocalError] = useState<string | null>(null)

  function handleSubmit() {
    const nextName = name.trim()
    const nextEmail = email.trim()
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)
    if (!nextName || !nextEmail || !accessLevel || !emailIsValid) {
      setLocalError('يرجى إدخال الاسم والبريد الإلكتروني ومستوى الصلاحية بشكل صحيح')
      return
    }
    setLocalError(null)
    onSubmit({
      name: nextName,
      email: nextEmail,
      department: department.trim(),
      accessLevel,
    })
  }

  return (
    <div className="td-add-user-overlay" role="presentation">
      <div
        className="td-add-user-modal"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-modal-title"
      >
        <div className="td-add-user-modal__header">
          <div className="td-add-user-modal__icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M5.5 19c.55-3.1 2.7-4.8 6.5-4.8s5.95 1.7 6.5 4.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 id="add-user-modal-title">إضافة مستخدم</h2>
        </div>

        <div className="td-add-user-modal__divider" />

        {(localError || error) && <p className="td-add-user-error">{localError || error}</p>}

        <div className="td-add-user-form">
          <label className="td-add-user-field">
            <span>الاسم الكامل</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>

          <label className="td-add-user-field">
            <span>البريد الالكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              dir="ltr"
            />
          </label>

          <label className="td-add-user-field">
            <span>القسم / الإدارة</span>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </label>

          <label className="td-add-user-field">
            <span>نوع المستخدم</span>
            <div className="td-add-user-select-wrap">
              <select value={portal} disabled>
                <option value={portal}>{PORTAL_LABEL[portal]}</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </label>

          <label className="td-add-user-field">
            <span>الدور</span>
            <div className="td-add-user-select-wrap">
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevel | '')}
              >
                <option value="">اختر الدور</option>
                <option value="UPPER">إدارة عليا</option>
                <option value="DATA_ENTRY">مدخل بيانات</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </label>
        </div>

        <div className="td-add-user-modal__actions">
          <button type="button" className="td-add-user-submit" onClick={handleSubmit} disabled={submitting}>
            <span>{submitting ? 'جاري الإرسال...' : 'ارسال دعوة'}</span>
            <span className="td-add-user-submit__icon" aria-hidden>✓</span>
          </button>
          <button type="button" className="td-add-user-cancel" onClick={onClose} disabled={submitting}>
            <span>إلغاء</span>
            <span className="td-add-user-cancel__icon" aria-hidden>×</span>
          </button>
        </div>
      </div>
    </div>
  )
}
