import { useEffect, useState } from 'react';
import { ChevronDown, Calendar, Lock } from 'lucide-react';
import { usePackages, type Package, type PackageDuration } from '../../context/PackageContext';
import { calculateRenewalDate } from '../../utils/dateUtils';
import { PageHeader } from '../layout/PageHeader';
import './tenant-form.css';

interface AddTenantPageProps {
  onCancel: () => void;
  onNext: (data: TenantFormData) => void;
  
  initialData?: TenantFormData;
}

export interface TenantFormData {
  tenantType: '' | 'ORG' | 'CLIENT' | 'JODAYN';
  entityName: string;
  entityType: string;
  unifiedId: string;
  region: string;
  subdomain: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  managerTitle: string;
  planId: string;
  userLimit: string;
  storageLimit: string;
  subscriptionStart: string;
  subscriptionRenewal: string;
}

const ALPHA_AR_EN = /^[\u0600-\u06FFa-zA-Z\s]+$/;

const DIGITS_ONLY = /^\d+$/;

const LETTERS_AND_SPECIAL = /^[^\d]+$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PHONE_RE = /^\d{10}$/;

type FormErrors = Partial<Record<keyof TenantFormData, string>>;
type TouchedFields = Partial<Record<keyof TenantFormData, boolean>>;

function validate(data: TenantFormData): FormErrors {
  const e: FormErrors = {};

  if (!data.tenantType) {
    e.tenantType = 'نوع المستأجر مطلوب';
  }

  if (!data.entityName.trim()) {
    e.entityName = 'اسم الجهة مطلوب';
  } else if (!ALPHA_AR_EN.test(data.entityName)) {
    e.entityName = 'يُسمح بالحروف العربية والإنجليزية والمسافات فقط — لا أرقام أو رموز';
  }

  if (!data.unifiedId.trim()) {
    e.unifiedId = 'المعرّف الموحد مطلوب';
  } else if (!DIGITS_ONLY.test(data.unifiedId)) {
    e.unifiedId = 'يُسمح بالأرقام فقط';
  }

  if (!data.region.trim()) {
    e.region = 'المنطقة مطلوبة';
  } else if (!ALPHA_AR_EN.test(data.region)) {
    e.region = 'يُسمح بالحروف العربية والإنجليزية والمسافات فقط';
  }

  if (!data.subdomain.trim()) {
    e.subdomain = 'النطاق الفرعي مطلوب';
  } else if (!LETTERS_AND_SPECIAL.test(data.subdomain)) {
    e.subdomain = 'لا يُسمح بالأرقام في النطاق الفرعي';
  }

  if (!data.managerName.trim()) {
    e.managerName = 'الاسم الكامل مطلوب';
  } else if (!ALPHA_AR_EN.test(data.managerName)) {
    e.managerName = 'يُسمح بالحروف العربية والإنجليزية والمسافات فقط — لا أرقام';
  }

  if (!data.managerEmail.trim()) {
    e.managerEmail = 'البريد الإلكتروني مطلوب';
  } else if (!EMAIL_RE.test(data.managerEmail)) {
    e.managerEmail = 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@domain.com)';
  }

  if (!data.managerPhone.trim()) {
    e.managerPhone = 'رقم الجوال مطلوب';
  } else if (!PHONE_RE.test(data.managerPhone)) {
    e.managerPhone = 'يجب أن يتكون رقم الجوال من 10 أرقام بالضبط';
  }

  if (!data.userLimit.trim()) {
    e.userLimit = 'حد المستخدمين مطلوب';
  } else if (!DIGITS_ONLY.test(data.userLimit) || Number(data.userLimit) < 1) {
    e.userLimit = 'يُسمح بالأرقام الصحيحة الموجبة فقط';
  }

  if (!data.storageLimit.trim()) {
    e.storageLimit = 'حد التخزين مطلوب';
  } else if (!DIGITS_ONLY.test(data.storageLimit) || Number(data.storageLimit) < 1) {
    e.storageLimit = 'يُسمح بالأرقام الصحيحة الموجبة فقط';
  }

  if (!data.subscriptionStart) {
    e.subscriptionStart = 'تاريخ بداية الاشتراك مطلوب';
  }

  return e;
}

const ENTITY_TYPE_OPTIONS = ['حكومية', 'خاصة', 'غير ربحية'];

const TENANT_TYPE_OPTIONS: Array<{ value: '' | 'ORG' | 'CLIENT' | 'JODAYN'; label: string }> = [
  { value: '', label: 'اختر نوع المستأجر' },
  { value: 'ORG', label: 'Organization' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'JODAYN', label: 'Jodayn' },
];

interface FormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
}

function FormField({ label, error, touched, children }: FormFieldProps) {
  const showError = touched && error;
  return (
    <div className="tenant-form-field">
      <label>{label}</label>
      {children}
      {showError && (
        <span className="tenant-form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
  hasError,
  onBlur,
}: {
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
  hasError?: boolean;
  onBlur?: () => void;
}) {
  return (
    <div className={`tenant-form-select-wrap${hasError ? ' tenant-form-select-wrap--error' : ''}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={!value ? 'tenant-form-select--placeholder' : undefined}
      >
        {options.map((opt) => {
          const optionValue = typeof opt === 'string' ? opt : opt.value;
          const optionLabel = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={optionValue || 'empty'} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      <ChevronDown size={16} className="tenant-form-chevron" />
    </div>
  );
}

function DateField({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  return (
    <div className="tenant-form-select-wrap tenant-form-date-wrap">
      <input
        type="date"
        className={`tenant-form-input tenant-form-date-input${hasError ? ' tenant-form-input--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Calendar size={15} className="tenant-form-chevron tenant-form-date-icon" />
    </div>
  );
}

function RenewalDateField({ value }: { value: string }) {
  return (
    <div className="tenant-form-select-wrap tenant-form-date-wrap">
      <input
        type="date"
        className="tenant-form-input tenant-form-date-input tenant-form-date-input--readonly"
        value={value}
        readOnly
        disabled
        aria-label="تاريخ التجديد — محسوب تلقائياً"
        tabIndex={-1}
      />
      <Lock size={14} className="tenant-form-chevron tenant-form-renewal-lock-icon" />
    </div>
  );
}

export function AddTenantPage({ onCancel, onNext, initialData }: AddTenantPageProps) {
  const availablePackages: Package[] = usePackages();
  const defaultPkg = availablePackages[0];

  const [formData, setFormData] = useState<TenantFormData>(
    initialData ?? {
      tenantType: '',
      entityName: '',
      entityType: 'حكومية',
      unifiedId: '',
      region: '',
      subdomain: '',
      managerName: '',
      managerEmail: '',
      managerPhone: '',
      managerTitle: '',
      planId: defaultPkg?.id ?? '',
      userLimit: defaultPkg ? String(defaultPkg.userLimit) : '',
      storageLimit: defaultPkg ? String(defaultPkg.users) : '',
      subscriptionStart: '',
      subscriptionRenewal: '',
    },
  );

  
  const [touched, setTouched] = useState<TouchedFields>(
    
    initialData ? Object.fromEntries(Object.keys(initialData).map((k) => [k, true])) : {},
  );

  
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validate(formData);
  const isValid = Object.keys(errors).length === 0;

  
  const handleBlur = (field: keyof TenantFormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isTouched = (field: keyof TenantFormData) =>
    submitAttempted || !!touched[field];

  
  useEffect(() => {
    if (!formData.subscriptionStart) {
      setFormData((prev) => ({ ...prev, subscriptionRenewal: '' }));
      return;
    }
    const selectedPkg = availablePackages.find((p) => p.id === formData.planId);
    const duration: PackageDuration = selectedPkg?.duration ?? 'سنوي';
    const renewal = calculateRenewalDate(formData.subscriptionStart, duration);
    setFormData((prev) => ({ ...prev, subscriptionRenewal: renewal ?? '' }));
  
  }, [formData.subscriptionStart, formData.planId]);

  const updateField =
    (field: keyof TenantFormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleInputChange =
    (field: keyof TenantFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField(field)(e.target.value);
    };

  const handlePackageChange = (selectedId: string) => {
    const pkg = availablePackages.find((p) => p.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      planId: selectedId,
      userLimit: pkg ? String(pkg.userLimit) : '',
      storageLimit: pkg ? String(pkg.users) : '',
    }));
  };

  const handleNext = () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    onNext(formData);
  };

  
  const inputClass = (field: keyof TenantFormData) =>
    `tenant-form-input${isTouched(field) && errors[field] ? ' tenant-form-input--error' : ''}`;

  return (
    <div className="dashboard-page">
      <PageHeader
        title="إضافة مستأجر جديد"
        breadcrumbs={[{ label: 'إدارة المستأجرين', onClick: onCancel }]}
      />

      <div className="tenant-form-body" dir="rtl">
        <h2 className="tenant-form-section-title">معلومات الجهة</h2>

        {}
        <div className="tenant-form-card">
          <div className="tenant-form-card__header">معلومات المستأجر الأساسية</div>

          <FormField
            label="اسم الجهة"
            error={errors.entityName}
            touched={isTouched('entityName')}
          >
            <input
              type="text"
              className={inputClass('entityName')}
              placeholder="مثال: وزارة التعليم"
              value={formData.entityName}
              onChange={handleInputChange('entityName')}
              onBlur={handleBlur('entityName')}
            />
          </FormField>

          <FormField
            label="نوع المستأجر"
            error={errors.tenantType}
            touched={isTouched('tenantType')}
          >
            <SelectField
              value={formData.tenantType}
              options={TENANT_TYPE_OPTIONS}
              onChange={updateField('tenantType')}
              onBlur={handleBlur('tenantType')}
              hasError={isTouched('tenantType') && !!errors.tenantType}
            />
          </FormField>

          <div className="tenant-form-grid-2">
            <FormField label="نوع الجهة">
              <SelectField
                value={formData.entityType}
                options={ENTITY_TYPE_OPTIONS}
                onChange={updateField('entityType')}
              />
            </FormField>

            <FormField
              label="المنطقة"
              error={errors.region}
              touched={isTouched('region')}
            >
              <input
                type="text"
                className={inputClass('region')}
                placeholder="مثال: الرياض"
                value={formData.region}
                onChange={handleInputChange('region')}
                onBlur={handleBlur('region')}
              />
            </FormField>
          </div>

          <div className="tenant-form-grid-2">
            <FormField
              label="المعرّف الموحد / السجل"
              error={errors.unifiedId}
              touched={isTouched('unifiedId')}
            >
              <div className="tenant-form-select-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass('unifiedId')}
                  placeholder="مثال: 7001234567"
                  value={formData.unifiedId}
                  onChange={handleInputChange('unifiedId')}
                  onBlur={handleBlur('unifiedId')}
                />
                <ChevronDown size={16} className="tenant-form-chevron" />
              </div>
            </FormField>

            <FormField
              label="النطاق الفرعي للمستأجر"
              error={errors.subdomain}
              touched={isTouched('subdomain')}
            >
              <input
                type="text"
                className={inputClass('subdomain')}
                placeholder="example.trackplus.com"
                value={formData.subdomain}
                onChange={handleInputChange('subdomain')}
                onBlur={handleBlur('subdomain')}
              />
            </FormField>
          </div>
        </div>

        {}
        <div className="tenant-form-card">
          <div className="tenant-form-card__header">مدير الحساب</div>

          <FormField
            label="الاسم الكامل"
            error={errors.managerName}
            touched={isTouched('managerName')}
          >
            <input
              type="text"
              className={inputClass('managerName')}
              placeholder="مثال: أحمد محمد"
              value={formData.managerName}
              onChange={handleInputChange('managerName')}
              onBlur={handleBlur('managerName')}
            />
          </FormField>

          <FormField
            label="البريد الإلكتروني"
            error={errors.managerEmail}
            touched={isTouched('managerEmail')}
          >
            <input
              type="email"
              className={inputClass('managerEmail')}
              placeholder="name@domain.com"
              value={formData.managerEmail}
              onChange={handleInputChange('managerEmail')}
              onBlur={handleBlur('managerEmail')}
            />
          </FormField>

          <div className="tenant-form-grid-2">
            <FormField
              label="رقم الجوال"
              error={errors.managerPhone}
              touched={isTouched('managerPhone')}
            >
              <input
                type="tel"
                inputMode="numeric"
                className={inputClass('managerPhone')}
                placeholder="05XXXXXXXX (10 أرقام)"
                value={formData.managerPhone}
                onChange={handleInputChange('managerPhone')}
                onBlur={handleBlur('managerPhone')}
              />
            </FormField>

            <FormField label="المسمى الوظيفي">
              <input
                type="text"
                className="tenant-form-input"
                placeholder="مثال: مدير النظام"
                value={formData.managerTitle}
                onChange={handleInputChange('managerTitle')}
              />
            </FormField>
          </div>
        </div>

        {}
        <div className="tenant-form-card">
          <div className="tenant-form-card__header">الباقة والحدود</div>

          <FormField label="نوع الباقة">
            <div className="tenant-form-select-wrap">
              <select
                value={formData.planId}
                onChange={(e) => handlePackageChange(e.target.value)}
              >
                {availablePackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.duration}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="tenant-form-chevron" />
            </div>
          </FormField>

          <div className="tenant-form-grid-2">
            <FormField
              label="حد عدد المستخدمين"
              error={errors.userLimit}
              touched={isTouched('userLimit')}
            >
              <input
                type="text"
                inputMode="numeric"
                className={inputClass('userLimit')}
                placeholder="مثال: 50"
                value={formData.userLimit}
                onChange={handleInputChange('userLimit')}
                onBlur={handleBlur('userLimit')}
              />
            </FormField>

            <FormField
              label="حد التخزين (GB)"
              error={errors.storageLimit}
              touched={isTouched('storageLimit')}
            >
              <input
                type="text"
                inputMode="numeric"
                className={inputClass('storageLimit')}
                placeholder="مثال: 100"
                value={formData.storageLimit}
                onChange={handleInputChange('storageLimit')}
                onBlur={handleBlur('storageLimit')}
              />
            </FormField>
          </div>

          <div className="tenant-form-grid-2">
            <FormField
              label="تاريخ بداية الاشتراك"
              error={errors.subscriptionStart}
              touched={isTouched('subscriptionStart')}
            >
              <DateField
                value={formData.subscriptionStart}
                onChange={(v) => {
                  updateField('subscriptionStart')(v);
                  setTouched((prev) => ({ ...prev, subscriptionStart: true }));
                }}
                hasError={isTouched('subscriptionStart') && !!errors.subscriptionStart}
              />
            </FormField>

            <FormField label="تاريخ التجديد">
              <div className="tenant-form-renewal-hint-wrap">
                <RenewalDateField value={formData.subscriptionRenewal} />
                {formData.subscriptionStart && formData.subscriptionRenewal && (
                  <span className="tenant-form-renewal-hint">
                    محسوب تلقائياً بناءً على مدة الباقة
                  </span>
                )}
                {!formData.subscriptionStart && (
                  <span className="tenant-form-renewal-hint tenant-form-renewal-hint--muted">
                    اختر تاريخ البداية أولاً
                  </span>
                )}
              </div>
            </FormField>
          </div>
        </div>

        {}
        {submitAttempted && !isValid && (
          <div className="tenant-form-summary-error" role="alert">
            يوجد أخطاء في النموذج — يرجى مراجعة الحقول المميزة بالأحمر والتصحيح قبل المتابعة.
          </div>
        )}

        <div className="tenant-form-actions">
          <button
            type="button"
            className="tenant-form-btn tenant-form-btn--cancel"
            onClick={onCancel}
          >
            إلغاء
          </button>
          <button
            type="button"
            className={`tenant-form-btn tenant-form-btn--next${!isValid ? ' tenant-form-btn--disabled' : ''}`}
            onClick={handleNext}
            aria-disabled={!isValid}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}
