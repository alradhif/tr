import { useEffect, useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getAssignableOrgUsers, type OrgUser } from '../../api/org'
import type { OrgProject } from '../../api/orgProjects'
import { getAccounts } from '../../api/superAdmin'
import { projectStatusClass, STATUS_META } from './orgEntityUi'
import { useDepartmentPortal } from './departmentPortal'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { SubpageHeader } from '../../components/ui'
import '../../design/departments.css'

type LocalMember = { name: string; role: string; email: string; phone: string }

export function OrgDepartmentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  return mode === 'create' ? <OrgAddDepartmentPage /> : null
}

export function OrgAddDepartmentPage() {
  const navigate = useNavigate()
  const portal = useDepartmentPortal()
  const jodayn = portal.kind === 'jodayn'
  // Jodayn adds a department to a chosen organization; an organization adds to itself.
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [orgId, setOrgId] = useState('')
  const [allProjects, setAllProjects] = useState<OrgProject[]>([])
  const [linked, setLinked] = useState<string[]>([])
  const [projectToAdd, setProjectToAdd] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [users, setUsers] = useState<OrgUser[]>([])
  const [team, setTeam] = useState<LocalMember[]>([])
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamRole, setTeamRole] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamPhone, setTeamPhone] = useState('')
  const [teamEmail, setTeamEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = portal.token()
    if (!token) return
    if (jodayn) {
      getAccounts(token)
        .then((data) => setOrgs((data.orgs ?? []).map((o) => ({ id: o.id, name: o.name }))))
        .catch(() => setOrgs([]))
    } else {
      getAssignableOrgUsers(token)
        .then((data) => setUsers(data.users))
        .catch(() => setUsers([]))
    }
    portal
      .projects(token)
      .then(setAllProjects)
      .catch(() => setAllProjects([]))
  }, [jodayn, portal])

  // Projects that can be linked: the chosen organization's. Linking one already in another
  // department moves it to the new department.
  const linkable = allProjects.filter(
    (project) =>
      !linked.includes(project.id) &&
      (!jodayn || (project as OrgProject & { orgId?: string }).orgId === orgId),
  )
  const linkedProjects = allProjects.filter((project) => linked.includes(project.id))

  const addTeamMember = () => {
    if (!teamName.trim() || !teamRole.trim()) return
    setTeam((current) => [
      ...current,
      { name: teamName.trim(), role: teamRole.trim(), phone: teamPhone.trim(), email: teamEmail.trim() },
    ])
    setTeamRole('')
    setTeamName('')
    setTeamPhone('')
    setTeamEmail('')
    setShowTeamForm(false)
  }

  const save = async () => {
    if (!name.trim()) {
      setError('يرجى إدخال اسم الإدارة')
      return
    }
    if (jodayn && !orgId) {
      setError('يرجى اختيار الجهة')
      return
    }
    const token = portal.token()
    if (!token) {
      setError('تعذر إنشاء الإدارة')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { department } = await portal.create(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        responsibleName: owner.trim() || undefined,
        ...(jodayn ? { orgId } : {}),
      })
      if (linked.length) await portal.linkProjects(token, department.id, linked)
      await Promise.all(
        team.map((member) =>
          portal.addEmployee(token, department.id, {
            name: member.name,
            role: member.role || undefined,
            email: member.email || undefined,
          }),
        ),
      )
      navigate(portal.base, { state: { notice: 'success' } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard-page department-form-page" dir="rtl">
      <div className="department-form-header">
        <SubpageHeader parent="الإدارات" title="إضافة إدارة جديدة" onBack={() => navigate(portal.base)} />
      </div>
      {error ? (
        <FeedbackBanner tone="error" onClose={() => setError(null)}>
          {error}
        </FeedbackBanner>
      ) : null}
      <div className="department-form-page__inner">
        <section className="department-card">
          <div className="department-card__title">معلومات الإدارة</div>
          <label>
            اسم الإدارة
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال" />
          </label>
          <label>
            وصف الإدارة
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          {jodayn ? (
            <label>
              الجهة
              <div className="select-wrap">
                <select
                  value={orgId}
                  onChange={(e) => {
                    setOrgId(e.target.value)
                    setLinked([])
                  }}
                >
                  <option value="">اختر الجهة</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </div>
            </label>
          ) : null}
          <label>
            الشخص المسؤول
            {jodayn ? (
              <input value={owner} onChange={(e) => setOwner(e.target.value)} />
            ) : (
              <div className="select-wrap">
                <select value={owner} onChange={(e) => setOwner(e.target.value)}>
                  <option value="">اختر الشخص المسؤول</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </div>
            )}
          </label>
        </section>

        <section className="department-card">
          <div className="department-card__title">إضافة فريق العمل</div>
          {team.map((member, index) => (
            <div className="team-row" key={`${member.name}-${index}`}>
              <button
                type="button"
                className="trash-button"
                aria-label="حذف عضو"
                onClick={() => setTeam((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 size={17} />
              </button>
              <div className="team-avatar">{member.name.charAt(0)}</div>
              <div>
                <strong>{member.role}</strong>
                <p>
                  {member.name}
                  {member.phone ? ` • ${member.phone}` : ''}
                  {member.email ? ` • ${member.email}` : ''}
                </p>
              </div>
            </div>
          ))}
          {showTeamForm ? (
            <div className="team-row" style={{ flexWrap: 'wrap', background: '#fff', border: '1px dashed #dfe1e4' }}>
              <div style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input value={teamRole} onChange={(e) => setTeamRole(e.target.value)} placeholder="المسمى الوظيفي" />
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="الاسم" />
                <input value={teamPhone} onChange={(e) => setTeamPhone(e.target.value)} placeholder="رقم الجوال" />
                <input value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} placeholder="البريد الإلكتروني" />
              </div>
              <div style={{ display: 'flex', gap: 8, flex: '1 1 100%' }}>
                <button type="button" className="departments-primary" onClick={addTeamMember}>
                  إضافة
                </button>
                <button type="button" className="departments-outline" onClick={() => setShowTeamForm(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="add-row-button" onClick={() => setShowTeamForm(true)}>
              <Plus size={20} />
              إضافة فريق عمل
            </button>
          )}
        </section>

        <section className="department-card">
          <div className="department-card__title">المشاريع التابعة</div>
          {linkedProjects.map((project) => {
            const status = projectStatusClass(project.status)
            return (
              <div className="team-row" key={project.id}>
                <button
                  type="button"
                  className="trash-button"
                  aria-label={`إزالة ${project.name}`}
                  onClick={() => setLinked((current) => current.filter((id) => id !== project.id))}
                >
                  <Trash2 size={17} />
                </button>
                <span className={`linked-project-dot linked-project-dot--${status}`} />
                <div>
                  <strong>{project.name}</strong>
                  <p>
                    {STATUS_META[status]} · {project.progressPct || 0}%
                  </p>
                </div>
              </div>
            )
          })}
          <div className="linked-project-picker">
            <div className="select-wrap">
              <select value={projectToAdd} onChange={(e) => setProjectToAdd(e.target.value)} disabled={jodayn && !orgId}>
                <option value="">{jodayn && !orgId ? 'اختر الجهة أولاً' : 'اختر مشروعاً لربطه بالإدارة'}</option>
                {linkable.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </div>
            <button
              type="button"
              className="add-row-button"
              disabled={!projectToAdd}
              onClick={() => {
                setLinked((current) => [...current, projectToAdd])
                setProjectToAdd('')
              }}
            >
              <Plus size={20} />
              إضافة مشروع
            </button>
          </div>
        </section>

        <div className="department-form-actions">
          <button type="button" className="departments-primary" onClick={() => void save()} disabled={submitting}>
            {submitting ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          <button type="button" className="departments-outline" onClick={() => navigate(portal.base)}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
