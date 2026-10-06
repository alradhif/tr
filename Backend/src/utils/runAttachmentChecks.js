const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const { getDatabaseName } = require('../lib/demoSafety')
const prisma = require('../lib/prisma')

// Exercises project attachment upload, download and permissions against a running
// demo API. Creates its own draft projects, so it only runs on the demo database.
const BASE = process.env.API_URL || 'http://localhost:5001/api'

let failures = 0
function expect(condition, label) {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${label}`)
  if (!condition) failures += 1
}

async function request(urlPath, { method = 'GET', token, json, form, raw } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  if (form) body = form
  const response = await fetch(`${BASE}${urlPath}`, { method, headers, body })
  if (raw) return response
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}

async function login(role) {
  const { data } = await request('/auth/demo/login', { method: 'POST', json: { role } })
  return data.token
}

function formWith(...files) {
  const form = new FormData()
  for (const [name, content, type] of files) form.append('files', new Blob([content], { type }), name)
  return form
}

const PDF = Buffer.from(`%PDF-1.4 attachment check ${'x'.repeat(4000)}`)
const ARABIC_NAME = 'عقد المشروع.docx'
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

async function checkPortal(portal) {
  const prefix = portal === 'org' ? 'ORG' : 'CLIENT'
  const entry = await login(`${prefix}_DATA_ENTRY`)
  const mgmt = await login(`${prefix}_UPPER_MGMT`)
  const outsider = await login(portal === 'org' ? 'CLIENT_UPPER_MGMT' : 'ORG_UPPER_MGMT')
  const base = `/${portal}/projects`
  const model = portal === 'org' ? prisma.orgProjectAttachment : prisma.clientProjectAttachment

  const created = await request(base, {
    method: 'POST',
    token: entry,
    json: { name: `Attachment check ${Date.now()}`, startDate: '2026-10-01', endDate: '2027-03-01' },
  })
  expect(created.status === 200, `${portal}: data entry creates a draft project`)
  const projectId = created.data.project.id

  const upload = await request(`${base}/${projectId}/attachments`, {
    method: 'POST',
    token: entry,
    form: formWith(['scope.pdf', PDF, 'application/pdf'], [ARABIC_NAME, Buffer.from('PK docx'), DOCX_TYPE]),
  })
  expect(upload.status === 201 && upload.data.attachments?.length === 2, `${portal}: data entry uploads two files`)
  const [pdf, docx] = upload.data.attachments
  expect(docx.fileName === ARABIC_NAME, `${portal}: Arabic file name kept`)
  expect((await model.count({ where: { projectId } })) === 2, `${portal}: rows saved in PostgreSQL`)

  const list = await request(`${base}/${projectId}/attachments`, { token: mgmt })
  expect(list.status === 200 && list.data.count === 2, `${portal}: manager lists attachments`)
  const detail = await request(`${base}/${projectId}`, { token: entry })
  expect(detail.data.project?.attachments?.length === 2, `${portal}: project detail returns attachments`)

  const signed = await request(pdf.fileUrl, { raw: true })
  const bytes = Buffer.from(await signed.arrayBuffer())
  expect(signed.status === 200 && bytes.equals(PDF), `${portal}: signed link returns the same bytes`)
  const anonymous = await request(pdf.downloadPath, { raw: true })
  expect(anonymous.status === 401, `${portal}: unsigned download without session refused`)
  const sig = pdf.fileUrl.split('sig=')[1]
  const swapped = await request(`${docx.downloadPath}?sig=${sig}`, { raw: true })
  expect(swapped.status === 401, `${portal}: signature only opens its own file`)
  const crossTenant = await request(`${base}/${projectId}/attachments`, { token: outsider })
  expect(crossTenant.status === 403, `${portal}: other portal denied`)

  const badType = await request(`${base}/${projectId}/attachments`, {
    method: 'POST',
    token: entry,
    form: formWith(['run.exe', Buffer.from('MZ'), 'application/octet-stream']),
  })
  expect(badType.status === 400, `${portal}: disallowed file type rejected`)
  const tooBig = await request(`${base}/${projectId}/attachments`, {
    method: 'POST',
    token: entry,
    form: formWith(['big.pdf', Buffer.alloc(10 * 1024 * 1024 + 1), 'application/pdf']),
  })
  expect(tooBig.status === 413, `${portal}: file over 10 MB rejected`)

  await request(`${base}/${projectId}/submit`, { method: 'POST', token: entry })
  const lockedUpload = await request(`${base}/${projectId}/attachments`, {
    method: 'POST',
    token: entry,
    form: formWith(['late.pdf', PDF, 'application/pdf']),
  })
  expect(lockedUpload.status === 403, `${portal}: data entry locked out while pending`)
  const managerUpload = await request(`${base}/${projectId}/attachments`, {
    method: 'POST',
    token: mgmt,
    form: formWith(['review.pdf', PDF, 'application/pdf']),
  })
  expect(managerUpload.status === 201, `${portal}: manager uploads during review`)

  const removed = await request(`${base}/${projectId}/attachments/${docx.id}`, { method: 'DELETE', token: mgmt })
  expect(removed.status === 200, `${portal}: manager deletes an attachment`)
  const gone = await request(docx.downloadPath, { token: mgmt, raw: true })
  expect(gone.status === 404, `${portal}: deleted attachment no longer downloads`)
}

async function main() {
  if (getDatabaseName() !== 'trackplus_demo') {
    console.error('Attachment checks refused: active database is not trackplus_demo')
    process.exit(1)
  }
  await checkPortal('org')
  await checkPortal('client')
  console.log(failures ? `${failures} check(s) failed` : 'All attachment checks passed')
  process.exitCode = failures ? 1 : 0
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
