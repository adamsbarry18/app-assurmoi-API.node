const path = require('path')

/** Racine du dépôt (dossier contenant `docs/`, `templates/`, `uploads/`, `server.js`). */
const REPO_ROOT = path.join(__dirname, '..', '..')

function docs (...segments) {
  return path.join(REPO_ROOT, 'docs', ...segments)
}

function templates (...segments) {
  return path.join(REPO_ROOT, 'templates', ...segments)
}

function uploads (...segments) {
  return path.join(REPO_ROOT, 'uploads', ...segments)
}

module.exports = { REPO_ROOT, docs, templates, uploads }
