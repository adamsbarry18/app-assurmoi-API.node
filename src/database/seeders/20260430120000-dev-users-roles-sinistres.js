'use strict'

const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User, Sinister, SinisterFolder, FolderStep, dbInstance } = require('../../models')

/**
 * Comptes de démonstration (développement) : un user par rôle + sinistres / dossiers de test.
 * Mot de passe initial pour tous (identique) : `MotDeP@ss123`
 * Identifiants (username) : `seed.admin`, `seed.pm`, `seed.to`, `seed.co`, `seed.insured`
 * Nettoyage : `npx sequelize-cli db:seed:undo` en ciblant ce fichier, ou
 *   `npm run db:seed:undo:all` (défait tous les seeders, dans l’ordre inverse).
 */
const SEED_PREFIX = 'seed.'

const SEED_USER_ROWS = [
  { username: `${SEED_PREFIX}admin`, email: 'dev-admin@assurmoi.local', role: 'ADMIN' },
  { username: `${SEED_PREFIX}pm`, email: 'dev-pm@assurmoi.local', role: 'PORTFOLIO_MANAGER' },
  { username: `${SEED_PREFIX}to`, email: 'dev-to@assurmoi.local', role: 'TRACKING_OFFICER' },
  { username: `${SEED_PREFIX}co`, email: 'dev-co@assurmoi.local', role: 'CUSTOMER_OFFICER' },
  { username: `${SEED_PREFIX}insured`, email: 'dev-insured@assurmoi.local', role: 'INSURED' }
]

const SINISTER_P_A = 'SEED-DEMO-01'
const SINISTER_P_B = 'SEED-DEMO-02'
const FOLDER_REF_A = 'FOL-SEED-01'

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, _Sequelize) {
    const marker = await User.findOne({ where: { username: `${SEED_PREFIX}admin` } })
    if (marker) {
      // eslint-disable-next-line no-console
      console.warn(
        '[seed] Comptes seed.* déjà présents — annulation. Lancez d’abord le undo de ce seeder (voir scripts npm db:seed*).'
      )
      return
    }

    const t = await dbInstance.transaction()
    try {
      const password = process.env.SEED_DEV_PASSWORD || 'MotDeP@ss123'
      const password_hash = await bcrypt.hash(password, 12)
      const now = new Date()
      const call = new Date('2025-04-20T10:00:00')
      const inc = new Date('2025-04-20T09:30:00')

      const byUsername = new Map()
      for (const row of SEED_USER_ROWS) {
        const u = await User.create(
          {
            username: row.username,
            email: row.email,
            password_hash,
            first_name: row.username.replace(SEED_PREFIX, 'Demo '),
            last_name: 'Seed',
            role: row.role,
            is_active: true,
            password_pending: false,
            created_at: now,
            updated_at: now
          },
          { transaction: t }
        )
        byUsername.set(row.username, u)
      }

      const uAdmin = byUsername.get(`${SEED_PREFIX}admin`)
      const uCo = byUsername.get(`${SEED_PREFIX}co`)
      const uTo = byUsername.get(`${SEED_PREFIX}to`)
      const uIns = byUsername.get(`${SEED_PREFIX}insured`)

      // Sinistre 1 : créé par le chargé de clientèle pour l’assuré
      const s1 = await Sinister.create(
        {
          vehicle_plate: SINISTER_P_A,
          driver_first_name: 'Camille',
          driver_last_name: 'Ter',
          is_driver_insured: true,
          call_datetime: call,
          incident_datetime: inc,
          description: 'Donnée de seed — collision à un carrefour (démo).',
          driver_responsability: false,
          is_validated_by_manager: false,
          created_by_id: uCo.id,
          insured_user_id: uIns.id
        },
        { transaction: t }
      )

      const folder1 = await SinisterFolder.create(
        {
          sinister_id: s1.id,
          folder_reference: FOLDER_REF_A,
          status: 'INITIALIZED',
          scenario: 'REPAIRABLE',
          is_closed: false,
          assigned_officer_id: uTo.id,
          created_at: now,
          updated_at: now
        },
        { transaction: t }
      )

      await FolderStep.create(
        {
          folder_id: folder1.id,
          step_type: 'S1_EXPERT_REPORT',
          value: 'Rapport expert (donnée de seed)',
          action_date: now,
          document_id: null,
          performed_by_id: uTo.id
        },
        { transaction: t }
      )

      // Sinistre 2 : créé par l’admin, même assuré (second dossier possible en démo)
      await Sinister.create(
        {
          vehicle_plate: SINISTER_P_B,
          driver_first_name: 'Jules',
          driver_last_name: 'Ter',
          is_driver_insured: false,
          call_datetime: call,
          incident_datetime: inc,
          description: 'Deuxième sinistre de seed (sans dossier) — scénario minimal.',
          driver_responsability: true,
          driver_engaged_responsibility: 50,
          is_validated_by_manager: false,
          created_by_id: uAdmin.id,
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

  async down (_queryInterface, _Sequelize) {
    const t = await dbInstance.transaction()
    try {
      const plates = [SINISTER_P_A, SINISTER_P_B]
      const sinisters = await Sinister.findAll({
        where: { vehicle_plate: { [Op.in]: plates } },
        include: [
          { model: SinisterFolder, as: 'folder', required: false }
        ],
        transaction: t
      })

      for (const s of sinisters) {
        if (s.folder) {
          await FolderStep.destroy({ where: { folder_id: s.folder.id }, transaction: t })
          await s.folder.destroy({ transaction: t })
        }
        await s.destroy({ transaction: t })
      }

      const usernames = SEED_USER_ROWS.map((r) => r.username)
      await User.destroy({ where: { username: { [Op.in]: usernames } }, transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
