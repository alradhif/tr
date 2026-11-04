import { Navigate, useParams } from 'react-router-dom'
import { getJodaynRole } from '../../auth/jodaynAuth'
import { ProjectDetailView } from '../../components/project/ProjectDetailView'

/** An organization's or client's project, in the same page those portals use (read-only here). */
export function JodaynProjectDetailPage() {
  const { kind, projectId } = useParams()
  if (kind !== 'org' && kind !== 'client') return <Navigate to="/jodayn/projects" replace />
  return (
    <ProjectDetailView
      key={`${kind}-${projectId}`}
      projectId={projectId}
      backPath="/jodayn/projects"
      basePath="/jodayn/projects"
      jodaynKind={kind}
      showGeneratePresentation={getJodaynRole() === 'upper'}
    />
  )
}
