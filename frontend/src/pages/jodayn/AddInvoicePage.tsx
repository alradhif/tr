import { useState } from 'react'
import { DatePicker, Form, Input, InputNumber, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { createInvoice } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { FormActions, FormPageHeader, FormSection } from '../../components/forms'

type FormValues = {
  invoiceNumber: string
  clientName: string
  projectName?: string
  contractReference?: string
  region?: string
  billingCycle?: 'FIXED' | 'MONTHLY' | 'ANNUAL'
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

export function JodaynAddInvoicePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: FormValues) => {
    const token = getJodaynToken()
    if (!token) {
      message.error(t('loadError'))
      return
    }
    setSubmitting(true)
    try {
      await createInvoice(token, {
        invoiceNumber: values.invoiceNumber,
        clientName: values.clientName,
        projectName: values.projectName,
        contractReference: values.contractReference,
        region: values.region,
        billingCycle: values.billingCycle === 'FIXED' ? null : values.billingCycle,
        amount: values.amount,
        status: values.status,
        issueDate: toDateString(values.issueDate),
        dueDate: toDateString(values.dueDate),
      })
      message.success(t('saveInvoice'))
      navigate('/jodayn/invoices')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageHeader
      parentLabel={t('invoices')}
      currentLabel={t('addInvoiceFull')}
      backTo="/jodayn/invoices"
      title={t('addInvoiceFull')}
    >
      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
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
            <Form.Item label={t('amount')} name="amount" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('status')} name="status" initialValue="PENDING">
              <Select
                options={[
                  { value: 'PENDING', label: t('pendingInvoices') },
                  { value: 'PAID', label: t('paidInvoices') },
                  { value: 'OVERDUE', label: t('overdueInvoices') },
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

        <FormActions cancelTo="/jodayn/invoices" submitLabel={t('saveInvoice')} loading={submitting} />
      </Form>
    </FormPageHeader>
  )
}
