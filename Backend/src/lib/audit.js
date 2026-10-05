const prisma = require('./prisma')

/**
 * Write an audit log entry.
 * @param {{ action: 'CREATE'|'UPDATE'|'DELETE', tableName: string, recordId: string, oldData?: object|null, newData?: object|null, performedBy: string, actorType: string }} params
 */
async function writeAuditLog({
  action,
  tableName,
  recordId,
  oldData = null,
  newData = null,
  performedBy,
  actorType
}) {
  return prisma.auditLog.create({
    data: {
      action,
      tableName,
      recordId,
      oldData: oldData ?? undefined,
      newData: newData ?? undefined,
      performedBy,
      actorType
    }
  })
}

module.exports = { writeAuditLog }
