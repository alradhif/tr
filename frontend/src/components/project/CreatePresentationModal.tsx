import { useState } from 'react'
import { Form, Input, Modal, Radio } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { PptGeneratorFrame, type PptBridgePayload } from '../../features/portal/PptGeneratorFrame'
import { PrimaryButton } from '../ui'

export type CreatePresentationModalProps = {
  open: boolean
  onClose: () => void
  data?: PptBridgePayload | null
}

export function CreatePresentationModal({ open, onClose, data }: CreatePresentationModalProps) {
  const { t } = useTranslation()
  const [showGenerator, setShowGenerator] = useState(false)
  const [starting, setStarting] = useState(false)
  const [options, setOptions] = useState<{ title?: string; mode?: 'auto' | 'manual'; notes?: string }>({})

  const close = () => {
    setShowGenerator(false)
    setStarting(false)
    setOptions({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      centered
      width={showGenerator ? 960 : 560}
      className="tp-modal"
      destroyOnHidden
    >
      {showGenerator ? (
        <PptGeneratorFrame
          title={t('generatePresentation')}
          data={data ? { ...data, deckTitle: options.title, mode: options.mode, notes: options.notes } : data}
        />
      ) : (
        <>
          <div className="tp-modal__header">
            <h2>{t('createPresentation')}</h2>
            <span className="tp-modal__icon">
              <FileTextOutlined />
            </span>
          </div>

          <Form
            layout="vertical"
            requiredMark={false}
            className="tp-modal__form"
            onFinish={(values: { title?: string; mode?: 'auto' | 'manual'; notes?: string }) => {
              if (starting) return
              setStarting(true)
              setOptions({ title: values.title?.trim(), mode: values.mode, notes: values.notes?.trim() })
              setShowGenerator(true)
            }}
            initialValues={{ mode: 'auto', title: data?.project?.name }}
          >
            <Form.Item label={t('presentationTitle')} name="title" rules={[{ required: true }]}>
              <Input placeholder={t('presentationTitlePlaceholder')} />
            </Form.Item>

            <Form.Item label={t('generationMode')} name="mode">
              <Radio.Group className="presentation-mode">
                <Radio.Button value="auto">{t('autoGenerate')}</Radio.Button>
                <Radio.Button value="manual">{t('manualGenerate')}</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item label={t('presentationNotes')} name="notes">
              <Input.TextArea rows={3} placeholder={t('presentationNotesPlaceholder')} />
            </Form.Item>

            <div className="tp-modal__actions">
              <button type="button" className="tp-modal__cancel" onClick={close}>
                {t('cancel')}
              </button>
              <PrimaryButton htmlType="submit" disabled={starting}>
                {t('generatePresentation')}
              </PrimaryButton>
            </div>
          </Form>
        </>
      )}
    </Modal>
  )
}
