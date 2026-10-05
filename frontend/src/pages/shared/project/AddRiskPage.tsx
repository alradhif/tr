import { useNavigate } from 'react-router-dom'
import { AddRiskModal } from '../../../components/project/ProjectAddModals'
import { useProjectFormNav } from './useProjectFormNav'

export function AddRiskPage() {
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()

  return (
    <AddRiskModal
      projectId={projectId}
      portal={portal}
      onClose={() => navigate(backTo)}
      onSaved={() => navigate(backTo)}
    />
  )
}
