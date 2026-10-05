const crypto = require('crypto')

function generateTemporaryPassword() {
  return `${crypto.randomBytes(9).toString('base64url')}Aa1`
}

function resolveInvitePassword(requestedPassword) {
  if (typeof requestedPassword === 'string' && requestedPassword.length >= 8) {
    return { password: requestedPassword, generated: false }
  }
  return { password: generateTemporaryPassword(), generated: true }
}

function resolveInviteRole(body, prefix) {
  const upper = `${prefix}_UPPER_MGMT`
  const entry = `${prefix}_DATA_ENTRY`
  if (body.role === upper || body.role === entry) return body.role
  if (body.accessLevel === 'UPPER') return upper
  if (body.accessLevel === 'DATA_ENTRY') return entry
  return ''
}

module.exports = {
  generateTemporaryPassword,
  resolveInvitePassword,
  resolveInviteRole,
}
