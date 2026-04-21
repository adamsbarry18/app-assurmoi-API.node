const { body, query, param, validationResult } = require('express-validator')
const { ERROR_CODES } = require('../core/errors')
const { FOLDER_STATUSES } = require('../models/sinisterfolder')

const SINISTER_LIST_STATUSES = [
  'pending_validation',
  'validated',
  ...FOLDER_STATUSES
]

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

const listSinistersQueryValidators = [
  query('vehicle_plate').optional().trim().isLength({ max: 50 }),
  query('status').optional().isIn(SINISTER_LIST_STATUSES),
  query('call_datetime_from').optional().isISO8601().toDate(),
  query('call_datetime_to').optional().isISO8601().toDate(),
  query('incident_datetime_from').optional().isISO8601().toDate(),
  query('incident_datetime_to').optional().isISO8601().toDate(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
]

const idParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

const createSinisterValidators = [
  body('vehicle_plate').trim().notEmpty().isLength({ max: 50 }),
  body('driver_first_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('driver_last_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('is_driver_insured').optional().isBoolean(),
  body('call_datetime').isISO8601().toDate(),
  body('incident_datetime').isISO8601().toDate(),
  body('description').optional({ values: 'null' }).trim(),
  body('driver_responsability').optional().isBoolean(),
  body('driver_engaged_responsibility')
    .optional({ values: 'null' })
    .isInt()
    .isIn([0, 50, 100]),
  body('cni_driver').optional({ values: 'null' }).isInt({ min: 1 }),
  body('vehicle_registration_doc_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 }),
  body('insurance_certificate_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 }),
  body().custom((body, { req }) => {
    const dr = req.body.driver_responsability
    const pct = req.body.driver_engaged_responsibility
    if (dr === false && pct != null && pct !== 0) {
      throw new Error('Sans responsabilité conducteur, le pourcentage doit être 0 ou absent')
    }
    return true
  }),
  handleValidationErrors
]

const updateSinisterValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  body('vehicle_plate').optional().trim().notEmpty().isLength({ max: 50 }),
  body('driver_first_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('driver_last_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('is_driver_insured').optional().isBoolean(),
  body('call_datetime').optional().isISO8601().toDate(),
  body('incident_datetime').optional().isISO8601().toDate(),
  body('description').optional({ values: 'null' }).trim(),
  body('driver_responsability').optional().isBoolean(),
  body('driver_engaged_responsibility')
    .optional({ values: 'null' })
    .isInt()
    .isIn([0, 50, 100]),
  body('cni_driver').optional({ values: 'null' }).isInt({ min: 1 }),
  body('vehicle_registration_doc_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 }),
  body('insurance_certificate_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 }),
  body().custom((body, { req }) => {
    const dr = req.body.driver_responsability
    const pct = req.body.driver_engaged_responsibility
    if (dr === false && pct != null && pct !== 0) {
      throw new Error('Sans responsabilité conducteur, le pourcentage doit être 0 ou absent')
    }
    return true
  }),
  handleValidationErrors
]

module.exports = {
  listSinistersQueryValidators,
  idParamValidator,
  createSinisterValidators,
  updateSinisterValidators,
  SINISTER_LIST_STATUSES
}
