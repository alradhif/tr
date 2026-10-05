import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type CatalogButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'outline'
  icon?: ReactNode
}

export function CatalogButton({
  variant = 'primary',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: CatalogButtonProps) {
  return (
    <button
      type={type}
      className={`catalog-btn catalog-btn--${variant}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
