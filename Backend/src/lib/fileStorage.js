const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

// Uploaded files live in Cloud Storage when ATTACHMENTS_BUCKET is set (Cloud Run has
// no persistent disk), otherwise on local disk under UPLOAD_DIR for development.
const BUCKET_NAME = process.env.ATTACHMENTS_BUCKET || ''
const LOCAL_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'))

let bucket = null
function getBucket() {
  if (!bucket) {
    const { Storage } = require('@google-cloud/storage')
    // ATTACHMENTS_GCS_ENDPOINT is only for a local emulator (e.g. fake-gcs-server).
    const endpoint = process.env.ATTACHMENTS_GCS_ENDPOINT
    bucket = new Storage(endpoint ? { apiEndpoint: endpoint } : {}).bucket(BUCKET_NAME)
  }
  return bucket
}

function localPath(key) {
  const full = path.resolve(LOCAL_ROOT, key)
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error('Invalid storage key')
  return full
}

async function saveFile(key, buffer, contentType) {
  if (BUCKET_NAME) {
    await getBucket().file(key).save(buffer, { contentType, resumable: false })
    return
  }
  const full = localPath(key)
  await fsp.mkdir(path.dirname(full), { recursive: true })
  await fsp.writeFile(full, buffer)
}

async function fileExists(key) {
  if (BUCKET_NAME) {
    const [exists] = await getBucket().file(key).exists()
    return exists
  }
  try {
    await fsp.access(localPath(key))
    return true
  } catch {
    return false
  }
}

function openReadStream(key) {
  if (BUCKET_NAME) return getBucket().file(key).createReadStream()
  return fs.createReadStream(localPath(key))
}

async function deleteFile(key) {
  try {
    if (BUCKET_NAME) await getBucket().file(key).delete({ ignoreNotFound: true })
    else await fsp.rm(localPath(key), { force: true })
  } catch (err) {
    console.error(`Could not delete stored file ${key}: ${err.message}`)
  }
}

// Removes every stored object under a prefix. Used by the demo reset only.
async function deletePrefix(prefix) {
  if (BUCKET_NAME) {
    await getBucket().deleteFiles({ prefix, force: true })
    return
  }
  await fsp.rm(localPath(prefix), { recursive: true, force: true })
}

module.exports = {
  storageDriver: BUCKET_NAME ? 'gcs' : 'local',
  saveFile,
  fileExists,
  openReadStream,
  deleteFile,
  deletePrefix,
}
