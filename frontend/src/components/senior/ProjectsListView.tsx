import type { ReactNode } from 'react'
import { ChevronLeft, ListFilter, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TrendKpiRow } from './TrendKpiCard'
import { progressColor, RecordCard, RecordCardGrid, ToneBadge, ViewToggle, type ViewMode } from '../ui/RecordCards'
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
  /** Approved deliverables, as "7 من 10". Adds the column when present. */
  approvedOutputs?: string
  /** Who executes the project; shown on the card. */
  subtitle?: string
  /** No deliverables have been defined, so progress cannot be measured yet. */
  noOutputs?: boolean
}

/** Organization layout: KPIs and filters from the design, plus the table/cards switch. */
export type ProjectListExec = {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  kpis: Array<{ label: string; value: string | number; delta: string; up: boolean }>
  filterBar: ReactNode
  /** Portals without deliverable approval measure and name these differently. */
  outputsLabel?: string
  progressLabel?: string
}

type ExecCounts = Record<'all' | 'onTrack' | 'delayed' | 'completed' | 'pending' | 'draft' | 'rejected', number>

/** Options of the "حالة التنفيذ" filter, the same on every portal. */
export function executionFilterOptions(t: (key: string) => string, counts: ExecCounts) {
  return [
    { value: 'all', label: `${t('all')} (${counts.all})` },
    { value: 'onTrack', label: `${t('onTrack')} (${counts.onTrack})` },
    { value: 'delayed', label: `${t('delayedTab')} (${counts.delayed})` },
    { value: 'completed', label: `${t('completed')} (${counts.completed})` },
    { value: 'pending', label: `${t('approvalStatusPending')} (${counts.pending})` },
    { value: 'draft', label: `${t('approvalStatusDraft')} (${counts.draft})` },
    { value: 'rejected', label: `${t('approvalStatusRejected')} (${counts.rejected})` },
  ]
}

export type ProjectListFilter = { key: string; label: string; count: number }

const STATUS_META: Record<ProjectListStatus, { label: string; tone: string }> = {
  delayed: { label: 'تأخير', tone: 'delayed' },
  stalled: { label: 'متعثر', tone: 'stalled' },
  completed: { label: 'مكتمل', tone: 'completed' },
  onTrack: { label: 'على المسار', tone: 'ontrack' },
}

const EXEC_TONE: Record<ProjectListStatus, string> = {
  delayed: 'pending',
  stalled: 'changes',
  completed: 'approved',
  onTrack: 'approved',
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
  exec,
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
  exec?: ProjectListExec
  /** Replaces the KPI row and table (used for the presentation generator view). */
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const all = filters.find((f) => f.key === 'all')?.count ?? rows.length
  const avgProgress = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0
  const delayed = rows.filter((row) => row.status === 'delayed' || row.status === 'stalled').length
  const completed = rows.filter((row) => row.status === 'completed').length
  const showApproved = rows.some((row) => row.approvedOutputs !== undefined)
  const createButton =
    createLabel && onCreate ? (
      <button type="button" className="sc-btn-primary" onClick={onCreate}>
        <Plus size={18} />
        <span>{createLabel}</span>
      </button>
    ) : null

  return (
    <div className={`dashboard-page sc-page sp-page${exec ? ' sp-page--exec' : ''}`} dir="rtl">
      <div className="sc-shell-title">
        <h1>المشاريع</h1>
      </div>
      {banner}

      <div className="sc-content">
        {exec ? null : (
          <div className="sp-toolbar">
            {createButton}
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
        )}

        {filtersOpen && !exec ? (
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
              stats={
                exec?.kpis ?? [
                  { label: 'عدد المشاريع', value: all, delta: `${completed} مكتمل`, up: true },
                  { label: 'متوسط التقدم', value: `${avgProgress}%`, delta: `${delayed} متأخر`, up: delayed === 0 },
                  { label: 'عدد المخرجات', value: totalOutputs, delta: `${all} مشروع`, up: totalOutputs > 0 },
                ]
              }
            />

            {exec ? (
              <div className="rc-view-bar rc-view-bar--split sp-exec-bar">
                {exec.filterBar}
                <div className="rc-list-bar__actions">
                  <ViewToggle value={exec.view} onChange={exec.onViewChange} />
                  {createButton}
                </div>
              </div>
            ) : null}

            {exec?.view === 'cards' ? (
              <>
                {loading ? <p className="sc-empty">جاري التحميل...</p> : null}
                {!loading && rows.length === 0 ? (
                  <p className="sc-empty">{activeFilter === 'all' ? 'لا توجد مشاريع. أضف مشروعاً جديداً للبدء.' : t('noMatchingFilter')}</p>
                ) : null}
                <RecordCardGrid>
                  {rows.map((row) => {
                    const meta = STATUS_META[row.status]
                    const notStarted = !row.noOutputs && row.progress === 0 && row.status === 'onTrack'
                    return (
                      <RecordCard
                        key={row.key}
                        title={row.name}
                        subtitle={row.subtitle}
                        badges={
                          <ToneBadge
                            meta={
                              row.noOutputs
                                ? { label: 'لم تُحدد المخرجات', tone: 'none' }
                                : notStarted
                                  ? { label: 'لم يبدأ', tone: 'none' }
                                  : { label: meta.label, tone: EXEC_TONE[row.status] }
                            }
                          />
                        }
                        progress={{
                          label: exec.progressLabel ?? 'التقدم التنفيذي',
                          value: row.noOutputs ? null : row.progress,
                          note: row.noOutputs ? 'لم تُحدد المخرجات بعد' : `${exec.outputsLabel ?? 'المخرجات المعتمدة'} ${row.approvedOutputs}`,
                        }}
                        linkLabel="عرض المشروع"
                        onOpen={() => onOpen(row.key)}
                      />
                    )
                  })}
                </RecordCardGrid>
              </>
            ) : (
            <div className="sc-table-wrap">
              <div className={`sp-table-head${showApproved ? ' sp-grid--approved' : ''}`}>
                <span className="sp-col-name">اسم المشروع</span>
                <span className="sp-col-progress">نسبة التقدم</span>
                {showApproved ? <span className="sp-col-approved">{exec?.outputsLabel ?? 'المخرجات المعتمدة'}</span> : null}
                <span className="sp-col-status">{showApproved ? 'حالة التنفيذ' : 'الحالة'}</span>
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
                      className={`sp-table-row ${index % 2 === 0 ? 'sc-row-even' : 'sc-row-odd'}${showApproved ? ' sp-grid--approved' : ''}`}
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
                            <div
                              className={`sp-progress__fill sp-tone--${meta.tone}`}
                              style={{ width: `${progress}%`, ...(exec ? { background: progressColor(progress) } : null) }}
                            />
                          </div>
                        </div>
                      </div>
                      {showApproved ? <div className="sp-col-approved">{row.approvedOutputs}</div> : null}
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
            )}
          </>
        )}
      </div>
    </div>
  )
}
