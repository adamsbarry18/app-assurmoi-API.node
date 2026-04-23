const path = require('path')
const userRoutes = require('./users')
const authRoutes = require('./auth')
const sinisterRoutes = require('./sinisters')
const documentRoutes = require('./documents')
const folderRoutes = require('./folders')
const historyRoutes = require('./history')
const notificationRoutes = require('./notifications')
const logger = require('../core/logger')

const templatesDir = path.join(__dirname, '..', 'templates')

function initRoutes (app) {
  /** Pages HTML (liens e-mail : invitation, reset mot de passe) — voir /templates */
  app.get('/register', (req, res) => {
    res.sendFile(path.join(templatesDir, 'register.html'))
  })
  app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(templatesDir, 'reset-password.html'))
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/sinisters', sinisterRoutes)
  app.use('/api/documents', documentRoutes)
  app.use('/api/folders', folderRoutes)
  app.use('/api/history', historyRoutes)
  app.use('/api/notifications', notificationRoutes)

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
      history: '/api/history',
      notifications: '/api/notifications'
    })
  })
}

module.exports = initRoutes
