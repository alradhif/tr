import type { ReactNode } from 'react'

export type FormSectionProps = {
  title: string
  children: ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="form-section">
      <h2 className="form-section__title">{title}</h2>
      <div className="form-section__divider" />
      <div className="form-section__body">{children}</div>
    </section>
  )
}
