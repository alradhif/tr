import { useLocation, useParams } from 'react-router-dom'

export type ProjectPortal = 'org' | 'client'

export function useProjectFormNav() {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()
  const portal: ProjectPortal = pathname.startsWith('/client') ? 'client' : 'org'
  const projectPath = `/${portal}/projects/${projectId}`

  return { projectId, portal, projectPath, backTo: projectPath }
}
