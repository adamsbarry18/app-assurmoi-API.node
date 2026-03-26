const jwt = require('jsonwebtoken')

const ACCESS_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
const RESET_SECRET = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m'
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d'
const RESET_EXPIRES = process.env.JWT_RESET_EXPIRES || '1h'
const INVITE_EXPIRES = process.env.JWT_INVITE_EXPIRES || '7d'

function assertSecrets () {
  if (!ACCESS_SECRET || ACCESS_SECRET.length < 16) {
    throw new Error('JWT_SECRET doit être défini (min. 16 caractères)')
  }
}

function signAccessToken (user) {
  assertSecrets()
  return jwt.sign(
    { sub: user.id, role: user.role, typ: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  )
}

function signRefreshToken (user) {
  assertSecrets()
  return jwt.sign(
    { sub: user.id, typ: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  )
}

function signPasswordResetToken (userId) {
  assertSecrets()
  return jwt.sign(
    { sub: userId, typ: 'pwd_reset' },
    RESET_SECRET,
    { expiresIn: RESET_EXPIRES }
  )
}

function signInviteToken (email, role) {
  assertSecrets()
  return jwt.sign(
    { email, role, typ: 'invite' },
    RESET_SECRET,
    { expiresIn: INVITE_EXPIRES }
  )
}

function verifyAccessToken (token) {
  return jwt.verify(token, ACCESS_SECRET)
}

function verifyRefreshToken (token) {
  return jwt.verify(token, REFRESH_SECRET)
}

function verifyPasswordResetToken (token) {
  return jwt.verify(token, RESET_SECRET)
}

function verifyInviteToken (token) {
  return jwt.verify(token, RESET_SECRET)
}

/** Durée d’expiration de l’access token en secondes (approximation pour le client). */
function accessExpiresInSeconds () {
  const m = /^(\d+)([smhd])$/.exec(String(ACCESS_EXPIRES).trim())
  if (!m) return 900
  const n = Number(m[1])
  const u = m[2]
  const mult = u === 's' ? 1 : u === 'm' ? 60 : u === 'h' ? 3600 : 86400
  return n * mult
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  signInviteToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  verifyInviteToken,
  accessExpiresInSeconds
}
