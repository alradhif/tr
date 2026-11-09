import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { commonAssets, dashboardDataAssets, navigationAssets } from '@/assets'
import warningIcon from '../../features/jodayn-finance/assets/card-icon.svg'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getClientGoals, type ClientStrategicGoal } from '../../api/clientStrategy'
import { getClientToken } from '../../auth/clientAuth'
import {
  Badge,
  CatalogButton,
  ListCard,
  ListCardStack,
  StatCard,
  StatGrid,
  type BadgeVariant,
} from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { useGoalFilters } from '../../components/ui/GoalFilters'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { ProgressBar } from '../../org-catalog/ProgressBar'

type GoalUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'

const TAG_DOTS = ['#17b26a', '#2e90fa', '#f79009', '#7a5af8']

function yearOf(value?: string | null) {
  return value ? String(new Date(value).getFullYear()) : '—'
}

function projectNamesOf(goal: ClientStrategicGoal) {
  return (goal.projectLinks ?? [])
    .map((link) => (link as { project?: { name?: string } }).project?.name)
    .filter((name): name is string => Boolean(name))
}

function mapGoalUiStatus(goal: ClientStrategicGoal): GoalUiStatus {
  const status = String(goal.status ?? '').toUpperCase()
  if (status === 'ACHIEVED' || status === 'COMPLETED') return 'completed'
  if (status === 'MISSED') return 'delayed'
  if (status === 'NOT_STARTED') return 'stalled'
  if (goal.endDate && new Date(goal.endDate).getTime() < Date.now() && status !== 'COMPLETED') return 'delayed'
  return 'onTrack'
}

function statusVariant(status: GoalUiStatus): BadgeVariant {
  if (status === 'delayed') return 'warning'
  if (status === 'stalled') return 'danger'
  return 'success'
}

export function ClientGoalsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<ClientStrategicGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getClientToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { goals: data } = await getClientGoals(token)
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
  const delayedGoals = goals.filter((g) => mapGoalUiStatus(g) === 'delayed').length

  const rows = useMemo(
    () =>
      goals.map((goal) => {
        const ui = mapGoalUiStatus(goal)
        return {
          key: goal.id,
          name: goal.title,
          ui,
          achievementRate: goal.achievementPct ?? 0,
          linkedProjects: goal.projectLinks?.length ?? 0,
          period: [yearOf(goal.startDate), yearOf(goal.endDate)].join(' - '),
          projectNames: projectNamesOf(goal),
        }
      }),
    [goals],
  )

  const filterItems = useMemo(
    () =>
      goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: mapGoalUiStatus(goal),
        startDate: goal.startDate,
        endDate: goal.endDate,
        owners: [],
      })),
    [goals],
  )
  const { visibleIds, bar } = useGoalFilters(filterItems)
  const visible = rows.filter((row) => visibleIds.has(row.key))

  return (
    <OrgCatalogShell title={t('strategicGoals')}>
      <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/client/goals/new')}>
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
        >
          <ProgressBar value={avgAchievement} tone="success" className="goals-stat-card__bar" />
        </StatCard>
        <StatCard
          label={t('linkedProjects')}
          value={linkedProjects}
          suffix={t('projectsUnit')}
          icon={<AssetIcon src={navigationAssets.projects} size={16} />}
        />
        <StatCard
          label={t('delayedGoals')}
          value={delayedGoals}
          suffix={t('goalsUnit')}
          icon={<img src={warningIcon} alt="" width={18} height={18} />}
        />
      </StatGrid>

      {bar}

      <ListCardStack>
        {visible.map((row) => {
          const extra = Math.max(0, row.linkedProjects - row.projectNames.slice(0, 2).length)
          const { projectNames } = row
          return (
          <ListCard
            key={row.key}
            title={row.name}
            badge={<Badge variant={statusVariant(row.ui)}>{t(row.ui)}</Badge>}
            metaItems={[
              <>
                <AssetIcon src={commonAssets.clock} size={13} />
                {row.period}
              </>,
              `${row.linkedProjects} ${t('projectsUnit')}`,
            ]}
            progress={{ value: row.achievementRate, tone: row.achievementRate < 40 ? 'danger' : row.achievementRate < 70 ? 'warning' : 'success', label: t('achievementRate') }}
            tags={
                projectNames.length ? (
                  <>
                    {projectNames.slice(0, 2).map((name, index) => (
                      <span key={`${row.key}-${name}`} className="list-card__tag">
                        <span className="list-card__tag-dot" style={{ background: TAG_DOTS[index % TAG_DOTS.length] }} />
                        {name}
                      </span>
                    ))}
                    {extra > 0 ? <span className="list-card__tag list-card__tag--muted">+ {extra} {t('projectsUnit')}</span> : null}
                  </>
                ) : undefined
              }
            onOpen={() => navigate(`/client/goals/${row.key}`)}
            hideChevron
          />
          )
        })}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {visible.length === 0 && !loading ? <EmptyState /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
