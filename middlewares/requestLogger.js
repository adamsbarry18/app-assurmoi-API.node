const logger = require('../core/logger')

let serviceName = process.env.APP_NAME
if (!serviceName) {
  try {
    serviceName = require('../package.json').name
  } catch {
    serviceName = 'api'
  }
}

/**
 * Log une ligne JSON par requête terminée (méthode, route, statut, durée, env, service).
 */
function requestLogger (req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    logger.info('http.request', {
      env: process.env.NODE_ENV || 'development',
      service: serviceName,
      method: req.method,
      route: req.originalUrl || req.url,
      status: res.statusCode,
      ms: Date.now() - start,
      ip: req.ip || req.socket?.remoteAddress
    })
  })
  next()
}

module.exports = { requestLogger }
