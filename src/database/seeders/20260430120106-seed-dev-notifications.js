'use strict'

const { Op } = require('sequelize')
const { User, Notification, dbInstance } = require('../../models')
const { SEED_DEV_MARKER_USERNAME, SEED_USERNAMES, SINISTER_PLATES, SEED_PREFIX } = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120106 ignoré : pas d’utilisateurs de démonstration.')
      return
    }
    const uCo = await User.findOne({ where: { username: `${SEED_PREFIX}co` } })
    const uIns = await User.findOne({ where: { username: `${SEED_PREFIX}insured` } })
    if (
      uCo &&
      (await Notification.findOne({
        where: { user_id: uCo.id, content: { [Op.like]: '%second véhicule%' } }
      }))
    ) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Notifications de démonstration déjà présentes — 20260430120106 ignoré.')
      return
    }
    if (!uCo || !uIns) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120106 ignoré : utilisateurs de démonstration manquants.')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const uTo = await User.findOne({ where: { username: `${SEED_PREFIX}to` }, transaction: t })
      const uPm = await User.findOne({ where: { username: `${SEED_PREFIX}pm` }, transaction: t })
      const uIns2 = await User.findOne({ where: { username: `${SEED_PREFIX}insured2` }, transaction: t })
      const now = new Date()
      await Notification.bulkCreate(
        [
          {
            user_id: uIns.id,
            content: `Mise à jour : dossier en cours (immat. ${SINISTER_PLATES[0]}).`,
            channel: 'PUSH',
            is_read: false,
            created_at: now
          },
          {
            user_id: uIns2.id,
            content: 'Indemnisation : pièces reçues, traitement en cours (perte totale).',
            channel: 'EMAIL',
            is_read: false,
            created_at: now
          },
          { user_id: uPm.id, content: 'Rappel : revue périodique des dossiers en expertise.', channel: 'EMAIL', is_read: true, created_at: now },
          { user_id: uTo.id, content: 'Nouvel incident signalé — vérifier l’ouverture du dossier.', channel: 'PUSH', is_read: false, created_at: now },
          { user_id: uCo.id, content: 'Message interne : l’assuré a confirmé le second véhicule.', channel: 'PUSH', is_read: true, created_at: now }
        ],
        { transaction: t }
      )
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down () {
    const t = await dbInstance.transaction()
    try {
      const users = await User.findAll({ where: { username: { [Op.in]: SEED_USERNAMES } }, transaction: t })
      const userIds = users.map((u) => u.id)
      if (userIds.length) {
        await Notification.destroy({ where: { user_id: { [Op.in]: userIds } }, transaction: t })
      }
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
