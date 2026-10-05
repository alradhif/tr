import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronLeft } from 'lucide-react'

export function CatalogField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`catalog-field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function CatalogInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />
}

export function CatalogTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />
}

export function CatalogSelect({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className="catalog-select-wrap">
      <select {...props}>{children}</select>
      <ChevronLeft size={16} aria-hidden />
    </div>
  )
}

export function CatalogFieldRow({ children }: { children: ReactNode }) {
  return <div className="catalog-field-row">{children}</div>
}
