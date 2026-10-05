import { useTranslation } from 'react-i18next'
import { EmptyState, Panel } from '../ui'

type ProjectOverviewPanelProps = {
  progress?: number
  description?: string | null
  startDate?: string
  endDate?: string
  budget?: number
}

function formatDate(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString()
}

export function ProjectOverviewPanel({
  progress = 0,
  description,
  startDate,
  endDate,
  budget = 0,
}: ProjectOverviewPanelProps) {
  const { t } = useTranslation()
  const remaining = Math.max(0, 100 - progress)

  return (
    <div className="project-overview">
      <div className="project-overview__top">
        <Panel className="project-overview__progress">
          <h3>{t('projectProgress')}</h3>
          <div className="progress-ring" aria-hidden>
            <div
              className="progress-ring__track"
              style={{
                background: `conic-gradient(var(--tp-brand) ${progress * 3.6}deg, #e8e8ea ${progress * 3.6}deg)`,
              }}
            />
            <div className="progress-ring__value">
              <strong>{progress}%</strong>
              <span>{t('completed')}</span>
            </div>
          </div>
          <div className="progress-ring__legend">
            <span>
              <i className="dot dot--green" /> {t('completed')} {progress}%
            </span>
            <span>
              <i className="dot dot--orange" /> {t('remaining')} {remaining}%
            </span>
          </div>
        </Panel>

        <Panel className="project-overview__timeline">
          <h3>{t('projectTimeline')}</h3>
          <p>
            {t('startDate')}: {formatDate(startDate)}
          </p>
          <p>
            {t('endDate')}: {formatDate(endDate)}
          </p>
        </Panel>
      </div>

      <div className="project-overview__bottom">
        <Panel>
          <h3>{t('projectDescription')}</h3>
          {description ? <p>{description}</p> : (
            <div className="sa-panel--empty sa-panel--list">
              <EmptyState />
            </div>
          )}
        </Panel>
        <Panel>
          <h3>{t('financialOverview')}</h3>
          <div className="finance-stats">
            <div>
              <span>{t('totalBudget')}</span>
              <strong>{budget}</strong>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
