import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SubpageHeader } from '../../../components/ui'
import type { ProjectPortal } from './useProjectFormNav'

export function CatalogFormWrap({
  parent,
  title,
  backTo,
  children,
}: {
  portal: ProjectPortal
  parent: string
  title: string
  backTo: string
  children: ReactNode
}) {
  const navigate = useNavigate()

  return (
    <div className="dashboard-page entity-form-page" dir="rtl">
      <SubpageHeader parent={parent} title={title} onBack={() => navigate(backTo)} />
      <div className="catalog-form-body catalog-ant-form">{children}</div>
    </div>
  )
}
