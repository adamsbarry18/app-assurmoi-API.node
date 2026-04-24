const { body, query, param, validationResult } = require('express-validator')
const userModelModule = require('../models/user')
const { ERROR_CODES } = require('../core/errors')
const USER_ROLES = userModelModule.USER_ROLES

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

const createUserValidators = [
  body('username').trim().notEmpty().isLength({ max: 255 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('role').isIn([...USER_ROLES]),
  body('first_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('last_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('is_active').optional().isBoolean(),
  handleValidationErrors
]

const updateUserValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  body('username').optional().trim().notEmpty().isLength({ max: 255 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8 }),
  body('role').optional().isIn([...USER_ROLES]),
  body('first_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('last_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('is_active').optional().isBoolean(),
  handleValidationErrors
]

const idParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

const listUsersQueryValidators = [
  query('search').optional().trim().isLength({ max: 255 }),
  query('user_scope').optional().isIn(['insured', 'staff']),
  query('role').optional().isIn([...USER_ROLES]),
  query('is_active').optional().isIn(['true', 'false']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
]

const listInsuredOptionsQueryValidators = [
  query('search').optional().trim().isLength({ max: 255 }),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  handleValidationErrors
]

/** Création profil assuré par l’équipe (sans mot de passe ; e-mail premier accès). */
const provisionInsuredUserValidators = [
  body('username').trim().notEmpty().isLength({ max: 255 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('first_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('last_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('send_welcome_email').optional().isBoolean(),
  handleValidationErrors
]

module.exports = {
  createUserValidators,
  provisionInsuredUserValidators,
  updateUserValidators,
  idParamValidator,
  listUsersQueryValidators,
  listInsuredOptionsQueryValidators,
  USER_ROLES
}
