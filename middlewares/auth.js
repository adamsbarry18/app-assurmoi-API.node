const { verifyAccessToken } = require('../config/authTokens')
const { unauthorized, forbidden } = require('../core/errors')

/**
 * JWT **access** dans `Authorization: Bearer <token>` (schéma Bearer standard).
 */
function authenticate (req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(unauthorized('Token manquant'))
  }
  const token = auth.slice(7).trim()
  if (!token) {
    return next(unauthorized('Token manquant'))
  }
  try {
    const payload = verifyAccessToken(token)
    if (payload.typ !== 'access') {
      return next(unauthorized('Token invalide'))
    }
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    return next(unauthorized('Token invalide ou expiré'))
  }
}

function requireRoles (...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized())
    }
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Rôle insuffisant'))
    }
    next()
  }
}

module.exports = { authenticate, requireRoles }
