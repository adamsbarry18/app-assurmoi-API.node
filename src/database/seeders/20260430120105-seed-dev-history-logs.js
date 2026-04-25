'use strict'

const { Op } = require('sequelize')
const {
  Sinister,
  SinisterFolder,
  FolderStep,
  HistoryLog,
  User,
  dbInstance
} = require('../../models')
const {
  SEED_DEV_MARKER_USERNAME,
  SINISTER_PLATES,
  FOLDER_REF_A,
  FOLDER_REF_B,
  SEED_PREFIX,
  HISTORY
} = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120105 ignoré : pas d’utilisateurs de démonstration.')
      return
    }
    const s1 = await Sinister.findOne({ where: { vehicle_plate: SINISTER_PLATES[0] } })
    if (!s1) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120105 ignoré : sinistre DMO-0001 (première immat. démo) manquant.')
      return
    }
    if (await HistoryLog.findOne({ where: { entity_type: 'sinister', entity_id: s1.id } })) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Journal d’activité déjà alimenté — 20260430120105 ignoré.')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const s3 = await Sinister.findOne({ where: { vehicle_plate: SINISTER_PLATES[2] }, transaction: t })
      const folder1 = await SinisterFolder.findOne({ where: { folder_reference: FOLDER_REF_A }, transaction: t })
      const folder2 = await SinisterFolder.findOne({ where: { folder_reference: FOLDER_REF_B }, transaction: t })
      const uCo = await User.findOne({ where: { username: `${SEED_PREFIX}co` }, transaction: t })
      const uTo = await User.findOne({ where: { username: `${SEED_PREFIX}to` }, transaction: t })
      const now = new Date()

      const steps1 = await FolderStep.findAll({
        where: { folder_id: folder1.id },
        order: [['id', 'ASC']],
        transaction: t
      })
      const steps2 = folder2
        ? await FolderStep.findAll({ where: { folder_id: folder2.id }, order: [['id', 'ASC']], transaction: t })
        : []
      const [a, b, c] = steps1
      const [d, e] = steps2

      const historyRows = [
        { user_id: uCo.id, entity_type: 'sinister', entity_id: s1.id, action: HISTORY.SINISTER_CREATED, created_at: now },
        { user_id: uCo.id, entity_type: 'folder', entity_id: folder1.id, action: HISTORY.FOLDER_CREATED, created_at: now },
        { user_id: uTo.id, entity_type: 'folder_step', entity_id: a.id, action: HISTORY.FOLDER_STEP_S1, created_at: now },
        { user_id: uTo.id, entity_type: 'folder_step', entity_id: b.id, action: HISTORY.FOLDER_STEP_INV, created_at: now },
        { user_id: uCo.id, entity_type: 'folder_step', entity_id: c.id, action: HISTORY.FOLDER_STEP_PAY, created_at: now }
      ]
      if (s3 && folder2 && d && e) {
        historyRows.push(
          { user_id: uCo.id, entity_type: 'sinister', entity_id: s3.id, action: HISTORY.SINISTER_CREATED, created_at: now },
          { user_id: uCo.id, entity_type: 'folder', entity_id: folder2.id, action: HISTORY.FOLDER_CREATED, created_at: now },
          { user_id: uTo.id, entity_type: 'folder_step', entity_id: d.id, action: HISTORY.FOLDER_STEP_S1, created_at: now },
          { user_id: uTo.id, entity_type: 'folder_step', entity_id: e.id, action: HISTORY.FOLDER_STEP_RIB, created_at: now }
        )
      }
      await HistoryLog.bulkCreate(historyRows, { transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down () {
    const t = await dbInstance.transaction()
    try {
      const sinisters = await Sinister.findAll({
        where: { vehicle_plate: { [Op.in]: SINISTER_PLATES } },
        include: [{ model: SinisterFolder, as: 'folder', required: false }],
        transaction: t
      })
      const historyClauses = []
      for (const s of sinisters) {
        historyClauses.push({ entity_type: 'sinister', entity_id: s.id })
        if (s.folder) {
          historyClauses.push({ entity_type: 'folder', entity_id: s.folder.id })
          const st = await FolderStep.findAll({ where: { folder_id: s.folder.id }, transaction: t })
          for (const row of st) {
            historyClauses.push({ entity_type: 'folder_step', entity_id: row.id })
          }
        }
      }
      if (historyClauses.length > 0) {
        await HistoryLog.destroy({ where: { [Op.or]: historyClauses }, transaction: t })
      }
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
