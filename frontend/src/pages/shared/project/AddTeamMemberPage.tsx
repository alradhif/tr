import { useNavigate } from 'react-router-dom'
import { AddTeamMemberModal } from '../../../components/project/ProjectAddModals'
import { useProjectFormNav } from './useProjectFormNav'

export function AddTeamMemberPage() {
  const navigate = useNavigate()
  const { backTo, projectId, portal } = useProjectFormNav()

  return (
    <AddTeamMemberModal
      projectId={projectId}
      portal={portal}
      onClose={() => navigate(backTo)}
      onSaved={() => navigate(backTo)}
    />
  )
}
