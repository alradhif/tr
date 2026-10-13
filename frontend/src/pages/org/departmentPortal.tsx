import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { apiRequest } from '../../api/client'
import type { Department, DepartmentEmployee, DepartmentPayload } from '../../api/org'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import { getJodaynProjects } from '../../api/jodayn'
import { getOrgToken } from '../../auth/orgAuth'
import { getJodaynToken } from '../../auth/jodaynAuth'

/**
 * The departments pages serve two portals: an organization manages its own departments,
 * and Jodayn sees (and manages) every organization's departments. Same screens, different API.
 */
export type DepartmentPortalKind = 'org' | 'jodayn'

export type DepartmentPortal = {
  kind: DepartmentPortalKind
  /** Route base for the department screens. */
  base: string
  token: () => string | null
  /** Where a project row opens, or null when this portal has no project page. */
  projectHref: (id: string) => string | null
  list: (token: string) => Promise<{ departments: Department[] }>
  get: (token: string, id: string) => Promise<{ department: Department }>
  create: (token: string, data: DepartmentPayload & { orgId?: string }) => Promise<{ department: Department }>
  update: (token: string, id: string, data: Partial<DepartmentPayload>) => Promise<{ department: Department }>
  remove: (token: string, id: string) => Promise<unknown>
  employees: (token: string, id: string) => Promise<{ employees: DepartmentEmployee[] }>
  addEmployee: (
    token: string,
    id: string,
    data: { name: string; email?: string; role?: string },
  ) => Promise<unknown>
  removeEmployee: (token: string, id: string, empId: string) => Promise<unknown>
  linkProjects: (token: string, id: string, projectIds: string[]) => Promise<unknown>
  /** Projects that can belong to departments (organization projects only). */
  projects: (token: string) => Promise<OrgProject[]>
}

function portalFor(kind: DepartmentPortalKind): DepartmentPortal {
  const prefix = kind === 'jodayn' ? '/jodayn/departments' : '/org/departments'
  const json = (data: unknown) => JSON.stringify(data)
  return {
    kind,
    base: kind === 'jodayn' ? '/jodayn/departments' : '/org/departments',
    token: kind === 'jodayn' ? getJodaynToken : getOrgToken,
    projectHref: (id) => (kind === 'jodayn' ? null : `/org/projects/${id}`),
    list: (token) => apiRequest(prefix, { method: 'GET', token }),
    get: (token, id) => apiRequest(`${prefix}/${id}`, { method: 'GET', token }),
    create: (token, data) => apiRequest(prefix, { method: 'POST', token, body: json(data) }),
    update: (token, id, data) => apiRequest(`${prefix}/${id}`, { method: 'PATCH', token, body: json(data) }),
    remove: (token, id) => apiRequest(`${prefix}/${id}`, { method: 'DELETE', token }),
    employees: (token, id) => apiRequest(`${prefix}/${id}/employees`, { method: 'GET', token }),
    addEmployee: (token, id, data) =>
      apiRequest(`${prefix}/${id}/employees`, { method: 'POST', token, body: json(data) }),
    removeEmployee: (token, id, empId) =>
      apiRequest(`${prefix}/${id}/employees/${empId}`, { method: 'DELETE', token }),
    linkProjects: (token, id, projectIds) =>
      apiRequest(`${prefix}/${id}/projects`, { method: 'POST', token, body: json({ projectIds }) }),
    projects: async (token) => {
      if (kind === 'org') return (await getProjects(token)).projects ?? []
      const { projects } = await getJodaynProjects(token)
      return projects.filter((p) => p.ownerType === 'org') as unknown as OrgProject[]
    },
  }
}

const DepartmentPortalContext = createContext<DepartmentPortal>(portalFor('org'))

export function DepartmentPortalProvider({ kind, children }: { kind: DepartmentPortalKind; children: ReactNode }) {
  const value = useMemo(() => portalFor(kind), [kind])
  return <DepartmentPortalContext.Provider value={value}>{children}</DepartmentPortalContext.Provider>
}

export function useDepartmentPortal() {
  return useContext(DepartmentPortalContext)
}
