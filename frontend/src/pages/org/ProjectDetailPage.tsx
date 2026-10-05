import { useOutletContext, useParams } from 'react-router-dom'
import type { OrgRole } from '../../auth/orgAuth'
import { isUpperManagement } from '../../auth/permissions'
import { ProjectDetailView } from '../../components/project/ProjectDetailView'

export function OrgProjectDetailPage() {
  const { projectId } = useParams()
  const { role } = useOutletContext<{ role: OrgRole }>()
  return (
    <ProjectDetailView
      projectId={projectId}
      backPath="/org/projects"
      basePath="/org/projects"
      portal="org"
      showGeneratePresentation={isUpperManagement(role)}
      canApprove={isUpperManagement(role)}
    />
  )
}
