import type { ReactNode } from 'react'

export type PanelProps = {
  children: ReactNode
  empty?: boolean
  className?: string
}

export function Panel({ children, empty = false, className = '' }: PanelProps) {
  return (
    <section className={`sa-panel ${empty ? 'sa-panel--empty' : ''} ${className}`.trim()}>
      {children}
    </section>
  )
}
