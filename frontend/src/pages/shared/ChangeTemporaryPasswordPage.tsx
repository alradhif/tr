import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { changePassword } from '../../api/me'
import { clearPendingPasswordChange, commitSession, getPendingPasswordChange } from '../../auth/pendingLogin'
import { beginPostAuthLoading } from '../../auth/postAuthLoading'
import { AuthBackground } from '../../super-admin-ui/components/auth/AuthBackground'
import { AuthCardHeader } from '../../super-admin-ui/components/auth/AuthCardHeader'
import '../../super-admin-ui/components/auth/auth.css'

const MIN_PASSWORD_LENGTH = 8

/** The first sign-in with a temporary password stops here; the portal opens once it is changed. */
export function ChangeTemporaryPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pending] = useState(getPendingPasswordChange)
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!pending) {
    return <Navigate to="/login" replace />
  }
  const { token, user } = pending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!current || !password || !confirm) {
      setError(t('loginRequiredFields'))
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('passwordMinLength'))
      return
    }
    if (password !== confirm) {
      setError(t('passwordsDoNotMatch'))
      return
    }
    setIsSubmitting(true)
    try {
      await changePassword(token, { currentPassword: current, newPassword: password })
      clearPendingPasswordChange()
      const destination = commitSession(token, { ...user, mustChangePassword: false })
      if (!destination) throw new Error('هذا الحساب غير مدعوم في النظام')
      beginPostAuthLoading(navigate, destination)
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function backToLogin() {
    clearPendingPasswordChange()
    navigate('/login', { replace: true })
  }

  const fields = [
    { id: 'temporary-password', label: 'كلمة المرور المؤقتة', value: current, set: setCurrent, autoComplete: 'current-password' },
    { id: 'new-password', label: t('newPassword'), value: password, set: setPassword, autoComplete: 'new-password' },
    { id: 'confirm-password', label: t('confirmPassword'), value: confirm, set: setConfirm, autoComplete: 'new-password' },
  ]

  return (
    <div className="auth-page" dir="rtl">
      <AuthBackground />
      <div className="auth-card">
        <AuthCardHeader />
        <h1 className="auth-card__title">غيّر كلمة المرور</h1>
        <p className="auth-card__subtitle">كلمة المرور الحالية مؤقتة، ويجب تغييرها قبل الدخول إلى النظام.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {fields.map((field) => (
            <div key={field.id}>
              <label className="auth-form__label" htmlFor={field.id}>
                {field.label}
              </label>
              <div className="auth-form__field">
                <Lock size={18} className="auth-form__icon auth-form__icon--start" />
                <input
                  id={field.id}
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder={t('passwordPlaceholder')}
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  autoComplete={field.autoComplete}
                />
                {field.id === 'temporary-password' ? (
                  <button
                    type="button"
                    className="auth-form__icon auth-form__icon--end"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {error ? <p className="auth-form__error">{error}</p> : null}
          <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? t('loggingIn') : t('setNewPassword')}
          </button>
          <button type="button" className="otp-back" onClick={backToLogin}>
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  )
}
