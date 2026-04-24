const { query, validationResult } = require('express-validator')
const { ERROR_CODES } = require('../core/errors')
const { ENTITY_TYPES } = require('../models/historylog')

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

const listHistoryQueryValidators = [
  query('entity_type').trim().notEmpty().isIn([...ENTITY_TYPES]),
  query('entity_id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

module.exports = {
  listHistoryQueryValidators,
  ENTITY_TYPES
}
