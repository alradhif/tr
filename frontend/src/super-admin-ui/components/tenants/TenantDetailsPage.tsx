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
import { useCallback, useEffect, useState } from 'react';
import { useTenantById, useTenantMutations, type TenantUser } from '../../context/TenantContext';
import {
  deleteTenantAccount,
  getTenantDetails,
  notifyTenant,
  resetPlatformUserCredentials,
  toggleAccount,
  updatePlatformUser,
  type TenantDetails,
} from '../../../api/superAdmin';
import { downloadWithToken } from '../../../api/me';
import { getSuperAdminToken } from '../../../auth/superAdminAuth';
import { CredentialsModal } from '../../../components/settings/CredentialsModal';
import { PageHeader } from '../layout/PageHeader';
import { SaDialog, SaToast, type SaToastValue } from '../ui/SaDialog';
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

const AVATAR_COLORS = ['#dbeafe', '#d1f0e1', '#e9d5ff', '#fde9ce', '#f4f4f5'];

type DialogState =
  | { kind: 'suspend' }
  | { kind: 'delete'; typed: string }
  | { kind: 'export' }
  | { kind: 'notify'; title: string; message: string }
  | { kind: 'toggleUser'; userId: string; active: boolean }
  | { kind: 'role'; userId: string; accessLevel: 'UPPER' | 'DATA_ENTRY' };

function splitTenantId(id: string): { kind: 'org' | 'client' | 'jodayn'; id: string } {
  const [kind, ...rest] = id.split('-');
  return { kind: kind as 'org' | 'client' | 'jodayn', id: rest.join('-') };
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function TenantDetailsPage({ tenantId, onBack, onDeleted }: TenantDetailsPageProps) {
  const baseTenant = useTenantById(tenantId);
  const { refreshTenants, deleteTenant } = useTenantMutations();
  const ref = splitTenantId(tenantId);
  const [details, setDetails] = useState<TenantDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<SaToastValue | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  const [credentials, setCredentials] = useState<{ name: string; email: string; temporaryPassword: string; emailSent?: boolean } | null>(null);

  const loadDetails = useCallback(async () => {
    const token = getSuperAdminToken();
    if (!token || ref.kind === 'jodayn') return;
    try {
      setDetails(await getTenantDetails(token, ref.kind, ref.id));
    } catch (err) {
      setNotice({ ok: false, title: err instanceof Error ? err.message : 'تعذر تحميل تفاصيل المستأجر' });
    }
  }, [ref.kind, ref.id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  async function run(action: (token: string) => Promise<unknown>, success: SaToastValue) {
    const token = getSuperAdminToken();
    if (!token) return;
    setBusy(true);
    setNotice(null);
    try {
      await action(token);
      setNotice(success);
      setDialog(null);
      await Promise.all([refreshTenants(), loadDetails()]);
    } catch (err) {
      setNotice({ ok: false, title: err instanceof Error ? err.message : 'تعذر تنفيذ العملية' });
    } finally {
      setBusy(false);
    }
  }

  const tenant = baseTenant
    ? {
        ...baseTenant,
        users: details
          ? details.users.map<TenantUser & { pending: boolean; accessLevel: 'UPPER' | 'DATA_ENTRY'; lastLogin: string }>((user, index) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              initials: user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join(''),
              avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
              role: user.accessLevel === 'UPPER' ? 'مدير النظام' : 'مستخدم',
              status: user.isActive ? 'active' : 'suspended',
              statusLabel: user.statusLabel,
              pending: user.pendingActivation,
              accessLevel: user.accessLevel,
              lastLogin: formatDateTime(user.lastLoginAt),
            }))
          : [],
        activeUsers: details?.usage.activeUsers ?? baseTenant.activeUsers,
        userLimit: details?.usage.userLimit ?? baseTenant.userLimit,
        usedStorage: details ? formatBytes(details.usage.storageBytes) : baseTenant.usedStorage,
        storageLimit: details?.usage.storageLimitGb != null ? `${details.usage.storageLimitGb} GB` : baseTenant.storageLimit,
        lastActivity: details ? formatDateTime(details.lastActivityAt) : baseTenant.lastActivity,
      }
    : undefined;

  

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

  

  const storagePct = details?.usage.storageLimitGb
    ? pct(details.usage.storageBytes, details.usage.storageLimitGb * 1024 * 1024 * 1024)
    : pct(parseBytes(tenant.usedStorage), parseBytes(tenant.storageLimit));
  const userPct    = pct(tenant.activeUsers, tenant.userLimit);
  const isSuspended = tenant.status === 'suspended';

  const statusPillClass =
    tenant.status === 'active'    ? 'td-status-pill--active'
    : tenant.status === 'suspended' ? 'td-status-pill--suspended'
    : 'td-status-pill--trial';

  

  const isPrivate = /خاص/.test(tenant.entityType ?? '');
  const infoFields = [
    { label: 'اسم الجهة', value: tenant.entityName },
    { label: 'رقم السجل التجاري', value: tenant.crNumber },
    { label: 'القطاع', value: [tenant.entityType, tenant.sector].filter((part) => part && part !== '—').join(' — ') },
    { label: 'اتجاه المبالغ', value: isPrivate ? 'تحصيل من العملاء' : 'دفع للشركات المنفذة' },
    { label: 'وظيفة الفواتير', value: isPrivate ? 'تحصيل الفواتير' : 'تتبع الفواتير' },
    { label: 'المسؤول الرئيسي (Tenant Admin)', value: tenant.adminName },
    { label: 'الهاتف', value: tenant.phone },
    { label: 'البريد الإلكتروني', value: tenant.email },
    { label: 'تاريخ الانضمام', value: tenant.joinDate },
    { label: 'نوع الحساب', value: tenant.package.name },
    { label: 'المنطقة', value: tenant.region },
  ];


  

  async function handleDelete(typed: string) {
    if (!tenant || ref.kind === 'jodayn') return;
    const token = getSuperAdminToken();
    if (!token) return;
    setBusy(true);
    try {
      await deleteTenantAccount(token, ref.kind, ref.id, typed.trim());
      deleteTenant(tenant.id);
      await refreshTenants();
      onDeleted();
    } catch (err) {
      setNotice({ ok: false, title: err instanceof Error ? err.message : 'تعذر حذف المستأجر' });
      setBusy(false);
    }
  }

  async function handleResetCredentials(userId: string) {
    if (ref.kind === 'jodayn') return;
    const token = getSuperAdminToken();
    if (!token) return;
    if (!window.confirm('إصدار كلمة مرور مؤقتة جديدة؟ سيعود الحساب «غير نشط» حتى أول دخول.')) return;
    try {
      const result = await resetPlatformUserCredentials(token, ref.kind, userId);
      setCredentials({ name: result.user.name, email: result.user.email, temporaryPassword: result.temporaryPassword, emailSent: result.emailSent });
      await loadDetails();
    } catch (err) {
      setNotice({ ok: false, title: err instanceof Error ? err.message : 'تعذر إصدار بيانات الدخول' });
    }
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
              <button type="button" className="td-btn td-btn--outline" disabled={busy || ref.kind === 'jodayn'} onClick={() => setDialog({ kind: 'export' })}>
                <Download size={14} strokeWidth={2.25} />
                تصدير البيانات
              </button>
              <button type="button" className="td-btn td-btn--solid" disabled={busy || ref.kind === 'jodayn'} onClick={() => setDialog({ kind: 'notify', title: '', message: '' })}>
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
                  <span className="td-users-head-cell">آخر دخول</span>
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

                    <span className="td-user-last-login">{user.lastLogin}</span>

                    {}
                    <div className="td-user-actions">
                      <button
                        type="button"
                        className="td-user-btn"
                        title="تعديل الدور"
                        disabled={busy}
                        onClick={() => setDialog({ kind: 'role', userId: user.id, accessLevel: user.accessLevel })}
                      >
                        <Pencil size={11} strokeWidth={2.5} />
                        تعديل الدور
                      </button>
                      {user.pending ? (
                        <button
                          type="button"
                          className="td-user-btn td-user-btn--activate"
                          disabled={busy}
                          onClick={() => void handleResetCredentials(user.id)}
                        >
                          <RefreshCw size={11} strokeWidth={2.5} /> بيانات دخول جديدة
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`td-user-btn ${
                          user.status === 'active'
                            ? 'td-user-btn--danger'
                            : 'td-user-btn--activate'
                        }`}
                        disabled={busy}
                        onClick={() => setDialog({ kind: 'toggleUser', userId: user.id, active: user.status === 'active' })}
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
                      disabled={busy}
                      onChange={() => setDialog({ kind: 'suspend' })}
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
                    disabled={busy || ref.kind === 'jodayn'}
                    onClick={() => setDialog({ kind: 'delete', typed: '' })}
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
      {notice ? <SaToast toast={notice} onClose={clearNotice} /> : null}
      {dialog?.kind === 'suspend' ? (
        <SaDialog
          title={isSuspended ? 'إعادة تفعيل حساب الجهة؟' : 'تعليق حساب الجهة؟'}
          body={
            isSuspended
              ? `سيتمكن مستخدمو «${tenant.name}» من تسجيل الدخول مجددًا.`
              : `سيُمنع جميع مستخدمي «${tenant.name}» من تسجيل الدخول، وتبقى البيانات محفوظة حتى إعادة التفعيل.`
          }
          tone={isSuspended ? 'info' : 'danger'}
          confirmLabel={isSuspended ? 'إعادة التفعيل' : 'تعليق الحساب'}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            void run(
              (token) => toggleAccount(token, ref.kind, ref.id),
              isSuspended
                ? { ok: true, title: 'تمت إعادة تفعيل حساب الجهة' }
                : { ok: true, title: 'تم تعليق حساب الجهة', body: 'لن يتمكن مستخدموها من الدخول حتى إعادة التفعيل.' },
            )
          }
        />
      ) : null}
      {dialog?.kind === 'delete' ? (
        <SaDialog
          title="حذف المستأجر نهائيًا؟"
          body={`سيُحذف «${tenant.name}» وجميع مشاريعه وبيانات مستخدميه بشكل دائم، ولا يمكن التراجع.`}
          tone="danger"
          confirmLabel="حذف نهائي"
          confirmDisabled={dialog.typed.trim() !== tenant.name}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() => void handleDelete(dialog.typed)}
        >
          <label className="sa-dialog__field">
            للتأكيد اكتب اسم الجهة
            <input
              value={dialog.typed}
              placeholder={tenant.name}
              onChange={(event) => setDialog({ kind: 'delete', typed: event.target.value })}
            />
          </label>
        </SaDialog>
      ) : null}
      {dialog?.kind === 'export' ? (
        <SaDialog
          title="تصدير بيانات الجهة"
          body="يشمل الملف: معلومات الجهة، المستخدمين، الاشتراك، وسجل الإجراءات."
          confirmLabel="تصدير CSV"
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            void run(
              (token) => downloadWithToken(`/super-admin/accounts/${ref.kind}/${ref.id}/export`, token, `tenant-${ref.id}.csv`),
              { ok: true, title: 'ملف التصدير جاهز', body: `${tenant.name} · CSV` },
            )
          }
        />
      ) : null}
      {dialog?.kind === 'notify' ? (
        <SaDialog
          title="إرسال إشعار للجهة"
          body="يصل الإشعار داخل المنصة لكل مستخدمي الجهة."
          confirmLabel="إرسال الإشعار"
          confirmDisabled={!dialog.title.trim() || !dialog.message.trim()}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            void run(
              (token) =>
                notifyTenant(token, ref.kind as 'org' | 'client', ref.id, {
                  title: dialog.title.trim(),
                  message: dialog.message.trim(),
                }),
              { ok: true, title: 'تم إرسال الإشعار', body: 'أُرسل إلى مستخدمي الجهة.' },
            )
          }
        >
          <label className="sa-dialog__field">
            عنوان الإشعار *
            <input
              value={dialog.title}
              placeholder="مثال: صيانة مجدولة"
              onChange={(event) => setDialog({ ...dialog, title: event.target.value })}
            />
          </label>
          <label className="sa-dialog__field">
            نص الإشعار *
            <textarea
              rows={3}
              value={dialog.message}
              onChange={(event) => setDialog({ ...dialog, message: event.target.value })}
            />
          </label>
        </SaDialog>
      ) : null}
      {dialog?.kind === 'toggleUser' ? (
        <SaDialog
          title={dialog.active ? 'تعطيل المستخدم؟' : 'إعادة تفعيل المستخدم؟'}
          body={
            dialog.active
              ? 'لن يتمكن المستخدم من تسجيل الدخول حتى تُعيد تفعيله. تبقى بياناته وصلاحياته محفوظة.'
              : 'سيتمكن المستخدم من تسجيل الدخول مجددًا بنفس دوره السابق.'
          }
          tone={dialog.active ? 'danger' : 'info'}
          confirmLabel={dialog.active ? 'تعطيل المستخدم' : 'إعادة التفعيل'}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            void run(
              (token) => updatePlatformUser(token, ref.kind as 'org' | 'client', dialog.userId, { isActive: !dialog.active }),
              dialog.active
                ? { ok: true, title: 'تم تعطيل المستخدم', body: 'يمكنك إعادة تفعيله في أي وقت.' }
                : { ok: true, title: 'تمت إعادة تفعيل المستخدم' },
            )
          }
        />
      ) : null}
      {dialog?.kind === 'role' ? (
        <SaDialog
          title="تعديل دور المستخدم"
          body="اختر الدور الجديد. يُطبّق التغيير عند تسجيل الدخول التالي للمستخدم."
          confirmLabel="حفظ الدور"
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            void run(
              (token) => updatePlatformUser(token, ref.kind as 'org' | 'client', dialog.userId, { accessLevel: dialog.accessLevel }),
              { ok: true, title: 'تم تحديث دور المستخدم', body: 'يُطبّق عند تسجيل دخوله التالي.' },
            )
          }
        >
          <div className="sa-dialog__options">
            {(
              [
                ['UPPER', 'إدارة عليا'],
                ['DATA_ENTRY', 'مدخل بيانات'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`sa-dialog__option${dialog.accessLevel === value ? ' sa-dialog__option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={dialog.accessLevel === value}
                  onChange={() => setDialog({ ...dialog, accessLevel: value })}
                />
                {label}
              </label>
            ))}
          </div>
        </SaDialog>
      ) : null}
      {credentials ? (
        <CredentialsModal
          name={credentials.name}
          email={credentials.email}
          temporaryPassword={credentials.temporaryPassword}
          emailSent={credentials.emailSent}
          reissued
          onClose={() => setCredentials(null)}
        />
      ) : null}
    </div>
  );
}
