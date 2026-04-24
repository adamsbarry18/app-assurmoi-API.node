const fs = require('fs')
const yaml = require('js-yaml')
const { docs: docsPath } = require('./paths')

function loadOpenApiSpec () {
  const file = docsPath('openapi.yml')
  const raw = fs.readFileSync(file, 'utf8')
  return yaml.load(raw)
}

module.exports = { loadOpenApiSpec }
