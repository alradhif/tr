import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { loginOrg } from '../../api/auth'
import { ApiError } from '../../api/client'
import { mapOrgRole, orgRoleMatches } from '../../api/roles'
import { setOrgSession, type OrgRole } from '../../auth/orgAuth'
import { beginPostAuthLoading } from '../../auth/postAuthLoading'
import { AuthBackground } from '../../super-admin-ui/components/auth/AuthBackground'
import { AuthCardHeader } from '../../super-admin-ui/components/auth/AuthCardHeader'
import '../../super-admin-ui/components/auth/auth.css'
import './org-login.css'

export function OrgLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [role, setRole] = useState<OrgRole>('upper')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError(t('loginRequiredFields'))
      return
    }

    setIsSubmitting(true)
    try {
      const { token, user } = await loginOrg(email.trim(), password)
      if (!orgRoleMatches(role, user.role)) {
        setError(t('loginRoleMismatch'))
        return
      }
      const mapped = mapOrgRole(user.role)
      if (!mapped) {
        setError(t('loginRoleUnsupported'))
        return
      }
      setOrgSession(mapped, token, user)
      beginPostAuthLoading(navigate, '/org/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page org-login-page" dir="rtl">
      <AuthBackground />

      <div className="auth-card">
        <AuthCardHeader />

        <h1 className="auth-card__title">{t('orgLoginTitle')}</h1>
        <p className="auth-card__subtitle">{t('orgLoginSubtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__label" htmlFor="org-role">
            {t('accountType')}
          </label>
          <div className="auth-form__field">
            <select
              id="org-role"
              value={role}
              onChange={(event) => setRole(event.target.value as OrgRole)}
              aria-label={t('accountType')}
            >
              <option value="upper">{t('orgUpperRole')}</option>
              <option value="dataEntry">{t('orgDataEntryRole')}</option>
            </select>
            <ChevronLeft size={18} className="auth-form__icon org-login-page__select-chevron" aria-hidden />
          </div>

          <label className="auth-form__label" htmlFor="org-email">
            {t('email')}
          </label>
          <div className="auth-form__field">
            <Mail size={18} className="auth-form__icon auth-form__icon--start" />
            <input
              id="org-email"
              type="email"
              dir="ltr"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
            />
          </div>

          <label className="auth-form__label" htmlFor="org-password">
            {t('password')}
          </label>
          <div className="auth-form__field">
            <Lock size={18} className="auth-form__icon auth-form__icon--start" />
            <input
              id="org-password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
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

          <div className="auth-form__utility-row">
            <label className="auth-form__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>{t('rememberMe')}</span>
            </label>
            <button type="button" className="auth-form__forgot-link">
              {t('forgotPassword')}
            </button>
          </div>

          {error ? <p className="auth-form__error">{error}</p> : null}

          <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? t('loggingIn') : t('login')}
          </button>
        </form>
      </div>
    </div>
  )
}
