import type { ReactNode } from 'react'
import { ChevronLeft, ListFilter, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TrendKpiRow } from './TrendKpiCard'
import { approvalLabelKey } from '../../org-catalog/approvalStatus'
import '../../design/senior-companies.css'
import '../../design/senior-projects.css'

export type ProjectListStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'

export type ProjectListRow = {
  key: string
  name: string
  progress: number
  status: ProjectListStatus
  approvalStatus: string
}

export type ProjectListFilter = { key: string; label: string; count: number }

const STATUS_META: Record<ProjectListStatus, { label: string; tone: string }> = {
  delayed: { label: 'تأخير', tone: 'delayed' },
  stalled: { label: 'متعثر', tone: 'stalled' },
  completed: { label: 'مكتمل', tone: 'completed' },
  onTrack: { label: 'على المسار', tone: 'ontrack' },
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.67" fill="currentColor" fillOpacity="0.5" />
      <path
        d="M8 5.1667C7.586 5.1667 7.25 5.5027 7.25 5.9167C7.25 6.1931 7.0261 6.4167 6.75 6.4167C6.4739 6.4167 6.25 6.1931 6.25 5.9167C6.25 4.9502 7.0335 4.1667 8 4.1667C8.9665 4.1667 9.75 4.9502 9.75 5.9167C9.75 6.4067 9.5503 6.8484 9.2553 7.136L8.6987 7.7253C8.552 7.9133 8.5 8.0513 8.5 8.1667V8.6667C8.5 8.9428 8.2761 9.1667 8 9.1667C7.7239 9.1667 7.5 8.9428 7.5 8.6667V8.1667C7.5 7.73 7.7033 7.376 7.9093 7.1113L8.538 6.4393C8.6407 6.3336 8.75 6.1338 8.75 5.9167C8.75 5.5027 8.414 5.1667 8 5.1667ZM8 11.3333C8.3682 11.3333 8.6667 11.0349 8.6667 10.6667C8.6667 10.2985 8.3682 10 8 10C7.6318 10 7.3333 10.2985 7.3333 10.6667C7.3333 11.0349 7.6318 11.3333 8 11.3333Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Projects list from the senior-management design: KPI row, then a table of name, progress and status. */
export function ProjectsListView({
  rows,
  loading,
  totalOutputs,
  createLabel,
  onCreate,
  onOpen,
  filters,
  activeFilter,
  onFilterChange,
  filtersOpen,
  onToggleFilters,
  toolbarExtra,
  banner,
  children,
}: {
  rows: ProjectListRow[]
  loading: boolean
  totalOutputs: number
  createLabel?: string
  onCreate?: () => void
  onOpen: (key: string) => void
  filters: ProjectListFilter[]
  activeFilter: string
  onFilterChange: (key: string) => void
  filtersOpen: boolean
  onToggleFilters: () => void
  toolbarExtra?: ReactNode
  banner?: ReactNode
  /** Replaces the KPI row and table (used for the presentation generator view). */
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const all = filters.find((f) => f.key === 'all')?.count ?? rows.length
  const avgProgress = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0
  const delayed = rows.filter((row) => row.status === 'delayed' || row.status === 'stalled').length
  const completed = rows.filter((row) => row.status === 'completed').length

  return (
    <div className="dashboard-page sc-page sp-page" dir="rtl">
      <div className="sc-shell-title">
        <h1>المشاريع</h1>
      </div>
      {banner}

      <div className="sc-content">
        <div className="sp-toolbar">
          {createLabel && onCreate ? (
            <button type="button" className="sc-btn-primary" onClick={onCreate}>
              <Plus size={18} />
              <span>{createLabel}</span>
            </button>
          ) : null}
          {toolbarExtra}
          <button
            type="button"
            className={`sc-btn-outline${filtersOpen || activeFilter !== 'all' ? ' sc-btn-outline--active' : ''}`}
            onClick={onToggleFilters}
          >
            <ListFilter size={17} />
            <span>تصفية</span>
          </button>
        </div>

        {filtersOpen ? (
          <div className="sp-filters" role="tablist" aria-label="تصفية المشاريع">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={filter.key === activeFilter}
                className={filter.key === activeFilter ? 'is-active' : ''}
                onClick={() => onFilterChange(filter.key)}
              >
                {filter.label}
                <span className="sp-filters__count">{filter.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {children ?? (
          <>
            <TrendKpiRow
              stats={[
                { label: 'عدد المشاريع', value: all, delta: `${completed} مكتمل`, up: true },
                { label: 'متوسط التقدم', value: `${avgProgress}%`, delta: `${delayed} متأخر`, up: delayed === 0 },
                { label: 'عدد المخرجات', value: totalOutputs, delta: `${all} مشروع`, up: totalOutputs > 0 },
              ]}
            />

            <div className="sc-table-wrap">
              <div className="sp-table-head">
                <span className="sp-col-name">اسم المشروع</span>
                <span className="sp-col-progress">نسبة التقدم</span>
                <span className="sp-col-status">الحالة</span>
                <span className="sp-col-action" />
              </div>
              <ul className="sc-table-body">
                {loading ? <li className="sc-empty">جاري التحميل...</li> : null}
                {!loading && rows.length === 0 ? (
                  <li className="sc-empty">
                    {activeFilter === 'all' ? 'لا توجد مشاريع. أضف مشروعاً جديداً للبدء.' : t('noMatchingFilter')}
                  </li>
                ) : null}
                {rows.map((row, index) => {
                  const meta = STATUS_META[row.status]
                  const approval = String(row.approvalStatus || '').toUpperCase()
                  const progress = Math.min(100, Math.max(0, Math.round(row.progress)))
                  return (
                    <li
                      key={row.key}
                      className={`sp-table-row ${index % 2 === 0 ? 'sc-row-even' : 'sc-row-odd'}`}
                      onClick={() => onOpen(row.key)}
                    >
                      <div className="sp-col-name sp-name-cell">
                        <span className="sp-name">{row.name}</span>
                        {approval && approval !== 'APPROVED' ? (
                          <span className={`sp-approval sp-approval--${approval.toLowerCase()}`}>
                            {t(approvalLabelKey(approval))}
                          </span>
                        ) : null}
                      </div>
                      <div className="sp-col-progress">
                        <div className="sp-progress">
                          <span className="sp-progress__text">{progress}%</span>
                          <div className="sp-progress__track">
                            <div className={`sp-progress__fill sp-tone--${meta.tone}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="sp-col-status">
                        <span className={`sp-status sp-status--${meta.tone}`}>
                          <InfoIcon />
                          {meta.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="sp-col-action sc-btn-action"
                        aria-label={`فتح تفاصيل ${row.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpen(row.key)
                        }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
