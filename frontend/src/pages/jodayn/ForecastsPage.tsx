import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getForecasts } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import {
  FinanceAmountStats,
  FinanceGenerator,
  FinanceHead,
  FinancePage,
  FinanceTable,
  FinanceTabs,
  formatAmount,
  type FinanceView,
} from '../../features/jodayn-finance/FinanceParts'

type ForecastRow = {
  key: string
  quarter: string
  year: number
  optimisticValue: number
  pessimisticValue: number
  conservativeValue: number
  branchFilter: string
}

export function JodaynForecastsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<FinanceView>('list')
  const [rows, setRows] = useState<ForecastRow[]>([])
  const [loading, setLoading] = useState(true)
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
          forecasts.map((f) => ({
            key: f.id,
            quarter: f.quarter,
            year: f.year,
            optimisticValue: Number(f.optimisticValue ?? 0),
            pessimisticValue: Number(f.pessimisticValue ?? 0),
            conservativeValue: Number(f.conservativeValue ?? 0),
            branchFilter: f.branchFilter || 'كل الفروع',
          })),
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
    if (!token || !window.confirm(`حذف توقع ${row.quarter} ${row.year}؟`)) return
    try {
      await deleteJodaynRecord(token, 'forecasts', row.key)
      setRows((current) => current.filter((item) => item.key !== row.key))
      message.success(t('deletedSuccessfully'))
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  const sum = (pick: (row: ForecastRow) => number) => rows.reduce((total, row) => total + pick(row), 0)
  const optimistic = sum((r) => r.optimisticValue)
  const conservative = sum((r) => r.conservativeValue)
  const pessimistic = sum((r) => r.pessimisticValue)

  return (
    <FinancePage title={t('revenueForecasts')}>
      <FinanceHead
        title={t('revenueForecasts')}
        subtitle="سيناريوهات الإيرادات المتوقعة لكل ربع"
        createLabel={t('addForecast')}
        onCreate={() => navigate('/jodayn/forecasts/new')}
      />
      <FinanceTabs active={view} onChange={setView} />

      {view === 'generator' ? (
        <FinanceGenerator
          title="مولّد العروض التقديمية - توقعات الإيرادات"
          data={
            rows[0]
              ? {
                  project: {
                    name: 'توقعات الإيرادات',
                    code: `${rows[0].quarter}-${rows[0].year}`,
                    department: 'توقعات الإيرادات — جودين',
                    projectManager: '—',
                    sponsor: '—',
                    statusLabel: `${rows.length} توقع`,
                    budget: conservative,
                    budgetCurrency: 'SAR',
                  },
                  outputs: rows.slice(0, 4).map((r) => `${r.quarter} ${r.year} — متحفظ ${formatAmount(r.conservativeValue)}`),
                  scenarios: [
                    `السيناريو المتفائل: ${formatAmount(optimistic)} ريال`,
                    `السيناريو المتحفظ: ${formatAmount(conservative)} ريال`,
                    `السيناريو المتشائم: ${formatAmount(pessimistic)} ريال`,
                  ],
                  sourceLabel: `بيانات حية — ${rows.length} توقع`,
                }
              : null
          }
        />
      ) : (
        <>
          <FinanceAmountStats
            cards={[
              { label: 'إجمالي الإيرادات المتوقعة (متحفظ)', value: formatAmount(conservative), unit: 'ريال' },
              { label: 'السيناريو المتفائل', value: formatAmount(optimistic), unit: 'ريال' },
              { label: 'السيناريو المتشائم', value: formatAmount(pessimistic), unit: 'ريال' },
            ]}
          />
          <FinanceTable
            headers={[
              'الفترة الزمنية',
              'الفرع',
              t('optimisticValue'),
              t('conservativeValue'),
              t('pessimisticValue'),
              ...(isUpper ? [''] : []),
            ]}
            loading={loading}
            empty={rows.length === 0}
          >
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{`${row.quarter} ${row.year}`}</td>
                <td className="finance-muted">{row.branchFilter}</td>
                <td>{formatAmount(row.optimisticValue)}</td>
                <td>{formatAmount(row.conservativeValue)}</td>
                <td>{formatAmount(row.pessimisticValue)}</td>
                {isUpper ? (
                  <td>
                    <span className="finance-actions">
                      <button type="button" className="is-danger" onClick={() => void remove(row)}>
                        {t('delete')}
                      </button>
                    </span>
                  </td>
                ) : null}
              </tr>
            ))}
          </FinanceTable>
        </>
      )}
    </FinancePage>
  )
}
