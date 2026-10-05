import { Form, Input, Modal, Select, Upload, message } from 'antd'
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { createClientNested } from '../../api/clientPortal'
import { getClientToken } from '../../auth/clientAuth'
import { PrimaryButton } from '../ui'

export type AddDeliverableModalProps = {
  open: boolean
  onClose: () => void
  projectId?: string
  phaseOptions?: Array<{ value: string; label: string }>
  onCreated?: () => void
}

export function AddDeliverableModal({
  open,
  onClose,
  projectId,
  phaseOptions = [],
  onCreated,
}: AddDeliverableModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm()

  const onFinish = async (values: { name: string; description?: string; email?: string }) => {
    const token = getClientToken()
    if (!token || !projectId) {
      message.error(t('loadError'))
      return
    }
    try {
      await createClientNested(token, projectId, 'deliverables', {
        name: values.name,
        description: values.description,
        email: values.email,
      })
      message.success(t('saveDeliverable'))
      form.resetFields()
      onCreated?.()
      onClose()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={720}
      className="tp-modal"
      destroyOnHidden
    >
      <div className="tp-modal__header">
        <h2>{t('addDeliverable')}</h2>
        <span className="tp-modal__icon">
          <FileTextOutlined />
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="tp-modal__form"
        onFinish={onFinish}
      >
        <div className="form-grid-2">
          <Form.Item label={t('deliverableName')} name="name" rules={[{ required: true }]}>
            <Input placeholder={t('deliverableName')} />
          </Form.Item>
          <Form.Item label={t('phase')} name="phase">
            <Select options={phaseOptions} placeholder={t('phase')} allowClear />
          </Form.Item>
        </div>
        <div className="form-grid-2">
          <Form.Item label={t('deliverableType')} name="type">
            <Input placeholder={t('deliverableType')} />
          </Form.Item>
          <Form.Item label={t('deliverableDescription')} name="description">
            <Input placeholder={t('deliverableDescription')} />
          </Form.Item>
        </div>
        <div className="form-grid-2">
          <Form.Item label={t('email')} name="email">
            <Input placeholder={t('emailPlaceholder')} />
          </Form.Item>
        </div>

        <Form.Item label={t('addDeliverableFiles')} name="files">
          <Upload.Dragger multiple beforeUpload={() => false} className="tp-upload-dragger">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t('dragFilesHere')}</p>
            <p className="ant-upload-hint">PDF, DOCS, XLSX, PNG, JPG, FIG</p>
          </Upload.Dragger>
        </Form.Item>

        <div className="tp-modal__actions">
          <button type="button" className="tp-modal__cancel" onClick={onClose}>
            {t('cancel')}
          </button>
          <PrimaryButton htmlType="submit">{t('add')}</PrimaryButton>
        </div>
      </Form>
    </Modal>
  )
}
