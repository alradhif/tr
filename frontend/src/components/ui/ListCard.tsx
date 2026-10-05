import type { KeyboardEvent, ReactNode } from 'react'
import { commonAssets } from '@/assets'
import { AssetIcon } from './AssetIcon'
import type { BadgeVariant } from './Badge'

export type ListCardProgress = {
  value: number
  label?: string
  text?: string
  tone?: BadgeVariant
}

export type ListCardProps = {
  title: string
  badge?: ReactNode
  metaItems?: ReactNode[]
  progress?: ListCardProgress
  tags?: ReactNode
  onOpen?: () => void
}

export function ListCard({ title, badge, metaItems, progress, tags, onOpen }: ListCardProps) {
  const clickable = Boolean(onOpen)
  const tone = progress?.tone ?? 'success'
  const value = Math.min(100, Math.max(0, progress?.value ?? 0))

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!onOpen) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  const visibleMeta = (metaItems ?? []).filter((item) => item != null && item !== '')

  return (
    <article
      className={`list-card${clickable ? ' list-card--clickable' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="list-card__header">
        <h3 className="list-card__title">{title}</h3>
        <div className="list-card__header-end">
          {badge}
          {clickable ? (
            <span className="list-card__chevron" aria-hidden>
              <AssetIcon src={commonAssets.chevronLeft} size={16} />
            </span>
          ) : null}
        </div>
      </div>

      {visibleMeta && visibleMeta.length > 0 ? (
        <div className="list-card__meta">
          {visibleMeta.map((item, index) => (
            <span
              key={index}
              className={`list-card__meta-item${index === visibleMeta.length - 1 ? ' list-card__meta-item--end' : ''}`}
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {progress ? (
        <>
          <div className="list-card__progress-row">
            <span className="list-card__progress-text">
              {progress.text ?? (
                <>
                  100% /{' '}
                  <strong className={`list-card__progress-value list-card__progress-value--${tone}`}>
                    {value}%
                  </strong>
                </>
              )}
            </span>
            {progress.label ? <span className="list-card__progress-label">{progress.label}</span> : null}
          </div>
          <div className={`list-card__bar list-card__bar--${tone}`}>
            <span className="list-card__bar-fill" style={{ width: `${value}%` }} />
          </div>
        </>
      ) : null}

      {tags ? <div className="list-card__tags">{tags}</div> : null}
    </article>
  )
}

export function ListCardStack({ children }: { children: ReactNode }) {
  return <div className="list-card-stack">{children}</div>
}
