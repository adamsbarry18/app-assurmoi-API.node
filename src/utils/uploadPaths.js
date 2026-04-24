const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { uploads: defaultUploadsDir } = require('../config/paths')

function getUploadRoot () {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : defaultUploadsDir()
}

function ensureUploadRoot () {
  const root = getUploadRoot()
  fs.mkdirSync(root, { recursive: true })
  return root
}

function buildRelativePath (originalName) {
  const ext = path.extname(originalName || '').toLowerCase() || '.bin'
  const safeExt = ext.length > 16 ? '.bin' : ext
  const y = new Date().getUTCFullYear()
  const m = String(new Date().getUTCMonth() + 1).padStart(2, '0')
  const id = crypto.randomBytes(8).toString('hex')
  return path.join(String(y), m, `${id}${safeExt}`).split(path.sep).join('/')
}

function absoluteFromRelative (relative) {
  if (!relative || typeof relative !== 'string') return null
  const normalized = relative.replace(/^[/\\]+/, '')
  return path.join(getUploadRoot(), normalized)
}

function guessContentType (relative) {
  const ext = path.extname(relative || '').toLowerCase()
  const map = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.txt': 'text/plain',
    '.csv': 'text/csv'
  }
  return map[ext] || 'application/octet-stream'
}

module.exports = {
  getUploadRoot,
  ensureUploadRoot,
  buildRelativePath,
  absoluteFromRelative,
  guessContentType
}
