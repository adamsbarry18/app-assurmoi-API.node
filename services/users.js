const { Op } = require('sequelize')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { User, Invitation, dbInstance } = require('../models')
const { signPasswordResetToken } = require('../config/authTokens')
const { mailInsuredFirstAccess } = require('../utils/mailer')
const { logError } = require('../core/logError')
const { ERROR_CODES } = require('../core/errors')
const { recordHistory, HISTORY_ACTION } = require('./historyAudit')

const BCRYPT_ROUNDS = 12

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS)

const sanitizeUser = (user) => {
  if (!user) return null
  const dataUser = typeof user.toJSON === 'function' ? user.toJSON() : user
  delete dataUser.password_hash
  delete dataUser.session_token
  delete dataUser.refresh_token
  delete dataUser.two_factor_code
  if (dataUser.password_pending == null) {
    dataUser.password_pending = false
  }
  return dataUser
}

function parseListPagination (query) {
  const rawLimit = query.limit
  const rawOffset = query.offset
  let limit = Number.parseInt(String(rawLimit ?? '20'), 10)
  let offset = Number.parseInt(String(rawOffset ?? '0'), 10)
  if (Number.isNaN(limit) || limit < 1) limit = 20
  if (limit > 100) limit = 100
  if (Number.isNaN(offset) || offset < 0) offset = 0
  return { limit, offset }
}

const formatListUser = (u) => ({ kind: 'user', ...sanitizeUser(u) })

const formatListInvitation = (inv) => {
  const j = inv.toJSON ? inv.toJSON() : inv
  return {
    kind: 'invitation',
    id: j.id,
    email: j.email,
    role: j.role,
    status: j.status,
    username: null,
    first_name: null,
    last_name: null,
    is_active: null,
    created_at: j.created_at,
    updated_at: j.updated_at
  }
}

const STAFF_ROLES = ['ADMIN', 'PORTFOLIO_MANAGER', 'TRACKING_OFFICER', 'CUSTOMER_OFFICER']

const getAllUsers = async (req, res) => {
  try {
    const { limit, offset } = parseListPagination(req.query)
    const where = {}
    const isActiveQ = req.query.is_active
    const userScope = req.query.user_scope

    if (req.query.search) {
      const term = `%${req.query.search}%`
      where[Op.or] = [
        { username: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } }
      ]
    }
    if (userScope === 'insured') {
      where.role = 'INSURED'
    } else if (userScope === 'staff') {
      where.role = { [Op.in]: STAFF_ROLES }
    } else if (req.query.role !== undefined) {
      where.role = req.query.role
    }
    if (isActiveQ !== undefined) {
      where.is_active = isActiveQ === 'true'
    }

    if (isActiveQ === 'true') {
      const { rows, count } = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']]
      })
      return res.status(200).json({
        data: rows.map(formatListUser),
        meta: { total: count, limit, offset }
      })
    }

    const invWhere = { status: 'pending' }
    if (userScope === 'insured') {
      invWhere.role = 'INSURED'
    } else if (userScope === 'staff') {
      invWhere.role = { [Op.in]: STAFF_ROLES }
    } else if (req.query.role !== undefined) {
      invWhere.role = req.query.role
    }
    if (req.query.search) {
      const term = `%${req.query.search}%`
      invWhere.email = { [Op.like]: term }
    }

    const [usersList, invList] = await Promise.all([
      User.findAll({ where, order: [['created_at', 'DESC']] }),
      isActiveQ === 'false' || isActiveQ === undefined
        ? Invitation.findAll({ where: invWhere, order: [['created_at', 'DESC']] })
        : Promise.resolve([])
    ])

    const merged = [
      ...usersList.map((u) => ({ sortAt: u.created_at, item: () => formatListUser(u) })),
      ...invList.map((i) => ({ sortAt: i.created_at, item: () => formatListInvitation(i) }))
    ].sort(
      (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
    )

    const total = merged.length
    const page = merged.slice(offset, offset + limit)
    return res.status(200).json({
      data: page.map((e) => e.item()),
      meta: { total, limit, offset }
    })
  } catch (err) {
    return logError(res, err, {
      context: 'users.getAllUsers',
      defaultMessage: 'Erreur lors de la récupération des utilisateurs'
    })
  }
}

/** Même périmètre que GET /api/users (annuaire) : lecture fiche d’un autre compte. */
const ROLES_CAN_VIEW_ANY_USER_PROFILE = ['ADMIN', 'PORTFOLIO_MANAGER', 'CUSTOMER_OFFICER']

const getUser = async (req, res) => {
  try {
    const id = req.params.id
    const canViewOthers = ROLES_CAN_VIEW_ANY_USER_PROFILE.includes(req.user.role)
    if (!canViewOthers && Number(req.user.id) !== Number(id)) {
      return res.status(ERROR_CODES.FORBIDDEN.status).json({
        message: 'Vous ne pouvez consulter que votre propre profil',
        code: ERROR_CODES.FORBIDDEN.code
      })
    }
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    return res.status(200).json({ data: sanitizeUser(user) })
  } catch (err) {
    return logError(res, err, {
      context: 'users.getUser',
      defaultMessage: 'Erreur lors de la récupération de l’utilisateur'
    })
  }
}

/**
 * Compte assuré créé par l’équipe : profil connu, mot de passe défini par l’assuré via e-mail
 * si `send_welcome_email` est true (même mécanisme que la réinitialisation, flag password_pending).
 */
const provisionInsuredUser = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const {
      username,
      first_name: firstName,
      last_name: lastName,
      email
    } = req.body
    const sendWelcomeEmail = req.body.send_welcome_email === true

    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
      transaction
    })
    if (existing) {
      await transaction.rollback()
      return res.status(ERROR_CODES.CONFLICT.status).json({
        message: 'Username ou email déjà utilisé',
        code: ERROR_CODES.CONFLICT.code
      })
    }

    const provisionalPassword = crypto.randomBytes(32).toString('hex')
    const password_hash = await hashPassword(provisionalPassword)

    const created = await User.create(
      {
        username,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        email,
        password_hash,
        role: 'INSURED',
        is_active: true,
        password_pending: true
      },
      { transaction }
    )

    if (sendWelcomeEmail) {
      const token = signPasswordResetToken(created.id)
      const base = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
      const link = `${base}/reset-password?token=${encodeURIComponent(token)}`
      let scheme = (process.env.MOBILE_APP_SCHEME || 'assurmoiapp').trim()
      scheme = scheme.replace(/:\/\/.*/, '').replace(/\/$/, '')
      const mobileLink = `${scheme}://reset-password?token=${encodeURIComponent(token)}`
      try {
        await mailInsuredFirstAccess(created, link, mobileLink)
      } catch (mailErr) {
        await transaction.rollback()
        return logError(res, mailErr, {
          context: 'users.provisionInsuredUser',
          defaultMessage: 'Compte créé mais envoi e-mail échoué : réessayez (renvoi du lien).'
        })
      }
    }

    await transaction.commit()
    await recordHistory({
      userId: req.user.id,
      entityType: 'user',
      entityId: created.id,
      action: HISTORY_ACTION.USER_CREATED
    })
    return res.status(201).json({
      message: sendWelcomeEmail
        ? 'Compte assuré créé. Un e-mail a été envoyé pour définir le mot de passe (premier accès).'
        : 'Compte assuré créé. Aucun e-mail envoyé : utilisez « Renvoyer e-mail 1er accès » sur la fiche quand l’assuré doit accéder à l’espace.',
      data: sanitizeUser(created)
    })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'users.provisionInsuredUser',
      defaultMessage: 'Erreur lors de la création du compte assuré'
    })
  }
}

const resendInsuredWelcome = async (req, res) => {
  try {
    const id = req.params.id
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    if (user.role !== 'INSURED' || !user.password_pending) {
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message: 'Renvoi réservé à un compte assuré en attente de premier mot de passe',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }
    const token = signPasswordResetToken(user.id)
    const base = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const link = `${base}/reset-password?token=${encodeURIComponent(token)}`
    let scheme = (process.env.MOBILE_APP_SCHEME || 'assurmoiapp').trim()
    scheme = scheme.replace(/:\/\/.*/, '').replace(/\/$/, '')
    const mobileLink = `${scheme}://reset-password?token=${encodeURIComponent(token)}`
    try {
      await mailInsuredFirstAccess(user, link, mobileLink)
    } catch (mailErr) {
      return logError(res, mailErr, {
        context: 'users.resendInsuredWelcome',
        defaultMessage: "Erreur d'envoi e-mail"
      })
    }
    return res.status(200).json({ message: 'E-mail de premier accès renvoyé' })
  } catch (err) {
    return logError(res, err, {
      context: 'users.resendInsuredWelcome',
      defaultMessage: 'Erreur lors du renvoi'
    })
  }
}

const createUser = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role,
      is_active: isActive
    } = req.body

    const password_hash = await hashPassword(password)

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      },
      transaction
    })
    if (user) {
      await transaction.rollback()
      return res.status(ERROR_CODES.CONFLICT.status).json({
        message: 'Username ou email déjà utilisé',
        code: ERROR_CODES.CONFLICT.code
      })
    }

    const created = await User.create(
      {
        username,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        email,
        password_hash,
        role,
        is_active: isActive !== undefined ? Boolean(isActive) : true
      },
      { transaction }
    )

    await transaction.commit()
    await recordHistory({
      userId: req.user.id,
      entityType: 'user',
      entityId: created.id,
      action: HISTORY_ACTION.USER_CREATED
    })
    return res.status(201).json({ data: sanitizeUser(created) })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'users.createUser',
      defaultMessage: 'Erreur lors de la création de l’utilisateur'
    })
  }
}

const updateUser = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const userId = req.params.id
    const user = await User.findByPk(userId, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    const isAdmin = req.user.role === 'ADMIN'
    const isSelf = Number(req.user.id) === Number(userId)
    if (!isAdmin && !isSelf) {
      await transaction.rollback()
      return res.status(ERROR_CODES.FORBIDDEN.status).json({
        message: 'Mise à jour non autorisée',
        code: ERROR_CODES.FORBIDDEN.code
      })
    }

    const {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role,
      is_active: isActive
    } = req.body

    if (!isAdmin) {
      if (
        username !== undefined ||
        email !== undefined ||
        role !== undefined ||
        isActive !== undefined
      ) {
        await transaction.rollback()
        return res.status(ERROR_CODES.FORBIDDEN.status).json({
          message:
            'Vous ne pouvez modifier que votre prénom, nom et mot de passe',
          code: ERROR_CODES.FORBIDDEN.code
        })
      }
    }

    const updates = {}
    if (username !== undefined) updates.username = username
    if (email !== undefined) updates.email = email
    if (firstName !== undefined) updates.first_name = firstName
    if (lastName !== undefined) updates.last_name = lastName
    if (role !== undefined) updates.role = role
    if (isActive !== undefined) updates.is_active = Boolean(isActive)
    if (password !== undefined) {
      updates.password_hash = await hashPassword(password)
      updates.password_pending = false
    }

    if (Object.keys(updates).length === 0) {
      await transaction.rollback()
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Aucun champ à mettre à jour',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }

    if (updates.username || updates.email) {
      const or = []
      if (updates.username) or.push({ username: updates.username })
      if (updates.email) or.push({ email: updates.email })
      const conflict = await User.findOne({
        where: {
          id: { [Op.ne]: userId },
          [Op.or]: or
        },
        transaction
      })
      if (conflict) {
        await transaction.rollback()
        return res.status(ERROR_CODES.CONFLICT.status).json({
          message: 'Username ou email déjà utilisé',
          code: ERROR_CODES.CONFLICT.code
        })
      }
    }

    await user.update(updates, { transaction })
    await transaction.commit()

    const refreshed = await User.findByPk(userId)
    await recordHistory({
      userId: req.user.id,
      entityType: 'user',
      entityId: Number(userId),
      action: HISTORY_ACTION.USER_UPDATED
    })
    return res.status(200).json({ data: sanitizeUser(refreshed) })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'users.updateUser',
      defaultMessage: 'Erreur lors de la mise à jour'
    })
  }
}

const deleteUser = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const user_id = req.params.id

    const status = await User.destroy({
      where: { id: user_id },
      transaction
    })

    await transaction.commit()
    await recordHistory({
      userId: req.user.id,
      entityType: 'user',
      entityId: Number(user_id),
      action: HISTORY_ACTION.USER_DELETED
    })
    return res.status(200).json({
      message: 'Successfuly deleted',
      status
    })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'users.deleteUser',
      defaultMessage: 'Erreur lors de la suppression'
    })
  }
}

const deactivateUser = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const userId = req.params.id
    const user = await User.findByPk(userId, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    await user.update({ is_active: false }, { transaction })
    await transaction.commit()

    const refreshed = await User.findByPk(userId)
    await recordHistory({
      userId: req.user.id,
      entityType: 'user',
      entityId: Number(userId),
      action: HISTORY_ACTION.USER_DEACTIVATED
    })
    return res.status(200).json({
      message: 'Utilisateur désactivé',
      data: sanitizeUser(refreshed)
    })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'users.deactivateUser',
      defaultMessage: 'Erreur lors de la désactivation'
    })
  }
}

const activateUser = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const userId = req.params.id
    const user = await User.findByPk(userId, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Utilisateur introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    await user.update({ is_active: true }, { transaction })
    await transaction.commit()

    const refreshed = await User.findByPk(userId)
    await recordHistory({
      userId: req.user.id,
      entityType: 'user',
      entityId: Number(userId),
      action: HISTORY_ACTION.USER_ACTIVATED
    })
    return res.status(200).json({
      message: 'Utilisateur réactivé',
      data: sanitizeUser(refreshed)
    })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'users.activateUser',
      defaultMessage: 'Erreur lors de la réactivation'
    })
  }
}

/**
 * Assurés actifs (liste courte pour raccourcis métier : rattachement sinistre, etc.).
 */
const listInsuredOptions = async (req, res) => {
  try {
    const rawLimit = req.query.limit
    let limit = Number.parseInt(String(rawLimit ?? '100'), 10)
    if (Number.isNaN(limit) || limit < 1) limit = 100
    if (limit > 200) limit = 200

    const where = {
      role: 'INSURED',
      is_active: true,
      password_pending: false
    }

    if (req.query.search && String(req.query.search).trim() !== '') {
      const term = `%${String(req.query.search).trim()}%`
      where[Op.or] = [
        { username: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } }
      ]
    }

    const rows = await User.findAll({
      where,
      attributes: [
        'id',
        'username',
        'email',
        'first_name',
        'last_name',
        'role',
        'is_active'
      ],
      order: [
        ['last_name', 'ASC'],
        ['first_name', 'ASC'],
        ['id', 'ASC']
      ],
      limit
    })

    return res.status(200).json({
      data: rows.map((u) => sanitizeUser(u))
    })
  } catch (err) {
    return logError(res, err, {
      context: 'users.listInsuredOptions',
      defaultMessage: 'Erreur lors de la liste des assurés'
    })
  }
}

/**
 * Admins et chargés de suivi actifs (affectation dossier : rôles TRACKING_OFFICER ou ADMIN côté API).
 */
const listTrackingOfficerOptions = async (req, res) => {
  try {
    const rawLimit = req.query.limit
    let limit = Number.parseInt(String(rawLimit ?? '100'), 10)
    if (Number.isNaN(limit) || limit < 1) limit = 100
    if (limit > 200) limit = 200

    const where = {
      role: { [Op.in]: ['TRACKING_OFFICER', 'ADMIN'] },
      is_active: true
    }

    if (req.query.search && String(req.query.search).trim() !== '') {
      const term = `%${String(req.query.search).trim()}%`
      where[Op.or] = [
        { username: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } }
      ]
    }

    const rows = await User.findAll({
      where,
      attributes: [
        'id',
        'username',
        'email',
        'first_name',
        'last_name',
        'role',
        'is_active'
      ],
      order: [
        ['role', 'ASC'],
        ['last_name', 'ASC'],
        ['first_name', 'ASC'],
        ['id', 'ASC']
      ],
      limit
    })

    return res.status(200).json({
      data: rows.map((u) => sanitizeUser(u))
    })
  } catch (err) {
    return logError(res, err, {
      context: 'users.listTrackingOfficerOptions',
      defaultMessage: 'Erreur lors de la liste des chargés de suivi'
    })
  }
}

module.exports = {
  getAllUsers,
  getUser,
  listInsuredOptions,
  listTrackingOfficerOptions,
  createUser,
  provisionInsuredUser,
  resendInsuredWelcome,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  sanitizeUser,
  hashPassword
}
