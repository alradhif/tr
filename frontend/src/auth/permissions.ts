export type AppRole = 'upper' | 'dataEntry'

export function canApprove(role: AppRole) {
  return role === 'upper'
}

export function canManageStructure(role: AppRole) {
  return role === 'upper'
}

export function canCreateDraft(role: AppRole) {
  return role === 'upper' || role === 'dataEntry'
}

export function isDataEntry(role: AppRole) {
  return role === 'dataEntry'
}

export function isUpperManagement(role: AppRole) {
  return role === 'upper'
}
