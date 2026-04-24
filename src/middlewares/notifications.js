const { query, param, validationResult } = require('express-validator')
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

const listNotificationsQueryValidators = [
  query('is_read').optional().isIn(['true', 'false']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
]

const notificationIdParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

module.exports = {
  listNotificationsQueryValidators,
  notificationIdParamValidator
}
