import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { SubpageHeader } from "../layout/SubpageHeader";
import { linkedProjects, teamMembers } from "../../data/companies";
import './departments.css';
import './senior-companies.css';

type TeamMember = (typeof teamMembers)[number];
type LinkedProject = (typeof linkedProjects)[number];

export function NewCompanyPage({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");

  const [team, setTeam] = useState<TeamMember[]>(teamMembers);
  const [projects, setProjects] = useState<LinkedProject[]>(linkedProjects);

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamRole, setTeamRole] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamPhone, setTeamPhone] = useState("");
  const [teamEmail, setTeamEmail] = useState("");

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectCompany, setProjectCompany] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [projectProgress, setProjectProgress] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(name);
  };

  const removeTeamMember = (id: string) => {
    setTeam((current) => current.filter((member) => member.id !== id));
  };

  const removeProject = (id: string) => {
    setProjects((current) => current.filter((project) => project.id !== id));
  };

  const addTeamMember = () => {
    if (!teamName.trim() || !teamRole.trim()) return;
    setTeam((current) => [
      ...current,
      {
        id: `team-${Date.now()}`,
        initial: teamName.trim().charAt(0),
        role: teamRole.trim(),
        name: teamName.trim(),
        phone: teamPhone.trim(),
        email: teamEmail.trim(),
      },
    ]);
    setTeamRole("");
    setTeamName("");
    setTeamPhone("");
    setTeamEmail("");
    setShowTeamForm(false);
  };

  const addProject = () => {
    if (!projectName.trim()) return;
    setProjects((current) => [
      ...current,
      {
        id: `project-${Date.now()}`,
        name: projectName.trim(),
        company: projectCompany.trim(),
        status: projectStatus.trim(),
        progress: Number(projectProgress) || 0,
      },
    ]);
    setProjectName("");
    setProjectCompany("");
    setProjectStatus("");
    setProjectProgress("");
    setShowProjectForm(false);
  };

  return (
    <div className="nc-page" dir="rtl">
      
      <SubpageHeader
        parent="الشركات"
        title="إضافة شركة جديدة"
        onBack={onBack}
      />

      <div className="nc-inner">
        <h1 className="nc-page-title">إضافة شركة جديدة</h1>

        <form onSubmit={submit} className="nc-form">

          
          <div className="department-card">
            <h2 className="department-card__title">معلومات الشركة</h2>

            <label htmlFor="nc-name">
              اسم الشركة
              <input
                id="nc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شركة الجودة للتقنية"
              />
            </label>

            <label htmlFor="nc-description">
              وصف الشركة
              <input
                id="nc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر عن الشركة"
              />
            </label>

            <label htmlFor="nc-owner">
              الشخص المسؤول
              <div className="select-wrap">
                <select
                  id="nc-owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                >
                  <option value="" />
                  <option value="ahmad">أحمد محمد</option>
                  <option value="sara">سارة محمد</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </label>
          </div>

          
          <div className="department-card">
            <h2 className="department-card__title">إضافة فريق العمل</h2>

            {team.map((member) => (
              <div key={member.id} className="team-row">
                <div className="team-avatar">{member.initial}</div>
                <div>
                  <strong>{member.role}</strong>
                  <p>{member.name} · {member.phone} · {member.email}</p>
                </div>
                <button
                  type="button"
                  aria-label={`حذف ${member.name}`}
                  className="trash-button"
                  onClick={() => removeTeamMember(member.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {showTeamForm && (
              <div className="team-row" style={{ flexWrap: "wrap", background: "#fff", border: "1px dashed #dfe1e4" }}>
                <div style={{ flex: "1 1 100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    value={teamRole}
                    onChange={(e) => setTeamRole(e.target.value)}
                    placeholder="المسمى الوظيفي"
                  />
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="الاسم"
                  />
                  <input
                    value={teamPhone}
                    onChange={(e) => setTeamPhone(e.target.value)}
                    placeholder="رقم الجوال"
                  />
                  <input
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", flex: "1 1 100%" }}>
                  <button type="button" className="departments-primary" onClick={addTeamMember}>
                    إضافة
                  </button>
                  <button type="button" className="departments-outline" onClick={() => setShowTeamForm(false)}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            <button type="button" className="add-row-button" onClick={() => setShowTeamForm(true)}>
              <Plus size={16} />
              إضافة فريق عمل
            </button>
          </div>

          
          <div className="department-card">
            <h2 className="department-card__title">المشاريع التابعة</h2>

            {projects.map((project) => (
              <div key={project.id} className="project-row">
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.company} · {project.status} · {project.progress}%</p>
                </div>
                <button
                  type="button"
                  aria-label={`حذف ${project.name}`}
                  className="trash-button"
                  onClick={() => removeProject(project.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {showProjectForm && (
              <div className="project-row" style={{ flexWrap: "wrap", background: "#fff", border: "1px dashed #dfe1e4" }}>
                <div style={{ flex: "1 1 100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="اسم المشروع"
                  />
                  <input
                    value={projectCompany}
                    onChange={(e) => setProjectCompany(e.target.value)}
                    placeholder="الشركة"
                  />
                  <input
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    placeholder="الحالة"
                  />
                  <input
                    value={projectProgress}
                    onChange={(e) => setProjectProgress(e.target.value)}
                    placeholder="نسبة الإنجاز %"
                    type="number"
                    min={0}
                    max={100}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", flex: "1 1 100%" }}>
                  <button type="button" className="departments-primary" onClick={addProject}>
                    إضافة
                  </button>
                  <button type="button" className="departments-outline" onClick={() => setShowProjectForm(false)}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            <button type="button" className="add-row-button" onClick={() => setShowProjectForm(true)}>
              <Plus size={16} />
              ربط مشروع
            </button>
          </div>

          
          <div className="department-form-actions">
            <button type="submit" className="departments-primary">
              إضافة
            </button>
            <button type="button" className="departments-outline" onClick={onBack}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
