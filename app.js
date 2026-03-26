const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const initRoutes = require('./routes')
const swaggerRoutes = require('./routes/swagger')
const logger = require('./core/logger')
const { requestLogger } = require('./middlewares/requestLogger')
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler')

// Configuration du port
const PORT = process.env.PORT || 3000

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json())
// Middleware pour gérer les requêtes CORS
app.use(
  cors({
    credentials: true,
    origin: ['http://example.com', '*']
  })
)

// Middleware pour logger les requêtes
app.use(requestLogger)

// Routes
initRoutes(app)

// Routes pour la documentation Swagger
app.use('/api-docs', swaggerRoutes)

// Middleware pour gérer les erreurs 404

// Middleware pour gérer les erreurs
app.use(notFoundHandler)
app.use(errorHandler)

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info('Serveur démarré', { port: PORT })
})

module.exports = app;
