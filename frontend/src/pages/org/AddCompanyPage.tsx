import { useEffect, useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { createCompany, createCompanyTeamMember, getAssignableOrgUsers, type OrgUser } from '../../api/org'
import { getOrgToken } from '../../auth/orgAuth'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { SubpageHeader } from '../../components/ui'
import '../../design/departments.css'
import '../../design/senior-companies.css'

type LocalMember = { name: string; role: string; email: string; phone: string }

export function OrgCompanyFormPage({ mode }: { mode: 'create' | 'edit' }) {
  return mode === 'create' ? <OrgAddCompanyPage /> : null
}

export function OrgAddCompanyPage() {
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

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('يرجى إدخال اسم الشركة')
      return
    }
    const token = getOrgToken()
    if (!token) {
      setError('تعذر إنشاء الشركة')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { company } = await createCompany(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        managerName: owner.trim() || undefined,
      })
      await Promise.all(
        team.map((member) =>
          createCompanyTeamMember(token, company.id, {
            name: member.name,
            role: member.role || undefined,
            email: member.email || undefined,
          }),
        ),
      )
      navigate('/org/companies', { state: { notice: 'success' } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard-page nc-page" dir="rtl">
      <SubpageHeader parent="الشركات" title="إضافة شركة جديدة" onBack={() => navigate('/org/companies')} />
      <div className="nc-inner">
        <h1 className="nc-page-title">إضافة شركة جديدة</h1>
        {error ? (
          <FeedbackBanner tone="error" onClose={() => setError(null)}>
            {error}
          </FeedbackBanner>
        ) : null}
        <form onSubmit={onSubmit} className="nc-form">
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
                <select id="nc-owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
                  <option value="">اختر الشخص المسؤول</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </label>
          </div>

          <div className="department-card">
            <h2 className="department-card__title">إضافة فريق العمل</h2>
            {team.map((member, index) => (
              <div key={`${member.name}-${index}`} className="team-row">
                <div className="team-avatar">{member.name.charAt(0)}</div>
                <div>
                  <strong>{member.role}</strong>
                  <p>
                    {member.name}
                    {member.phone ? ` · ${member.phone}` : ''}
                    {member.email ? ` · ${member.email}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`حذف ${member.name}`}
                  className="trash-button"
                  onClick={() => setTeam((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 size={16} />
                </button>
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
            ) : null}
            <button type="button" className="add-row-button" onClick={() => setShowTeamForm(true)}>
              <Plus size={16} />
              إضافة فريق عمل
            </button>
          </div>

          <div className="department-form-actions">
            <button type="submit" className="departments-primary" disabled={submitting}>
              {submitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
            <button type="button" className="departments-outline" onClick={() => navigate('/org/companies')}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
