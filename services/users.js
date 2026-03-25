const { Op } = require('sequelize')
const bcrypt = require('bcryptjs')
const { User, dbInstance } = require('../models')

const BCRYPT_ROUNDS = 12

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS)

const sanitizeUser = (user) => {
  if (!user) return null
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : user
  delete plain.password_hash
  delete plain.session_token
  delete plain.refresh_token
  delete plain.two_factor_code
  return plain
}

/** Les query params sont des chaînes ; Sequelize + MariaDB exigent des entiers pour LIMIT/OFFSET. */
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
    console.error(err)
    return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' })
  }
}

const getUser = async (req, res) => {
  try {
    const id = req.params.id
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' })
    }
    return res.status(200).json({ data: sanitizeUser(user) })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erreur lors de la récupération de l’utilisateur' })
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
      return res.status(409).json({ message: 'Username ou email déjà utilisé' })
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
    return res.status(201).json({ data: sanitizeUser(created) })
  } catch (err) {
    await transaction.rollback()
    console.error(err)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Contrainte d’unicité violée' })
    }
    return res.status(400).json({
      message: 'Erreur lors de la création de l’utilisateur',
      details: err.errors?.map((e) => e.message) ?? err.message
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
      return res.status(404).json({ message: 'Utilisateur introuvable' })
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
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' })
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
        return res.status(409).json({ message: 'Username ou email déjà utilisé' })
      }
    }

    await user.update(updates, { transaction })
    await transaction.commit()

    const refreshed = await User.findByPk(userId)
    return res.status(200).json({ data: sanitizeUser(refreshed) })
  } catch (err) {
    await transaction.rollback()
    console.error(err)
    return res.status(400).json({
      message: 'Erreur lors de la mise à jour',
      details: err.errors?.map((e) => e.message) ?? err.message
    })
  }
}

const deleteUser = async (req, res) => {
    const transaction = await dbInstance.transaction();
    try {
        const user_id = req.params.id
        
        const status = await User.destroy({
            where: { id: user_id },
            transaction
        })

        transaction.commit();
        return res.status(200).json({
            message: "Successfuly deleted",
            status
        })
    } catch(err) {
        transaction.rollback();
        return res.status(400).json({
            message: 'Error on user deletion',
            stacktrace: err.errors
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
      return res.status(404).json({ message: 'Utilisateur introuvable' })
    }

    await user.update({ is_active: false }, { transaction })
    await transaction.commit()

    const refreshed = await User.findByPk(userId)
    return res.status(200).json({
      message: 'Utilisateur désactivé',
      data: sanitizeUser(refreshed)
    })
  } catch (err) {
    await transaction.rollback()
    console.error(err)
    return res.status(500).json({ message: 'Erreur lors de la désactivation' })
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
