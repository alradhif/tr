import { useOutletContext, useParams } from 'react-router-dom'
import type { ClientRole } from '../../auth/clientAuth'
import { isDataEntry, isUpperManagement } from '../../auth/permissions'
import { ProjectDetailView } from '../../components/project/ProjectDetailView'

export function ClientProjectDetailPage() {
  const { projectId } = useParams()
  const { role } = useOutletContext<{ role: ClientRole }>()

  return (
    <ProjectDetailView
      projectId={projectId}
      backPath="/client/projects"
      basePath="/client/projects"
      portal="client"
      variant="client"
      showUpdateAction={isDataEntry(role)}
      showGeneratePresentation={isUpperManagement(role)}
      canApprove={isUpperManagement(role)}
    />
  )
}
