import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { commonAssets, dashboardDataAssets, navigationAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getGoals, type StrategicGoal } from '../../api/orgStrategy'
import { getOrgToken } from '../../auth/orgAuth'
import {
  Badge,
  CatalogButton,
  FilterChips,
  ListCard,
  ListCardStack,
  StatCard,
  StatGrid,
  type BadgeVariant,
} from '../../components/ui'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { ProgressBar } from '../../org-catalog/ProgressBar'
import { EmptyState } from '../../components/EmptyState'

type GoalUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'

const TAG_DOTS = ['#17b26a', '#2e90fa', '#f79009', '#7a5af8']

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

function isOverdue(endDate?: string | null) {
  if (!endDate) return false
  const end = new Date(endDate)
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now()
}

function mapGoalUiStatus(goal: StrategicGoal): GoalUiStatus {
  const status = String(goal.status ?? '').toUpperCase()
  if (status === 'ACHIEVED' || status === 'COMPLETED') return 'completed'
  if (status === 'MISSED') return 'delayed'
  if (status === 'NOT_STARTED') return 'stalled'
  if (isOverdue(goal.endDate) && status !== 'ACHIEVED' && status !== 'COMPLETED') return 'delayed'
  return 'onTrack'
}

function statusVariant(status: GoalUiStatus): BadgeVariant {
  if (status === 'delayed') return 'warning'
  if (status === 'stalled') return 'danger'
  return 'success'
}

function statusLabelKey(status: GoalUiStatus) {
  if (status === 'onTrack') return 'onTrack'
  if (status === 'delayed') return 'delayed'
  if (status === 'stalled') return 'stalled'
  return 'completed'
}

function projectLinkName(link: unknown): string | null {
  if (!link || typeof link !== 'object') return null
  const rec = link as Record<string, unknown>
  if (typeof rec.name === 'string' && rec.name.trim()) return rec.name
  const project = rec.project
  if (project && typeof project === 'object') {
    const name = (project as { name?: unknown }).name
    if (typeof name === 'string' && name.trim()) return name
  }
  return null
}

export function OrgGoalsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<StrategicGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    const token = getOrgToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { goals: data } = await getGoals(token)
        if (!cancelled) setGoals(data)
      } catch (err) {
        if (!cancelled) {
          message.error(err instanceof ApiError ? err.message : t('loadError'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const avgAchievement =
    goals.length === 0
      ? 0
      : Math.round(goals.reduce((sum, g) => sum + (g.achievementPct ?? 0), 0) / goals.length)
  const linkedProjects = goals.reduce((sum, g) => sum + (g.projectLinks?.length ?? 0), 0)
  const delayedGoals = goals.filter((g) => {
    if (!g.endDate) return false
    return new Date(g.endDate).getTime() < Date.now() && String(g.status).toUpperCase() !== 'COMPLETED'
  }).length

  const filterCounts = useMemo(() => {
    const counts = { all: goals.length, onTrack: 0, delayed: 0, stalled: 0, completed: 0 }
    goals.forEach((goal) => {
      counts[mapGoalUiStatus(goal)] += 1
    })
    return counts
  }, [goals])

  const filteredGoals = useMemo(() => {
    if (activeFilter === 'all') return goals
    return goals.filter((goal) => mapGoalUiStatus(goal) === activeFilter)
  }, [goals, activeFilter])

  return (
    <OrgCatalogShell title={t('strategicGoals')}>
      <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/org/goals/new')}>
        {t('addGoal')}
      </CatalogButton>

      <StatGrid>
        <StatCard
          label={t('totalGoals')}
          value={goals.length}
          suffix={t('goalsUnit')}
          icon={<AssetIcon src={navigationAssets.goals} size={16} />}
        />
        <StatCard
          label={t('avgAchievement')}
          value={`${avgAchievement}%`}
          icon={<AssetIcon src={dashboardDataAssets.active} size={16} />}
          badge={
            <Badge variant="success" icon={<span className="tenants-status-dot" />}>
              {t('onTrack')}
            </Badge>
          }
        >
          <ProgressBar value={avgAchievement} tone="success" className="goals-stat-card__bar" />
        </StatCard>
        <StatCard
          label={t('linkedProjects')}
          value={linkedProjects}
          suffix={t('projectUnit')}
          icon={<AssetIcon src={navigationAssets.projects} size={16} />}
        />
        <StatCard
          label={t('delayedGoals')}
          value={delayedGoals}
          suffix={t('goalsUnit')}
          tone="warn"
          icon={<AssetIcon src={dashboardDataAssets.suspended} size={16} />}
        />
      </StatGrid>

      <FilterChips
        value={activeFilter}
        onChange={setActiveFilter}
        items={[
          { key: 'all', label: t('all'), count: filterCounts.all },
          { key: 'onTrack', label: t('onTrack'), count: filterCounts.onTrack },
          { key: 'delayed', label: t('delayed'), count: filterCounts.delayed },
          { key: 'stalled', label: t('stalled'), count: filterCounts.stalled },
          { key: 'completed', label: t('completed'), count: filterCounts.completed },
        ]}
      />

      <ListCardStack>
        {filteredGoals.map((goal) => {
          const uiStatus = mapGoalUiStatus(goal)
          const variant = statusVariant(uiStatus)
          const progress = goal.achievementPct ?? goal.progressPct ?? 0
          const projectCount = goal.projectLinks?.length ?? 0
          const projectNames = (goal.projectLinks ?? [])
            .map(projectLinkName)
            .filter((name): name is string => Boolean(name))
          const extraCount = Math.max(0, projectCount - projectNames.slice(0, 2).length)

          return (
            <ListCard
              key={goal.id}
              title={goal.title}
              onOpen={() => navigate(`/org/goals/${goal.id}`)}
              badge={
                <Badge variant={variant} icon={<span className="tenants-status-dot" />}>
                  {t(statusLabelKey(uiStatus))}
                </Badge>
              }
              metaItems={[
                `${t('linkedProjects')}: ${projectCount}`,
                <>
                  <AssetIcon src={commonAssets.clock} size={13} />
                  {[formatDate(goal.startDate), formatDate(goal.endDate)].join(' – ')}
                </>,
              ]}
              progress={{ value: progress, tone: variant, label: t('achievementRate') }}
              tags={
                <>
                  {projectNames.slice(0, 2).map((name, index) => (
                    <span key={`${goal.id}-${name}`} className="list-card__tag">
                      <span className="list-card__tag-dot" style={{ background: TAG_DOTS[index % TAG_DOTS.length] }} />
                      {name}
                    </span>
                  ))}
                  {extraCount > 0 ? (
                    <span className="list-card__tag list-card__tag--muted">
                      + {extraCount} {t('projectUnit')}
                    </span>
                  ) : null}
                </>
              }
            />
          )
        })}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {filteredGoals.length === 0 && !loading ? <EmptyState description={t('noMatchingFilter')} /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
