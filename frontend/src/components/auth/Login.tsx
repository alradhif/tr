import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthBackground } from './AuthBackground';
import { AuthCardHeader } from './AuthCardHeader';
import type { UserRole } from '../../types/auth';
import { apiRequest, writeSession } from '../../api/client';
import { backendRoleFromUi, uiRoleFromBackend } from '../../auth/roleMap';
import './auth.css';

const MIN_PASSWORD_LENGTH = 8;

interface QuickLoginOption {
  label: string;
  role: UserRole;
}

const QUICK_LOGIN_OPTIONS: QuickLoginOption[] = [
  { label: 'الدخول كجهة - إدارة عليا', role: 'senior_management' },
  { label: 'الدخول كجهة - مدخل بيانات', role: 'dataentry_management' },
  { label: 'الدخول كعميل - إدارة عليا', role: 'client_senior_management' },
  { label: 'الدخول كعميل - مدخل بيانات', role: 'client_dataentry_management' },
  { label: 'الدخول لحساب جودين - إدارة عليا', role: 'jodayn_senior_management' },
  { label: 'الدخول لحساب جودين - مدخل بيانات', role: 'jodayn_dataentry_management' },
];

interface LoginProps {
  onSuccess: (role: UserRole, skipOtp?: boolean) => void;
  onForgotPassword?: () => void;
}

export function Login({ onSuccess, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function completeSession(token: string, user: { id: string; name: string; email: string; role: string; type: string; orgId?: string; clientId?: string }, skipOtp: boolean) {
    writeSession({ token, user }, rememberMe);
    onSuccess(uiRoleFromBackend(user.role), skipOtp);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة المرور يجب أن تتكون من ${MIN_PASSWORD_LENGTH} أحرف على الأقل`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest<{ token: string; user: { id: string; name: string; email: string; role: string; type: string; orgId?: string; clientId?: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) },
      );
      await completeSession(result.token, result.user, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بيانات الدخول غير صحيحة');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin(role: UserRole) {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await apiRequest<{ token: string; user: { id: string; name: string; email: string; role: string; type: string; orgId?: string; clientId?: string } }>(
        '/auth/demo/login',
        { method: 'POST', body: JSON.stringify({ role: backendRoleFromUi(role) }) },
      );
      await completeSession(result.token, result.user, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الدخول إلى الحساب التجريبي');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      <div className="auth-card">
        <AuthCardHeader />

        <h1 className="auth-card__title">تسجيل الدخول</h1>
        <p className="auth-card__subtitle">أدخل بياناتك للمتابعة</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__label" htmlFor="email">
            البريد الإلكتروني
          </label>
          <div className="auth-form__field">
            <Mail size={18} className="auth-form__icon auth-form__icon--start" />
            <input
              id="email"
              type="email"
              dir="ltr"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <label className="auth-form__label" htmlFor="password">
            كلمة المرور
          </label>
          <div className="auth-form__field">
            <Lock size={18} className="auth-form__icon auth-form__icon--start" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={MIN_PASSWORD_LENGTH}
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
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>تذكرني</span>
            </label>

            {onForgotPassword && (
              <button
                type="button"
                className="auth-form__forgot-link"
                onClick={onForgotPassword}
              >
                نسيت كلمة المرور؟
              </button>
            )}
          </div>

          {error && <p className="auth-form__error">{error}</p>}

          <button className="auth-form__submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          <div className="auth-quicklogin">
            {QUICK_LOGIN_OPTIONS.map((option) => (
              <button
                key={option.role}
                type="button"
                className="auth-quicklogin__btn"
                disabled={isSubmitting}
                onClick={() => handleDemoLogin(option.role)}
              >
                <span className="auth-quicklogin__btn-label">{option.label}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
