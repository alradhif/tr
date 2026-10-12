import { useEffect, useState } from 'react'
import { DatePicker, Form, Input, InputNumber, Select, Switch, message } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { createInvoice, getInvoice, updateInvoice } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { FormActions, FormPageHeader, FormSection } from '../../components/forms'

type FormValues = {
  invoiceNumber: string
  clientName: string
  projectName?: string
  contractReference?: string
  region?: string
  billingCycle?: 'FIXED' | 'MONTHLY' | 'ANNUAL'
  autoRenew?: boolean
  assetOwner?: string
  amount: number
  status?: string
  issueDate: { toISOString?: () => string } | string
  dueDate: { toISOString?: () => string } | string
}

function toDateString(value: FormValues['issueDate']) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.toISOString?.()
}

/** Add an invoice, or edit one when opened at /jodayn/invoices/:invoiceId/edit. */
export function JodaynAddInvoicePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const editing = Boolean(invoiceId)
  const backTo = editing ? `/jodayn/invoices/${invoiceId}` : '/jodayn/invoices'
  const heading = editing ? 'تعديل السجل' : t('addInvoiceFull')

  useEffect(() => {
    const token = getJodaynToken()
    if (!token || !invoiceId) return
    getInvoice(token, invoiceId)
      .then(({ invoice }) => {
        form.setFieldsValue({
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          projectName: invoice.projectName ?? undefined,
          contractReference: invoice.contractReference ?? undefined,
          region: invoice.region ?? undefined,
          billingCycle: invoice.billingCycle ?? 'FIXED',
          autoRenew: Boolean(invoice.autoRenew),
          assetOwner: invoice.assetOwner ?? undefined,
          amount: Number(invoice.amount),
          status: invoice.status,
          issueDate: dayjs(invoice.issueDate) as unknown as FormValues['issueDate'],
          dueDate: dayjs(invoice.dueDate) as unknown as FormValues['dueDate'],
        })
      })
      .catch((err) => message.error(err instanceof ApiError ? err.message : t('loadError')))
  }, [form, invoiceId, t])

  const onFinish = async (values: FormValues) => {
    const token = getJodaynToken()
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        invoiceNumber: values.invoiceNumber,
        clientName: values.clientName,
        projectName: values.projectName,
        contractReference: values.contractReference,
        region: values.region,
        billingCycle: values.billingCycle === 'FIXED' ? null : values.billingCycle,
        autoRenew: Boolean(values.autoRenew),
        assetOwner: values.assetOwner,
        amount: values.amount,
        status: values.status,
        issueDate: toDateString(values.issueDate),
        dueDate: toDateString(values.dueDate),
      }
      if (invoiceId) await updateInvoice(token, invoiceId, payload)
      else await createInvoice(token, payload)
      message.success(t('saveInvoice'))
      navigate(backTo)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageHeader
      parentLabel={t('invoices')}
      currentLabel={heading}
      backTo={backTo}
      title={heading}
    >
      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        form={form}
        onFinish={onFinish}
      >
        <FormSection title={t('invoiceBasicInfo')}>
          <div className="form-grid-2">
            <Form.Item label={t('invoiceNumber')} name="invoiceNumber" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={t('clientName')} name="clientName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label="الأصل" name="projectName">
              <Input />
            </Form.Item>
            <Form.Item label="الرقم التسلسلي" name="contractReference">
              <Input placeholder="SRV-2026-001" />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label="النوع" name="billingCycle" initialValue="FIXED">
              <Select
                options={[
                  { value: 'FIXED', label: 'أصل ثابت' },
                  { value: 'MONTHLY', label: 'إشتراك شهري' },
                  { value: 'ANNUAL', label: 'إشتراك سنوي' },
                ]}
              />
            </Form.Item>
            <Form.Item label="المنطقة" name="region">
              <Input />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label="المسؤول عن الأصل" name="assetOwner">
              <Input />
            </Form.Item>
            <Form.Item label="التجديد التلقائي" name="autoRenew" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label={t('amount')} name="amount" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('status')} name="status" initialValue="PENDING">
              <Select
                options={[
                  { value: 'PENDING', label: t('pendingInvoices') },
                  { value: 'PAID', label: t('paidInvoices') },
                  { value: 'OVERDUE', label: t('overdueInvoices') },
                  ...(editing ? [{ value: 'CANCELLED', label: 'ملغاة' }] : []),
                ]}
              />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label={t('issueDate')} name="issueDate" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('dueDate')} name="dueDate" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
        </FormSection>

        <FormActions cancelTo={backTo} submitLabel={t('saveInvoice')} loading={submitting} />
      </Form>
    </FormPageHeader>
  )
}
