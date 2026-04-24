const { Op } = require('sequelize')
const logger = require('../core/logger')
const { User, Notification } = require('../models')
const { STEP_TYPE, HOURS_48_MS } = require('./folderWorkflow')

const DEADLINE_STEP_TYPES = new Set([
  STEP_TYPE.EXPERTISE_ECHEANCE,
  STEP_TYPE.GENERIC_ECHEANCE
])

async function createInAppNotification ({ userId, content, channel = 'PUSH' }) {
  if (userId == null) return
  try {
    await Notification.create({
      user_id: userId,
      content,
      channel,
      is_read: false
    })
  } catch (err) {
    logger.error('notificationDispatch.createInAppNotification', err, {
      userId,
      channel
    })
  }
}

/**
 * Document uploadé non validé → gestionnaires / admin (canal interne PUSH).
 */
async function notifyDocumentPendingValidation ({ documentId, documentType }) {
  try {
    const managers = await User.findAll({
      where: {
        is_active: true,
        role: { [Op.in]: ['ADMIN', 'PORTFOLIO_MANAGER'] }
      },
      attributes: ['id']
    })
    const text = `Document n°${documentId} (type ${documentType}) en attente de validation.`
    for (const m of managers) {
      await createInAppNotification({ userId: m.id, content: text })
    }
  } catch (err) {
    logger.error('notificationDispatch.notifyDocumentPendingValidation', err)
  }
}

/**
 * Étape RIB scénario 2 : action attendue côté assuré — informe les acteurs du dossier.
 */
async function notifyRibExpectedFromInsured ({ folder, sinister }) {
  try {
    const ids = new Set()
    if (folder.assigned_officer_id) ids.add(folder.assigned_officer_id)
    if (sinister.created_by_id) ids.add(sinister.created_by_id)

    const text = `Sinistre n°${sinister.id} — dossier n°${folder.id} : dépôt du RIB par l’assuré attendu (suivi interne).`

    const managers = await User.findAll({
      where: { is_active: true, role: 'PORTFOLIO_MANAGER' },
      attributes: ['id']
    })
    for (const m of managers) ids.add(m.id)

    for (const userId of ids) {
      await createInAppNotification({ userId, content: text })
    }
  } catch (err) {
    logger.error('notificationDispatch.notifyRibExpectedFromInsured', err)
  }
}

/**
 * Après enregistrement du règlement : rappel du délai 48h avant clôture possible.
 */
async function notifyPaymentSettledDeadline ({ folder, step }) {
  try {
    const t = new Date(step.action_date).getTime()
    if (Number.isNaN(t)) return
    const eligible = new Date(t + HOURS_48_MS)
    const when = eligible.toLocaleString('fr-FR', { timeZone: 'UTC' }) + ' UTC'
    const text = `Règlement enregistré sur le dossier n°${folder.id}. Clôture possible après le délai de 48h (à partir du ${when}).`

    const ids = new Set()
    if (folder.assigned_officer_id) ids.add(folder.assigned_officer_id)
    const managers = await User.findAll({
      where: {
        is_active: true,
        role: { [Op.in]: ['ADMIN', 'PORTFOLIO_MANAGER'] }
      },
      attributes: ['id']
    })
    for (const m of managers) ids.add(m.id)

    for (const userId of ids) {
      await createInAppNotification({ userId, content: text })
    }
  } catch (err) {
    logger.error('notificationDispatch.notifyPaymentSettledDeadline', err)
  }
}

/**
 * Alerte d’échéance (expertise ou générique) : `value` décrit la date / le libellé.
 */
async function notifyDeadlineAlert ({ folder, stepType, value }) {
  try {
    const detail = value != null && String(value).trim() !== '' ? String(value).trim() : 'échéance à préciser'
    const text = `Dossier n°${folder.id} — échéance (${stepType}) : ${detail}.`

    const ids = new Set()
    if (folder.assigned_officer_id) ids.add(folder.assigned_officer_id)
    const managers = await User.findAll({
      where: {
        is_active: true,
        role: { [Op.in]: ['PORTFOLIO_MANAGER', 'ADMIN'] }
      },
      attributes: ['id']
    })
    for (const m of managers) ids.add(m.id)

    for (const userId of ids) {
      await createInAppNotification({ userId, content: text })
    }
  } catch (err) {
    logger.error('notificationDispatch.notifyDeadlineAlert', err)
  }
}

/**
 * Appelé après création réussie d’une étape de dossier.
 */
async function dispatchForFolderStep ({ folder, sinister, step }) {
  const stepType = step.step_type
  if (stepType === STEP_TYPE.S2_RIB) {
    await notifyRibExpectedFromInsured({ folder, sinister })
  }
  if (stepType === STEP_TYPE.PAYMENT_SETTLED) {
    await notifyPaymentSettledDeadline({ folder, step })
  }
  if (DEADLINE_STEP_TYPES.has(stepType)) {
    await notifyDeadlineAlert({
      folder,
      stepType,
      value: step.value
    })
  }
}

module.exports = {
  createInAppNotification,
  notifyDocumentPendingValidation,
  notifyRibExpectedFromInsured,
  notifyPaymentSettledDeadline,
  notifyDeadlineAlert,
  dispatchForFolderStep,
  DEADLINE_STEP_TYPES
}
