import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import requestLogo from "@/assets/landingpage/requestlogo.png";
import { WaveLoop } from "./WaveLoop";
import { apiRequest, ApiError } from "../../api/client";
import "./demo-request.css";

interface DemoRequestPageProps {
  /** Called after a successful submit; the caller should return the user to the landing page. */
  onSubmitted: () => void;
}

function goToLanding(navigate: ReturnType<typeof useNavigate>) {
  const idx = typeof window.history.state?.idx === "number" ? window.history.state.idx : 0;
  if (idx > 0) {
    navigate(-1);
    return;
  }
  navigate("/", { replace: true });
}

interface FormValues {
  fullName: string;
  phone: string;
  companyName: string;
  businessEmail: string;
  jobTitle: string;
}

const EMPTY_VALUES: FormValues = {
  fullName: "",
  phone: "",
  companyName: "",
  businessEmail: "",
  jobTitle: "",
};

const SAUDI_PHONE_PATTERN = /^5\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DemoRequestPage({ onSubmitted }: DemoRequestPageProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};

    if (!values.fullName.trim() || values.fullName.trim().length < 3) {
      next.fullName = "الرجاء إدخال الاسم الكامل (٣ أحرف على الأقل)";
    }

    if (!SAUDI_PHONE_PATTERN.test(values.phone.trim())) {
      next.phone = "الرجاء إدخال رقم جوال سعودي صحيح (٩ أرقام تبدأ بـ 5)";
    }

    if (!values.companyName.trim() || values.companyName.trim().length < 2) {
      next.companyName = "الرجاء إدخال اسم الشركة";
    }

    if (!EMAIL_PATTERN.test(values.businessEmail.trim())) {
      next.businessEmail = "الرجاء إدخال بريد إلكتروني صحيح";
    }

    if (!values.jobTitle.trim()) {
      next.jobTitle = "الرجاء إدخال المسمى الوظيفي";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiRequest("/public/demo-requests", { method: "POST", body: JSON.stringify(values) });
      setValues(EMPTY_VALUES);
      setErrors({});
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "تعذر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="demo-request-page hero-surface" dir="rtl">
      <WaveLoop />

      <button
        type="button"
        className="demo-request-back"
        onClick={() => goToLanding(navigate)}
        aria-label="العودة"
      >
        <span>العودة</span>
        <span className="demo-request-back__arrow" aria-hidden="true">
          ←
        </span>
      </button>

      <div className="demo-request-copy">
        <h1 className="text-4xl leading-[1.35] font-bold text-white md:text-5xl">
          تواصل مع فريقنا
        </h1>
        <p className="mt-8 text-xl leading-8 text-white md:text-2xl">
          اكتشف كيف يمكنك إدارة أهدافك الاستراتيجية ومشاريعك بكفاءة ووضوح.
        </p>
        <p className="mt-6 text-lg leading-8 text-white md:text-xl">
          تواصل معنا وسنعود إليك في أقرب وقت.
        </p>
      </div>

      <div className="demo-request-card">
        <img src={requestLogo} alt="Track+" className="demo-request-card__logo" />

        {submitted ? (
          <div className="demo-request-form">
            <p className="demo-request-form__label" role="status">
              تم استلام طلبك، سيتواصل معك فريقنا قريباً.
            </p>
            <button type="button" className="demo-request-form__submit" onClick={onSubmitted}>
              العودة للرئيسية
            </button>
          </div>
        ) : (
        <form className="demo-request-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <label className="demo-request-form__label" htmlFor="fullName">
            الاسم كامل
          </label>
          <input
            id="fullName"
            type="text"
            className="demo-request-form__input"
            value={values.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            autoComplete="name"
            required
            minLength={3}
          />
          {errors.fullName && <p className="demo-request-form__error">{errors.fullName}</p>}

          <label className="demo-request-form__label" htmlFor="phone">
            رقم التواصل
          </label>
          <div className="demo-request-form__phone-field">
            <span className="demo-request-form__phone-prefix">+966</span>
            <input
              id="phone"
              type="tel"
              dir="ltr"
              className="demo-request-form__input demo-request-form__input--phone"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
              autoComplete="tel-national"
              inputMode="numeric"
              placeholder="5XXXXXXXX"
              required
              pattern="5\d{8}"
              maxLength={9}
            />
          </div>
          {errors.phone && <p className="demo-request-form__error">{errors.phone}</p>}

          <label className="demo-request-form__label" htmlFor="companyName">
            اسم الشركة
          </label>
          <input
            id="companyName"
            type="text"
            className="demo-request-form__input"
            value={values.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            autoComplete="organization"
            required
            minLength={2}
          />
          {errors.companyName && <p className="demo-request-form__error">{errors.companyName}</p>}

          <label className="demo-request-form__label" htmlFor="businessEmail">
            البريد الإلكتروني للأعمال
          </label>
          <input
            id="businessEmail"
            type="email"
            dir="ltr"
            className="demo-request-form__input"
            value={values.businessEmail}
            onChange={(e) => update("businessEmail", e.target.value)}
            autoComplete="email"
            required
          />
          {errors.businessEmail && (
            <p className="demo-request-form__error">{errors.businessEmail}</p>
          )}

          <label className="demo-request-form__label" htmlFor="jobTitle">
            المسمى الوظيفي
          </label>
          <input
            id="jobTitle"
            type="text"
            className="demo-request-form__input"
            value={values.jobTitle}
            onChange={(e) => update("jobTitle", e.target.value)}
            autoComplete="organization-title"
            required
          />
          {errors.jobTitle && <p className="demo-request-form__error">{errors.jobTitle}</p>}

          {submitError && <p className="demo-request-form__error" role="alert">{submitError}</p>}
          <button type="submit" className="demo-request-form__submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإرسال..." : "أرسل"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
