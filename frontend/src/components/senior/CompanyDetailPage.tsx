import {
  Briefcase,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  Download,
  HelpCircle,
  Link,
  ListFilter,
  Mail,
  Phone,
  Presentation,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";

import { SubpageHeader } from "../layout/SubpageHeader";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { TrendKpiRow, type TrendKpiCardProps } from "./TrendKpiCard";
import { companies, deleteCompany } from "../../data/companies";
import {
  companyProjects,
  defaultDetails,
  projectStatusMeta,
  type CompanyDetails,
} from "../../data/companyDetail";
import './senior-companies.css';

const tabs = ["المشاريع", "التقارير", "الموظفين"] as const;

function buildStats(progress: number): TrendKpiCardProps[] {
  return [
    { label: "عدد المشاريع",  value: "12",          delta: "+5%", up: true  },
    { label: "متوسط التقدم",  value: `${progress}%`, delta: "+5%", up: true  },
    { label: "عدد المخرجات",  value: "28",           delta: "+5%", up: false },
  ];
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="cd-info-item">
      <span className="cd-info-icon">
        <Icon size={16} />
      </span>
      <div>
        <p className="cd-info-label">{label}</p>
        <strong className="cd-info-value">{value}</strong>
      </div>
    </div>
  );
}

function ModalInput({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  return (
    <div className="edit-modal__field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        style={invalid ? { borderColor: "#f04438" } : {}}
      />
    </div>
  );
}

export function CompanyDetailPage({
  companyId,
  onBack,
  onDeleted,
  onOpenPptx,
}: {
  companyId: string;
  onBack: () => void;
  onDeleted: () => void;
  onOpenPptx?: () => void;
}) {
  const company = companies.find((c) => c.id === companyId);
  const [name, setName] = useState(company?.name ?? "");
  const [details, setDetails] = useState<CompanyDetails>(defaultDetails);
  const [banner, setBanner] = useState<"success" | "error" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number]>("المشاريع");
  const [draftName, setDraftName] = useState(name);
  const [draft, setDraft] = useState(details);
  const [touched, setTouched] = useState(false);

  if (!company) {
    return (
      <div className="cd-page" dir="rtl">
        <SubpageHeader parent="الشركات" title="غير موجودة" onBack={onBack} />
        <p className="sc-empty" style={{ padding: "80px 24px" }}>
          هذه الشركة غير موجودة أو تم حذفها.
        </p>
      </div>
    );
  }

  const stats = buildStats(company.progress);

  const openEdit = () => {
    setDraftName(name);
    setDraft(details);
    setTouched(false);
    setEditOpen(true);
  };

  const missing = (v: string) => touched && !v.trim();

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    const vals = [draftName, draft.registration, draft.sector, draft.owner, draft.phone, draft.email, draft.description];
    if (vals.some((v) => !v.trim())) {
      setBanner("error");
      return;
    }
    setName(draftName);
    setDetails(draft);
    setBanner("success");
    setEditOpen(false);
  };

  return (
    <div className="cd-page" dir="rtl">
      
      <SubpageHeader
        parent="الشركات"
        title={name}
        onBack={onBack}
        actions={
          <>
            <button type="button" className="sc-btn-primary cd-action-btn" onClick={openEdit}>
              تعديل
            </button>
            <button
              type="button"
              className="sc-btn-danger cd-action-btn"
              onClick={() => setConfirmDelete(true)}
            >
              حذف
            </button>
          </>
        }
      />

      
      {banner === "success" && (
        <FeedbackBanner tone="success" onClose={() => setBanner(null)}>
          تم حفظ التغييرات بنجاح
        </FeedbackBanner>
      )}
      {banner === "error" && (
        <FeedbackBanner tone="error" onClose={() => setBanner(null)}>
          حدث خطأ ما ، يرجى المحاولة مرة أخرى
        </FeedbackBanner>
      )}

      <div className="cd-content">
        
        <div className="cd-kpis">
          <TrendKpiRow stats={stats} />
        </div>

        
        <div className="cd-main-card">
          
          <div className="cd-intro">
            <span className={`cd-logo ${company.logoClass}`}>
              {company.logoText}
            </span>
            <div>
              <h2 className="cd-company-name">{name}</h2>
              <p className="cd-company-desc">{details.description}</p>
            </div>
          </div>

          
          <div className="cd-info-row">
            <Field icon={ClipboardList}  label="رقم السجل التجاري" value={details.registration} />
            <Field icon={ClipboardCheck} label="الأداء"            value={details.performance}  />
            <Field icon={Briefcase}      label="القطاع"            value={details.sector}       />
          </div>
          <div className="cd-info-row">
            <Field icon={User}  label="الشخص المسؤول"     value={details.owner} />
            <Field icon={Phone} label="الهاتف"            value={details.phone} />
            <Field icon={Mail}  label="البريد الإلكتروني" value={details.email} />
          </div>

          
          <div className="cd-tabs">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                className={`cd-tab${tab === t ? " cd-tab--active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          
          <div className="cd-tab-toolbar">
            <button type="button" className="sc-btn-outline cd-tool-btn">
              <ListFilter size={15} />
              تصفية
            </button>
            <button type="button" className="sc-btn-outline cd-tool-btn">
              <Download size={15} />
              تصدير
            </button>
            {tab === "المشاريع" && (
              <>
                <button type="button" className="sc-btn-outline cd-tool-btn">
                  <UserPlus size={15} />
                  إضافة فريق عمل
                </button>
                <button type="button" className="sc-btn-outline cd-tool-btn">
                  <Link size={15} />
                  ربط المشروع
                </button>
              </>
            )}
            {tab === "التقارير" && (
              <button
                type="button"
                className="sc-btn-outline cd-tool-btn"
                onClick={onOpenPptx}
              >
                <Presentation size={15} />
                توليد عرض تقديمي
              </button>
            )}
          </div>

          
          {tab === "المشاريع" ? (
            <div>
              <div className="cd-proj-head cd-proj-head--with-trash">
                <span className="cd-proj-col-name">اسم المشروع</span>
                <span className="sc-col-center">نسبة التقدم</span>
                <span className="sc-col-center">الحالة</span>
                <span />
                <span />
              </div>
              <ul className="cd-proj-body">
                {companyProjects.map((project) => {
                  const meta = projectStatusMeta[project.status];
                  return (
                    <li key={project.id} className="cd-proj-row cd-proj-row--with-trash">
                      <p className="cd-proj-name cd-proj-name--right">{project.name}</p>
                      <div className="sc-progress-cell">
                        <div className="sc-progress-track">
                          <div
                            className={`sc-progress-fill sc-progress-fill--${project.status}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="sc-progress-text">{project.progress}%</span>
                      </div>
                      <div className="sc-col-center">
                        <span className={`cd-proj-status cd-proj-status--${project.status}`}>
                          <HelpCircle size={13} />
                          {meta.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`تفاصيل ${project.name}`}
                        className="sc-btn-action"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`حذف ${project.name}`}
                        className="sc-btn-action cd-proj-trash"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="cd-empty-tab">لا توجد بيانات لعرضها في {tab}</p>
          )}
        </div>
      </div>

      
      {editOpen && (
        <div className="modal-backdrop">
          <form onSubmit={save} className="edit-modal">
            <div className="edit-modal__heading">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setEditOpen(false)}
                className="sc-btn-action"
                style={{ marginInlineEnd: "auto" }}
              >
                <X size={16} />
              </button>
              <h2>تعديل بيانات الشركة</h2>
              <span className="edit-modal__icon">
                <ClipboardList size={22} />
              </span>
            </div>

            <div className="edit-modal__grid">
              <ModalInput id="edit-name"         label="اسم الشركة"           value={draftName}          onChange={setDraftName}                                   invalid={missing(draftName)}          />
              <ModalInput id="edit-registration" label="رقم السجل التجاري"    value={draft.registration} onChange={(v) => setDraft({ ...draft, registration: v })} invalid={missing(draft.registration)} />
              <ModalInput id="edit-sector"       label="القطاع"               value={draft.sector}       onChange={(v) => setDraft({ ...draft, sector: v })}       invalid={missing(draft.sector)}       />
              <ModalInput id="edit-owner"        label="الشخص المسؤول"        value={draft.owner}        onChange={(v) => setDraft({ ...draft, owner: v })}        invalid={missing(draft.owner)}        />
              <ModalInput id="edit-phone"        label="الهاتف"               value={draft.phone}        onChange={(v) => setDraft({ ...draft, phone: v })}        invalid={missing(draft.phone)}        />
              <ModalInput id="edit-email"        label="البريد الإلكتروني"    value={draft.email}        onChange={(v) => setDraft({ ...draft, email: v })}        invalid={missing(draft.email)}        />
              <div className="edit-modal__full">
                <label htmlFor="edit-description">وصف الشركة</label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  aria-invalid={missing(draft.description)}
                  style={missing(draft.description) ? { borderColor: "#f04438" } : {}}
                />
              </div>
            </div>

            <div className="edit-modal__actions">
              <button type="submit" className="sc-btn-primary" style={{ minWidth: "auto", height: "38px", fontSize: "13px" }}>
                حفظ التغييرات
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="sc-btn-outline"
                style={{ minWidth: "auto", height: "38px", fontSize: "13px" }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      
      {confirmDelete && (
        <div role="dialog" aria-modal="true" aria-label="تأكيد الإجراء" className="modal-backdrop">
          <div className="delete-modal">
            <div className="delete-modal__heading">
              <div className="delete-icon">
                <Trash2 size={24} />
              </div>
              <h2>تأكيد الإجراء</h2>
            </div>
            <hr />
            <p>هل أنت متأكد من حذف هذه الشركة؟</p>
            <div className="delete-modal__actions">
              <button
                type="button"
                className="sc-btn-danger"
                style={{ minWidth: "auto", height: "38px", fontSize: "13px" }}
                onClick={() => {
                  deleteCompany(company.id);
                  setConfirmDelete(false);
                  onDeleted();
                }}
              >
                حذف
              </button>
              <button
                type="button"
                className="sc-btn-outline"
                style={{ minWidth: "auto", height: "38px", fontSize: "13px" }}
                onClick={() => setConfirmDelete(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
