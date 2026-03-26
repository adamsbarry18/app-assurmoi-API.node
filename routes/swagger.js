const path = require('path')
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const { loadOpenApiSpec } = require('../config/openapi')

const router = express.Router()
const spec = loadOpenApiSpec()

router.get('/openapi.yml', (req, res) => {
  res.type('application/yaml').sendFile(path.resolve(__dirname, '..', 'docs', 'openapi.yml'))
})

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(spec, {
    customSiteTitle: 'AssurMoi API — Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  })
)

module.exports = router
