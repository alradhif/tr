import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { AuthBackground } from './AuthBackground';
import { AuthCardHeader } from './AuthCardHeader';
import clockIcon from '../../../assets/new-ui-icons/clock-2.svg';
import './auth.css';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

interface TwoFactorProps {
  /** Verifies the code with the server; rejects with an Error whose message is shown. */
  onVerify: (code: string) => Promise<void>;
  /** Requests a new code from the server. */
  onResend: () => Promise<void>;
  onBack: () => void;
  /** Code shown on screen when the server has no mail delivery (demo environment only). */
  demoCode?: string | null;
  resendSeconds?: number;
}

export function TwoFactor({ onVerify, onResend, onBack, demoCode, resendSeconds = RESEND_SECONDS }: TwoFactorProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendSeconds);
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

  async function handleSubmit() {
    const code = digits.join('');

    if (code.length < CODE_LENGTH) {
      setError('الرجاء إدخال الرمز المكوّن من 6 أرقام');
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'الرمز غير صحيح، الرجاء المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || isSubmitting) return;
    setError('');
    try {
      await onResend();
      setDigits(Array(CODE_LENGTH).fill(''));
      setSecondsLeft(resendSeconds);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال رمز جديد');
    }
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      <div className="auth-card">
        <AuthCardHeader />

        <h1 className="auth-card__title">التحقق الثنائي</h1>
        <p className="auth-card__subtitle">أدخل رمز التحقق المكوّن من 6 أرقام</p>

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
              `يمكنك طلب رمز جديد بعد ${secondsLeft} ثانية`
            ) : (
              <button type="button" className="otp-timer__resend" onClick={() => void handleResend()}>
                إعادة إرسال الرمز
              </button>
            )}
          </span>
        </div>

        {demoCode ? (
          <p className="otp-demo-hint">
            رمز التحقق في بيئة العرض التجريبي: <bdi dir="ltr">{demoCode}</bdi>
          </p>
        ) : null}

        {error && <p className="auth-form__error">{error}</p>}

        <button
          type="button"
          className="auth-form__submit"
          onClick={() => void handleSubmit()}
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
