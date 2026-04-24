const logger = require('./logger')
const { AppError, ERROR_CODES } = require('./errors')

/**
 * Log + réponse JSON pour erreurs dans les services (handlers Express).
 * Toutes les réponses incluent un champ `code` (machine-readable).
 */
function logError (res, err, opts = {}) {
  const { context = 'service', defaultMessage = 'Erreur interne du serveur' } =
    opts

  const errObj =
    err instanceof Error ? err : new Error(String(err))
  logger.error(context, errObj, { context })

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code
    })
  }

  const name = err && typeof err === 'object' && 'name' in err ? err.name : ''

  if (name === 'SequelizeUniqueConstraintError') {
    return res.status(ERROR_CODES.CONFLICT.status).json({
      message: 'Contrainte d’unicité violée',
      code: ERROR_CODES.CONFLICT.code
    })
  }

  if (name === 'SequelizeValidationError' && err.errors) {
    return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
      message: 'Données invalides',
      code: ERROR_CODES.VALIDATION_ERROR.code,
      details: err.errors.map((e) => e.message)
    })
  }

  if (name === 'SequelizeForeignKeyConstraintError') {
    return res.status(ERROR_CODES.BAD_REQUEST.status).json({
      message: 'Référence invalide',
      code: ERROR_CODES.BAD_REQUEST.code
    })
  }

  if (name === 'SequelizeDatabaseError') {
    return res.status(ERROR_CODES.INTERNAL_ERROR.status).json({
      message: defaultMessage,
      code: ERROR_CODES.INTERNAL_ERROR.code
    })
  }

  return res.status(ERROR_CODES.INTERNAL_ERROR.status).json({
    message: defaultMessage,
    code: ERROR_CODES.INTERNAL_ERROR.code
  })
}

module.exports = { logError }
