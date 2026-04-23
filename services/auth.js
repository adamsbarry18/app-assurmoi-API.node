const { Op } = require('sequelize')
const bcrypt = require('bcryptjs')
const { User, Invitation, dbInstance } = require('../models')
const {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  signInviteToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  verifyInviteToken,
  accessExpiresInSeconds
} = require('../config/authTokens')
const { mailLogin, mailForgotPassword, mailInvitation } = require('../utils/mailer')
const { sanitizeUser, hashPassword } = require('./users')
const { logError } = require('../core/logError')
const { ERROR_CODES } = require('../core/errors')

const login = async (req, res) => {
  try {
    const { email: loginId, password } = req.body
    const user = await User.unscoped().findOne({
      where: {
        [Op.or]: [{ email: loginId }, { username: loginId }]
      }
    })
    if (!user || !user.is_active) {
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        message: 'Identifiants invalides',
        code: ERROR_CODES.UNAUTHORIZED.code
      })
    }
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        message: 'Identifiants invalides',
        code: ERROR_CODES.UNAUTHORIZED.code
      })
    }
    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)
    await user.update({ refresh_token: refreshToken })
    const plain = sanitizeUser(await User.findByPk(user.id))
    const mailStatus = await mailLogin(user)
    if (mailStatus !== true) console.log('Notification email non envoyée')
    return res.status(200).json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresInSeconds(),
      user: plain
    })
  } catch (err) {
    return logError(res, err, {
      context: 'auth.login',
      defaultMessage: 'Erreur de connexion'
    })
  }
}

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        message: 'Refresh token invalide ou expiré',
        code: ERROR_CODES.UNAUTHORIZED.code
      })
    }
    if (payload.typ !== 'refresh') {
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        message: 'Refresh token invalide',
        code: ERROR_CODES.UNAUTHORIZED.code
      })
    }
    const user = await User.unscoped().findByPk(payload.sub)
    if (!user || !user.is_active) {
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        message: 'Utilisateur invalide',
        code: ERROR_CODES.UNAUTHORIZED.code
      })
    }
    if (user.refresh_token !== refreshToken) {
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        message: 'Session révoquée',
        code: ERROR_CODES.UNAUTHORIZED.code
      })
    }
    const accessToken = signAccessToken(user)
    const newRefresh = signRefreshToken(user)
    await user.update({ refresh_token: newRefresh })
    return res.status(200).json({
      accessToken,
      refreshToken: newRefresh,
      tokenType: 'Bearer',
      expiresIn: accessExpiresInSeconds()
    })
  } catch (err) {
    return logError(res, err, {
      context: 'auth.refresh',
      defaultMessage: 'Erreur lors du rafraîchissement du token'
    })
  }
}

const logout = async (req, res) => {
  try {
    const user = await User.unscoped().findByPk(req.user.id)
    if (user) {
      await user.update({ refresh_token: null })
    }
    return res.status(204).send()
  } catch (err) {
    return logError(res, err, {
      context: 'auth.logout',
      defaultMessage: 'Erreur lors de la déconnexion'
    })
  }
}

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    return res.status(200).json({ data: sanitizeUser(user) })
  } catch (err) {
    return logError(res, err, {
      context: 'auth.me',
      defaultMessage: 'Erreur lors de la récupération du profil'
    })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ where: { email } })
    if (user && user.is_active) {
      const token = signPasswordResetToken(user.id)
      const base = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(
        /\/$/,
        ''
      )
      const link = `${base}/reset-password?token=${encodeURIComponent(token)}`
      let scheme = (process.env.MOBILE_APP_SCHEME || 'assurmoiapp').trim()
      scheme = scheme.replace(/:\/\/.*/, '').replace(/\/$/, '')
      const mobileLink = `${scheme}://reset-password?token=${encodeURIComponent(token)}`
      try {
        await mailForgotPassword(user, link, mobileLink)
      } catch {
        console.log('Notification email non envoyée')
      }
    }
    return res.status(200).json({
      message:
        'Si un compte correspond à cet email, un message avec les instructions a été envoyé.'
    })
  } catch (err) {
    return logError(res, err, {
      context: 'auth.forgotPassword',
      defaultMessage: 'Erreur lors de la demande'
    })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body
    let payload
    try {
      payload = verifyPasswordResetToken(token)
    } catch {
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Lien invalide ou expiré',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    if (payload.typ !== 'pwd_reset') {
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Token invalide',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    const user = await User.unscoped().findByPk(payload.sub)
    if (!user || !user.is_active) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    const password_hash = await hashPassword(password)
    await user.update({ password_hash, refresh_token: null })
    return res.status(200).json({ message: 'Mot de passe mis à jour' })
  } catch (err) {
    return logError(res, err, {
      context: 'auth.resetPassword',
      defaultMessage: 'Erreur lors de la réinitialisation'
    })
  }
}

const sendInvitation = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const { email, role } = req.body
    const existing = await User.findOne({ where: { email }, transaction })
    if (existing) {
      await transaction.rollback()
      return res.status(ERROR_CODES.CONFLICT.status).json({
        message: 'Un compte existe déjà avec cet email',
        code: ERROR_CODES.CONFLICT.code
      })
    }
    const pending = await Invitation.findOne({
      where: { email, status: 'pending' },
      transaction
    })
    if (pending) {
      await transaction.rollback()
      return res.status(ERROR_CODES.CONFLICT.status).json({
        message: 'Une invitation est déjà en attente pour cet email',
        code: ERROR_CODES.CONFLICT.code
      })
    }
    const inv = await Invitation.create(
      { email, role, status: 'pending' },
      { transaction }
    )
    const inviteToken = signInviteToken(email, role)
    const base = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(
      /\/$/,
      ''
    )
    const link = `${base}/register?token=${encodeURIComponent(inviteToken)}`
    try {
      await mailInvitation({ email, role, link })
    } catch (mailErr) {
      await transaction.rollback()
      throw mailErr
    }
    await transaction.commit()
    return res.status(200).json({
      message: 'Invitation envoyée',
      data: { id: inv.id, email: inv.email, role: inv.role, status: inv.status }
    })
  } catch (err) {
    try {
      await transaction.rollback()
    } catch (_) {}
    return logError(res, err, {
      context: 'auth.sendInvitation',
      defaultMessage: "Erreur lors de l'envoi de l'invitation"
    })
  }
}

const resendInvitation = async (req, res) => {
  try {
    const id = req.params.id
    const inv = await Invitation.findByPk(id)
    if (!inv) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Invitation introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    if (inv.status !== 'pending') {
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Seule une invitation en attente peut être renvoyée',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    const { email, role } = inv
    const inviteToken = signInviteToken(email, role)
    const base = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(
      /\/$/,
      ''
    )
    const link = `${base}/register?token=${encodeURIComponent(inviteToken)}`
    await mailInvitation({ email, role, link })
    return res.status(200).json({ message: 'Invitation renvoyée' })
  } catch (err) {
    return logError(res, err, {
      context: 'auth.resendInvitation',
      defaultMessage: "Erreur lors de l'envoi de l'invitation"
    })
  }
}

const cancelInvitation = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const id = req.params.id
    const inv = await Invitation.findByPk(id, { transaction })
    if (!inv) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Invitation introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    if (inv.status !== 'pending') {
      await transaction.rollback()
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: "L'invitation n'est plus en attente",
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    await inv.update({ status: 'cancelled' }, { transaction })
    await transaction.commit()
    return res.status(200).json({ message: 'Invitation annulée' })
  } catch (err) {
    try {
      await transaction.rollback()
    } catch (_) {}
    return logError(res, err, {
      context: 'auth.cancelInvitation',
      defaultMessage: "Erreur lors de l'annulation"
    })
  }
}

const completeInvite = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const { token, username, password, first_name: firstName, last_name: lastName } =
      req.body
    let payload
    try {
      payload = verifyInviteToken(token)
    } catch {
      await transaction.rollback()
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Invitation invalide ou expirée',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    if (payload.typ !== 'invite') {
      await transaction.rollback()
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Token invalide',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }
    const email = payload.email
    const role = payload.role
    const dup = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      },
      transaction
    })
    if (dup) {
      await transaction.rollback()
      return res.status(ERROR_CODES.CONFLICT.status).json({
        message: 'Email ou nom d’utilisateur déjà utilisé',
        code: ERROR_CODES.CONFLICT.code
      })
    }
    const password_hash = await hashPassword(password)
    const created = await User.create(
      {
        username,
        email,
        password_hash,
        role,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        is_active: true
      },
      { transaction }
    )
    await Invitation.update(
      { status: 'accepted' },
      { where: { email, status: 'pending' }, transaction }
    )
    const accessToken = signAccessToken(created)
    const refreshToken = signRefreshToken(created)
    await created.update({ refresh_token: refreshToken }, { transaction })
    await transaction.commit()
    const plain = sanitizeUser(await User.findByPk(created.id))
    return res.status(201).json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresInSeconds(),
      user: plain
    })
  } catch (err) {
    try {
      await transaction.rollback()
    } catch (_) {}
    return logError(res, err, {
      context: 'auth.completeInvite',
      defaultMessage: "Erreur lors de la création du compte"
    })
  }
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  sendInvitation,
  resendInvitation,
  cancelInvitation,
  completeInvite
}
