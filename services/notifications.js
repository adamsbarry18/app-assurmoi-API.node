const { Notification } = require('../models')
const { logError } = require('../core/logError')
const { ERROR_CODES } = require('../core/errors')

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

const listMyNotifications = async (req, res) => {
  try {
    const { limit, offset } = parseListPagination(req.query)
    const where = { user_id: req.user.id }

    if (req.query.is_read === 'true') {
      where.is_read = true
    } else if (req.query.is_read === 'false') {
      where.is_read = false
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      data: rows,
      meta: { total: count, limit, offset }
    })
  } catch (err) {
    return logError(res, err, {
      context: 'notifications.listMyNotifications',
      defaultMessage: 'Erreur lors de la liste des notifications'
    })
  }
}

const markNotificationRead = async (req, res) => {
  try {
    const id = req.params.id
    const notif = await Notification.findOne({
      where: { id, user_id: req.user.id }
    })
    if (!notif) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Notification introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    if (!notif.is_read) {
      await notif.update({ is_read: true })
    }
    const refreshed = await Notification.findByPk(id)
    return res.status(200).json({ data: refreshed })
  } catch (err) {
    return logError(res, err, {
      context: 'notifications.markNotificationRead',
      defaultMessage: 'Erreur lors de la mise à jour'
    })
  }
}

module.exports = {
  listMyNotifications,
  markNotificationRead
}
