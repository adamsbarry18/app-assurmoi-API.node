/**
 * Point d’entrée HTTP — charge l’environnement puis l’application Express (`src/app.js`).
 */
require('dotenv').config()
const app = require('./src/app')
const logger = require('./src/core/logger')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  logger.info('Serveur démarré', { port: PORT })
  logger.info(`API disponible sur http://localhost:${PORT}/api`)
  logger.info(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`)
})
