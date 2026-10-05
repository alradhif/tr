import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, Filter, Plus, Trash2 } from 'lucide-react';
import { FeedbackBanner } from '../ui/FeedbackBanner';
import { SubpageHeader } from '../layout/SubpageHeader';
import {
  addDepartment,
  useDepartments,
  type Department,
  type DepartmentProject,
  type StatusClass,
  type TeamMember,
} from '../../lib/departments-store';
import './departments.css';

export type { Department, DepartmentProject, StatusClass, TeamMember } from '../../lib/departments-store';

export const STATUS_META: Record<StatusClass, string> = {
  track: 'على المسار',
  delay: 'تأخير',
  blocked: 'متعثر',
  done: 'مكتمل',
};

export function DepartmentsPage({ onOpenDepartment, departmentDeleted, onClearDeleted }: { onOpenDepartment: (department: Department) => void; departmentDeleted?: boolean; onClearDeleted?: () => void }) {
  const departments = useDepartments();
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState(false);
  const [search] = useState('');

  
  useEffect(() => {
    if (departmentDeleted) {
      setDeleteNotice(true);
      onClearDeleted?.();
    }
  }, [departmentDeleted, onClearDeleted]);

  const filtered = useMemo(() => departments.filter((d) => `${d.name} ${d.manager} ${d.section}`.toLowerCase().includes(search.toLowerCase())), [departments, search]);

  if (showCreate) {
    return (
      <DepartmentForm
        mode="create"
        onClose={() => setShowCreate(false)}
        onSave={(department) => {
          addDepartment(department);
          setShowCreate(false);
          setNotice(true);
        }}
      />
    );
  }

  return (
    <div className="departments-page departments-page--screenshot-one" dir="rtl">
      <div className="departments-shell-title departments-shell-title--reference">
        <h1>الإدارات</h1>
      </div>
      {notice && (
        <FeedbackBanner tone="success" onClose={() => setNotice(false)}>
          تم إضافة الإدارة بنجاح
        </FeedbackBanner>
      )}
      {deleteNotice && (
        <FeedbackBanner tone="success" onClose={() => setDeleteNotice(false)}>
          تم حذف الإدارة بنجاح
        </FeedbackBanner>
      )}
      <div className="departments-content departments-content--screenshot-one">
        <div className="departments-list-header departments-list-header--screenshot-one">
          <div className="departments-toolbar departments-toolbar--screenshot-one">
            <button className="departments-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={19} /><span>إضافة إدارة جديدة</span></button>
            <button className="departments-outline" type="button"><Filter size={18} /><span>تصفية</span></button>
          </div>
        </div>
        <div className="departments-table-wrap departments-table-wrap--screenshot-one">
          <table className="departments-table departments-table--screenshot-one">
            <thead><tr><th>الإدارة</th><th>مدير الإدارة</th><th>القسم</th><th>عدد المشاريع</th><th>نسبة الإنجاز</th><th>الحالة</th><th>آخر نشاط</th><th aria-label="فتح"></th></tr></thead>
            <tbody>
              {filtered.map((department) => (
                <tr key={department.id} onClick={() => onOpenDepartment(department)}>
                  <td><strong>{department.name}</strong><small>وصف تفصيلي للإدارة</small></td>
                  <td>{department.manager}</td>
                  <td>{department.section}</td>
                  <td className="number-cell">{department.projects}</td>
                  <td>
                    <div className="progress-cell progress-cell--screenshot-one">
                      <strong>{department.progress}%</strong>
                      <span><i className={`bar-${department.statusClass}`} style={{ width: `${department.progress}%` }} /></span>
                    </div>
                  </td>
                  <td><span className={`status-pill project-status--${department.statusClass}`}><b className="status-pill__question">?</b>{department.status}</span></td>
                  <td className="date-cell" dir="ltr">12 april 2026</td>
                  <td><ChevronLeft size={23} className="row-chevron" /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="departments-empty">لا توجد إدارات حالياً</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const owners = ['أحمد العمري', 'سارة محمد', 'عبدالعزيز سالم', 'نورة الحربي'];

export function DepartmentForm({ mode, initial, onClose, onSave }: { mode: 'create' | 'edit'; initial?: Department; onClose: () => void; onSave: (department: Department) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [owner, setOwner] = useState(initial?.owner ?? '');
  const [error, setError] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>(initial?.team ?? [
    { id: 't1', name: 'سارة محمد', role: 'مدير المشروع', email: 'salwa@aljoud.com', phone: '+966 50 4567 123' },
  ]);
  const [projects, setProjects] = useState<DepartmentProject[]>(initial?.projectsList ?? [
    { id: 'p1', name: 'نظام إدارة المحتوى', progress: 45, status: STATUS_META.track, statusClass: 'track', company: 'شركة A' },
  ]);

  const addTeamMember = () => {
    setTeam((prev) => [...prev, { id: `t-${Date.now()}`, name: 'عضو جديد', role: 'عضو فريق', email: 'member@aljoud.com', phone: '+966 50 0000 000' }]);
  };
  const removeTeamMember = (id: string) => setTeam((prev) => prev.filter((m) => m.id !== id));

  const addProject = () => {
    setProjects((prev) => [...prev, { id: `p-${Date.now()}`, name: 'مشروع جديد', progress: 0, status: STATUS_META.track, statusClass: 'track', company: 'شركة A' }]);
  };
  const removeProject = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));

  const save = () => {
    if (!name.trim()) { setError(true); return; }
    onSave({
      id: initial?.id ?? Date.now(),
      name,
      description: description || 'وصف تفصيلي للإدارة',
      manager: initial?.manager ?? 'عبدالعزيز سالم',
      owner: owner || 'أحمد العمري',
      section: initial?.section ?? 'التقنية',
      projects: projects.length,
      progress: initial?.progress ?? 0,
      status: initial?.status ?? STATUS_META.track,
      statusClass: initial?.statusClass ?? 'track',
      lastActivity: '12/04/2026',
      sector: initial?.sector ?? 'الخدمات المدارة',
      performance: initial?.performance ?? 'جيد',
      email: initial?.email ?? 'salwa@aljoud.com',
      phone: initial?.phone ?? '+966 50 4567 123',
      outputs: initial?.outputs ?? 0,
      team,
      projectsList: projects,
    });
  };

  return (
    <div className="department-form-page" dir="rtl">
      <div className="department-form-header">
        <SubpageHeader parent="الإدارات" title={mode === 'create' ? 'إضافة إدارة جديدة' : 'تعديل الإدارة'} onBack={onClose} />
      </div>

      {error && (
        <FeedbackBanner tone="error" onClose={() => setError(false)}>
          يرجى إدخال اسم الإدارة
        </FeedbackBanner>
      )}

      <div className="department-form-page__inner">
      <section className="department-card">
        <div className="department-card__title">معلومات الإدارة</div>
        <label>اسم الإدارة<input value={name} onChange={(e) => { setName(e.target.value); setError(false); }} placeholder="مثال" /></label>
        <label>وصف الإدارة<input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <label>الشخص المسؤول<div className="select-wrap"><select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">اختر الشخص المسؤول</option>{owners.map((o) => <option key={o} value={o}>{o}</option>)}</select><ChevronDown size={17} /></div></label>
      </section>

      <section className="department-card">
        <div className="department-card__title">إضافة فريق العمل</div>
        {team.map((member) => (
          <div className="team-row" key={member.id}>
            <button type="button" className="trash-button" aria-label="حذف عضو" onClick={() => removeTeamMember(member.id)}><Trash2 size={17} /></button>
            <div className="team-avatar">{member.name.charAt(0)}</div>
            <div><strong>{member.role}</strong><p>{member.name}&nbsp; • &nbsp;{member.phone}&nbsp; • &nbsp;{member.email}</p></div>
          </div>
        ))}
        <button type="button" className="add-row-button" onClick={addTeamMember}><Plus size={20} />إضافة فريق عمل</button>
      </section>

      <section className="department-card">
        <div className="department-card__title">المشاريع التابعة</div>
        {projects.map((project) => (
          <div className="project-row" key={project.id}>
            <button type="button" className="trash-button" aria-label="حذف مشروع" onClick={() => removeProject(project.id)}><Trash2 size={17} /></button>
            <span className="project-dot" />
            <div><strong>{project.name}</strong><p>{project.company ? `${project.company} • ` : ''}{project.status} {project.progress}%</p></div>
          </div>
        ))}
        <button type="button" className="add-row-button" onClick={addProject}><Plus size={20} />ربط مشروع</button>
      </section>

        <div className="department-form-actions"><button type="button" className="departments-primary" onClick={save}>{mode === 'create' ? 'إضافة' : 'حفظ الإدارة'}</button><button type="button" className="departments-outline" onClick={onClose}>إلغاء</button></div>
      </div>
    </div>
  );
}
