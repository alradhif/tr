import { useNavigate } from 'react-router-dom'
import { AddPhaseModal } from '../../../components/project/ProjectAddModals'
import { useProjectFormNav } from './useProjectFormNav'

export function AddPhasePage() {
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()

  return (
    <AddPhaseModal
      projectId={projectId}
      portal={portal}
      onClose={() => navigate(backTo)}
      onSaved={() => navigate(backTo)}
    />
  )
}
