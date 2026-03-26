const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const initRoutes = require('./routes')
const logger = require('./core/logger')
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler')

const PORT = process.env.PORT || 3000
app.use(express.json())
app.use(
  cors({
    credentials: true,
    origin: ['http://example.com', '*']
  })
)

initRoutes(app)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info('Serveur démarré', { port: PORT })
})

module.exports = app;
