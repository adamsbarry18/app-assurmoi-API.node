const userRoutes = require('./users')

function initRoutes (app) {
  app.use('/api/users', userRoutes)

  app.get('/', (req, res, next) => {
    console.log('middleware 1 homepage')
    next()
  }, (req, res) => {
    console.log('Controller homepage')
    res.status(200).json({
      message: "Bienvenue sur l'API AssurMoi",
      docs: '/api/users'
    })
  })
}

module.exports = initRoutes
