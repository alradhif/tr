import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { AuthBackground } from './AuthBackground';
import { AuthCardHeader } from './AuthCardHeader';
import { isMockOtpValid, MOCK_OTP_LENGTH } from '../../../auth/mockOtp';
import clockIcon from '../../../assets/new-ui-icons/clock-2.svg';
import './auth.css';

const CODE_LENGTH = MOCK_OTP_LENGTH;
const RESEND_SECONDS = 30;

interface TwoFactorProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function TwoFactor({ onSuccess, onBack }: TwoFactorProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    setError('');

    if (clean && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError('');
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  function handleSubmit() {
    const code = digits.join('');

    if (code.length < CODE_LENGTH) {
      setError('الرجاء إدخال الرمز المكوّن من 6 أرقام');
      return;
    }

    if (!isMockOtpValid(code)) {
      setError('الرمز غير صحيح، الرجاء المحاولة مرة أخرى');
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 350);
  }

  function handleResend() {
    if (secondsLeft > 0) return;
    setDigits(Array(CODE_LENGTH).fill(''));
    setError('');
    setSecondsLeft(RESEND_SECONDS);
    inputsRef.current[0]?.focus();
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      <div className="auth-card">
        <AuthCardHeader />

        <h1 className="auth-card__title">التحقق الثنائي</h1>
        <p className="auth-card__subtitle">أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة</p>

        <div className="otp-row" dir="ltr" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              className="otp-row__cell"
              value={digit}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <div className="otp-timer">
          <img src={clockIcon} alt="" width={16} height={16} className="asset-icon" />
          <span>
            {secondsLeft > 0 ? (
              `الرمز صالح لمدة ${secondsLeft} ثانية`
            ) : (
              <button type="button" className="otp-timer__resend" onClick={handleResend}>
                إعادة إرسال الرمز
              </button>
            )}
          </span>
        </div>

        {error && <p className="auth-form__error">{error}</p>}

        <button
          type="button"
          className="auth-form__submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري التحقق...' : 'التأكيد والدخول'}
        </button>

        <button type="button" className="otp-back" onClick={onBack}>
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}
