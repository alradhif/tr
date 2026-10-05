import type { ReactNode } from 'react'
import { commonAssets } from '@/assets'
import { AssetIcon } from './AssetIcon'

export type SubpageHeaderProps = {
  parent: string
  title: string
  onBack: () => void
  subtitle?: string
  actions?: ReactNode
}

export function SubpageHeader({ parent, title, onBack, subtitle, actions }: SubpageHeaderProps) {
  return (
    <header className="subpage-header">
      <button type="button" className="subpage-header__back" onClick={onBack} aria-label={parent}>
        <AssetIcon src={commonAssets.chevronLeft} size={24} className="asset-icon subpage-header__back-icon" />
      </button>
      <nav className="subpage-header__nav">
        <div className="subpage-header__breadcrumb">
          <button type="button" className="subpage-header__parent" onClick={onBack}>
            {parent}
          </button>
          <span className="subpage-header__separator" aria-hidden>
            /
          </span>
          <span className="subpage-header__current">{title}</span>
        </div>
        {subtitle ? <p className="subpage-header__subtitle">{subtitle}</p> : null}
      </nav>
      {actions ? <div className="subpage-header__actions">{actions}</div> : null}
    </header>
  )
}
