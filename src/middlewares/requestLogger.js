const logger = require('../core/logger')

function requestLogger (req, res, next) {
  const start = Date.now()
  const ip = req.ip ?? req.socket?.remoteAddress

  res.on('finish', () => {
    const originalUrl = req.originalUrl
    if (originalUrl?.startsWith('/api-docs')) {
      return
    }

    const duration = Date.now() - start
    const { statusCode } = res
    const host = req.headers.host ?? process.env.HOST ?? 'localhost'
    const protocol = req.protocol || 'http'
    const apiUrl = (process.env.API_URL || '').trim()
    const baseUrl = apiUrl
      ? apiUrl.replace(/\/$/, '')
      : `${protocol}://${host}`
    const fullUrl = `${baseUrl}${originalUrl || req.url}`
    const httpVersion = req.httpVersion || '1.1'
    const logMessage = `${ip} - "${req.method} ${fullUrl} HTTP/${httpVersion}" ${statusCode} ${duration}ms`

    if (statusCode >= 500) {
      logger.plain('error', logMessage)
    } else if (statusCode >= 400) {
      logger.plain('warn', logMessage)
    } else {
      logger.plain('info', logMessage)
    }
  })

  next()
}

module.exports = { requestLogger }
