import { useEffect, useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createDepartment,
  createDepartmentEmployee,
  getAssignableOrgUsers,
  type OrgUser,
} from '../../api/org'
import { getOrgToken } from '../../auth/orgAuth'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { SubpageHeader } from '../../components/ui'
import '../../design/departments.css'

type LocalMember = { name: string; role: string; email: string; phone: string }

export function OrgDepartmentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  return mode === 'create' ? <OrgAddDepartmentPage /> : null
}

export function OrgAddDepartmentPage() {
  const navigate = useNavigate()
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
    const token = getOrgToken()
    if (!token) return
    getAssignableOrgUsers(token)
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]))
  }, [])

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
    const token = getOrgToken()
    if (!token) {
      setError('تعذر إنشاء الإدارة')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { department } = await createDepartment(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        managerName: owner.trim() || undefined,
      })
      await Promise.all(
        team.map((member) =>
          createDepartmentEmployee(token, department.id, {
            name: member.name,
            role: member.role || undefined,
            email: member.email || undefined,
          }),
        ),
      )
      navigate('/org/departments', { state: { notice: 'success' } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard-page department-form-page" dir="rtl">
      <div className="department-form-header">
        <SubpageHeader parent="الإدارات" title="إضافة إدارة جديدة" onBack={() => navigate('/org/departments')} />
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
          <label>
            الشخص المسؤول
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

        <div className="department-form-actions">
          <button type="button" className="departments-primary" onClick={() => void save()} disabled={submitting}>
            {submitting ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          <button type="button" className="departments-outline" onClick={() => navigate('/org/departments')}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
