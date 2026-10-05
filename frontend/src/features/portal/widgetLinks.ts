import { useLocation, useNavigate } from 'react-router-dom'

type Portal = 'org' | 'client' | 'jodayn' | 'superadmin' | null

function portalOf(pathname: string): Portal {
  if (pathname.startsWith('/org')) return 'org'
  if (pathname.startsWith('/client')) return 'client'
  if (pathname.startsWith('/jodayn')) return 'jodayn'
  if (pathname.startsWith('/super-admin')) return 'superadmin'
  return null
}

const JODAYN_ACTION_LINKS: Record<string, string> = {
  inv: '/jodayn/invoices',
  fc: '/jodayn/forecasts',
  rp: '/jodayn/reports',
  sec: '/jodayn/sectors',
}

/** Where dashboard widget rows and "view all" links lead in the current portal (null = no page). */
export function useWidgetLinks() {
  const location = useLocation()
  const navigate = useNavigate()
  const portal = portalOf(location.pathname)
  const projectPortal = portal === 'org' || portal === 'client' ? portal : null

  const links = {
    projects: projectPortal ? `/${projectPortal}/projects` : null,
    project: (id?: string) => (projectPortal && id ? `/${projectPortal}/projects/${id}` : null),
    tenants: portal === 'superadmin' ? '/super-admin/tenants' : portal === 'jodayn' ? '/jodayn/org-accounts' : null,
    tenant: (id: string) => {
      if (portal === 'superadmin') return `/super-admin/tenants?id=${id}`
      if (portal === 'jodayn') return id.startsWith('client-') ? '/jodayn/client-accounts' : '/jodayn/org-accounts'
      return null
    },
    actions: portal === 'superadmin' ? '/super-admin/audit-log' : portal === 'jodayn' ? '/jodayn/reports' : null,
    action: (id: string) => {
      if (portal === 'superadmin') return '/super-admin/audit-log'
      if (portal === 'jodayn') return JODAYN_ACTION_LINKS[id] ?? null
      return null
    },
  }

  const go = (to: string | null) => {
    if (to) navigate(to)
  }

  return { links, go }
}
