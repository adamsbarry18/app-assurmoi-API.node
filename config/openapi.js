const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

function loadOpenApiSpec () {
  const file = path.join(__dirname, '..', 'docs', 'openapi.yml')
  const raw = fs.readFileSync(file, 'utf8')
  return yaml.load(raw)
}

module.exports = { loadOpenApiSpec }
