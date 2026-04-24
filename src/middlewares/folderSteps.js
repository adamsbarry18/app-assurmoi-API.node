const { body, param, validationResult } = require('express-validator')
const { ERROR_CODES } = require('../core/errors')

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

const folderIdForStepsValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

const createFolderStepValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  body('step_type').trim().notEmpty().isLength({ max: 255 }),
  body('value').optional({ values: 'null' }),
  body('document_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('performed_by_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

module.exports = {
  folderIdForStepsValidators,
  createFolderStepValidators
}
