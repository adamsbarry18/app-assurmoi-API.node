const logger = require('../core/logger')
const multer = require('multer')
const { AppError, ERROR_CODES } = require('../core/errors')

function notFoundHandler (req, res) {
  res.status(ERROR_CODES.NOT_FOUND.status).json({
    message: 'Route non trouvée',
    code: ERROR_CODES.NOT_FOUND.code
  })
}

function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  logger.error('middleware.errorHandler', err, { path: req.path })

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Fichier trop volumineux'
        : 'Erreur lors de l’upload'
    res.status(ERROR_CODES.BAD_REQUEST.status).json({
      message,
      code: ERROR_CODES.BAD_REQUEST.code
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code })
    return
  }

  const msg =
    process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message || 'Erreur interne du serveur'
  res.status(ERROR_CODES.INTERNAL_ERROR.status).json({
    message: msg,
    code: ERROR_CODES.INTERNAL_ERROR.code
  })
}

module.exports = { notFoundHandler, errorHandler }
