import { useNavigate } from 'react-router-dom'
import { AddDeliverableModal } from '../../../components/project/ProjectAddModals'
import { useProjectFormNav } from './useProjectFormNav'

export function AddDeliverablePage() {
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()

  return (
    <AddDeliverableModal
      projectId={projectId}
      portal={portal}
      onClose={() => navigate(backTo)}
      onSaved={() => navigate(backTo)}
    />
  )
}
