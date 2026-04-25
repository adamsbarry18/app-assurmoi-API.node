'use strict'

const { Op } = require('sequelize')
const { Document, User, dbInstance } = require('../../models')
const { SEED_DEV_MARKER_USERNAME, SEED_DOC, SEED_ALL_DOC_URLS, SEED_PREFIX } = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120101 ignoré : exécutez d’abord 20260430120100 (utilisateurs).')
      return
    }
    if (await Document.findOne({ where: { storage_url: SEED_DOC.REG } })) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Pièces déjà présentes — 20260430120101 ignoré.')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const u = (name) => User.findOne({ where: { username: `${SEED_PREFIX}${name}` }, transaction: t })
      const uCo = await u('co')
      const uTo = await u('to')
      const uIns = await u('insured')
      const uIns2 = await u('insured2')
      const now = new Date()

      await Document.bulkCreate(
        [
          { type: 'REGISTRATION_CARD', storage_url: SEED_DOC.REG, is_validated: false, uploaded_by_id: uCo.id, uploaded_at: now },
          { type: 'EXPERT_REPORT', storage_url: SEED_DOC.EXPERT, is_validated: true, uploaded_by_id: uTo.id, uploaded_at: now },
          { type: 'ID_CARD', storage_url: SEED_DOC.CNI, is_validated: true, uploaded_by_id: uCo.id, uploaded_at: now },
          { type: 'INSURANCE_CERT', storage_url: SEED_DOC.ATTEST, is_validated: true, uploaded_by_id: uCo.id, uploaded_at: now },
          { type: 'INVOICE', storage_url: SEED_DOC.INVOICE, is_validated: true, uploaded_by_id: uTo.id, uploaded_at: now },
          { type: 'RIB', storage_url: SEED_DOC.RIB, is_validated: false, uploaded_by_id: uIns2.id, uploaded_at: now },
          { type: 'SIGNATURE', storage_url: SEED_DOC.SIGN, is_validated: true, uploaded_by_id: uIns.id, uploaded_at: now },
          { type: 'REGISTRATION_CARD', storage_url: SEED_DOC.REG_EM, is_validated: true, uploaded_by_id: uCo.id, uploaded_at: now },
          { type: 'INSURANCE_CERT', storage_url: SEED_DOC.ATTEST_EM, is_validated: true, uploaded_by_id: uCo.id, uploaded_at: now },
          { type: 'EXPERT_REPORT', storage_url: SEED_DOC.EXPERT_TL, is_validated: true, uploaded_by_id: uTo.id, uploaded_at: now }
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
      await Document.destroy({ where: { storage_url: { [Op.in]: SEED_ALL_DOC_URLS } }, transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
