const userRoutes = require('./users')
const logger = require('../core/logger')

function initRoutes (app) {
  app.use('/api/users', userRoutes)

  app.get('/', (req, res, next) => {
    logger.debug('GET /')
    next()
  }, (req, res) => {
    res.status(200).json({
      message: "Bienvenue sur l'API AssurMoi",
      docs: '/api/users'
    })
  })
}

module.exports = initRoutes
