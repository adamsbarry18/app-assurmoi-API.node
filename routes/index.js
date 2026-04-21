const userRoutes = require('./users')
const authRoutes = require('./auth')
const sinisterRoutes = require('./sinisters')
const documentRoutes = require('./documents')
const folderRoutes = require('./folders')
const historyRoutes = require('./history')
const logger = require('../core/logger')

function initRoutes (app) {
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/sinisters', sinisterRoutes)
  app.use('/api/documents', documentRoutes)
  app.use('/api/folders', folderRoutes)
  app.use('/api/history', historyRoutes)

  app.get('/', (req, res, next) => {
    logger.debug('GET /')
    next()
  }, (req, res) => {
    res.status(200).json({
      message: "Bienvenue sur l'API AssurMoi",
      docs: '/api-docs',
      auth: '/api/auth',
      users: '/api/users',
      sinisters: '/api/sinisters',
      documents: '/api/documents',
      folders: '/api/folders',
      history: '/api/history'
    })
  })
}

module.exports = initRoutes
