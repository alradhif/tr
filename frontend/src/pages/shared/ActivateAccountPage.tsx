import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { activateAccount, getInvite, type InvitePreview } from '../../api/auth'
import { ApiError } from '../../api/client'
import { clearAllSessions } from '../../auth/session'
import { AuthBackground } from '../../super-admin-ui/components/auth/AuthBackground'
import { AuthCardHeader } from '../../super-admin-ui/components/auth/AuthCardHeader'
import '../../super-admin-ui/components/auth/auth.css'

const MIN_PASSWORD_LENGTH = 8

function roleLabel(role: string) {
  return role.endsWith('_UPPER_MGMT') ? 'إدارة عليا' : 'مدخل بيانات'
}

function entityLabel(invite: InvitePreview) {
  if (invite.type === 'ORG') return invite.orgName || 'الجهة'
  if (invite.type === 'CLIENT') return invite.clientName || 'العميل'
  return 'جدين'
}

export function ActivateAccountPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [loadError, setLoadError] = useState(token ? '' : 'رابط الدعوة غير صالح أو منتهي الصلاحية')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getInvite(token)
      .then((data) => {
        if (!cancelled) setInvite(data)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'تعذر التحقق من رابط الدعوة')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!password || !confirm) {
      setError('الرجاء إدخال كلمة المرور وتأكيدها')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة المرور يجب أن تتكون من ${MIN_PASSWORD_LENGTH} أحرف على الأقل`)
      return
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await activateAccount(token, password)
      // A different account may still be signed in on this tab; the invitee signs in fresh.
      clearAllSessions()
      navigate(`/login?activated=1&email=${encodeURIComponent(result.email)}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تفعيل الحساب')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page" dir="rtl">
      <AuthBackground />
      <div className="auth-card">
        <AuthCardHeader />
        <h1 className="auth-card__title">تفعيل الحساب</h1>
        {loadError ? (
          <>
            <p className="auth-card__subtitle">{loadError}</p>
            <button type="button" className="auth-back-link" onClick={() => navigate('/login', { replace: true })}>
              العودة لتسجيل الدخول
            </button>
          </>
        ) : !invite ? (
          <p className="auth-card__subtitle">جاري التحقق من رابط الدعوة...</p>
        ) : (
          <>
            <p className="auth-card__subtitle">
              مرحبًا {invite.name}، تمت دعوتك إلى {entityLabel(invite)} بصلاحية {roleLabel(invite.role)}. عيّن كلمة
              المرور لتفعيل حسابك.
            </p>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="auth-form__label" htmlFor="activate-email">
                البريد الإلكتروني
              </label>
              <div className="auth-form__field">
                <Mail size={18} className="auth-form__icon auth-form__icon--start" />
                <input id="activate-email" type="email" dir="ltr" value={invite.email} readOnly autoComplete="username" />
              </div>
              <label className="auth-form__label" htmlFor="activate-password">
                كلمة المرور الجديدة
              </label>
              <div className="auth-form__field">
                <Lock size={18} className="auth-form__icon auth-form__icon--start" />
                <input
                  id="activate-password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-form__icon auth-form__icon--end"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <label className="auth-form__label" htmlFor="activate-confirm">
                تأكيد كلمة المرور
              </label>
              <div className="auth-form__field">
                <Lock size={18} className="auth-form__icon auth-form__icon--start" />
                <input
                  id="activate-confirm"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="Confirm Password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error ? <p className="auth-form__error">{error}</p> : null}
              <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري التفعيل...' : 'تفعيل الحساب'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
