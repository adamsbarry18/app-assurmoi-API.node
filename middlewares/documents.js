const { body, param, validationResult } = require('express-validator')
const { ERROR_CODES } = require('../core/errors')
const { DOCUMENT_TYPES } = require('../models/document')

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
      message: 'Validation des paramètres échouée',
      code: ERROR_CODES.VALIDATION_ERROR.code,
      errors: errors.array()
    })
  }
  next()
}

const uploadDocumentValidators = [
  body('type').trim().notEmpty().isIn([...DOCUMENT_TYPES]),
  handleValidationErrors
]

const documentIdValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

const signDocumentValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  body('first_name').trim().notEmpty().isLength({ max: 255 }),
  body('last_name').trim().notEmpty().isLength({ max: 255 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('locale').optional().trim().isLength({ max: 8 }),
  body('sign_page').optional().isInt({ min: 1 }).toInt(),
  body('sign_x').optional().isInt({ min: 0 }).toInt(),
  body('sign_y').optional().isInt({ min: 0 }).toInt(),
  body('signature_request_name').optional().trim().isLength({ max: 255 }),
  handleValidationErrors
]

module.exports = {
  uploadDocumentValidators,
  documentIdValidators,
  signDocumentValidators,
  DOCUMENT_TYPES
}
