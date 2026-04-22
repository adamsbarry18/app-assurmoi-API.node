const { Op } = require('sequelize')
const bcrypt = require('bcryptjs')
const { User, dbInstance } = require('../models')
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

const getAllUsers = async (req, res) => {
  try {
    const { limit, offset } = parseListPagination(req.query)
    const where = {}

    if (req.query.search) {
      const term = `%${req.query.search}%`
      where[Op.or] = [
        { username: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } }
      ]
    }
    if (req.query.role !== undefined) {
      where.role = req.query.role
    }
    if (req.query.is_active !== undefined) {
      where.is_active = req.query.is_active === 'true'
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      data: rows.map(sanitizeUser),
      meta: { total: count, limit, offset }
    })
  } catch (err) {
    return logError(res, err, {
      context: 'users.getAllUsers',
      defaultMessage: 'Erreur lors de la récupération des utilisateurs'
    })
  }
}

const getUser = async (req, res) => {
  try {
    const id = req.params.id
    const isAdmin = req.user.role === 'ADMIN'
    if (!isAdmin && Number(req.user.id) !== Number(id)) {
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

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  sanitizeUser,
  hashPassword
}
