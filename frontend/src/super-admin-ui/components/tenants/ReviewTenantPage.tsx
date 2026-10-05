import { CircleAlert } from 'lucide-react';
import type { TenantFormData } from './AddTenantPage';
import { tenantTypeLabel } from '../../lib/tenantTypes';
import { usePackages } from '../../context/PackageContext';
import { PageHeader } from '../layout/PageHeader';
import './tenant-form.css';
import './review-tenant.css';

interface ReviewTenantPageProps {
  formData: TenantFormData;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}

interface TenantInfo {
  name: string;
  type: string;
  nationalId: string;
  subdomain: string;
}

interface AccountManager {
  fullName: string;
  jobTitle: string;
  phone: string;
  email: string;
}

interface PackageLimits {
  packageName: string;
  userLimit: string;
  storageLimit: string;
  renewalDate: string;
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rv-field">
      <span className="rv-field__label">{label}</span>
      <span className="rv-field__value">{value || '—'}</span>
    </div>
  );
}

function ReviewInputField({ label, value }: { label: string; value: string }) {
  return (
    <div className="tenant-form-field">
      <label className="rv-input-label">{label}</label>
      <div className="rv-input-box">{value || '—'}</div>
    </div>
  );
}

export function ReviewTenantPage({
  formData,
  onConfirm,
  onBack,
  onCancel,
}: ReviewTenantPageProps) {
  
  const packages = usePackages();
  const selectedPkg = packages.find((p) => p.id === formData.planId);

  
  const tenantInfo: TenantInfo = {
    name:       formData.entityName,
    type:       formData.entityType,
    nationalId: formData.unifiedId,
    subdomain:  formData.subdomain,
  };
  const region = formData.region || '—';

  const accountManager: AccountManager = {
    fullName: formData.managerName,
    jobTitle: formData.managerTitle,
    phone:    formData.managerPhone,
    email:    formData.managerEmail,
  };

  const packageLimits: PackageLimits = {
    packageName:  selectedPkg?.name ?? formData.planId,
    userLimit:    formData.userLimit,
    storageLimit: formData.storageLimit,
    renewalDate:  formData.subscriptionRenewal,
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="مراجعة وتأكيد"
        breadcrumbs={[{ label: 'إدارة المستأجرين', onClick: onCancel }]}
      />

      {}
      <div className="tenant-form-body" dir="rtl">
        <h2 className="rv-section-title">مراجعة وتأكيد معلومات الجهة</h2>

        {}
        <div className="tenant-form-card">
          <div className="tenant-form-card__header">معلومات المستأجر الأساسية</div>

          <div className="rv-grid-2x2">
            <ReviewField
              label="اسم الجهة"
              value={tenantInfo.name}
            />
            <ReviewField
              label="نوع المستأجر"
              value={tenantTypeLabel(formData.tenantType)}
            />
            <ReviewField
              label="نوع الجهة"
              value={tenantInfo.type}
            />
            <ReviewField
              label="المنطقة"
              value={region}
            />
            <ReviewField
              label="المعرّف الموحد / السجل"
              value={tenantInfo.nationalId}
            />
            <ReviewField
              label="النطاق"
              value={tenantInfo.subdomain}
            />
          </div>
        </div>

        {}
        <div className="tenant-form-card">
          <div className="tenant-form-card__header">مدير الحساب</div>

          <div className="rv-grid-2x2">
            <ReviewField
              label="الاسم"
              value={accountManager.fullName}
            />
            <ReviewField
              label="المسمى الوظيفي"
              value={accountManager.jobTitle}
            />
            <ReviewField
              label="رقم الجوال"
              value={accountManager.phone}
            />
            <ReviewField
              label="البريد الإلكتروني"
              value={accountManager.email}
            />
          </div>
        </div>

        {}
        <div className="tenant-form-card">
          <div className="tenant-form-card__header">الباقة والحدود</div>

          {}
          <ReviewInputField
            label="نوع الباقة"
            value={packageLimits.packageName}
          />

          {}
          <div className="tenant-form-grid-2">
            <ReviewInputField
              label="حد المستخدمين"
              value={packageLimits.userLimit}
            />
            <ReviewInputField
              label="حد التخزين (GB)"
              value={packageLimits.storageLimit}
            />
          </div>

          {}
          <ReviewInputField
            label="التجديد"
            value={packageLimits.renewalDate}
          />
        </div>

        {}
        {}
        <div className="rv-warning-banner" role="alert" aria-live="polite">
          <CircleAlert
            size={18}
            className="rv-warning-banner__icon"
            aria-hidden
          />
          <p className="rv-warning-banner__text">
            سيتم إرسال بريد دعوة فعلي إلى{' '}
            <strong className="rv-warning-banner__email">
              {accountManager.email || '—'}
            </strong>{' '}
            فوراً بعد التأكيد
          </p>
        </div>

        {}
        {}
        <div className="rv-actions">
          {}
          <button
            type="button"
            className="tenant-form-btn rv-btn--confirm"
            onClick={onConfirm}
          >
            تأكيد وإنشاء المستأجر
          </button>

          {}
          <button
            type="button"
            className="tenant-form-btn rv-btn--outline"
            onClick={onBack}
          >
            تعديل
          </button>

          {}
          <button
            type="button"
            className="tenant-form-btn rv-btn--outline"
            onClick={onCancel}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
