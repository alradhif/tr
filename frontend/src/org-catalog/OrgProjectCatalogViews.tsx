import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { projectsAssets } from '@/assets'
import { AssetIcon } from '../components/ui/AssetIcon'
import { Badge } from '../components/ui'
import { ProgressBar } from './ProgressBar'

type PhaseRow = {
  key: string
  title: string
  status: string
  startDate: string
  endDate: string
  startRaw?: string
  endRaw?: string
  activities?: string[]
}

type DeliverableRow = {
  key: string
  name: string
  phase: string
  endDate: string
  status: string
  createdAt?: string
  progress?: number
  actions?: ReactNode
}

type RecordRow = {
  key: string
  title: string
  subtitle?: string
  meta?: string
  status?: string
  actions?: ReactNode
}

function parseTime(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function phaseUiStatus(start?: string, end?: string): 'completed' | 'inProgress' | 'notStarted' {
  const now = Date.now()
  const startAt = parseTime(start)
  const endAt = parseTime(end)
  if (endAt !== null && endAt < now) return 'completed'
  if (startAt !== null && startAt > now) return 'notStarted'
  return 'inProgress'
}

function phaseProgress(start?: string, end?: string) {
  const now = Date.now()
  const startAt = parseTime(start)
  const endAt = parseTime(end)
  if (startAt === null || endAt === null || endAt <= startAt) return 0
  if (now <= startAt) return 0
  if (now >= endAt) return 100
  return Math.round(((now - startAt) / (endAt - startAt)) * 100)
}

function monthPosition(value?: string) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return null
  const month = date.getMonth()
  const day = date.getDate()
  const days = new Date(date.getFullYear(), month + 1, 0).getDate()
  return ((month + (day - 1) / days) / 12) * 100
}

export function OrgProjectStagesView({
  phases,
  projectName,
}: {
  phases: PhaseRow[]
  projectName: string
}) {
  const { t } = useTranslation()
  const views = useMemo(
    () =>
      phases.map((phase, index) => {
        const status = phaseUiStatus(phase.startRaw, phase.endRaw)
        return {
          number: index + 1,
          title: phase.title,
          date: [phase.startDate, phase.endDate].filter(Boolean).join(' — '),
          progress: phaseProgress(phase.startRaw, phase.endRaw),
          status,
          startRaw: phase.startRaw,
          endRaw: phase.endRaw,
          activities: phase.activities ?? [],
        }
      }),
    [phases],
  )
  const [openStages, setOpenStages] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(views.map((stage, index) => [stage.number, index < 2])),
  )

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const colors = ['#f9d9d7', '#ccefe0', '#d5e9fe', '#a8d6a2', '#f9e2c4']

  return (
    <section className="project-stages" dir="rtl">
      <section className="project-stages__timeline" aria-label={t('timeline')}>
        <div className="project-stages__timeline-title">
          <span>
            <AssetIcon src={projectsAssets.timeline} size={22} />
          </span>
          <h2>{t('timeline')}</h2>
        </div>
        <div className="project-stages__timeline-grid">
          <div className="project-stages__timeline-months">
            {months.map((month) => (
              <div key={month}>{month}</div>
            ))}
          </div>
          <div className="project-stages__timeline-body">
            {views.map((stage, index) => {
              const start = monthPosition(stage.startRaw)
              const end = monthPosition(stage.endRaw)
              if (start === null || end === null) return null
              const left = Math.max(0, Math.min(100, start))
              const right = Math.max(left + 4, Math.min(100, end))
              return (
                <div
                  key={stage.number}
                  className="project-stages__timeline-bar"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(5, right - left)}%`,
                    top: `${18 + (index % 5) * 42}px`,
                    background: colors[index % colors.length],
                  }}
                >
                  <span>
                    {stage.date} — {projectName}
                  </span>
                  <strong>{stage.title}</strong>
                </div>
              )
            })}
            {views.length === 0 ? <div className="project-stages__timeline-empty">{t('noPhasesYet')}</div> : null}
          </div>
        </div>
      </section>

      {views.map((stage) => {
        const isOpen = Boolean(openStages[stage.number])
        const statusKey =
          stage.status === 'completed' ? 'completed' : stage.status === 'inProgress' ? 'inProgress' : 'notStarted'
        const variant = stage.status === 'completed' ? 'success' : stage.status === 'inProgress' ? 'info' : 'neutral'
        return (
          <article className={`project-stages__card ${isOpen ? 'is-open' : 'is-collapsed'}`} key={stage.number}>
            <header className="project-stages__header">
              <div className="project-stages__title-group">
                <div className="project-stages__number">{stage.number}</div>
                <div>
                  <h2>{stage.title}</h2>
                  <p>{stage.date}</p>
                </div>
              </div>
              <div className="project-stages__summary">
                <button
                  type="button"
                  className="project-stages__toggle"
                  onClick={() => setOpenStages((current) => ({ ...current, [stage.number]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                <Badge variant={variant} icon={<span className="tenants-status-dot" />}>
                  {t(statusKey)}
                </Badge>
                <div className="org-progress-cell">
                  <strong>{stage.progress}%</strong>
                  <ProgressBar
                    value={stage.progress}
                    tone={stage.progress >= 100 ? 'success' : stage.progress > 0 ? 'info' : 'warning'}
                  />
                </div>
              </div>
            </header>
            {isOpen ? (
              <div className="project-stages__details">
                <div className="project-stages__divider" />
                <h3>{t('activities')}</h3>
                {stage.activities.length > 0 ? (
                  <ul className="project-stages__activities">
                    {stage.activities.map((activity, index) => {
                      const [name, owner, start, end] = activity.split('|').map((part) => part.trim())
                      return (
                        <li key={`${stage.number}-${index}`}>
                          <strong>{name}</strong>
                          {owner ? <span>{owner}</span> : null}
                          {start || end ? <em>{[start, end].filter(Boolean).join(' — ')}</em> : null}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="project-stages__empty">{t('noActivitiesYet')}</div>
                )}
              </div>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}

export function OrgProjectOutputsView({ rows }: { rows: DeliverableRow[] }) {
  const { t } = useTranslation()
  return (
    <section className="project-outputs" dir="rtl">
      <div className="project-outputs__table-card">
        <div className="project-outputs__thead" role="row">
          <div>{t('deliverableName')}</div>
          <div>{t('phase')}</div>
          <div>{t('startDate')}</div>
          <div>{t('createdAt')}</div>
          <div>{t('status')}</div>
        </div>
        {rows.map((row, index) => {
          const completed = String(row.status).toUpperCase() === 'COMPLETED'
          return (
            <div className={`project-outputs__row ${index % 2 ? 'is-alt' : ''}`} key={row.key} role="row">
              <div className="project-outputs__name">{row.name}</div>
              <div className="project-outputs__stage">
                <strong>{row.phase === '—' ? t('phase') : row.phase}</strong>
              </div>
              <div>{row.endDate}</div>
              <div>{row.createdAt ?? '—'}</div>
              <div>
                <Badge variant={completed ? 'success' : 'neutral'} icon={<span className="tenants-status-dot" />}>
                  {completed ? t('completed') : row.progress ? `${row.progress}%` : t('planned')}
                </Badge>
                {row.actions}
              </div>
            </div>
          )
        })}
        {rows.length === 0 ? <div className="project-outputs__empty">{t('noOutputsYet')}</div> : null}
      </div>
    </section>
  )
}

export function OrgProjectRecordList({ rows, emptyKey }: { rows: RecordRow[]; emptyKey: string }) {
  const { t } = useTranslation()
  return (
    <section className="catalog-record-list" dir="rtl">
      {rows.map((row) => (
        <article key={row.key} className="catalog-record-list__row">
          <div>
            <strong>{row.title}</strong>
            {row.subtitle ? <span>{row.subtitle}</span> : null}
          </div>
          {row.meta ? <em>{row.meta}</em> : null}
          {row.status ? (
            <Badge variant="neutral" icon={<span className="tenants-status-dot" />}>
              {row.status}
            </Badge>
          ) : null}
          {row.actions}
        </article>
      ))}
      {rows.length === 0 ? <div className="catalog-record-list__empty">{t(emptyKey)}</div> : null}
    </section>
  )
}
