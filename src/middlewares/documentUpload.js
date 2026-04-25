const fs = require('fs')
const path = require('path')
const formidable = require('formidable')
const { ERROR_CODES } = require('../core/errors')
const {
  ensureUploadRoot,
  buildRelativePath,
  getUploadRoot
} = require('../utils/uploadPaths')

const MAX_BYTES = Number.parseInt(process.env.UPLOAD_MAX_BYTES || '15728640', 10)

/**
 * Déplace le fichier temporaire vers le dossier d’upload.
 * `rename` est atomique seulement sur le même disque ; en Docker, /tmp et le volume
 * monté sont souvent sur des devices différents → EXDEV. On retombe sur copy + unlink.
 */
function moveTempFileTo (src, dest) {
  try {
    fs.renameSync(src, dest)
  } catch (e) {
    if (e && e.code === 'EXDEV') {
      try {
        fs.copyFileSync(src, dest)
      } finally {
        try {
          fs.unlinkSync(src)
        } catch (_) {
          /* */
        }
      }
      return
    }
    throw e
  }
}

/**
 * Multipart (champs `type` + fichier `file`) via formidable — même contrat qu’avant (multer).
 * Remplit `req.body`, `req.file`, `req.diskRelativePath` pour le service.
 */
const uploadDocumentFile = (req, res, next) => {
  const contentType = (req.headers['content-type'] || '').toLowerCase()
  if (!contentType.includes('multipart/form-data')) {
    return res.status(ERROR_CODES.BAD_REQUEST.status).json({
      message: 'Content-Type multipart/form-data attendu',
      code: ERROR_CODES.BAD_REQUEST.code
    })
  }

  ensureUploadRoot()

  const form = new formidable.IncomingForm()
  form.maxFileSize = MAX_BYTES
  form.keepExtensions = true
  form.multiples = false

  form.parse(req, (err, fields, files) => {
    if (err) {
      const tooBig =
        (err.message && err.message.toLowerCase().includes('max filesize')) ||
        err.message?.includes('maxFileSize') ||
        err.code === 413
      if (tooBig) {
        return res.status(ERROR_CODES.BAD_REQUEST.status).json({
          message: 'Fichier trop volumineux',
          code: ERROR_CODES.BAD_REQUEST.code
        })
      }
      return next(err)
    }

    const typeRaw = fields.type
    const type = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw
    const fileField = files.file
    const file = fileField ? (Array.isArray(fileField) ? fileField[0] : fileField) : null

    if (!file) {
      req.body = { type: type != null ? String(type) : '' }
      req.file = null
      req.diskRelativePath = undefined
      return next()
    }

    const originalName = file.originalFilename || 'file.bin'
    const rel = buildRelativePath(originalName)
    const destPath = path.join(getUploadRoot(), rel)
    const destDir = path.dirname(destPath)

    try {
      fs.mkdirSync(destDir, { recursive: true })
      moveTempFileTo(file.filepath, destPath)
    } catch (e) {
      try {
        if (file.filepath) fs.unlinkSync(file.filepath)
      } catch (_) {
        /* ignore */
      }
      return next(e)
    }

    req.body = { type: type != null ? String(type) : '' }
    req.diskRelativePath = rel
    req.file = {
      path: destPath,
      mimetype: file.mimetype || 'application/octet-stream',
      originalname: originalName,
      size: file.size
    }
    next()
  })
}

module.exports = {
  uploadDocumentFile,
  MAX_BYTES
}
