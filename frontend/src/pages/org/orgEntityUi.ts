import type { OrgProject } from '../../api/orgProjects'

export type StatusClass = 'track' | 'delay' | 'blocked' | 'done'

export const STATUS_META: Record<StatusClass, string> = {
  track: 'على المسار',
  delay: 'تأخير',
  blocked: 'متعثر',
  done: 'مكتمل',
}

export function projectStatusClass(status?: string | null): StatusClass {
  const value = String(status || '').toUpperCase()
  if (value === 'COMPLETED' || value === 'DONE') return 'done'
  if (value === 'ON_HOLD' || value === 'DELAYED' || value === 'AT_RISK') return 'delay'
  if (value === 'CANCELLED' || value === 'BLOCKED' || value === 'SUSPENDED') return 'blocked'
  return 'track'
}

export function averageProgress(projects: OrgProject[]) {
  if (!projects.length) return 0
  const total = projects.reduce((sum, project) => sum + (Number(project.progressPct) || 0), 0)
  return Math.round(total / projects.length)
}

export function contractCount(project: OrgProject) {
  return Array.isArray(project.contracts) ? project.contracts.length : 0
}

export function formatJoinDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    .toLowerCase()
}
