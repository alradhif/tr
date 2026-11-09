import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MultiSelectFilter, SingleSelectFilter } from '../../super-admin-ui/components/ui/filters'
import '../../design/senior-projects.css'
import '../../design/record-cards.css'

export type GoalFilterItem = {
  id: string
  title: string
  status: 'onTrack' | 'delayed' | 'stalled' | 'completed'
  startDate?: string | null
  endDate?: string | null
  /** Who executes or owns the goal; leave empty on portals without this filter. */
  owners: string[]
}

const yearOf = (value?: string | null) => (value ? new Date(value).getFullYear() : null)

function yearsOf(item: GoalFilterItem) {
  const start = yearOf(item.startDate) ?? yearOf(item.endDate)
  const end = yearOf(item.endDate) ?? start
  if (start === null || end === null) return []
  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index))
}

/** Delayed goals are shown under "متعثر", as on the goals statistics. */
const statusGroup = (status: GoalFilterItem['status']) => (status === 'delayed' ? 'stalled' : status)

/** The goal, owner, execution status and period filters used on every goals page. */
export function useGoalFilters(items: GoalFilterItem[], ownerLabel?: string) {
  const { t } = useTranslation()
  const [titles, setTitles] = useState<string[]>([])
  const [owners, setOwners] = useState<string[]>([])
  const [status, setStatus] = useState('all')
  const [year, setYear] = useState('all')

  const visibleIds = useMemo(
    () =>
      new Set(
        items
          .filter(
            (item) =>
              (titles.length === 0 || titles.includes(item.title)) &&
              (owners.length === 0 || item.owners.some((owner) => owners.includes(owner))) &&
              (status === 'all' || statusGroup(item.status) === status) &&
              (year === 'all' || yearsOf(item).includes(year)),
          )
          .map((item) => item.id),
      ),
    [items, titles, owners, status, year],
  )

  const countOf = (key: string) => items.filter((item) => statusGroup(item.status) === key).length
  const distinct = (values: string[]) => [...new Set(values)].map((value) => ({ value, label: value }))

  const bar = (
    <div className="org-projects-filters">
      <MultiSelectFilter label="الهدف" selected={titles} options={distinct(items.map((item) => item.title))} onApply={setTitles} />
      {ownerLabel ? (
        <MultiSelectFilter label={ownerLabel} selected={owners} options={distinct(items.flatMap((item) => item.owners))} onApply={setOwners} />
      ) : null}
      <SingleSelectFilter
        label="حالة التنفيذ"
        value={status}
        options={[
          { value: 'all', label: `${t('all')} (${items.length})` },
          { value: 'onTrack', label: `${t('onTrack')} (${countOf('onTrack')})` },
          { value: 'stalled', label: `${t('stalled')} (${countOf('stalled')})` },
          { value: 'completed', label: `${t('completed')} (${countOf('completed')})` },
        ]}
        onChange={setStatus}
      />
      <SingleSelectFilter
        label="الفترة"
        value={year}
        options={[{ value: 'all', label: 'الكل' }, ...distinct(items.flatMap(yearsOf)).sort((a, b) => a.value.localeCompare(b.value))]}
        onChange={setYear}
      />
    </div>
  )

  return { visibleIds, bar }
}
