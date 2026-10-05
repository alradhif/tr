import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { requestPasswordReset, startLogin, type AuthUser, type ForgotPasswordType } from '../../api/auth'
import { ApiError, apiRequest } from '../../api/client'
import { type PortalKind } from '../../auth/resolveLogin'
import { commitSession, setPendingLogin } from '../../auth/pendingLogin'
import { beginPostAuthLoading } from '../../auth/postAuthLoading'
import { AuthBackground } from '../../super-admin-ui/components/auth/AuthBackground'
import { AuthCardHeader } from '../../super-admin-ui/components/auth/AuthCardHeader'
import '../../super-admin-ui/components/auth/auth.css'

const MIN_PASSWORD_LENGTH = 6
const FORGOT_TYPES: ForgotPasswordType[] = ['SUPER_ADMIN', 'JODAYN', 'ORG', 'CLIENT']

const DEMO_LOGINS: Array<{ label: string; role: string; portal: PortalKind }> = [
  { label: 'الدخول كجهة - إدارة عليا', role: 'ORG_UPPER_MGMT', portal: 'org' },
  { label: 'الدخول كجهة - مدخل بيانات', role: 'ORG_DATA_ENTRY', portal: 'org' },
  { label: 'الدخول كعميل - إدارة عليا', role: 'CLIENT_UPPER_MGMT', portal: 'client' },
  { label: 'الدخول كعميل - مدخل بيانات', role: 'CLIENT_DATA_ENTRY', portal: 'client' },
  { label: 'الدخول لحساب جودين - إدارة عليا', role: 'JODAYN_UPPER_MGMT', portal: 'jodayn' },
  { label: 'الدخول لحساب جودين - مدخل بيانات', role: 'JODAYN_DATA_ENTRY', portal: 'jodayn' },
]

export function UnifiedLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const activatedEmail = params.get('activated') ? params.get('email') : null
  const notice = activatedEmail
    ? { tone: 'success', text: 'تم تفعيل حسابك. سجّل الدخول بكلمة المرور الجديدة' }
    : params.get('expired')
      ? { tone: 'warning', text: 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى' }
      : null
  const [step, setStep] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState(() => activatedEmail || localStorage.getItem('trackplus.rememberEmail') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('trackplus.rememberEmail')))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [demoEnabled, setDemoEnabled] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest<{ enabled: boolean }>('/auth/demo/status')
      .then((result) => {
        if (active) setDemoEnabled(Boolean(result.enabled))
      })
      .catch(() => {
        if (active) setDemoEnabled(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة المرور يجب أن تتكون من ${MIN_PASSWORD_LENGTH} أحرف على الأقل`)
      return
    }
    setIsSubmitting(true)
    try {
      const challenge = await startLogin(email.trim(), password)
      setPendingLogin({
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        resendAfterSeconds: challenge.resendAfterSeconds,
        demoCode: challenge.demoCode,
        email: email.trim(),
      })
      if (rememberMe) {
        localStorage.setItem('trackplus.rememberEmail', email.trim())
      } else {
        localStorage.removeItem('trackplus.rememberEmail')
      }
      navigate('/otp', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني')
      return
    }
    setIsSubmitting(true)
    try {
      const results = await Promise.allSettled(
        FORGOT_TYPES.map((type) => requestPasswordReset(email.trim(), type)),
      )
      const token = results
        .map((item) => (item.status === 'fulfilled' ? item.value.token : undefined))
        .find((value): value is string => Boolean(value))
      if (token) {
        navigate(`/reset-password?token=${encodeURIComponent(token)}`)
        return
      }
      setForgotSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إرسال رابط الاستعادة')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDemoLogin(option: (typeof DEMO_LOGINS)[number]) {
    setError('')
    setIsSubmitting(true)
    try {
      const result = await apiRequest<{ token: string; user: AuthUser }>(
        '/auth/demo/login',
        { method: 'POST', body: JSON.stringify({ role: option.role }) },
      )
      const destination = commitSession(result.token, result.user, option.portal)
      if (!destination) {
        setError('تعذر الدخول إلى الحساب التجريبي')
        return
      }
      beginPostAuthLoading(navigate, destination)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر الدخول إلى الحساب التجريبي')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page" dir="rtl">
      <AuthBackground />
      <div className="auth-card">
        <AuthCardHeader />
        {step === 'login' ? (
          <>
            <h1 className="auth-card__title">تسجيل الدخول</h1>
            <p className="auth-card__subtitle">أدخل بريدك الإلكتروني وكلمة المرور</p>
            {notice ? (
              <p className={`auth-form__notice${notice.tone === 'warning' ? ' auth-form__notice--warning' : ''}`}>
                {notice.text}
              </p>
            ) : null}
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <label className="auth-form__label" htmlFor="login-email">
                البريد الإلكتروني
              </label>
              <div className="auth-form__field">
                <Mail size={18} className="auth-form__icon auth-form__icon--start" />
                <input
                  id="login-email"
                  type="email"
                  dir="ltr"
                  placeholder="Enter Email Address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                />
              </div>
              <label className="auth-form__label" htmlFor="login-password">
                كلمة المرور
              </label>
              <div className="auth-form__field">
                <Lock size={18} className="auth-form__icon auth-form__icon--start" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
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
              <div className="auth-form__utility-row">
                <label className="auth-form__remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>تذكرني</span>
                </label>
                <button
                  type="button"
                  className="auth-form__forgot-link"
                  onClick={() => {
                    setError('')
                    setForgotSent(false)
                    setStep('forgot')
                  }}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              {error ? <p className="auth-form__error">{error}</p> : null}
              <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
            {demoEnabled ? (
              <div className="auth-quicklogin">
                {DEMO_LOGINS.map((option) => (
                  <button
                    key={option.role}
                    type="button"
                    className="auth-quicklogin__btn"
                    disabled={isSubmitting}
                    onClick={() => void handleDemoLogin(option)}
                  >
                    <span className="auth-quicklogin__btn-label">{option.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="auth-card__title">استعادة كلمة المرور</h1>
            <p className="auth-card__subtitle">
              أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
            </p>
            {forgotSent ? (
              <div className="auth-form__success">
                <span className="auth-form__success-icon">
                  <CheckCircle2 size={24} strokeWidth={2.4} />
                </span>
                <h2 className="auth-form__success-title">تم إرسال الرابط</h2>
                <p className="auth-form__success-text">
                  إذا كان البريد مسجلاً، تحقق من بريدك الإلكتروني{' '}
                  {email ? <bdi dir="ltr">{email}</bdi> : null} لمتابعة إعادة التعيين.
                </p>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleForgot} noValidate>
                <label className="auth-form__label" htmlFor="forgot-email">
                  البريد الإلكتروني
                </label>
                <div className="auth-form__field">
                  <Mail size={18} className="auth-form__icon auth-form__icon--start" />
                  <input
                    id="forgot-email"
                    type="email"
                    dir="ltr"
                    placeholder="Enter Email Address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                  />
                </div>
                {error ? <p className="auth-form__error">{error}</p> : null}
                <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط إعادة الضبط'}
                </button>
              </form>
            )}
            <button
              type="button"
              className="auth-back-link"
              onClick={() => {
                setError('')
                setForgotSent(false)
                setStep('login')
              }}
            >
              العودة لتسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  )
}
