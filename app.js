/**
 * Compatibilité : exporte l’app Express **sans** lancer l’écoute (tests, scripts).
 * Pour démarrer l’API : `node server.js` ou `npm start`.
 */
module.exports = require('./src/app')
