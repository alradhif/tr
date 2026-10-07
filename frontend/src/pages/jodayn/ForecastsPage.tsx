import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getForecasts } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceCreateButton,
  FinanceDetails,
  FinanceGenerator,
  FinancePage,
  FinanceRow,
  FinanceTable,
  FinanceTabs,
  formatAmount,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'
import { periodLabel, periodName } from './labels'

type ForecastRow = {
  key: string
  name: string
  period: string
  entity: string
  expected: number
  actual: number
  optimistic: number
  pessimistic: number
  achieved: boolean
}

const PERIOD_START: Record<string, number> = { Q1: 1, H1: 1, Q2: 4, Q3: 7, H2: 7, Q4: 10 }

/** Chronological order: by year, then by the month the quarter / half starts. */
function byPeriod(a: { year: number; quarter: string }, b: { year: number; quarter: string }) {
  return a.year - b.year || (PERIOD_START[a.quarter] ?? 13) - (PERIOD_START[b.quarter] ?? 13)
}

/** A forecast counts as achieved once actual revenue reaches 90% of the expected (conservative) value. */
const ACHIEVED_RATIO = 0.9

export function JodaynForecastsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<FinanceView>('list')
  const [rows, setRows] = useState<ForecastRow[]>([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState<ForecastRow | null>(null)
  const isUpper = getJodaynRole() === 'upper'

  useEffect(() => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { forecasts } = await getForecasts(token)
        if (cancelled) return
        setRows(
          [...forecasts].sort(byPeriod).map((f) => {
            const expected = Number(f.conservativeValue ?? 0)
            const actual = Number(f.actualValue ?? 0)
            return {
              key: f.id,
              name: `توقع إيرادات ${periodName(f.quarter)}`,
              period: periodLabel(f.quarter, f.year),
              entity: f.branchFilter || '—',
              expected,
              actual,
              optimistic: Number(f.optimisticValue ?? 0),
              pessimistic: Number(f.pessimisticValue ?? 0),
              achieved: expected > 0 && actual >= expected * ACHIEVED_RATIO,
            }
          }),
        )
      } catch (err) {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const remove = async (row: ForecastRow) => {
    const token = getJodaynToken()
    if (!token || !window.confirm(`حذف ${row.name}؟`)) return
    try {
      await deleteJodaynRecord(token, 'forecasts', row.key)
      setOpened(null)
      setRows((current) => current.filter((item) => item.key !== row.key))
      message.success(t('deletedSuccessfully'))
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  const expected = rows.reduce((sum, row) => sum + row.expected, 0)
  const actual = rows.reduce((sum, row) => sum + row.actual, 0)
  const percent = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0

  return (
    <FinancePage title={t('revenueForecasts')}>
      <FinanceTabs
        active={view}
        onChange={setView}
        extra={<FinanceCreateButton label={t('addForecast')} onClick={() => navigate('/jodayn/forecasts/new')} />}
      />

      {view === 'generator' ? (
        <FinanceGenerator
          title="مولّد العروض التقديمية - توقعات الإيرادات"
          data={
            rows[0]
              ? {
                  project: {
                    name: 'توقعات الإيرادات',
                    code: rows[0].period,
                    department: 'توقعات الإيرادات — جودين',
                    projectManager: '—',
                    sponsor: '—',
                    statusLabel: `${rows.length} توقع`,
                    budget: expected,
                    spent: actual,
                    budgetCurrency: 'SAR',
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.name} — ${r.entity} — ${formatAmount(r.actual)} من ${formatAmount(r.expected)}`),
                  sourceLabel: `بيانات حية — ${rows.length} توقع`,
                }
              : null
          }
        />
      ) : (
        <>
          <div className="finance-cards">
            <div className="finance-card finance-card--plain">
              <div className="finance-card__top">
                <span className="finance-card__label">إجمالي الإيرادات المتوقعة للفترة الحالية</span>
              </div>
              <div className="finance-card__value-row">
                <span className="finance-card__value" style={{ marginTop: 0 }}>
                  {formatAmount(expected)}
                </span>
                <span className="finance-card__unit">ريال</span>
              </div>
            </div>

            <div className="finance-card finance-card--plain">
              <div className="finance-card__top">
                <span className="finance-card__label">الإيراد الفعلي المحقق حتى الآن</span>
              </div>
              <div className="finance-card__value-row">
                <span className="finance-card__value" style={{ marginTop: 0 }}>
                  {formatAmount(actual)}
                </span>
                <span className="finance-card__unit">ريال</span>
              </div>
            </div>

            <div className="finance-card finance-card--plain">
              <div className="finance-card__top">
                <span className="finance-card__label">الميزانية</span>
              </div>
              <div className="finance-budget__row finance-budget__row--legend">
                <span className="finance-budget__legend-expected">المتوقع</span>
                <span className="finance-budget__legend-actual">الفعلي</span>
              </div>
              <div className="finance-budget__track">
                <div className="finance-budget__fill" style={{ width: `${percent}%` }} />
              </div>
              <div className="finance-budget__row finance-budget__row--values">
                <span className="finance-budget__value">{formatAmount(expected)}</span>
                <span className="finance-budget__value">{formatAmount(actual)}</span>
              </div>
            </div>
          </div>

          <FinanceTable
            headers={['اسم', 'الفترة الزمنية', 'الجهة', 'الإيراد المتوقع', 'الإيراد الفعلي المحقق', 'الحالة']}
            loading={loading}
            empty={rows.length === 0}
          >
            {rows.map((row) => (
              <FinanceRow key={row.key} onOpen={() => setOpened(row)}>
                <td>{row.name}</td>
                <td className="finance-muted">{row.period}</td>
                <td>{row.entity}</td>
                <td>{formatAmount(row.expected)}</td>
                <td>{formatAmount(row.actual)}</td>
                <td>
                  <span className="finance-status finance-status--active">
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                    {row.achieved ? 'محقق' : 'قيد التحقيق'}
                  </span>
                </td>
              </FinanceRow>
            ))}
          </FinanceTable>
          {opened ? (
            <FinanceDetails
              title={opened.name}
              onClose={() => setOpened(null)}
              fields={[
                { label: 'الفترة الزمنية', value: opened.period },
                { label: 'الجهة', value: opened.entity },
                { label: 'الإيراد المتوقع (متحفظ)', value: formatAmount(opened.expected) },
                { label: 'الإيراد الفعلي المحقق', value: formatAmount(opened.actual) },
                { label: t('optimisticValue'), value: formatAmount(opened.optimistic) },
                { label: t('pessimisticValue'), value: formatAmount(opened.pessimistic) },
                { label: 'الحالة', value: opened.achieved ? 'محقق' : 'قيد التحقيق' },
              ]}
              actions={
                isUpper ? (
                  <button type="button" className="finance-btn finance-btn--danger" onClick={() => void remove(opened)}>
                    {t('delete')}
                  </button>
                ) : null
              }
            />
          ) : null}
        </>
      )}
    </FinancePage>
  )
}
