import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteJodaynRecord, getInvoice, getInvoices, updateInvoice, type Invoice } from '../../api/jodayn'
import { downloadCsv } from '../../api/me'
import { getJodaynRole, getJodaynToken } from '../../auth/jodaynAuth'
import { formatAmount } from '../../features/jodayn-finance/FinanceParts'
import arrowRightIcon from '../../features/jodayn-finance/assets/arrow-right.svg'
import documentTextIcon from '../../features/jodayn-finance/assets/document-text.svg'
import gpsIcon from '../../features/jodayn-finance/assets/gps.svg'
import note2Icon from '../../features/jodayn-finance/assets/note-2.svg'
import note3Icon from '../../features/jodayn-finance/assets/note-3.svg'
import calendarIcon from '../../features/jodayn-finance/assets/calendar-2.svg'
import taskSquareIcon from '../../features/jodayn-finance/assets/task-square.svg'
import downloadIcon from '../../features/jodayn-finance/assets/download.svg'
import checkBlueIcon from '../../features/jodayn-finance/assets/check-circle-blue.svg'
import checkGreenIcon from '../../features/jodayn-finance/assets/check-circle-green.svg'
import dangerIcon from '../../features/jodayn-finance/assets/danger-triangle.svg'
import '../../features/jodayn-finance/jodayn-invoices.css'
import '../../features/jodayn-finance/jodayn-detail.css'

const ASSET_STATUS: Record<string, string> = { PAID: 'نشط', PENDING: 'معلق', OVERDUE: 'متأخر', CANCELLED: 'ملغى' }

const PAYMENT_STATUS: Record<string, { label: string; tone: string; icon: string }> = {
  PAID: { label: 'مدفوع', tone: 'green', icon: checkGreenIcon },
  OVERDUE: { label: 'متأخر', tone: 'red', icon: dangerIcon },
  PENDING: { label: 'معلق', tone: 'orange', icon: dangerIcon },
  CANCELLED: { label: 'ملغى', tone: 'red', icon: dangerIcon },
}

function cycleLabel(inv: Invoice) {
  if (inv.billingCycle === 'MONTHLY') return 'شهري'
  if (inv.billingCycle === 'ANNUAL') return 'سنوي'
  return 'أصل ثابت'
}

function arabicDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { day: '2-digit', month: 'long', year: 'numeric' })
}

function shortDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB')
}

function Item({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="jdet-item">
      <img src={icon} alt="" width={24} height={24} />
      <div className="jdet-item__text">
        <span className="jdet-item__label">{label}</span>
        <span className="jdet-item__value">{value}</span>
      </div>
    </div>
  )
}

/** One invoice (asset), laid out as the Figma invoice frame (2314:121570). */
export function JodaynInvoiceDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [all, setAll] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const isUpper = getJodaynRole() === 'upper'

  const load = useCallback(async () => {
    const token = getJodaynToken()
    if (!token || !invoiceId) {
      setLoading(false)
      return
    }
    try {
      const [{ invoice: data }, { invoices }] = await Promise.all([getInvoice(token, invoiceId), getInvoices(token)])
      setInvoice(data)
      setAll(invoices)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [invoiceId, t])

  useEffect(() => {
    void load()
  }, [load])

  // Payment history: every invoice billed for the same asset (same serial number), newest first.
  const history = useMemo(() => {
    if (!invoice) return []
    const sameAsset = invoice.contractReference
      ? all.filter((inv) => inv.contractReference === invoice.contractReference)
      : [invoice]
    return [...sameAsset].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
  }, [all, invoice])

  const paidTotal = history.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
  const startDate = history.length ? history[history.length - 1].issueDate : invoice?.issueDate

  const act = async (action: (token: string) => Promise<unknown>, done: string, after?: () => void) => {
    const token = getJodaynToken()
    if (!token) return
    setBusy(true)
    try {
      await action(token)
      message.success(done)
      if (after) after()
      else await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setBusy(false)
    }
  }

  const exportRow = (inv: Invoice) =>
    downloadCsv(
      `${inv.invoiceNumber}.csv`,
      [
        ['invoiceNumber', 'رقم الفاتورة'],
        ['projectName', 'الأصل'],
        ['contractReference', 'الرقم التسلسلي'],
        ['clientName', 'الجهة المرتبطة'],
        ['amount', 'المبلغ'],
        ['totalWithVat', 'الإجمالي مع الضريبة'],
        ['status', 'الحالة'],
        ['issueDate', 'تاريخ الإصدار'],
      ],
      [{ ...inv, status: PAYMENT_STATUS[inv.status]?.label ?? inv.status, issueDate: shortDate(inv.issueDate) }],
    )

  const assetName = invoice?.projectName || invoice?.invoiceNumber || ''

  return (
    <div className="finance-page jinv" dir="rtl">
      <header className="jinv-header">
        <h1 className="jdet-crumb">
          <button type="button" className="jdet-crumb__back" aria-label="رجوع" onClick={() => navigate('/jodayn/invoices')}>
            <img src={arrowRightIcon} alt="" width={24} height={24} />
          </button>
          {invoice ? `فاتورة ${assetName}` : t('invoices')}
        </h1>
      </header>
      <div className="jinv-body">
        {loading ? (
          <p className="jinv-empty">جاري تحميل البيانات...</p>
        ) : !invoice ? (
          <p className="jinv-empty">لم يتم العثور على الفاتورة.</p>
        ) : (
          <>
            <div className="jdet-head">
              <h2 className="jdet-title">{assetName}</h2>
              <div className="jdet-sub">
                <span>{`الرقم التسلسلي: ${invoice.contractReference || '—'}   ·`}</span>
                <span className="jdet-badge jdet-badge--blue">
                  {ASSET_STATUS[invoice.status] ?? invoice.status}
                  <img src={checkBlueIcon} alt="" width={16} height={16} />
                </span>
              </div>
              <div className="jdet-divider" />
            </div>

            <section className="jdet-card jdet-split">
              <div className="jdet-section">
                <div className="jdet-section__head">
                  <span className="jdet-section__logo">
                    <img src={documentTextIcon} alt="" width={24} height={24} />
                  </span>
                  <h3 className="jdet-section__title">تفاصيل الاشتراك</h3>
                </div>
                <div className="jdet-row">
                  <Item icon={note2Icon} label="دورة الفوترة" value={cycleLabel(invoice)} />
                  <Item icon={taskSquareIcon} label="التجديد التلقائي" value={invoice.autoRenew ? 'مفعل' : 'غير مفعل'} />
                </div>
                <div className="jdet-row">
                  <Item icon={calendarIcon} label="تاريخ بداية الاشتراك" value={arabicDate(startDate)} />
                  <Item icon={note3Icon} label="المسؤول عن الأصل" value={invoice.assetOwner || '—'} />
                </div>
              </div>
              <div className="jdet-split__sep" />
              <div className="jdet-section">
                <div className="jdet-section__head">
                  <span className="jdet-section__logo">
                    <img src={documentTextIcon} alt="" width={24} height={24} />
                  </span>
                  <h3 className="jdet-section__title">المورد والفاتورة</h3>
                </div>
                <div className="jdet-row">
                  <Item icon={note2Icon} label="الجهة المرتبطة (المورد)" value={invoice.clientName} />
                  <Item icon={gpsIcon} label="المدينة" value={invoice.region || '—'} />
                </div>
                <div className="jdet-row">
                  <Item icon={calendarIcon} label="رقم الفاتورة الحالية" value={invoice.invoiceNumber} />
                  <Item icon={note3Icon} label="إجمالي المدفوع حتى الآن" value={`${formatAmount(paidTotal)} ريال`} />
                </div>
              </div>
            </section>

            <section className="jdet-card">
              <h3 className="jdet-table-title">سجل آخر الدفعات</h3>
              <div className="jdet-table-wrap">
                <table className="jdet-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>رقم الفاتورة</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                      <th>المرفقات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((inv) => {
                      const status = PAYMENT_STATUS[inv.status] ?? PAYMENT_STATUS.PENDING
                      return (
                        <tr key={inv.id}>
                          <td className="jdet-muted">{shortDate(inv.issueDate)}</td>
                          <td>{inv.invoiceNumber}</td>
                          <td>{formatAmount(inv.amount)}</td>
                          <td>
                            <span className={`jdet-badge jdet-badge--${status.tone}`}>
                              {status.label}
                              <img src={status.icon} alt="" width={16} height={16} />
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="jdet-icon-btn"
                              aria-label={`تنزيل ${inv.invoiceNumber}`}
                              onClick={() => exportRow(inv)}
                            >
                              <img src={downloadIcon} alt="" width={24} height={24} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="jdet-actions">
              <button
                type="button"
                className="jdet-btn jdet-btn--dark"
                disabled={busy}
                onClick={() => navigate(`/jodayn/invoices/${invoice.id}/edit`)}
              >
                تعديل السجل
              </button>
              {invoice.billingCycle && invoice.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  className="jdet-btn jdet-btn--outline"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`إلغاء اشتراك ${assetName}؟`)) return
                    void act(
                      (token) => updateInvoice(token, invoice.id, { status: 'CANCELLED', autoRenew: false }),
                      'تم إلغاء الاشتراك',
                    )
                  }}
                >
                  إلغاء الإشتراك
                </button>
              ) : null}
              {isUpper ? (
                <button
                  type="button"
                  className="jdet-btn jdet-btn--danger"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`حذف الفاتورة ${invoice.invoiceNumber}؟`)) return
                    void act(
                      (token) => deleteJodaynRecord(token, 'invoices', invoice.id),
                      t('deletedSuccessfully'),
                      () => navigate('/jodayn/invoices'),
                    )
                  }}
                >
                  {t('delete')}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
