import type { ReactNode } from 'react'
import { PageHeader } from '../components/ui'

export function OrgCatalogShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dashboard-page">
      <PageHeader className="page-header--senior" title={title} />
      <div className="tenants-body" dir="rtl">
        {children}
      </div>
    </div>
  )
}
