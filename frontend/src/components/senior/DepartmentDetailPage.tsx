import { useState, type ReactNode } from 'react';
import {
  Briefcase,
  ChevronLeft,
  ClipboardList,
  Download,
  FileText,
  HelpCircle,
  ListFilter,
  Mail,
  Phone,
  SquareCheckBig,
  Trash2,
  User,
} from 'lucide-react';
import type { Department, DepartmentProject, StatusClass } from './DepartmentsPage';
import { SubpageHeader } from '../layout/SubpageHeader';
import { TrendKpiRow } from './TrendKpiCard';
import { deleteDepartment, updateDepartment, useDepartment } from '../../lib/departments-store';
import { FeedbackBanner } from '../ui/FeedbackBanner';
import './departments-detail.css';

type Props = { departmentId: number; onBack: (reason?: 'deleted') => void };

const tabs = ['المشاريع', 'التقارير', 'الموظفين'] as const;
type Tab = (typeof tabs)[number];

const statusMap: Record<StatusClass, { label: string; className: string; barClass: string }> = {
  track: { label: 'على المسار', className: 'is-track', barClass: 'is-track' },
  delay: { label: 'تأخير', className: 'is-late', barClass: 'is-late' },
  blocked: { label: 'متعثر', className: 'is-risk', barClass: 'is-risk' },
  done: { label: 'مكتمل', className: 'is-done', barClass: 'is-done' },
};

export function DepartmentDetailPage({ departmentId, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('المشاريع');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [banner, setBanner] = useState<'success' | 'error' | null>(null);
  const department = useDepartment(departmentId);

  if (!department) {
    return (
      <div className="department-detail-exact" dir="rtl">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: 'var(--dd-muted-foreground)', fontWeight: 600 }}>
            هذه الإدارة غير موجودة أو تم حذفها.
          </p>
          <button type="button" className="department-detail-edit" onClick={() => onBack()}>
            العودة إلى الإدارات
          </button>
        </div>
      </div>
    );
  }

  const projects = department.projectsList ?? [];
  const stats = [
    { label: 'عدد المشاريع', value: `${department.projects}`, delta: '+5%', up: true },
    { label: 'متوسط التقدم', value: `${department.progress}%`, delta: '+5%', up: true },
    { label: 'عدد المخرجات', value: `${department.outputs}`, delta: '+5%', up: false },
  ];

  const saveDepartment = (patch: Partial<Department>, ok: boolean) => {
    setEditOpen(false);
    if (!ok) {
      setBanner('error');
      return;
    }
    updateDepartment(department.id, patch);
    setBanner('success');
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    deleteDepartment(department.id);
    onBack('deleted');
  };

  return (
    <div className="department-detail-exact" dir="rtl">
      <div className="department-detail-header">
        <SubpageHeader
          parent="الإدارات"
          title={department.name}
          onBack={onBack}
          actions={
            <div className="department-detail-header__actions">
              <button type="button" className="department-detail-edit" onClick={() => setEditOpen(true)}>
                تعديل
              </button>
              <button type="button" className="department-detail-delete" onClick={() => setDeleteOpen(true)}>
                حذف
              </button>
            </div>
          }
        />
      </div>

      {banner && (
        <FeedbackBanner className="department-detail-banner" tone={banner} onClose={() => setBanner(null)}>
          {banner === 'success'
            ? 'تم حفظ التغييرات بنجاح'
            : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى'}
        </FeedbackBanner>
      )}

      <div className="department-detail-content">
        <TrendKpiRow stats={stats} />

        <section className="department-detail-card">
          <div className="department-detail-card__intro">
            <span className="department-detail-card__icon">
              <FileText />
            </span>
            <div>
              <h1>{department.name}</h1>
              <p>{department.description}</p>
            </div>
          </div>

          <div className="department-detail-info-grid department-detail-info-grid--first">
            <InfoItem icon={<Briefcase />} label="القسم" value={department.section} />
            <InfoItem icon={<SquareCheckBig />} label="الأداء" value={department.performance} />
            <InfoItem icon={<ClipboardList />} label="القطاع" value={department.sector} />
          </div>
          <div className="department-detail-info-grid department-detail-info-grid--second">
            <InfoItem icon={<User />} label="الشخص المسؤول" value={department.owner} />
            <InfoItem icon={<Phone />} label="الهاتف" value={department.phone} ltr />
            <InfoItem icon={<Mail />} label="البريد الإلكتروني" value={department.email} ltr />
          </div>
        </section>

        <section className="department-detail-workspace">
          <div className="department-detail-tabs">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                className={tab === t ? 'is-active' : ''}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'المشاريع' && (
            <>
              <div className="department-detail-toolbar">
                <button type="button" className="department-detail-outline">
                  <Download />
                  تصدير
                </button>
                <button type="button" className="department-detail-outline">
                  <ListFilter />
                  حفظ
                </button>
              </div>

              <table className="department-detail-project-table">
                <thead>
                  <tr>
                    <th>اسم المشروع</th>
                    <th>نسبة التقدم</th>
                    <th>الحالة</th>
                    <th aria-label="فتح" />
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'التقارير' && (
            <p className="department-detail-empty">لا توجد تقارير متاحة لهذه الإدارة حالياً.</p>
          )}

          {tab === 'الموظفين' && (
            <ul className="department-detail-team">
              {department.team.map((member) => (
                <li key={member.id}>
                  <span className="department-detail-team__avatar">{member.name.charAt(0)}</span>
                  <div>
                    <strong>{member.name}</strong>
                    <p>
                      {member.role} · {member.phone} · {member.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editOpen && (
        <EditDialog
          initial={department}
          onClose={() => setEditOpen(false)}
          onSave={saveDepartment}
        />
      )}

      {deleteOpen && (
        <ConfirmDialog onCancel={() => setDeleteOpen(false)} onConfirm={handleDelete} />
      )}
    </div>
  );
}

function ProjectRow({ project }: { project: DepartmentProject }) {
  const meta = statusMap[project.statusClass];
  return (
    <tr>
      <td>{project.name}</td>
      <td>
        <div className="department-detail-progress">
          <span>{project.progress}%</span>
          <span dir="ltr" className="department-detail-progress__track">
            <span className={`department-detail-progress__bar ${meta.barClass}`} style={{ width: `${project.progress}%` }} />
          </span>
        </div>
      </td>
      <td>
        <span className={`department-detail-status ${meta.className}`}>
          {meta.label}
          <HelpCircle className="department-detail-status__icon" />
        </span>
      </td>
      <td>
        <ChevronLeft className="department-detail-row-chevron" />
      </td>
    </tr>
  );
}

function InfoItem({
  icon,
  label,
  value,
  ltr,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="department-detail-info-item">
      <span className="department-detail-info-item__icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong dir={ltr ? 'ltr' : undefined}>{value}</strong>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return <div className="department-detail-overlay">{children}</div>;
}

function EditDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Department;
  onClose: () => void;
  onSave: (patch: Partial<Department>, ok: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: initial.name,
    section: initial.section,
    manager: initial.manager,
    owner: initial.owner,
    phone: initial.phone,
    email: initial.email,
    description: initial.description,
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Overlay>
      <div className="department-detail-dialog" role="dialog" aria-modal="true">
        <div className="department-detail-dialog__heading">
          <h2>تعديل بيانات الإدارة</h2>
          <span>
            <FileText />
          </span>
        </div>
        <div className="department-detail-dialog__grid">
          <Field label="اسم الإدارة" value={form.name} onChange={set('name')} />
          <Field label="القسم" value={form.section} onChange={set('section')} />
          <Field label="مدير الإدارة" value={form.manager} onChange={set('manager')} />
          <Field label="الشخص المسؤول" value={form.owner} onChange={set('owner')} />
          <Field label="الهاتف" value={form.phone} onChange={set('phone')} ltr />
          <Field label="البريد الإلكتروني" value={form.email} onChange={set('email')} ltr />
          <div className="department-detail-dialog__full">
            <label>وصف الإدارة</label>
            <textarea value={form.description} onChange={set('description')} rows={4} />
          </div>
        </div>
        <div className="department-detail-dialog__actions">
          <button
            type="button"
            className="department-detail-dialog__save"
            onClick={() => onSave(form, form.name.trim().length > 0)}
          >
            حفظ الإدارة
          </button>
          <button type="button" className="department-detail-dialog__cancel" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Field({
  label,
  value,
  onChange,
  ltr,
}: {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  ltr?: boolean;
}) {
  return (
    <div>
      <label>{label}</label>
      <input dir={ltr ? 'ltr' : undefined} value={value} onChange={onChange} className={ltr ? 'is-ltr' : ''} />
    </div>
  );
}

function ConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <Overlay>
      <div className="department-detail-dialog department-detail-confirm" role="alertdialog" aria-modal="true">
        <div className="department-detail-dialog__heading">
          <h2>تأكيد الإجراء</h2>
          <span className="is-danger">
            <Trash2 />
          </span>
        </div>
        <p>هل أنت متأكد من هذا الإجراء</p>
        <div className="department-detail-dialog__confirm-actions">
          <button type="button" className="department-detail-dialog__delete" onClick={onConfirm}>
            حذف
          </button>
          <button type="button" className="department-detail-dialog__cancel" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </div>
    </Overlay>
  );
}

