import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getForecast, type RevenueForecast } from '../../api/jodayn'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import { formatAmount } from '../../features/jodayn-finance/FinanceParts'
import gpsIcon from '../../features/jodayn-finance/assets/gps-24.svg'
import riseGreen from '../../features/jodayn-finance/assets/arrow-rise-green.svg'
import riseOrange from '../../features/jodayn-finance/assets/arrow-rise-orange.svg'
import riseRed from '../../features/jodayn-finance/assets/arrow-rise-red.svg'
import checkGreen from '../../features/jodayn-finance/assets/badge-check-green.svg'
import checkOrange from '../../features/jodayn-finance/assets/badge-check-orange.svg'
import checkRed from '../../features/jodayn-finance/assets/badge-check-red.svg'
import '../../features/jodayn-finance/jodayn-invoices.css'
import '../../features/jodayn-finance/jodayn-report.css'
import { periodName } from './labels'

function dmy(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="jfc-info__item">
      <img src={gpsIcon} alt="" width={24} height={24} />
      <div className="jfc-info__text">
        <span className="jfc-info__label">{label}</span>
        <span className="jfc-info__value">{value}</span>
      </div>
    </div>
  )
}

function ScenarioCard({
  label,
  value,
  probability,
  tone,
}: {
  label: string
  value: number | string
  probability: number | string | undefined
  tone: 'green' | 'orange' | 'red'
}) {
  const icons = {
    green: { rise: riseGreen, check: checkGreen },
    orange: { rise: riseOrange, check: checkOrange },
    red: { rise: riseRed, check: checkRed },
  }[tone]
  return (
    <div className="jfc-card">
      <div className="jfc-card__row jfc-card__row--top">
        <span className="jfc-card__label">{label}</span>
        <span className={`jfc-trend jfc--${tone}${tone === 'red' ? ' jfc-trend--down' : ''}`}>
          <img src={icons.rise} alt="" width={24} height={24} />
        </span>
      </div>
      <div className="jfc-card__row">
        <span className="jfc-card__value">{formatAmount(value)}</span>
        <span className={`jfc-badge jfc--${tone}`}>
          {`احتمالية ${formatAmount(probability ?? 0)}%`}
          <img src={icons.check} alt="" width={16} height={16} />
        </span>
      </div>
    </div>
  )
}

/** One revenue forecast, laid out as the Figma forecast frame (2311:67616). */
export function JodaynForecastDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { forecastId } = useParams<{ forecastId: string }>()
  const [forecast, setForecast] = useState<RevenueForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const isUpper = getJodaynRole() === 'upper'

  useEffect(() => {
    const token = getJodaynToken()
    if (!token || !forecastId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getForecast(token, forecastId)
      .then(({ forecast: data }) => {
        if (!cancelled) setForecast(data)
      })
      .catch((err) => {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [forecastId, t])

  const title = forecast ? `توقع إيرادات ${periodName(forecast.quarter)}` : ''
  const start = dmy(forecast?.dateRangeStart)
  const end = dmy(forecast?.dateRangeEnd)

  const remove = async () => {
    const token = getJodaynToken()
    if (!token || !forecast || !window.confirm(`حذف ${title}؟`)) return
    try {
      await deleteJodaynRecord(token, 'forecasts', forecast.id)
      message.success(t('deletedSuccessfully'))
      navigate('/jodayn/forecasts')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  return (
    <div className="finance-page jinv" dir="rtl">
      <header className="jinv-header">
        <h1 className="jinv-header__title">{t('revenueForecasts')}</h1>
      </header>
      <div className="jinv-body jrep-body">
        {loading ? (
          <p className="jinv-empty">جاري تحميل البيانات...</p>
        ) : !forecast ? (
          <p className="jinv-empty">لم يتم العثور على التوقع.</p>
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

            <section className="jfc-info">
              <InfoItem label="الجهة" value={forecast.branchFilter || '—'} />
              <InfoItem label="الفترة" value={start && end ? `${start} - ${end}` : '—'} />
              <InfoItem label="الربع" value={`${periodName(forecast.quarter)} ${forecast.year}`} />
            </section>

            <div className="jrep-cards">
              <ScenarioCard
                label="سيناريو متشائم"
                value={forecast.pessimisticValue}
                probability={forecast.pessimisticProbability}
                tone="red"
              />
              <ScenarioCard
                label="سيناريو متحفظ"
                value={forecast.conservativeValue}
                probability={forecast.conservativeProbability}
                tone="orange"
              />
              <ScenarioCard
                label="سيناريو متفائل"
                value={forecast.optimisticValue}
                probability={forecast.optimisticProbability}
                tone="green"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
