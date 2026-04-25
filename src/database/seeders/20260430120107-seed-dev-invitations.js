'use strict'

const { Op } = require('sequelize')
const { User, Invitation, dbInstance } = require('../../models')
const { SEED_DEV_MARKER_USERNAME, SEED_INVITE_EMAILS } = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120107 ignoré : pas d’utilisateurs de démonstration.')
      return
    }
    if (await Invitation.findOne({ where: { email: SEED_INVITE_EMAILS[0] } })) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Invitations de démonstration déjà présentes — 20260430120107 ignoré.')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const now = new Date()
      await Invitation.bulkCreate(
        [
          { email: SEED_INVITE_EMAILS[0], role: 'TRACKING_OFFICER', status: 'pending', created_at: now, updated_at: now },
          { email: SEED_INVITE_EMAILS[1], role: 'CUSTOMER_OFFICER', status: 'pending', created_at: now, updated_at: now },
          { email: SEED_INVITE_EMAILS[2], role: 'INSURED', status: 'cancelled', created_at: now, updated_at: now }
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
      await Invitation.destroy({ where: { email: { [Op.in]: SEED_INVITE_EMAILS } }, transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
