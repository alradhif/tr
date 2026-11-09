import { useState, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RecordCard, RecordCardGrid, ToneBadge, useViewMode, ViewToggle } from '../ui/RecordCards'

import '../../design/deliverable-review.css'

export { ToneBadge }

export const LEVEL_META: Record<string, { label: string; tone: string }> = {
  CRITICAL: { label: 'حرج', tone: 'changes' },
  HIGH: { label: 'عالي', tone: 'changes' },
  MEDIUM: { label: 'متوسط', tone: 'pending' },
  LOW: { label: 'منخفض', tone: 'approved' },
}

export const RISK_STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'نشط', tone: 'approved' },
  OPEN: { label: 'نشط', tone: 'approved' },
  IN_PROGRESS: { label: 'قيد المعالجة', tone: 'pending' },
  MITIGATING: { label: 'قيد المعالجة', tone: 'pending' },
  CLOSED: { label: 'مغلق', tone: 'none' },
}

export const REQUEST_STATUS: Record<string, { label: string; tone: string }> = {
  APPROVED: { label: 'مقبول', tone: 'approved' },
  PENDING: { label: 'قيد المراجعة', tone: 'pending' },
  UNDER_REVIEW: { label: 'قيد المراجعة', tone: 'pending' },
  SENT_FOR_REVIEW: { label: 'قيد المراجعة', tone: 'pending' },
  REJECTED: { label: 'مرفوض', tone: 'changes' },
}

function Person({ name }: { name: string }) {
  return (
    <span className="dr-person">
      <span className="dr-avatar dr-avatar--sm">{name.charAt(0)}</span>
      {name}
    </span>
  )
}

export function RisksTable({
  rows,
  base,
  canOpen,
}: {
  rows: Array<{ key: string; name: string; subtitle: string; impact: string; status: string; responsible: string; updated: string; actions?: ReactNode }>
  base: string
  canOpen: boolean
}) {
  const navigate = useNavigate()
  const [view, setView] = useViewMode('org-project-risks')
  const hasActions = rows.some((row) => row.actions)
  return (
    <div className="dr-tab">
    <div className="rc-view-bar">
      <ViewToggle value={view} onChange={setView} />
    </div>
    {view === 'cards' ? (
      <>
        {rows.length === 0 ? <p className="dr-empty">لا توجد مخاطر بعد</p> : null}
        <RecordCardGrid>
          {rows.map((row) => (
            <RecordCard
              key={row.key}
              title={row.name}
              subtitle={row.subtitle}
              badges={
                <>
                  <ToneBadge meta={RISK_STATUS[row.status.toUpperCase()] ?? { label: row.status, tone: 'none' }} />
                  <ToneBadge meta={LEVEL_META[row.impact.toUpperCase()]} />
                </>
              }
              rows={[
                { label: 'آخر نشاط', value: row.updated },
                { label: 'المسؤول', value: row.responsible },
              ]}
              actions={row.actions}
              linkLabel={canOpen ? 'عرض الخطر' : undefined}
              onOpen={canOpen ? () => navigate(`${base}/${row.key}`) : undefined}
            />
          ))}
        </RecordCardGrid>
      </>
    ) : (
    <div className="dr-table-wrap">
      <table className="dr-table dr-table--center">
        <thead>
          <tr>
            <th>الخطر</th>
            <th>المستوى</th>
            <th>الحالة</th>
            <th>المسؤول</th>
            <th>آخر نشاط</th>
            <th aria-label={canOpen ? 'فتح' : undefined}>{canOpen ? null : hasActions ? 'الإجراء' : null}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="dr-empty">
                لا توجد مخاطر بعد
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.key} className={canOpen ? 'dr-row-link' : undefined} onClick={canOpen ? () => navigate(`${base}/${row.key}`) : undefined}>
              <td className="dr-name">
                {row.name}
                <small>{row.subtitle}</small>
              </td>
              <td>
                <ToneBadge meta={LEVEL_META[row.impact.toUpperCase()]} />
              </td>
              <td>
                <ToneBadge meta={RISK_STATUS[row.status.toUpperCase()] ?? { label: row.status, tone: 'none' }} />
              </td>
              <td>
                <Person name={row.responsible} />
              </td>
              <td>{row.updated}</td>
              <td>{canOpen ? <ChevronLeft size={20} /> : row.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    )}
    </div>
  )
}

export function ChangeRequestsTable({
  rows,
  base,
  canOpen,
}: {
  rows: Array<{ key: string; title: string; submittedBy: string; priority: string; status: string; date: string; actions?: ReactNode }>
  base: string
  canOpen: boolean
}) {
  const navigate = useNavigate()
  const [view, setView] = useViewMode('org-project-change-requests')
  const hasActions = rows.some((row) => row.actions)
  return (
    <div className="dr-tab">
    <div className="rc-view-bar">
      <ViewToggle value={view} onChange={setView} />
    </div>
    {view === 'cards' ? (
      <>
        {rows.length === 0 ? <p className="dr-empty">لا توجد طلبات تغيير بعد</p> : null}
        <RecordCardGrid>
          {rows.map((row) => (
            <RecordCard
              key={row.key}
              title={row.title}
              badges={
                <>
                  <ToneBadge meta={REQUEST_STATUS[row.status.toUpperCase()] ?? { label: row.status, tone: 'none' }} />
                  <ToneBadge meta={LEVEL_META[row.priority.toUpperCase()]} />
                </>
              }
              rows={[
                { label: 'التاريخ', value: row.date },
                { label: 'مقدم الطلب', value: row.submittedBy },
              ]}
              actions={row.actions}
              linkLabel={canOpen ? 'عرض الطلب' : undefined}
              onOpen={canOpen ? () => navigate(`${base}/${row.key}`) : undefined}
            />
          ))}
        </RecordCardGrid>
      </>
    ) : (
    <div className="dr-table-wrap">
      <table className="dr-table dr-table--center">
        <thead>
          <tr>
            <th>عنوان الطلب</th>
            <th>مقدم الطلب</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>التاريخ</th>
            <th aria-label={canOpen ? 'فتح' : undefined}>{canOpen ? null : hasActions ? 'الإجراء' : null}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="dr-empty">
                لا توجد طلبات تغيير بعد
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.key} className={canOpen ? 'dr-row-link' : undefined} onClick={canOpen ? () => navigate(`${base}/${row.key}`) : undefined}>
              <td className="dr-name">{row.title}</td>
              <td>
                <Person name={row.submittedBy} />
              </td>
              <td>
                <ToneBadge meta={LEVEL_META[row.priority.toUpperCase()]} />
              </td>
              <td>
                <ToneBadge meta={REQUEST_STATUS[row.status.toUpperCase()] ?? { label: row.status, tone: 'none' }} />
              </td>
              <td>{row.date}</td>
              <td>{canOpen ? <ChevronLeft size={20} /> : row.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    )}
    </div>
  )
}

const OUTPUT_STATE = {
  done: { label: 'مكتمل', tone: 'approved' },
  active: { label: 'قيد التنفيذ', tone: 'pending' },
  planned: { label: 'مخطط', tone: 'none' },
} as const

type OutputRow = {
  key: string
  name: string
  phase: string
  dueDate: string
  createdAt: string
  status: string
  progress: number
  actions?: ReactNode
}

const outputState = (row: OutputRow) =>
  row.status.toUpperCase() === 'COMPLETED' ? 'done' : row.progress > 0 ? 'active' : 'planned'

/** Deliverables for portals without an approval step: same layout as the organization's tab. */
export function OutputsTab({ rows }: { rows: OutputRow[] }) {
  const [view, setView] = useViewMode('project-outputs')
  const [filter, setFilter] = useState<'all' | keyof typeof OUTPUT_STATE>('all')
  const visible = filter === 'all' ? rows : rows.filter((row) => outputState(row) === filter)
  const hasActions = rows.some((row) => row.actions)
  const chips = [
    ['all', 'الكل', rows.length],
    ...(Object.keys(OUTPUT_STATE) as Array<keyof typeof OUTPUT_STATE>).map(
      (key) => [key, OUTPUT_STATE[key].label, rows.filter((row) => outputState(row) === key).length] as const,
    ),
  ] as Array<readonly ['all' | keyof typeof OUTPUT_STATE, string, number]>
  const stateMeta = (row: OutputRow) => {
    const state = outputState(row)
    return state === 'active' ? { label: `${OUTPUT_STATE.active.label} ${row.progress}%`, tone: 'pending' } : OUTPUT_STATE[state]
  }

  return (
    <div className="dr-tab">
      <div className="dr-chips" role="tablist">
        {chips.map(([key, label, count]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}>
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>
      <div className="rc-view-bar">
        <ViewToggle value={view} onChange={setView} />
      </div>
      {view === 'cards' ? (
        <>
          {visible.length === 0 ? <p className="dr-empty">لا توجد مخرجات بهذه الحالة</p> : null}
          <RecordCardGrid>
            {visible.map((row) => (
              <RecordCard
                key={row.key}
                title={row.name}
                badges={<ToneBadge meta={stateMeta(row)} />}
                rows={[
                  { label: 'المرحلة', value: row.phase },
                  { label: 'تاريخ الاستحقاق', value: row.dueDate },
                  { label: 'تاريخ الإضافة', value: row.createdAt },
                ]}
                actions={row.actions}
              />
            ))}
          </RecordCardGrid>
        </>
      ) : (
        <div className="dr-table-wrap">
          <table className="dr-table">
            <thead>
              <tr>
                <th>اسم المخرج</th>
                <th>المرحلة</th>
                <th>تاريخ الاستحقاق</th>
                <th>تاريخ الإضافة</th>
                <th>الحالة</th>
                {hasActions ? <th>الإجراء</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={hasActions ? 6 : 5} className="dr-empty">
                    لا توجد مخرجات بهذه الحالة
                  </td>
                </tr>
              ) : null}
              {visible.map((row) => (
                <tr key={row.key}>
                  <td className="dr-name">{row.name}</td>
                  <td>{row.phase}</td>
                  <td>{row.dueDate}</td>
                  <td>{row.createdAt}</td>
                  <td>
                    <ToneBadge meta={stateMeta(row)} />
                  </td>
                  {hasActions ? <td>{row.actions}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
