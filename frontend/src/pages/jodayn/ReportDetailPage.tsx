import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getReport, type FinancialReport } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import { formatAmount } from '../../features/jodayn-finance/FinanceParts'
import cardIcon from '../../features/jodayn-finance/assets/card-icon.svg'
import '../../features/jodayn-finance/jodayn-invoices.css'
import '../../features/jodayn-finance/jodayn-report.css'
import { reportName, reportTypeLabel } from './labels'

function CardIcon({ down = false }: { down?: boolean }) {
  return (
    <span className={`jrep-card__icon${down ? ' jrep-card__icon--down' : ''}`}>
      <img src={cardIcon} alt="" width={22} height={22} />
    </span>
  )
}

function isDown(value?: string | null) {
  return Boolean(value && value.trim().startsWith('-'))
}

/** Single financial report, laid out as the Figma report frame (2293:66744). */
export function JodaynReportDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { reportId } = useParams<{ reportId: string }>()
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(true)
  const isUpper = getJodaynRole() === 'upper'

  useEffect(() => {
    const token = getJodaynToken()
    if (!token || !reportId) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { report: data } = await getReport(token, reportId)
        if (!cancelled) setReport(data)
      } catch (err) {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reportId, t])

  const remove = async () => {
    const token = getJodaynToken()
    if (!token || !report || !window.confirm(`حذف ${title}؟`)) return
    try {
      await deleteJodaynRecord(token, 'reports', report.id)
      message.success(t('deletedSuccessfully'))
      navigate('/jodayn/reports')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  const title = report ? reportName(report.period, reportTypeLabel(report.type, t)) : ''
  const cashIn = Number(report?.cashFlowIn ?? 0)
  const cashOut = Number(report?.cashFlowOut ?? 0)
  const flowMax = Math.max(cashIn, cashOut, 1)
  const variance = Number(report?.budgetVariance ?? 0)

  return (
    <div className="finance-page jinv" dir="rtl">
      <header className="jinv-header">
        <h1 className="jinv-header__title">{t('financialReports')}</h1>
      </header>
      <div className="jinv-body jrep-body">
        {loading ? (
          <p className="jinv-empty">جاري تحميل البيانات...</p>
        ) : !report ? (
          <p className="jinv-empty">لم يتم العثور على التقرير.</p>
        ) : (
          <>
            <div className="jrep-title-row">
              <h2 className="jrep-title">{title}</h2>
              {isUpper ? (
                <button type="button" className="finance-btn finance-btn--danger" onClick={() => void remove()}>
                  {t('delete')}
                </button>
              ) : null}
            </div>
            <div className="jrep-divider" />

            <div className="jrep-cards">
              <div className="jrep-card jrep-card--fixed">
                <div className="jrep-card__top">
                  <CardIcon />
                  <span className="jrep-card__label">إجمالي قيمة العقود</span>
                </div>
                <span className="jrep-card__value">{formatAmount(report.totalContractsValue)}</span>
              </div>
              <div className="jrep-card jrep-card--fixed">
                <div className="jrep-card__top">
                  <CardIcon />
                  <span className="jrep-card__label">صافي الربح</span>
                </div>
                <span className="jrep-card__value">{formatAmount(report.netProfit)}</span>
              </div>
              <div className="jrep-card jrep-card--fixed">
                <div className="jrep-card__top">
                  <CardIcon />
                  <span className="jrep-card__label">انحراف الميزانية</span>
                </div>
                <span className="jrep-card__value" dir="rtl">
                  {`${formatAmount(variance)}%`}
                </span>
              </div>
            </div>

            <section className="jrep-info">
              <span className="jrep-info__title">معلومات أساسية</span>
              <div className="jrep-divider" />
              <div className="jrep-info__content">
                <div className="jrep-info__row">
                  <div className="jrep-flows">
                    <div className="jrep-flow">
                      <span className="jrep-flow__label">الداخل</span>
                      <div className="jrep-flow__track">
                        <div className="jrep-flow__fill" style={{ width: `${(cashIn / flowMax) * 100}%` }} />
                      </div>
                      <span className="jrep-flow__value">{formatAmount(cashIn)}</span>
                    </div>
                    <div className="jrep-flow">
                      <span className="jrep-flow__label">الخارج</span>
                      <div className="jrep-flow__track">
                        <div className="jrep-flow__fill" style={{ width: `${(cashOut / flowMax) * 100}%` }} />
                      </div>
                      <span className="jrep-flow__value">{formatAmount(cashOut)}</span>
                    </div>
                  </div>
                  <div className="jrep-info__sep" />
                  <div className="jrep-net">
                    <span className="jrep-card__label">صافي التدفق النقدي</span>
                    <span className="jrep-card__value">{formatAmount(report.netCashFlow)}</span>
                  </div>
                </div>
                <div className="jrep-divider" />
              </div>
            </section>

            <div className="jrep-cards">
              <div className="jrep-card">
                <span className="jrep-card__label">اتجاه الربح</span>
                <div className="jrep-card__value-row">
                  <CardIcon down={isDown(report.profitTrend)} />
                  <span className="jrep-card__value" dir="ltr">
                    {report.profitTrend || '—'}
                  </span>
                </div>
                <span className="jrep-card__note">مقارنة بالربع السابق</span>
              </div>
              <div className="jrep-card">
                <span className="jrep-card__label">اتجاه الإيرادات</span>
                <div className="jrep-card__value-row">
                  <CardIcon down={isDown(report.revenueTrend)} />
                  <span className="jrep-card__value" dir="ltr">
                    {report.revenueTrend || '—'}
                  </span>
                </div>
                <span className="jrep-card__note">مقارنة بالربع السابق</span>
              </div>
              <div className="jrep-card">
                <span className="jrep-card__label">مقارنة إيرادات القطاع</span>
                <div className="jrep-card__value-row">
                  <CardIcon />
                  <span className="jrep-card__value">{report.sectorRevenueComparison || '—'}</span>
                </div>
                <span className="jrep-card__note">من متوسط أداء القطاع</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
