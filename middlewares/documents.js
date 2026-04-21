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

module.exports = {
  uploadDocumentValidators,
  documentIdValidators,
  DOCUMENT_TYPES
}
