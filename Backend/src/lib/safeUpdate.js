const { Prisma } = require('@prisma/client')

/**
 * Fields an edit request may never set: identity and ownership (which record and tenant it
 * belongs to), timestamps, and anything only an approval step may change.
 */
const PROTECTED = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'orgId',
  'clientId',
  'uploadedBy',
  'createdBy',
  'requestedBy',
  'reviewStatus',
  'version',
  'submittedAt',
  'submittedByName',
  'reviewedAt',
  'reviewedByName',
  'reviewNote',
  'approvedAt',
  'approvedByName',
])

const scalarFields = new Map(
  Prisma.dmmf.datamodel.models.map((model) => [
    model.name,
    new Set(model.fields.filter((field) => field.kind !== 'object').map((field) => field.name)),
  ]),
)

/**
 * Copies only the plain fields of `model` that an edit may change. Relations, foreign keys
 * (`...Id`) and the protected fields above are dropped, so an edit cannot approve a record,
 * move it to another project or tenant, or reach other tables.
 */
function pickUpdatable(model, body, extraProtected = []) {
  const allowed = scalarFields.get(model)
  if (!allowed) throw new Error(`Unknown model ${model}`)
  const blocked = new Set(extraProtected)
  const data = {}
  for (const [key, value] of Object.entries(body || {})) {
    if (!allowed.has(key) || PROTECTED.has(key) || blocked.has(key) || key.endsWith('Id')) continue
    data[key] = value
  }
  return data
}

module.exports = { pickUpdatable }
