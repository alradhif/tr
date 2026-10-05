import type { ReactNode } from 'react'

export type StatTone = 'green' | 'mint' | 'teal' | 'warn' | 'default'

export type StatCardProps = {
  label: string
  value: string | number
  suffix?: string
  icon?: ReactNode
  tone?: StatTone
  badge?: ReactNode
  children?: ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  suffix,
  icon,
  tone = 'default',
  badge,
  children,
  className,
}: StatCardProps) {
  return (
    <article className={`stat-card ${tone !== 'default' ? `stat-card--${tone}` : ''}${className ? ` ${className}` : ''}`}>
      <div className="stat-card__label-row">
        {icon ? <div className="stat-card__icon">{icon}</div> : null}
        <div className="stat-card__label">{label}</div>
      </div>
      <div className="stat-card__value">
        {badge}
        <strong>{value}</strong>
        {suffix ? <span>{suffix}</span> : null}
      </div>
      {children}
    </article>
  )
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={`stat-grid${className ? ` ${className}` : ''}`}>{children}</section>
}
