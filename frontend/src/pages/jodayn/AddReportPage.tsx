import { useState } from 'react'
import { Form, Input, InputNumber, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { createReport } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { FormActions, FormPageHeader, FormSection } from '../../components/forms'

type FormValues = {
  type: string
  period?: string
  totalContractsValue?: number
  netProfit?: number
  cashFlowIn?: number
  cashFlowOut?: number
  netCashFlow?: number
  aiInsights?: string
}

export function JodaynAddReportPage() {
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
      await createReport(token, {
        type: values.type,
        period: values.period,
        totalContractsValue: values.totalContractsValue,
        netProfit: values.netProfit,
        cashFlowIn: values.cashFlowIn,
        cashFlowOut: values.cashFlowOut,
        netCashFlow: values.netCashFlow,
        aiInsights: values.aiInsights,
      })
      message.success(t('saveReport'))
      navigate('/jodayn/reports')
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageHeader
      parentLabel={t('financialReports')}
      currentLabel={t('addReportFull')}
      backTo="/jodayn/reports"
      title={t('addReportFull')}
    >
      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        onFinish={onFinish}
      >
        <FormSection title={t('reportBasicInfo')}>
          <div className="form-grid-2">
            <Form.Item label={t('reportType')} name="type" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'EXECUTIVE', label: t('reportExecutive') },
                  { value: 'PROFIT_LOSS', label: t('reportProfitLoss') },
                  { value: 'RISK', label: t('reportRisk') },
                ]}
              />
            </Form.Item>
            <Form.Item label={t('period')} name="period">
              <Input placeholder="2026-Q1" />
            </Form.Item>
          </div>
        </FormSection>

        <FormSection title={t('reportFinancials')}>
          <div className="form-grid-2">
            <Form.Item label={t('totalContractsValue')} name="totalContractsValue">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('netProfit')} name="netProfit">
              <InputNumber className="w-full" />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label={t('cashFlowIn')} name="cashFlowIn">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label={t('cashFlowOut')} name="cashFlowOut">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <Form.Item label={t('netCashFlow')} name="netCashFlow">
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item label={t('aiInsights')} name="aiInsights">
            <Input.TextArea rows={3} />
          </Form.Item>
        </FormSection>

        <FormActions cancelTo="/jodayn/reports" submitLabel={t('saveReport')} loading={submitting} />
      </Form>
    </FormPageHeader>
  )
}
