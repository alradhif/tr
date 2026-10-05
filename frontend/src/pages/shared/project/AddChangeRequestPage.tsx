import { useNavigate } from 'react-router-dom'
import { AddChangeRequestModal } from '../../../components/project/ProjectAddModals'
import { useProjectFormNav } from './useProjectFormNav'

export function AddChangeRequestPage() {
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()

  return (
    <AddChangeRequestModal
      projectId={projectId}
      portal={portal}
      onClose={() => navigate(backTo)}
      onSaved={() => navigate(backTo)}
    />
  )
}
