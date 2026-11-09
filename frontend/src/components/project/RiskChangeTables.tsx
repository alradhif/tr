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
  rows: Array<{ key: string; name: string; subtitle: string; impact: string; status: string; responsible: string; updated: string }>
  base: string
  canOpen: boolean
}) {
  const navigate = useNavigate()
  const [view, setView] = useViewMode('org-project-risks')
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
            <th aria-label="فتح" />
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
              <td>{canOpen ? <ChevronLeft size={20} /> : null}</td>
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
  rows: Array<{ key: string; title: string; submittedBy: string; priority: string; status: string; date: string }>
  base: string
  canOpen: boolean
}) {
  const navigate = useNavigate()
  const [view, setView] = useViewMode('org-project-change-requests')
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
            <th aria-label="فتح" />
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
              <td>{canOpen ? <ChevronLeft size={20} /> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    )}
    </div>
  )
}
