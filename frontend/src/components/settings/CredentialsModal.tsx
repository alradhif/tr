import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type CredentialsModalProps = {
  name: string
  email: string
  inviteUrl: string
  inviteExpiresAt?: string
  reissued?: boolean
  onClose: () => void
}

function formatExpiry(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('ar-u-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

export function CredentialsModal({ name, email, inviteUrl, inviteExpiresAt, reissued = false, onClose }: CredentialsModalProps) {
  const [copied, setCopied] = useState<'email' | 'link' | null>(null)
  const expiry = formatExpiry(inviteExpiresAt)

  async function copy(kind: 'email' | 'link', value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="td-add-user-overlay" role="presentation">
      <div className="td-add-user-modal" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="creds-title">
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
          <h2 id="creds-title">{reissued ? 'تم إصدار رابط دعوة جديد' : 'تم إنشاء المستخدم بنجاح'}</h2>
        </div>
        <div className="td-add-user-modal__divider" />
        <p className="td-credentials-hint">
          أرسل رابط التفعيل إلى {name} ليعيّن كلمة المرور الخاصة به عند أول دخول. يعمل الرابط مرة واحدة
          {expiry ? <> وينتهي في {expiry}</> : null}.
        </p>
        <div className="td-add-user-form">
          <label className="td-add-user-field">
            <span>البريد الإلكتروني</span>
            <p className="td-credentials-secret" dir="ltr">
              {email}
            </p>
          </label>
          <label className="td-add-user-field">
            <span>رابط التفعيل</span>
            <p className="td-credentials-secret" dir="ltr" style={{ wordBreak: 'break-all' }}>
              {inviteUrl}
            </p>
          </label>
        </div>
        <div className="td-add-user-modal__actions">
          <button type="button" className="td-add-user-submit" onClick={() => void copy('email', email)}>
            {copied === 'email' ? <Check size={16} /> : <Copy size={16} />}
            <span>Copy Email</span>
          </button>
          <button
            type="button"
            className="td-add-user-submit"
            onClick={() => void copy('link', inviteUrl)}
          >
            {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
            <span>Copy Link</span>
          </button>
          <button type="button" className="td-add-user-cancel" onClick={onClose}>
            <span>إغلاق</span>
            <span className="td-add-user-cancel__icon" aria-hidden>×</span>
          </button>
        </div>
      </div>
    </div>
  )
}
