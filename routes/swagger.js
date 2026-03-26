const path = require('path')
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const { loadOpenApiSpec } = require('../config/openapi')

const router = express.Router()

const swaggerUiOptions = {
  customSiteTitle: 'AssurMoi API — Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
}

router.get('/openapi.yml', (req, res) => {
  res.type('application/yaml').sendFile(path.resolve(__dirname, '..', 'docs', 'openapi.yml'))
})

// Recharge openapi.yml à chaque requête : évite d’afficher une spec obsolète après édition sans redémarrage.
router.use('/', swaggerUi.serve, (req, res, next) => {
  const spec = loadOpenApiSpec()
  swaggerUi.setup(spec, swaggerUiOptions)(req, res, next)
})

module.exports = router
