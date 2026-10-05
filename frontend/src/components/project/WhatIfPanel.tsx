import { DatePicker, Form, InputNumber, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { EmptyState, Panel, PrimaryButton } from '../ui'

export type WhatIfPanelProps = {
  deliverableOptions?: Array<{ value: string; label: string }>
  onAdd?: () => void
}

export function WhatIfPanel({ deliverableOptions = [], onAdd }: WhatIfPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="whatif-panel">
      <Panel>
        <h3>{t('delayAnalysis')}</h3>
        <Form layout="vertical" requiredMark={false} className="whatif-form" onFinish={() => undefined}>
          <Form.Item label={t('projectDeliverable')} name="deliverable">
            <Select
              options={deliverableOptions}
              placeholder={t('chooseDeliverable')}
              allowClear
            />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label={t('currentEndDate')} name="currentEndDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('newEndDate')} name="newEndDate">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="form-grid-3">
            <Form.Item label={t('originalDuration')} name="originalDuration">
              <InputNumber className="w-full" min={0} addonAfter={t('days')} />
            </Form.Item>
            <Form.Item label={t('newDuration')} name="newDuration">
              <InputNumber className="w-full" min={0} addonAfter={t('days')} />
            </Form.Item>
            <Form.Item label={t('delayDays')} name="delayDays">
              <InputNumber className="w-full" min={0} addonAfter={t('days')} />
            </Form.Item>
          </div>
          <div className="tab-toolbar">
            {onAdd ? (
              <PrimaryButton type="default" htmlType="button" onClick={onAdd}>
                {t('addScenario')}
              </PrimaryButton>
            ) : null}
            <PrimaryButton htmlType="submit">{t('analyzeImpact')}</PrimaryButton>
          </div>
        </Form>
      </Panel>

      <div className="whatif-panel__grid">
        <Panel>
          <h3>{t('impactOnSchedule')}</h3>
          <div className="sa-panel--empty sa-panel--list">
            <EmptyState />
          </div>
        </Panel>
        <Panel>
          <h3>{t('impactOnCost')}</h3>
          <div className="sa-panel--empty sa-panel--list">
            <EmptyState />
          </div>
        </Panel>
      </div>

      <Panel>
        <h3>{t('aiRecommendations')}</h3>
        <div className="sa-panel--empty sa-panel--list">
          <EmptyState />
        </div>
      </Panel>
    </div>
  )
}
