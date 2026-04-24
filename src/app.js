const express = require('express')
const app = express()
const cors = require('cors')
const initRoutes = require('./routes')
const swaggerRoutes = require('./routes/swagger')
const logger = require('./core/logger')
const { requestLogger } = require('./middlewares/requestLogger')
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler')

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn(
    '[app] JWT_SECRET manquant ou trop court (min. 16 car.) — /api/auth échouera.'
  )
}

app.use(express.json())
app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:8081', '*']
  })
)

app.use(requestLogger)
initRoutes(app)
app.use('/api-docs', swaggerRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
