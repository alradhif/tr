import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { resetPassword } from '../../api/auth'
import { ApiError } from '../../api/client'
import { AuthBackground } from '../../super-admin-ui/components/auth/AuthBackground'
import { AuthCardHeader } from '../../super-admin-ui/components/auth/AuthCardHeader'
import '../../super-admin-ui/components/auth/auth.css'

const MIN_PASSWORD_LENGTH = 8

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!token) {
      setError(t('resetTokenMissing'))
      return
    }
    if (!password || !confirm) {
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
      await resetPassword(token, password)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page" dir="rtl">
      <AuthBackground />
      <div className="auth-card">
        <AuthCardHeader />
        <h1 className="auth-card__title">{t('setNewPassword')}</h1>
        <p className="auth-card__subtitle">{t('orgLoginSubtitle')}</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__label" htmlFor="reset-password">
            {t('newPassword')}
          </label>
          <div className="auth-form__field">
            <Lock size={18} className="auth-form__icon auth-form__icon--start" />
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-form__icon auth-form__icon--end"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <label className="auth-form__label" htmlFor="reset-confirm">
            {t('confirmPassword')}
          </label>
          <div className="auth-form__field">
            <Lock size={18} className="auth-form__icon auth-form__icon--start" />
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              placeholder={t('passwordPlaceholder')}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? t('loggingIn') : t('setNewPassword')}
          </button>
          <button type="button" className="otp-back" onClick={() => navigate('/login')}>
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  )
}
