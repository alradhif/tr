import {
  Download,
  HardDrive,
  Users,
  Activity,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Shield,
} from 'lucide-react';
import { companiesAssets, dashboardAssets } from '@/assets';
import { AssetIcon } from '../../../components/ui/AssetIcon';
import { useTenantById, useTenantMutations, type TenantUser } from '../../context/TenantContext';
import { PageHeader } from '../layout/PageHeader';
import './tenant-details.css';

interface TenantDetailsPageProps {
  tenantId: string;
  onBack: () => void;
  onDeleted: () => void;
}

const ROLE_CLASS: Record<TenantUser['role'], string> = {
  'مدير النظام': 'td-role-badge--admin',
  'محلل':        'td-role-badge--analyst',
  'مشرف':        'td-role-badge--supervisor',
  'مستخدم':      'td-role-badge--user',
};

function RoleBadge({ role }: { role: TenantUser['role'] }) {
  return <span className={`td-role-badge ${ROLE_CLASS[role]}`}>{role}</span>;
}

function parseBytes(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (/TB|تيرابايت/i.test(s)) return n * 1024;
  return n; 
}

function pct(used: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

function barClass(p: number) {
  if (p >= 85) return 'td-progress-fill--red';
  if (p >= 60) return 'td-progress-fill--yellow';
  return 'td-progress-fill--green';
}

export function TenantDetailsPage({ tenantId, onBack, onDeleted }: TenantDetailsPageProps) {
  const tenant = useTenantById(tenantId);
  const { updateTenant, deleteTenant } = useTenantMutations();

  

  if (!tenant) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="غير موجود"
          breadcrumbs={[{ label: 'إدارة المستأجرين', onClick: onBack }]}
        />
        <div className="td-page" dir="rtl">
          <div className="td-body" style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#71717a' }}>لم يتم العثور على المستأجر</p>
            <button type="button" className="td-btn td-btn--outline" style={{ marginTop: 12 }} onClick={onBack}>
              العودة للقائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  

  const storagePct = pct(parseBytes(tenant.usedStorage), parseBytes(tenant.storageLimit));
  const userPct    = pct(tenant.activeUsers, tenant.userLimit);
  const isSuspended = tenant.status === 'suspended';

  const statusPillClass =
    tenant.status === 'active'    ? 'td-status-pill--active'
    : tenant.status === 'suspended' ? 'td-status-pill--suspended'
    : 'td-status-pill--trial';

  

  const infoFields = [
    { label: 'اسم الجهة',           value: tenant.entityName },
    { label: 'رقم السجل التجاري',   value: tenant.crNumber },
    { label: 'القطاع',              value: tenant.sector },
    { label: 'مدير الحساب',         value: tenant.adminName },
    { label: 'رقم الهاتف',          value: tenant.phone },
    { label: 'البريد الإلكتروني',   value: tenant.email },
    { label: 'تاريخ الانضمام',      value: tenant.joinDate },
    { label: 'نوع المستأجر',        value: tenant.accountType },
    { label: 'نوع الجهة',           value: tenant.entityType || '—' },
    { label: 'المنطقة',             value: tenant.region },
  ];

  

  function handleToggleSuspend() {
    if (!tenant) return;
    const next: typeof tenant.status = isSuspended ? 'active' : 'suspended';
    updateTenant(tenant.id, {
      status:      next,
      statusLabel: next === 'active' ? 'نشط' : 'معلق',
    });
  }

  function handleDelete() {
    if (!tenant) return;
    const ok = window.confirm(
      `هل أنت متأكد من حذف "${tenant.name}" نهائياً؟\nلا يمكن التراجع عن هذه العملية.`,
    );
    if (!ok) return;
    deleteTenant(tenant.id);
    onDeleted();
  }

  function handleToggleUser(userId: string, current: 'active' | 'suspended') {
    if (!tenant) return;
    const next: 'active' | 'suspended' = current === 'active' ? 'suspended' : 'active';
    const updatedUsers = tenant.users.map((u) =>
      u.id === userId
        ? { ...u, status: next, statusLabel: next === 'active' ? 'نشط' : 'معلق' }
        : u,
    );
    updateTenant(tenant.id, { users: updatedUsers });
  }

  

  return (
    <div className="dashboard-page">
      <PageHeader
        title={tenant.name}
        breadcrumbs={[{ label: 'إدارة المستأجرين', onClick: onBack }]}
      />
      <div className="td-page" dir="rtl">

        {}
        <div className="td-body">

          {}
          <div className="td-title-row">
            <div className="td-title-block">
              <h1 className="td-title">{tenant.name}</h1>
              <div className="td-meta-row">
                <span className="td-meta-item">
                  #{tenant.id}
                </span>
                <span className="td-meta-sep" />
                <span className="td-meta-item">
                  {tenant.joinDuration}
                </span>
                <span className="td-meta-sep" />
                <span className="td-meta-item">
                  آخر نشاط: {tenant.lastActivity}
                </span>
              </div>
            </div>

            <div className="td-actions">
              <button type="button" className="td-btn td-btn--outline">
                <Download size={14} strokeWidth={2.25} />
                تصدير البيانات
              </button>
              <button type="button" className="td-btn td-btn--solid">
                <AssetIcon src={dashboardAssets.notification} size={14} />
                إرسال إشعار
              </button>
            </div>
          </div>

          {}
          <div className="td-kpi-row">

            {}
            <div className="td-kpi-card">
              <div className="td-kpi-card__header">
                <span className="td-kpi-card__icon-badge">
                  <HardDrive size={14} strokeWidth={2} />
                </span>
                <p className="td-kpi-card__label">التخزين المستخدم</p>
              </div>
              <p className="td-kpi-card__value">
                {tenant.usedStorage}
                <span className="td-kpi-card__sub"> / {tenant.storageLimit}</span>
              </p>
              <div className="td-kpi-card__progress">
                <div className="td-progress-track">
                  <div
                    className={`td-progress-fill ${barClass(storagePct)}`}
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              </div>
            </div>

            {}
            <div className="td-kpi-card">
              <div className="td-kpi-card__header">
                <span className="td-kpi-card__icon-badge">
                  <Users size={14} strokeWidth={2} />
                </span>
                <p className="td-kpi-card__label">المستخدمون النشطون</p>
              </div>
              <p className="td-kpi-card__value">
                {tenant.activeUsers}
                <span className="td-kpi-card__sub"> / {tenant.userLimit}</span>
              </p>
              <div className="td-kpi-card__progress">
                <div className="td-progress-track">
                  <div
                    className={`td-progress-fill ${barClass(userPct)}`}
                    style={{ width: `${userPct}%` }}
                  />
                </div>
              </div>
            </div>

            {}
            <div className="td-kpi-card">
              <div className="td-kpi-card__header">
                <span className="td-kpi-card__icon-badge">
                  <Activity size={14} strokeWidth={2} />
                </span>
                <p className="td-kpi-card__label">حالة الحساب</p>
              </div>
              <span className={`td-status-pill ${statusPillClass}`}>
                <span className="td-status-dot" />
                {tenant.statusLabel}
              </span>
              <p className="td-status-desc">
                {isSuspended
                  ? 'الحساب موقوف — المستخدمون لا يملكون وصولاً'
                  : tenant.status === 'trial'
                  ? 'فترة تجريبية — ميزات محدودة'
                  : 'الحساب يعمل بشكل طبيعي'}
              </p>
            </div>
          </div>

          {}
          <div className="td-sub-banner">

            {}
            <div className="td-sub-banner__features">
              <p className="td-sub-banner__features-title">المميزات المتاحة</p>
              <div className="td-sub-banner__feature-list">
                {tenant.package.features.map((f) => (
                  <span key={f} className="td-sub-banner__feature">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    {f}
                  </span>
                ))}
                {tenant.package.features.length === 0 && (
                  <span className="td-sub-banner__feature" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    لا توجد مميزات مضافة
                  </span>
                )}
              </div>
            </div>

            {}
            <div className="td-sub-banner__info">
              <span className="td-sub-banner__eyebrow">الاشتراك الحالي</span>
              <h2 className="td-sub-banner__pkg-name">باقة {tenant.package.name}</h2>
              <div className="td-sub-banner__details">
                <span className="td-sub-banner__detail">
                  <CreditCard size={13} strokeWidth={2} />
                  التكلفة:&nbsp;
                  <span className="td-sub-banner__detail-value">{tenant.package.monthlyCost}</span>
                </span>
                <span className="td-sub-banner__detail">
                  <RefreshCw size={13} strokeWidth={2} />
                  تاريخ التجديد:&nbsp;
                  <span className="td-sub-banner__detail-value">{tenant.package.renewalDate}</span>
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="td-main-card">

            {}
            <div className="td-section">
              <h3 className="td-section__title">
                <span className="td-section__title-icon">
                  <AssetIcon src={companiesAssets.company} size={15} />
                </span>
                معلومات الجهة
              </h3>

              <div className="td-info-grid">
                {infoFields.map((f) => (
                  <div key={f.label}>
                    <p className="td-info-field__label">{f.label}</p>
                    <p className="td-info-field__value">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="td-section">
              <h3 className="td-section__title">
                <span className="td-section__title-icon">
                  <Users size={15} strokeWidth={2} />
                </span>
                المستخدمون
                <span className="td-section__title-count">{tenant.users.length}</span>
              </h3>

              <div className="td-users-table">
                {}
                <div className="td-users-row td-users-row--head">
                  <span className="td-users-head-cell">المستخدم</span>
                  <span className="td-users-head-cell">الدور</span>
                  <span className="td-users-head-cell">الحالة</span>
                  <span className="td-users-head-cell">إجراءات</span>
                </div>

                {}
                {tenant.users.map((user) => (
                  <div className="td-users-row" key={user.id}>

                    {}
                    <div className="td-user-identity">
                      <div
                        className="td-user-avatar"
                        style={{ background: user.avatarColor }}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <p className="td-user-name">{user.name}</p>
                        <p className="td-user-email">{user.email}</p>
                      </div>
                    </div>

                    {}
                    <RoleBadge role={user.role} />

                    {}
                    <span
                      className={`td-user-status ${
                        user.status === 'active'
                          ? 'td-user-status--active'
                          : 'td-user-status--suspended'
                      }`}
                    >
                      <span className="td-status-dot" />
                      {user.statusLabel}
                    </span>

                    {}
                    <div className="td-user-actions">
                      <button
                        type="button"
                        className="td-user-btn"
                        title="تعديل الدور"
                      >
                        <Pencil size={11} strokeWidth={2.5} />
                        تعديل الدور
                      </button>
                      <button
                        type="button"
                        className={`td-user-btn ${
                          user.status === 'active'
                            ? 'td-user-btn--danger'
                            : 'td-user-btn--activate'
                        }`}
                        onClick={() => handleToggleUser(user.id, user.status)}
                      >
                        {user.status === 'active' ? (
                          <><UserX size={11} strokeWidth={2.5} /> تعليق</>
                        ) : (
                          <><UserCheck size={11} strokeWidth={2.5} /> تفعيل</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {tenant.users.length === 0 && (
                  <div style={{ padding: '24px 0', color: '#a1a1aa', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    لا يوجد مستخدمون مضافون بعد
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="td-admin-section">
              <h3 className="td-admin-section__title">
                <span className="td-section__title-icon">
                  <Shield size={15} strokeWidth={2} />
                </span>
                إجراءات Super Admin
              </h3>

              <div className="td-admin-actions-row">

                {}
                <div className="td-admin-action">
                  <label className="td-toggle">
                    <input
                      type="checkbox"
                      checked={isSuspended}
                      onChange={handleToggleSuspend}
                    />
                    <span className="td-toggle__track" />
                  </label>
                  <div className="td-admin-action__text">
                    <p className="td-admin-action__title">تعليق الحساب</p>
                    <p className="td-admin-action__desc">
                      {isSuspended
                        ? 'الحساب معلق حالياً — قم بتشغيل المفتاح لإعادة التفعيل الفوري.'
                        : 'يوقف وصول جميع مستخدمي الجهة فوراً دون حذف أي بيانات.'}
                    </p>
                  </div>
                </div>

                <div className="td-admin-divider" />

                {}
                <div className="td-admin-action">
                  <div className="td-admin-action__text">
                    <p className="td-admin-action__title td-admin-action__title--danger">
                      حذف المستأجر نهائياً
                    </p>
                    <p className="td-admin-action__desc">
                      يحذف الجهة وجميع بياناتها بشكل دائم ولا يمكن التراجع عن هذه العملية.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="td-delete-btn"
                    onClick={handleDelete}
                  >
                    <Trash2 size={13} strokeWidth={2.25} />
                    حذف الحساب
                  </button>
                </div>
              </div>
            </div>

          </div>{}
        </div>{}
      </div>{}
    </div>
  );
}
