import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SubpageHeader } from '../ui'

export type FormPageHeaderProps = {
  parentLabel: string
  currentLabel: string
  backTo: string
  title: string
  children?: ReactNode
}

export function FormPageHeader({
  parentLabel,
  currentLabel,
  backTo,
  title,
  children,
}: FormPageHeaderProps) {
  const navigate = useNavigate()
  const header = (
    <SubpageHeader parent={parentLabel} title={currentLabel || title} onBack={() => navigate(backTo)} />
  )

  if (!children) return header

  return (
    <div className="dashboard-page entity-form-page" dir="rtl">
      {header}
      <div className="catalog-form-body catalog-ant-form">{children}</div>
    </div>
  )
}
