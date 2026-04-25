'use strict'

const { Op } = require('sequelize')
const { Sinister, SinisterFolder, User, dbInstance } = require('../../models')
const {
  SEED_DEV_MARKER_USERNAME,
  SINISTER_PLATES,
  FOLDER_REF_A,
  FOLDER_REF_B,
  SEED_PREFIX
} = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120103 ignoré : pas d’utilisateurs de démonstration.')
      return
    }
    if (await SinisterFolder.findOne({ where: { folder_reference: FOLDER_REF_A } })) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Dossiers de démonstration déjà présents — 20260430120103 ignoré.')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const s1 = await Sinister.findOne({ where: { vehicle_plate: SINISTER_PLATES[0] }, transaction: t })
      const s3 = await Sinister.findOne({ where: { vehicle_plate: SINISTER_PLATES[2] }, transaction: t })
      const uTo = await User.findOne({ where: { username: `${SEED_PREFIX}to` }, transaction: t })
      const now = new Date()

      await SinisterFolder.create(
        {
          sinister_id: s1.id,
          folder_reference: FOLDER_REF_A,
          status: 'EXPERTISE_PENDING',
          scenario: 'REPAIRABLE',
          is_closed: false,
          assigned_officer_id: uTo.id,
          created_at: now,
          updated_at: now
        },
        { transaction: t }
      )
      await SinisterFolder.create(
        {
          sinister_id: s3.id,
          folder_reference: FOLDER_REF_B,
          status: 'COMPENSATION_PENDING',
          scenario: 'TOTAL_LOSS',
          is_closed: false,
          assigned_officer_id: uTo.id,
          created_at: now,
          updated_at: now
        },
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
      await SinisterFolder.destroy({
        where: { folder_reference: { [Op.in]: [FOLDER_REF_A, FOLDER_REF_B] } },
        transaction: t
      })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
