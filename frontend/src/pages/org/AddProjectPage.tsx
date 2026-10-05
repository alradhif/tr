import { ProjectForm } from '../../org-catalog/ProjectForm'

export function OrgAddProjectPage() {
  return <ProjectForm mode="create" />
}

export function OrgEditProjectPage() {
  return <ProjectForm mode="edit" />
}
