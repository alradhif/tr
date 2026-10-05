import { navigationAssets, tenantsAssets } from '@/assets'

export function DashboardIcon() {
  return (
    <img src={navigationAssets.dashboard} alt="" className="sidebar__nav-icon" width={20} height={20} />
  )
}

export function GoalsIcon() {
  return <img src={navigationAssets.goals} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function ProjectsIcon() {
  return <img src={navigationAssets.projects} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function CompaniesIcon() {
  return <img src={navigationAssets.companies} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function DepartmentsIcon() {
  return <img src={navigationAssets.departments} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function SidebarSettingsIcon() {
  return <img src={navigationAssets.settings} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function TenantsIcon() {
  return <img src={tenantsAssets.tenantsMenu} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function SubscriptionsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.2 17.3 6v8L10 17.8 2.7 14V6L10 2.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M2.7 6 10 10l7.3-4M10 10v7.8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function UsersNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19c.6-3 2.7-4.6 5.5-4.6S14.4 16 15 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="8.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16.2 14.2c2.1.3 3.6 1.7 4.2 4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AuditLogIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="17" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.2 22c.5-2.1 2-3.2 3.8-3.2s3.3 1.1 3.8 3.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M1 13c.45-1.95 1.85-3 3.5-3s3.05 1.05 3.5 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 13c.45-1.95 1.85-3 3.5-3s3.05 1.05 3.5 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 11.5 Q12 7 17 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
