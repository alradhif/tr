import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  icon?: ReactNode
  className?: string
}

export function Badge({ children, variant = 'neutral', icon, className }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${variant}${className ? ` ${className}` : ''}`}>
      {icon ? <span className="ui-badge__icon">{icon}</span> : null}
      {children}
    </span>
  )
}
