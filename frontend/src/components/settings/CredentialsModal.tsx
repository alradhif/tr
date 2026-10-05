import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import '../../design/settings-users.css'

type CredentialsModalProps = {
  name: string
  email: string
  temporaryPassword: string
  reissued?: boolean
  onClose: () => void
}

export function CredentialsModal({ name, email, temporaryPassword, reissued = false, onClose }: CredentialsModalProps) {
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  async function copy(kind: 'email' | 'password', value: string) {
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
          <h2 id="creds-title">{reissued ? 'تم إصدار بيانات دخول جديدة' : 'تم إنشاء المستخدم بنجاح'}</h2>
        </div>
        <div className="td-add-user-modal__divider" />
        <p className="td-credentials-hint">
          انسخ بيانات الدخول لـ {name} الآن. لن تظهر كلمة المرور مرة أخرى. يبقى الحساب «غير نشط» حتى أول تسجيل دخول ناجح.
        </p>
        <div className="td-add-user-form">
          <label className="td-add-user-field">
            <span>البريد الإلكتروني</span>
            <p className="td-credentials-secret" dir="ltr">
              {email}
            </p>
          </label>
          <label className="td-add-user-field">
            <span>كلمة المرور المؤقتة</span>
            <p className="td-credentials-secret" dir="ltr" data-testid="temporary-password">
              {temporaryPassword}
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
            onClick={() => void copy('password', temporaryPassword)}
          >
            {copied === 'password' ? <Check size={16} /> : <Copy size={16} />}
            <span>Copy Password</span>
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
