// Brand
import logoFull from './brand/logo-full.png'
import logoMark from './brand/logo-mark.png'
import favicon from './brand/favicon.svg'

// Navigation
import navDashboard from './navigation/dashboard.svg'
import navGoals from './navigation/goals.png'
import navProjects from './navigation/projects.png'
import navCompanies from './navigation/companies.png'
import navDepartments from './navigation/departments.png'
import navSettings from './navigation/settings.png'

// Dashboard
import approval from './dashboard/approval.png'
import assistantIcon from './dashboard/assistant-icon.png'
import risk from './dashboard/risk.png'
import notification from './dashboard/notification.png'

// Dashboard data
import activeEntities from './dashboard-data/active-entities.png'
import active from './dashboard-data/active.png'
import suspended from './dashboard-data/suspended.png'
import totalPackages from './dashboard-data/total-packages.png'
import totalTenants from './dashboard-data/total-tenants.png'
import totalUsers from './dashboard-data/total-users.png'
import trial from './dashboard-data/trial.png'

// Auth
import authWave from './auth/auth-wave.svg'
import loginLogo from './auth/login-logo.png'

// Projects
import contract from './projects/contract.svg'
import budget from './projects/budget.svg'
import timeline from './projects/timeline.svg'
import team from './projects/team.svg'
import deliverables from './projects/deliverables.svg'
import risks from './projects/risks.svg'

// Companies / departments
import company from './companies/company.svg'
import department from './departments/department.svg'

// Company logos
import dherwa from './company-logos/dherwa.png'
import jodayn from './company-logos/jodayn.png'
import manara from './company-logos/manara.png'
import masar from './company-logos/masar.png'
import nafidh from './company-logos/nafidh.png'
import rawasi from './company-logos/rawasi.png'
import wasl from './company-logos/wasl.png'

// Tenants
import tenantsMenu from './tenants/tenants-menu.png'

// Common
import upload from './common/upload.svg'
import closeCircle from './common/close-circle.svg'
import closeCirclePng from './common/close-circle.png'
import emptyState from './common/empty-state.svg'
import chevronLeft from './common/chevron-left.svg'
import editGridSvg from './common/edit-grid.svg'
import editGridPng from './common/edit-grid.png'
import clock from './common/clock.svg'
import clockPng from './common/clock.png'
import clock1Svg from './common/clock-1.svg'
import clock1Png from './common/clock-1.png'
import clock2 from './common/clock-2.svg'
import clock3 from './common/clock-3.svg'
import clock4 from './common/clock-4.svg'
import clock5 from './common/clock-5.svg'

export const brandAssets = {
  logoFull,
  logoMark,
  favicon,
}

export const navigationAssets = {
  dashboard: navDashboard,
  goals: navGoals,
  projects: navProjects,
  companies: navCompanies,
  departments: navDepartments,
  settings: navSettings,
}

export const dashboardAssets = {
  approval,
  assistantIcon,
  risk,
  notification,
}

export const dashboardDataAssets = {
  activeEntities,
  active,
  suspended,
  totalPackages,
  totalTenants,
  totalUsers,
  trial,
}

export const authAssets = {
  authWave,
  loginLogo,
}

export const projectsAssets = {
  contract,
  budget,
  timeline,
  team,
  deliverables,
  risks,
}

export const companiesAssets = {
  company,
}

export const departmentsAssets = {
  department,
}

export const companyLogoAssets = {
  dherwa,
  jodayn,
  manara,
  masar,
  nafidh,
  rawasi,
  wasl,
}

export const tenantsAssets = {
  tenantsMenu,
}

export const commonAssets = {
  upload,
  closeCircle,
  closeCirclePng,
  emptyState,
  chevronLeft,
  editGrid: editGridSvg,
  editGridPng,
  clock,
  clockPng,
  clock1: clock1Svg,
  clock1Png,
  clock2,
  clock3,
  clock4,
  clock5,
}

const COMPANY_LOGO_MATCHERS: Array<{ keys: string[]; src: string }> = [
  { keys: ['dherwa', 'ذروا', 'ذرة'], src: dherwa },
  { keys: ['jodayn', 'جوداين', 'جداين'], src: jodayn },
  { keys: ['manara', 'منارة', 'المنارة'], src: manara },
  { keys: ['masar', 'مسار'], src: masar },
  { keys: ['nafidh', 'نافذ'], src: nafidh },
  { keys: ['rawasi', 'رواسي'], src: rawasi },
  { keys: ['wasl', 'وصل'], src: wasl },
]

export function matchCompanyLogo(name?: string | null): string | undefined {
  const value = String(name ?? '').trim().toLowerCase()
  if (!value) return undefined
  return COMPANY_LOGO_MATCHERS.find((entry) => entry.keys.some((key) => value.includes(key)))?.src
}
