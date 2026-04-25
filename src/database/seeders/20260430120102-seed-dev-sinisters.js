'use strict'

const { Op } = require('sequelize')
const { Sinister, User, Document, dbInstance } = require('../../models')
const {
  SEED_DEV_MARKER_USERNAME,
  SEED_DOC,
  SINISTER_PLATES,
  SEED_PREFIX,
  demoTimeWindow,
  dApr20
} = require('./lib/devSeedConstants')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up () {
    if (!(await User.findOne({ where: { username: SEED_DEV_MARKER_USERNAME } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120102 ignoré : pas d’utilisateurs de démonstration.')
      return
    }
    if (await Sinister.findOne({ where: { vehicle_plate: SINISTER_PLATES[0] } })) {
      // eslint-disable-next-line no-console
      console.warn('[démo] Sinistres de démonstration déjà présents — 20260430120102 ignoré.')
      return
    }
    if (!(await Document.findOne({ where: { storage_url: SEED_DOC.REG } }))) {
      // eslint-disable-next-line no-console
      console.warn('[démo] 20260430120102 ignoré : exécutez d’abord 20260430120101 (documents).')
      return
    }

    const t = await dbInstance.transaction()
    try {
      const { call, inc, call2, inc2 } = demoTimeWindow()

      const u = (name) => User.findOne({ where: { username: `${SEED_PREFIX}${name}` }, transaction: t })
      const d = (url) => Document.findOne({ where: { storage_url: url }, transaction: t })
      const uAdmin = await u('admin')
      const uCo = await u('co')
      const uPm = await u('pm')
      const uIns = await u('insured')
      const uIns2 = await u('insured2')
      const docReg = await d(SEED_DOC.REG)
      const docCni = await d(SEED_DOC.CNI)
      const docAttest = await d(SEED_DOC.ATTEST)
      const docRegEm = await d(SEED_DOC.REG_EM)
      const docAttestEm = await d(SEED_DOC.ATTEST_EM)

      await Sinister.create(
        {
          vehicle_plate: SINISTER_PLATES[0],
          driver_first_name: 'Nadia',
          driver_last_name: 'CHAUVEAU',
          is_driver_insured: true,
          call_datetime: call,
          incident_datetime: inc,
          description: 'Choc arrière à un carrefour — dégâts aile / pare-chocs.',
          driver_responsability: false,
          is_validated_by_manager: false,
          created_by_id: uCo.id,
          insured_user_id: uIns.id,
          vehicle_registration_doc_id: docReg.id,
          cni_driver: docCni.id,
          insurance_certificate_id: docAttest.id
        },
        { transaction: t }
      )

      await Sinister.create(
        {
          vehicle_plate: SINISTER_PLATES[1],
          driver_first_name: 'Hugo',
          driver_last_name: 'BAILLY',
          is_driver_insured: false,
          call_datetime: call,
          incident_datetime: inc,
          description: 'Griffures parking — en attente d’ouverture de dossier.',
          driver_responsability: true,
          driver_engaged_responsibility: 50,
          is_validated_by_manager: false,
          created_by_id: uAdmin.id,
          insured_user_id: uIns.id
        },
        { transaction: t }
      )

      await Sinister.create(
        {
          vehicle_plate: SINISTER_PLATES[2],
          driver_first_name: 'Émilie',
          driver_last_name: 'DUBOIS',
          is_driver_insured: true,
          call_datetime: call2,
          incident_datetime: inc2,
          description: 'Sortie de route, véhicule économiquement réparable = perte totale (expert).',
          driver_responsability: true,
          driver_engaged_responsibility: 100,
          is_validated_by_manager: true,
          created_by_id: uCo.id,
          insured_user_id: uIns2.id,
          vehicle_registration_doc_id: docRegEm.id,
          insurance_certificate_id: docAttestEm.id
        },
        { transaction: t }
      )

      await Sinister.create(
        {
          vehicle_plate: SINISTER_PLATES[3],
          driver_first_name: 'Jules',
          driver_last_name: 'RENAUD',
          is_driver_insured: true,
          call_datetime: dApr20(8, 45),
          incident_datetime: dApr20(8, 20),
          description: 'Accrochage rétroviseur — en instruction.',
          driver_responsability: false,
          is_validated_by_manager: false,
          created_by_id: uPm.id,
          insured_user_id: uIns.id
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
      await Sinister.destroy({ where: { vehicle_plate: { [Op.in]: SINISTER_PLATES } }, transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
