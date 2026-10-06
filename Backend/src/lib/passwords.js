function resolveInviteRole(body, prefix) {
  const upper = `${prefix}_UPPER_MGMT`
  const entry = `${prefix}_DATA_ENTRY`
  if (body.role === upper || body.role === entry) return body.role
  if (body.accessLevel === 'UPPER') return upper
  if (body.accessLevel === 'DATA_ENTRY') return entry
  return ''
}

module.exports = {
  resolveInviteRole,
}
