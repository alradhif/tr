import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getAccounts } from '../../api/superAdmin'
import { getSuperAdminToken } from '../../auth/superAdminAuth'
import { mapAccountsToTenants } from '../lib/mapAccounts'
import type { TenantType } from '../lib/tenantTypes'

export type TenantUserRole = 'مدير النظام' | 'محلل' | 'مشرف' | 'مستخدم'
export type TenantUserStatus = 'active' | 'suspended'

export interface TenantUser {
  id: string
  name: string
  email: string
  initials: string
  avatarColor: string
  role: TenantUserRole
  status: TenantUserStatus
  statusLabel: string
}

export type TenantStatus = 'active' | 'trial' | 'suspended'

export interface TenantPackage {
  name: string
  features: string[]
  monthlyCost: string
  renewalDate: string
}

export interface Tenant {
  id: string
  name: string
  status: TenantStatus
  statusLabel: string
  joinDuration: string
  lastActivity: string
  entityName: string
  crNumber: string
  sector: string
  adminName: string
  phone: string
  email: string
  joinDate: string
  tenantType: TenantType
  accountType: string
  entityType?: string
  region: string
  usedStorage: string
  storageLimit: string
  activeUsers: number
  userLimit: number
  package: TenantPackage
  users: TenantUser[]
}

interface TenantContextValue {
  tenants: Tenant[]
  loading: boolean
  refreshTenants: () => Promise<void>
  addTenant: (tenant: Tenant) => void
  updateTenant: (id: string, updates: Partial<Tenant>) => void
  deleteTenant: (id: string) => void
  getTenantById: (id: string) => Tenant | undefined
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  const refreshTenants = useCallback(async () => {
    const token = getSuperAdminToken()
    if (!token) {
      setTenants([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getAccounts(token)
      setTenants(mapAccountsToTenants(data.orgs ?? [], data.clients ?? [], data.jodaynUsers ?? []))
    } catch {
      // keep previous list on failure
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshTenants()
  }, [refreshTenants])

  const addTenant = useCallback((tenant: Tenant) => {
    setTenants((prev) => [tenant, ...prev])
  }, [])

  const updateTenant = useCallback((id: string, updates: Partial<Tenant>) => {
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])

  const deleteTenant = useCallback((id: string) => {
    setTenants((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const getTenantById = useCallback(
    (id: string) => tenants.find((t) => t.id === id),
    [tenants],
  )

  return (
    <TenantContext.Provider
      value={{
        tenants,
        loading,
        refreshTenants,
        addTenant,
        updateTenant,
        deleteTenant,
        getTenantById,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenants(): Tenant[] {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenants must be used inside <TenantProvider>')
  return ctx.tenants
}

export function useTenantById(id: string): Tenant | undefined {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenantById must be used inside <TenantProvider>')
  return ctx.getTenantById(id)
}

export function useTenantMutations() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenantMutations must be used inside <TenantProvider>')
  const { addTenant, updateTenant, deleteTenant, getTenantById, refreshTenants, loading } = ctx
  return { addTenant, updateTenant, deleteTenant, getTenantById, refreshTenants, loading }
}
