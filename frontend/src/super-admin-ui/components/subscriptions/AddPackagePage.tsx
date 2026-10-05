import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import '../tenants/tenant-form.css';
import './subscriptions.css';

export const PERMISSION_OPTIONS = ['إدارة الحسابات', 'تصدير البيانات', 'إدارة الفوترة'];

export interface NewPackageData {
  planType: string;
  userLimit: string;
  storageLimit: string;
  period: string;
  price: string;
  permissions: string[];
}

interface AddPackagePageProps {
  mode?: 'add' | 'edit';
  initialData?: NewPackageData;
  onCancel: () => void;
  onSave: (data: NewPackageData) => void;
}

const PLAN_TYPE_OPTIONS = ['اساسية', 'متقدمة', 'مؤسسية'];
const USER_LIMIT_OPTIONS = ['3', '5', '10', '20', '50', '100'];
const PERIOD_OPTIONS = ['شهري', 'سنوي'];

export function AddPackagePage({ mode = 'add', initialData, onCancel, onSave }: AddPackagePageProps) {
  
  
  
  const planTypeOptions = initialData && !PLAN_TYPE_OPTIONS.includes(initialData.planType)
    ? [initialData.planType, ...PLAN_TYPE_OPTIONS]
    : PLAN_TYPE_OPTIONS;
  const userLimitOptions = initialData && !USER_LIMIT_OPTIONS.includes(initialData.userLimit)
    ? [initialData.userLimit, ...USER_LIMIT_OPTIONS]
    : USER_LIMIT_OPTIONS;

  const [planType, setPlanType] = useState(initialData?.planType ?? planTypeOptions[0]);
  const [userLimit, setUserLimit] = useState(initialData?.userLimit ?? userLimitOptions[0]);
  const [storageLimit, setStorageLimit] = useState(
    initialData?.storageLimit.match(/\d+/)?.[0] ?? '',
  );
  const [period, setPeriod] = useState(initialData?.period ?? '');
  const [price, setPrice] = useState(initialData?.price ?? '');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(
      PERMISSION_OPTIONS.map((permission) => [
        permission,
        initialData?.permissions.includes(permission) ?? false,
      ]),
    ),
  );

  const isEdit = mode === 'edit';

  const togglePermission = (permission: string) => {
    setPermissions((prev) => ({ ...prev, [permission]: !prev[permission] }));
  };

  const handleSave = () => {
    onSave({
      planType,
      userLimit,
      storageLimit,
      period,
      price,
      permissions: PERMISSION_OPTIONS.filter((permission) => permissions[permission]),
    });
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title={isEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
        breadcrumbs={[{ label: 'الاشتراكات والباقات', onClick: onCancel }]}
      />

      <div className="tenant-form-body" dir="rtl">
        <h1 className="package-form-title">{isEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</h1>

        <div className="tenant-form-card">
          <div className="tenant-form-card__header">
            {isEdit ? 'تعديل معلومات الباقة' : 'معلومات الباقة الجديدة'}
          </div>

          <div className="tenant-form-field">
            <label>نوع الباقة</label>
            <div className="tenant-form-select-wrap">
              <select value={planType} onChange={(event) => setPlanType(event.target.value)}>
                {planTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="tenant-form-chevron" />
            </div>
          </div>

          <div className="package-form-grid-4">
            <div className="tenant-form-field">
              <label>حد المستخدمين</label>
              <div className="tenant-form-select-wrap">
                <select value={userLimit} onChange={(event) => setUserLimit(event.target.value)}>
                  {userLimitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="tenant-form-chevron" />
              </div>
            </div>

            <div className="tenant-form-field">
              <label>حد التخزين (GB)</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                className="tenant-form-input"
                placeholder="مثال: 50"
                value={storageLimit}
                onChange={(event) => setStorageLimit(event.target.value)}
              />
            </div>

            <div className="tenant-form-field">
              <label>الفترة</label>
              <div className="tenant-form-select-wrap">
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className={period === '' ? 'tenant-form-select--placeholder' : ''}
                >
                  <option value="" disabled>
                    مثال: شهري
                  </option>
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="tenant-form-chevron" />
              </div>
            </div>

            <div className="tenant-form-field">
              <label>السعر</label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                className="tenant-form-input"
                placeholder="مثال: 999"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
          </div>

          <div className="tenant-form-field">
            <label>الصلاحيات</label>
            <div className="tenant-form-select-wrap">
              <input type="text" className="tenant-form-input" placeholder="مثال: إدارة البيانات" readOnly />
              <ChevronDown size={16} className="tenant-form-chevron" />
            </div>

            <div className="package-permissions-list">
              {PERMISSION_OPTIONS.map((permission) => (
                <label className="package-permission-row" key={permission}>
                  <input
                    type="checkbox"
                    className="package-permission-checkbox"
                    checked={permissions[permission]}
                    onChange={() => togglePermission(permission)}
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="tenant-form-actions">
          <button type="button" className="tenant-form-btn tenant-form-btn--cancel" onClick={onCancel}>
            إلغاء
          </button>
          <button type="button" className="tenant-form-btn tenant-form-btn--next" onClick={handleSave}>
            {isEdit ? 'حفظ التعديلات' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
