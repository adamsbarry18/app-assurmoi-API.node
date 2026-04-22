const fs = require('fs')
const path = require('path')
const { Document } = require('../models')
const { logError } = require('../core/logError')
const { ERROR_CODES, AppError } = require('../core/errors')
const { ensureUploadRoot, absoluteFromRelative, guessContentType } = require('../utils/uploadPaths')
const { recordHistory, HISTORY_ACTION } = require('./historyAudit')
const { notifyDocumentPendingValidation } = require('./notificationDispatch')
const { createAndActivateSignatureRequest } = require('./yousignClient')

const ALLOWED_UPLOAD_MIMES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain'
])

function publicDocumentUrl (req, id) {
  const host = req.get('host')
  const proto = req.protocol
  return `${proto}://${host}/api/documents/${id}`
}

const createDocumentRecord = async (
  { type, diskRelativePath },
  { transaction } = {}
) => {
  ensureUploadRoot()
  return Document.create(
    {
      type,
      storage_url: diskRelativePath
    },
    { transaction }
  )
}

const uploadDocument = async (req, res) => {
  try {
    const file = req.file
    const type = req.body.type
    if (!file) {
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Fichier manquant (champ file)',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    if (!ALLOWED_UPLOAD_MIMES.has(file.mimetype)) {
      fs.unlink(file.path, () => {})
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Type de fichier non autorisé',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }

    const doc = await createDocumentRecord({
      type,
      diskRelativePath: req.diskRelativePath
    })

    await recordHistory({
      userId: req.user.id,
      entityType: 'document',
      entityId: doc.id,
      action: HISTORY_ACTION.DOCUMENT_UPLOADED
    })

    await notifyDocumentPendingValidation({
      documentId: doc.id,
      documentType: doc.type
    })

    return res.status(201).json({
      data: {
        id: doc.id,
        type: doc.type,
        storage_url: publicDocumentUrl(req, doc.id)
      }
    })
  } catch (err) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {})
    }
    return logError(res, err, {
      context: 'documents.uploadDocument',
      defaultMessage: 'Erreur lors de l’upload'
    })
  }
}

const getDocumentFile = async (req, res) => {
  try {
    const id = req.params.id
    const doc = await Document.findByPk(id)
    if (!doc || !doc.storage_url) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Document introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    const abs = absoluteFromRelative(doc.storage_url)
    if (!abs || !fs.existsSync(abs)) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Fichier absent du stockage',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    const meta = req.query.meta === 'true' || req.query.meta === '1'
    if (meta) {
      return res.status(200).json({
        data: {
          id: doc.id,
          type: doc.type,
          is_validated: doc.is_validated,
          uploaded_at: doc.uploaded_at,
          storage_url: publicDocumentUrl(req, doc.id)
        }
      })
    }

    const disposition =
      req.query.disposition === 'attachment' ? 'attachment' : 'inline'
    const filename = path.basename(doc.storage_url) || `document-${doc.id}`
    res.setHeader('Content-Type', guessContentType(doc.storage_url))
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${filename}"`
    )

    const stream = fs.createReadStream(abs)
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(ERROR_CODES.INTERNAL_ERROR.status).end()
      }
    })
    return stream.pipe(res)
  } catch (err) {
    return logError(res, err, {
      context: 'documents.getDocumentFile',
      defaultMessage: 'Erreur lors de la lecture du document'
    })
  }
}

const validateDocument = async (req, res) => {
  try {
    const id = req.params.id
    const doc = await Document.findByPk(id)
    if (!doc) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Document introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    if (doc.is_validated) {
      return res.status(200).json({
        message: 'Document déjà validé',
        data: doc
      })
    }
    await doc.update({ is_validated: true })
    const refreshed = await Document.findByPk(id)
    await recordHistory({
      userId: req.user.id,
      entityType: 'document',
      entityId: Number(id),
      action: HISTORY_ACTION.DOCUMENT_VALIDATED
    })
    return res.status(200).json({
      message: 'Document validé',
      data: refreshed
    })
  } catch (err) {
    return logError(res, err, {
      context: 'documents.validateDocument',
      defaultMessage: 'Erreur lors de la validation du document'
    })
  }
}

const SIGNABLE_EXTENSIONS = new Set(['.pdf', '.docx'])

const signDocument = async (req, res) => {
  try {
    const id = req.params.id
    const doc = await Document.findByPk(id)
    if (!doc || !doc.storage_url) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Document introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    if (!doc.is_validated) {
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message:
          'Document non validé en interne : valider le document avant envoi en signature Yousign',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    const abs = absoluteFromRelative(doc.storage_url)
    if (!abs || !fs.existsSync(abs)) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Fichier absent du stockage',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    const ext = path.extname(abs).toLowerCase()
    if (!SIGNABLE_EXTENSIONS.has(ext)) {
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message:
          'Yousign : formats signables acceptés — PDF ou DOCX (les images doivent être converties)',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    const signer = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      locale: req.body.locale || 'fr'
    }

    const placement = {}
    if (req.body.sign_page !== undefined) placement.page = req.body.sign_page
    if (req.body.sign_x !== undefined) placement.x = req.body.sign_x
    if (req.body.sign_y !== undefined) placement.y = req.body.sign_y

    const result = await createAndActivateSignatureRequest({
      filePath: abs,
      filename: path.basename(doc.storage_url) || `document-${doc.id}${ext}`,
      signer,
      signaturePlacement: placement,
      requestName: req.body.signature_request_name
    })

    await recordHistory({
      userId: req.user.id,
      entityType: 'document',
      entityId: Number(id),
      action: HISTORY_ACTION.DOCUMENT_SIGNATURE_REQUESTED
    })

    const firstSigner = Array.isArray(result.signers) ? result.signers[0] : null
    return res.status(200).json({
      data: {
        document_id: doc.id,
        signature_request_id: result.signature_request_id,
        yousign_document_id: result.yousign_document_id,
        status: result.status,
        signature_link: firstSigner?.signature_link ?? null,
        signers: result.signers
      }
    })
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      })
    }
    return logError(res, err, {
      context: 'documents.signDocument',
      defaultMessage: 'Erreur lors du lancement de la signature Yousign'
    })
  }
}

async function assertDocumentType (documentId, expectedType, { transaction } = {}) {
  if (documentId == null) return
  const doc = await Document.findByPk(documentId, { transaction })
  if (!doc) {
    throw new AppError('Document référencé introuvable', 400, ERROR_CODES.BAD_REQUEST.code)
  }
  if (doc.type !== expectedType) {
    throw new AppError(
      `Le document ${documentId} doit être de type ${expectedType}`,
      400,
      ERROR_CODES.BAD_REQUEST.code
    )
  }
}

module.exports = {
  createDocumentRecord,
  uploadDocument,
  getDocumentFile,
  validateDocument,
  signDocument,
  publicDocumentUrl,
  assertDocumentType
}
