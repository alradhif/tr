import { useState } from 'react'
import { DatePicker, Form, Input, Upload, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { commonAssets } from '@/assets'
import { AssetIcon } from '../../../components/ui/AssetIcon'
import { ApiError } from '../../../api/client'
import { createClientNested, uploadClientProjectAttachments } from '../../../api/clientPortal'
import { createProjectContract, uploadProjectAttachments } from '../../../api/orgProjects'
import { getClientToken } from '../../../auth/clientAuth'
import { getOrgToken } from '../../../auth/orgAuth'
import { FormActions, FormSection } from '../../../components/forms'
import { CatalogFormWrap } from './CatalogFormWrap'
import { useProjectFormNav } from './useProjectFormNav'

type FormValues = {
  name: string
  startDate: { toISOString?: () => string } | string
  endDate: { toISOString?: () => string } | string
  file?: { fileList?: Array<{ name?: string; originFileObj?: File }> }
}

function toDateString(value: FormValues['startDate']) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.toISOString?.()
}

export function AddContractPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const token = portal === 'client' ? getClientToken() : getOrgToken()
      if (!token) throw new Error(t('loadError'))
      const file = values.file?.fileList?.[0]?.originFileObj
      let fileUrl = ''
      if (file) {
        const uploaded =
          portal === 'client'
            ? await uploadClientProjectAttachments(token, projectId, [file])
            : await uploadProjectAttachments(token, projectId, [file])
        fileUrl = uploaded.attachments?.[0]?.downloadPath ?? ''
      }
      const payload = {
        name: values.name,
        fileUrl,
        startDate: toDateString(values.startDate),
        endDate: toDateString(values.endDate),
      }
      if (portal === 'client') {
        await createClientNested(token, projectId, 'contracts', payload)
      } else {
        await createProjectContract(token, projectId, payload)
      }
      message.success(t('saveContract'))
      navigate(backTo)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CatalogFormWrap portal={portal} parent={t('contracts')} title={t('addContractFull')} backTo={backTo}>

      <Form
        layout="vertical"
        requiredMark={false}
        className="form-page__form"
        onFinish={onFinish}
      >
        <FormSection title={t('contractBasicInfo')}>
          <Form.Item label={t('contractName')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label={t('startDate')} name="startDate" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label={t('endDate')} name="endDate" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <Form.Item label={t('contractFile')} name="file">
            <Upload.Dragger beforeUpload={() => false} maxCount={1}>
              <p className="ant-upload-drag-icon">
                <AssetIcon src={commonAssets.upload} size={20} />
              </p>
              <p>{t('uploadContractHint')}</p>
            </Upload.Dragger>
          </Form.Item>
        </FormSection>

        <FormActions cancelTo={backTo} submitLabel={t('saveContract')} loading={submitting} />
      </Form>
    </CatalogFormWrap>
  )
}
