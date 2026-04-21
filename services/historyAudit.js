const logger = require('../core/logger')
const { HistoryLog, User } = require('../models')
const { logError } = require('../core/logError')

/**
 * Enregistrement best-effort : n’interrompt pas la mutation métier en cas d’échec.
 */
async function recordHistory ({ userId, entityType, entityId, action }) {
  try {
    await HistoryLog.create({
      user_id: userId != null ? userId : null,
      entity_type: entityType != null ? String(entityType) : null,
      entity_id: entityId != null ? Number(entityId) : null,
      action: action != null ? String(action) : null
    })
  } catch (err) {
    logger.error('historyAudit.recordHistory', err, {
      entityType,
      entityId,
      action
    })
  }
}

const HISTORY_ACTION = Object.freeze({
  SINISTER_CREATED: 'sinister.created',
  SINISTER_UPDATED: 'sinister.updated',
  SINISTER_VALIDATED: 'sinister.validated',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_VALIDATED: 'document.validated',
  FOLDER_CREATED: 'folder.created',
  FOLDER_ASSIGNED: 'folder.assigned',
  FOLDER_CLOSED: 'folder.closed',
  /** Préfixe ; le service peut suffixer `:step_type` pour le détail */
  FOLDER_STEP_CREATED: 'folder_step.created',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_DELETED: 'user.deleted'
})

const listHistory = async (req, res) => {
  try {
    const entityType = req.query.entity_type
    const entityId = req.query.entity_id

    const logs = await HistoryLog.findAll({
      where: { entity_type: entityType, entity_id: entityId },
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({ data: logs })
  } catch (err) {
    return logError(res, err, {
      context: 'historyAudit.listHistory',
      defaultMessage: 'Erreur lors de la lecture de l’historique'
    })
  }
}

module.exports = {
  recordHistory,
  HISTORY_ACTION,
  listHistory
}
