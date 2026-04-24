class AppError extends Error {
  constructor (message, statusCode = 400, code = 'APP_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'AppError'
  }
}

const ERROR_CODES = Object.freeze({
  BAD_REQUEST: { status: 400, code: 'BAD_REQUEST' },
  VALIDATION_ERROR: { status: 400, code: 'VALIDATION_ERROR' },
  UNAUTHORIZED: { status: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { status: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
  CONFLICT: { status: 409, code: 'CONFLICT' },
  UNPROCESSABLE_ENTITY: { status: 422, code: 'UNPROCESSABLE_ENTITY' },
  TOO_MANY_REQUESTS: { status: 429, code: 'TOO_MANY_REQUESTS' },
  INTERNAL_ERROR: { status: 500, code: 'INTERNAL_ERROR' },
  SERVICE_UNAVAILABLE: { status: 503, code: 'SERVICE_UNAVAILABLE' }
})

function badRequest (message = 'Requête invalide', code = ERROR_CODES.BAD_REQUEST.code) {
  return new AppError(message, 400, code)
}

function validationError (message = 'Données invalides') {
  return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR.code)
}

function unauthorized (message = 'Authentification requise') {
  return new AppError(message, 401, ERROR_CODES.UNAUTHORIZED.code)
}

function forbidden (message = 'Accès refusé') {
  return new AppError(message, 403, ERROR_CODES.FORBIDDEN.code)
}

function notFound (message = 'Ressource introuvable') {
  return new AppError(message, 404, ERROR_CODES.NOT_FOUND.code)
}

function conflict (message = 'Conflit avec l’état actuel') {
  return new AppError(message, 409, ERROR_CODES.CONFLICT.code)
}

function unprocessableEntity (message = 'Traitement impossible') {
  return new AppError(message, 422, ERROR_CODES.UNPROCESSABLE_ENTITY.code)
}

function tooManyRequests (message = 'Trop de requêtes') {
  return new AppError(message, 429, ERROR_CODES.TOO_MANY_REQUESTS.code)
}

function internalError (message = 'Erreur interne du serveur') {
  return new AppError(message, 500, ERROR_CODES.INTERNAL_ERROR.code)
}

function serviceUnavailable (message = 'Service temporairement indisponible') {
  return new AppError(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE.code)
}

module.exports = {
  AppError,
  ERROR_CODES,
  badRequest,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalError,
  serviceUnavailable
}
