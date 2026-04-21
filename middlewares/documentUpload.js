const fs = require('fs')
const path = require('path')
const multer = require('multer')
const {
  ensureUploadRoot,
  buildRelativePath,
  getUploadRoot
} = require('../utils/uploadPaths')

const MAX_BYTES = Number.parseInt(process.env.UPLOAD_MAX_BYTES || '15728640', 10)

const storage = multer.diskStorage({
  destination (req, file, cb) {
    try {
      ensureUploadRoot()
      const rel = buildRelativePath(file.originalname)
      req.diskRelativePath = rel
      const absDir = path.join(getUploadRoot(), path.dirname(rel))
      fs.mkdirSync(absDir, { recursive: true })
      cb(null, absDir)
    } catch (e) {
      cb(e)
    }
  },
  filename (req, file, cb) {
    cb(null, path.basename(req.diskRelativePath || 'file.bin'))
  }
})

const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_BYTES }
})

module.exports = {
  uploadDocumentFile: uploadSingle.single('file'),
  MAX_BYTES
}
