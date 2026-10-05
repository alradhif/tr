import { useState } from 'react';
import { FeedbackBanner } from '../ui/FeedbackBanner';
const profileImage = 'https://www.figma.com/api/mcp/asset/afa2c740-2ec8-40c7-a560-802eaa7ae5b1.png';
import './dataentry-settings.css';

export type DataEntrySettingsTab = 'notifications' | 'security' | 'profile';

type AlertState = 'error' | 'success';

function SettingsAlert({ type, onClose }: { type: AlertState; onClose: () => void }) {
  return (
    <FeedbackBanner tone={type} onClose={onClose}>
      {type === 'success' ? 'تم حفظ التغييرات بنجاح' : 'تم إلغاء التغييرات'}
    </FeedbackBanner>
  );
}

function SettingsTabs({ activeTab, onChange }: { activeTab: DataEntrySettingsTab; onChange: (tab: DataEntrySettingsTab) => void }) {
  const tabs: Array<[DataEntrySettingsTab, string]> = [
    ['notifications', 'الاشعارات'],
    ['security', 'الامان'],
    ['profile', 'الملف الشخصي '],
  ];

  return (
    <div className="dataentry-settings__tabs" role="tablist" aria-label="إعدادات الحساب">
      {tabs.map(([tab, label], index) => (
        <div className="dataentry-settings__tab-slot" key={tab}>
          {index > 0 && <span className="dataentry-settings__tab-divider" aria-hidden="true" />}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`dataentry-settings__tab ${activeTab === tab ? 'dataentry-settings__tab--active' : ''}`}
            onClick={() => onChange(tab)}
          >
            {label}
          </button>
        </div>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`dataentry-settings__toggle ${checked ? 'dataentry-settings__toggle--on' : ''}`}
      onClick={onChange}
    >
      <span className="dataentry-settings__toggle-dot" />
    </button>
  );
}

function NotificationsPanel({ data, onChange }: { data: boolean[], onChange: (index: number) => void }) {
  const rows = [
    ['إشعارات البريد الالكتروني', 'تحديثات ومهام عبر البريد'],
    ['الإشعارات الفورية', 'تنبيهات طلبات المصادقة'],
    ['تحديثات المنتج والميزات الجديدة', 'أخبار المنصة والتحسينات'],
  ];

  return (
    <section className="dataentry-settings__card" aria-labelledby="notifications-heading">
      <div className="dataentry-settings__card-title" id="notifications-heading">الاشعارات</div>
      <div className="dataentry-settings__separator" />
      {rows.map(([title, description], index) => (
        <div className="dataentry-settings__notification-row" key={title}>
          <Toggle
            checked={data[index]}
            label={title}
            onChange={() => onChange(index)}
          />
          <div className="dataentry-settings__notification-copy">
            <span className="dataentry-settings__field-value dataentry-settings__field-value--dark">{title}</span>
            <span className="dataentry-settings__field-value dataentry-settings__field-value--muted">{description}</span>
          </div>
        </div>
      ))}
      <div className="dataentry-settings__separator" />
    </section>
  );
}

function TextField({ label, value, type = 'text', onChange }: { label: string; value: string; type?: string; onChange?: (val: string) => void }) {
  return (
    <label className="dataentry-settings__field">
      <span className="dataentry-settings__field-label">{label}</span>
      <input type={type} placeholder={label} value={value} onChange={e => onChange?.(e.target.value)} />
    </label>
  );
}

function SecurityPanel({ data, onChange }: { data: any, onChange: (key: string, val: string) => void }) {
  return (
    <section className="dataentry-settings__card dataentry-settings__card--security" aria-labelledby="security-heading">
      <div className="dataentry-settings__card-title" id="security-heading">إعادة تعيين كلمة المرور</div>
      <div className="dataentry-settings__separator" />
      <TextField label="كلمة المرور الحالية " value={data.currentPass} type="password" onChange={v => onChange('currentPass', v)} />
      <TextField label="كلمة المرور الجديدة " value={data.newPass} type="password" onChange={v => onChange('newPass', v)} />
      <TextField label="تأكيد كلمة المرور الجديدة" value={data.confirmPass} type="password" onChange={v => onChange('confirmPass', v)} />
    </section>
  );
}

function ProfilePanel({ data, onChange }: { data: any, onChange: (key: string, val: string) => void }) {
  return (
    <section className="dataentry-settings__card dataentry-settings__card--profile" aria-labelledby="profile-heading">
      <div className="dataentry-settings__card-title" id="profile-heading">المعلومات الشخصية</div>
      <div className="dataentry-settings__separator" />

      <div className="dataentry-settings__identity">
        <div className="dataentry-settings__avatar-image">
          <img src={profileImage} alt={data.fullName} />
        </div>
        <div className="dataentry-settings__identity-copy">
          <span className="dataentry-settings__identity-name">{data.fullName}</span>
          <span className="dataentry-settings__identity-email">{data.email}</span>
        </div>
      </div>

      <div className="dataentry-settings__profile-grid">
        <TextField label="المسمى الوظيفي" value={data.jobTitle} onChange={v => onChange('jobTitle', v)} />
        <TextField label="الاسم الكامل" value={data.fullName} onChange={v => onChange('fullName', v)} />
        <TextField label="رقم الجوال" value={data.phone} onChange={v => onChange('phone', v)} />
        <TextField label="البريد الالكتروني" value={data.email} onChange={v => onChange('email', v)} />
      </div>
    </section>
  );
}

export function DataEntrySettingsPage() {
  const [activeTab, setActiveTab] = useState<DataEntrySettingsTab>('profile');
  const [alert, setAlert] = useState<AlertState>('error');
  const [alertVisible, setAlertVisible] = useState(false);

  type ProfileData = { jobTitle: string; fullName: string; phone: string; email: string };
  type SecurityData = { currentPass: string; newPass: string; confirmPass: string };

  const defaultNotifications: boolean[] = [true, false, true];

  const [savedProfile, setSavedProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('dataentryProfile');
    return saved ? JSON.parse(saved) : { jobTitle: 'مدير مشروع ', fullName: 'سارة خالد', phone: '0555555555', email: 'Sarah@example.com' };
  });
  const [draftProfile, setDraftProfile] = useState<ProfileData>(savedProfile);

  const [savedSecurity, setSavedSecurity] = useState<SecurityData>(() => {
    const saved = localStorage.getItem('dataentrySecurity');
    return saved ? JSON.parse(saved) : { currentPass: '', newPass: '', confirmPass: '' };
  });
  const [draftSecurity, setDraftSecurity] = useState<SecurityData>(savedSecurity);

  const [savedNotifications, setSavedNotifications] = useState<boolean[]>(() => {
    const saved = localStorage.getItem('dataentryNotifications');
    return saved ? JSON.parse(saved) : defaultNotifications;
  });
  const [draftNotifications, setDraftNotifications] = useState<boolean[]>(savedNotifications);

  const handleSave = () => {
    setSavedProfile(draftProfile);
    setSavedSecurity(draftSecurity);
    setSavedNotifications(draftNotifications);
    localStorage.setItem('dataentryProfile', JSON.stringify(draftProfile));
    localStorage.setItem('dataentrySecurity', JSON.stringify(draftSecurity));
    localStorage.setItem('dataentryNotifications', JSON.stringify(draftNotifications));
    setAlert('success');
    setAlertVisible(true);
  };

  const handleCancel = () => {
    setDraftProfile(savedProfile);
    setDraftSecurity(savedSecurity);
    setDraftNotifications(savedNotifications);
    setAlert('error');
    setAlertVisible(true);
  };

  return (
    <div className="dataentry-settings" dir="rtl">
      <div className="dataentry-settings__header">
        <h1>الاعدادات</h1>
      </div>

      {alertVisible && <SettingsAlert type={alert} onClose={() => setAlertVisible(false)} />}

      <div className="dataentry-settings__content">

        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'notifications' && <NotificationsPanel data={draftNotifications} onChange={(index) => setDraftNotifications(prev => prev.map((v, i) => i === index ? !v : v))} />}
        {activeTab === 'security' && <SecurityPanel data={draftSecurity} onChange={(k, v) => setDraftSecurity(prev => ({ ...prev, [k]: v }))} />}
        {activeTab === 'profile' && <ProfilePanel data={draftProfile} onChange={(k, v) => setDraftProfile(prev => ({ ...prev, [k]: v }))} />}

        <div className="dataentry-settings__actions">
          <button type="button" className="dataentry-settings__button dataentry-settings__button--cancel" onClick={handleCancel}>
            الغاء
          </button>
          <button type="button" className="dataentry-settings__button dataentry-settings__button--save" onClick={handleSave}>
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}
