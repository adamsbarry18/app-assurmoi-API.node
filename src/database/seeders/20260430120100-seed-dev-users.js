'use strict'

const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User, dbInstance } = require('../../models')
const { SEED_USER_ROWS, SEED_DEV_MARKER_USERNAME, SEED_USERNAMES } = require('./lib/devSeedConstants')

/**
 * Comptes de démonstration (usernames `seed.*`). Exécuté en premier de la suite 202604301201* — voir `lib/devSeedConstants.js`.
 */
/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    const marker = await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } })
    if (marker) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Comptes de démonstration déjà présents — 20260430120100 ignoré. Annulez le seed puis relancez `db:seed` pour tout rejouer.')
      return
    }
    const t = await dbInstance.transaction()
    try {
      const password = process.env.SEED_DEV_PASSWORD || 'MotDeP@ss123'
      const password_hash = await bcrypt.hash(password, 12)
      const now = new Date()
      for (const row of SEED_USER_ROWS) {
        await User.create(
          {
            username: row.username,
            email: row.email,
            password_hash,
            first_name: row.first_name,
            last_name: row.last_name,
            role: row.role,
            is_active: true,
            password_pending: false,
            created_at: now,
            updated_at: now
          },
          { transaction: t }
        )
      }
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down () {
    const t = await dbInstance.transaction()
    try {
      await User.destroy({ where: { username: { [Op.in]: SEED_USERNAMES } }, transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
