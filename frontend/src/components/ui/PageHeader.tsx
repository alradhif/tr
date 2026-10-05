import type { ReactNode } from 'react'

export type PageHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header className={`page-header${className ? ` ${className}` : ''}`} dir="rtl">
      <div className="page-header__title-block">
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : <p className="page-header__subtitle page-header__subtitle--placeholder" aria-hidden>&nbsp;</p>}
      </div>
      <div className="page-header__action">{action ?? null}</div>
    </header>
  )
}
