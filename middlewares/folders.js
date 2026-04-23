const { body, query, param, validationResult } = require('express-validator')
const { ERROR_CODES } = require('../core/errors')
const { FOLDER_STATUSES, FOLDER_SCENARIOS } = require('../models/sinisterfolder')

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

const listFoldersQueryValidators = [
  query('status').optional().isIn([...FOLDER_STATUSES]),
  query('scenario').optional().isIn([...FOLDER_SCENARIOS]),
  query('assigned_officer_id').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
]

const folderIdParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

const createFolderValidators = [
  body('sinister_id').isInt({ min: 1 }).toInt(),
  body('force').optional().isBoolean(),
  body('scenario').optional().isIn([...FOLDER_SCENARIOS]),
  handleValidationErrors
]

const assignOfficerValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  body('assigned_officer_id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

const updateFolderScenarioValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  body('scenario').isIn([...FOLDER_SCENARIOS]),
  handleValidationErrors
]

module.exports = {
  listFoldersQueryValidators,
  folderIdParamValidator,
  createFolderValidators,
  assignOfficerValidators,
  updateFolderScenarioValidators
}
