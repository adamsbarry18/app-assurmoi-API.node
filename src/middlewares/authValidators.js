const { body, param, validationResult } = require('express-validator')
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

const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('email requis (adresse email ou nom d’utilisateur)'),
  body('password').notEmpty(),
  handleValidationErrors
]

const refreshValidators = [
  body('refreshToken').trim().notEmpty(),
  handleValidationErrors
]

const forgotPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  handleValidationErrors
]

const resetPasswordValidators = [
  body('token').trim().notEmpty(),
  body('password').isLength({ min: 8 }),
  handleValidationErrors
]

const inviteValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  body('role').isIn([...USER_ROLES]),
  handleValidationErrors
]

const completeInviteValidators = [
  body('token').trim().notEmpty(),
  body('username').trim().notEmpty().isLength({ max: 255 }),
  body('password').isLength({ min: 8 }),
  body('first_name').optional().trim(),
  body('last_name').optional().trim(),
  handleValidationErrors
]

const invitationIdParamValidators = [
  param('id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
]

module.exports = {
  loginValidators,
  refreshValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  inviteValidators,
  completeInviteValidators,
  invitationIdParamValidators
}
