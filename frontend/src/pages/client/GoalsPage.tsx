import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { commonAssets, dashboardDataAssets, navigationAssets } from '@/assets'
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
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { ProgressBar } from '../../org-catalog/ProgressBar'

type GoalUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
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
          endDate: formatDate(goal.endDate),
        }
      }),
    [goals],
  )

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
          tone="warn"
          icon={<AssetIcon src={dashboardDataAssets.suspended} size={16} />}
        />
      </StatGrid>

      <ListCardStack>
        {rows.map((row) => (
          <ListCard
            key={row.key}
            title={row.name}
            badge={<Badge variant={statusVariant(row.ui)}>{t(row.ui)}</Badge>}
            metaItems={[
              <>
                <AssetIcon src={commonAssets.clock} size={13} />
                {row.endDate}
              </>,
              `${row.linkedProjects} ${t('projectsUnit')}`,
            ]}
            progress={{ value: row.achievementRate, tone: statusVariant(row.ui), label: t('achievementRate') }}
            onOpen={() => navigate(`/client/goals/${row.key}`)}
          />
        ))}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {rows.length === 0 && !loading ? <EmptyState /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
