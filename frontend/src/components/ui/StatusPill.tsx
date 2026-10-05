import type { ReactNode } from 'react'

export type StatusTone = 'green' | 'orange' | 'red' | 'blue' | 'gray'

export type StatusPillProps = {
  label: string
  tone?: StatusTone
  icon?: ReactNode
}

export function StatusPill({ label, tone = 'gray', icon }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${tone}`}>
      {icon ? <span className="status-pill__icon">{icon}</span> : <span className="status-pill__dot" />}
      {label}
    </span>
  )
}
