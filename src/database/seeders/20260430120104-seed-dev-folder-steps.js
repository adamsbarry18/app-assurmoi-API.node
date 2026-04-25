'use strict'

const { Op } = require('sequelize')
const {
  SinisterFolder,
  FolderStep,
  User,
  Document,
  dbInstance
} = require('../../models')
const {
  SEED_DEV_MARKER_USERNAME,
  SEED_DOC,
  FOLDER_REF_A,
  FOLDER_REF_B,
  SEED_PREFIX,
  dApr20
} = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120104 ignoré : pas d’utilisateurs de démonstration.')
      return
    }
    const folder1 = await SinisterFolder.findOne({ where: { folder_reference: FOLDER_REF_A } })
    if (!folder1) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120104 ignoré : pas de dossier FOL-DMO-01 (exécutez 20103).')
      return
    }
    if (
      await FolderStep.findOne({
        where: { folder_id: folder1.id, step_type: 'S1_EXPERT_REPORT' }
      })
    ) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Étapes de dossier déjà présentes — 20260430120104 ignoré.')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const uCo = await User.findOne({ where: { username: `${SEED_PREFIX}co` }, transaction: t })
      const uTo = await User.findOne({ where: { username: `${SEED_PREFIX}to` }, transaction: t })
      const d = (url) => Document.findOne({ where: { storage_url: url }, transaction: t })
      const docExpert = await d(SEED_DOC.EXPERT)
      const docInvoice = await d(SEED_DOC.INVOICE)
      const docSign = await d(SEED_DOC.SIGN)
      const docExpertTl = await d(SEED_DOC.EXPERT_TL)
      const docRib = await d(SEED_DOC.RIB)
      const folder2 = await SinisterFolder.findOne({ where: { folder_reference: FOLDER_REF_B }, transaction: t })

      await FolderStep.bulkCreate(
        [
          {
            folder_id: folder1.id,
            step_type: 'S1_EXPERT_REPORT',
            value: 'Rapport d’expertise — dégâts réparables, délai atelier 10 j. ouvrés',
            action_date: dApr20(11, 0),
            document_id: docExpert.id,
            performed_by_id: uTo.id
          },
          {
            folder_id: folder1.id,
            step_type: 'S1_INVOICE',
            value: 'Facture carrosserie — règlement en attente',
            action_date: dApr20(11, 45),
            document_id: docInvoice.id,
            performed_by_id: uTo.id
          },
          {
            folder_id: folder1.id,
            step_type: 'PAYMENT_SETTLED',
            value: 'Mandat signé — règlement assuré',
            action_date: dApr20(12, 10),
            document_id: docSign.id,
            performed_by_id: uCo.id
          }
        ],
        { transaction: t }
      )
      if (folder2) {
        await FolderStep.bulkCreate(
          [
            {
              folder_id: folder2.id,
              step_type: 'S1_EXPERT_REPORT',
              value: 'Avis d’irréparabilité économique — offre d’indemnisation',
              action_date: dApr20(16, 0),
              document_id: docExpertTl.id,
              performed_by_id: uTo.id
            },
            {
              folder_id: folder2.id,
              step_type: 'S2_RIB',
              value: 'Dépôt RIB par l’assuré pour virement d’indemnisation',
              action_date: dApr20(16, 30),
              document_id: docRib.id,
              performed_by_id: uTo.id
            }
          ],
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
      const f = await SinisterFolder.findAll({
        where: { folder_reference: { [Op.in]: [FOLDER_REF_A, FOLDER_REF_B] } },
        transaction: t
      })
      const ids = f.map((x) => x.id)
      if (ids.length > 0) {
        await FolderStep.destroy({ where: { folder_id: { [Op.in]: ids } }, transaction: t })
      }
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
