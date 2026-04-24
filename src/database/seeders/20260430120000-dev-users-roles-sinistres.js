'use strict'

const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const {
  User,
  Sinister,
  SinisterFolder,
  FolderStep,
  Document,
  HistoryLog,
  Notification,
  Invitation,
  dbInstance
} = require('../../models')

/**
 * Jeu de données de démonstration : au moins un enregistrement par table métier utile.
 * Tables concernées : `users`, `documents`, `sinisters`, `sinister_folders`, `folder_steps`,
 * `history_logs`, `notifications`, `invitations` (les autres viennent du seeder `20260324130823-user.js` pour `users`).
 * Mot de passe (tous comptes `seed.*`) : `MotDeP@ss123` (ou `SEED_DEV_PASSWORD`).
 * Nettoyage : `npm run db:seed:undo:all` puis `npm run db:seed` si le jeu est déjà inséré.
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

const SEED_DOC_REG_URL = 'seed://demo/carte-grise.pdf'
const SEED_DOC_EXPERT_URL = 'seed://demo/rapport-expert-seed.pdf'
const SEED_INVITE_EMAIL = 'seed.invite.pending@assurmoi.local'

const HISTORY = {
  SINISTER_CREATED: 'sinister.created',
  FOLDER_CREATED: 'folder.created',
  FOLDER_STEP_CREATED: 'folder_step.created:S1_EXPERT_REPORT'
}

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
      const uPm = byUsername.get(`${SEED_PREFIX}pm`)

      // documents : au moins un enregistrement (carte grise + rapport expert rattaché à l’étape)
      const docReg = await Document.create(
        {
          type: 'REGISTRATION_CARD',
          storage_url: SEED_DOC_REG_URL,
          is_validated: false,
          uploaded_by_id: uCo.id,
          uploaded_at: now
        },
        { transaction: t }
      )
      const docExpert = await Document.create(
        {
          type: 'EXPERT_REPORT',
          storage_url: SEED_DOC_EXPERT_URL,
          is_validated: true,
          uploaded_by_id: uTo.id,
          uploaded_at: now
        },
        { transaction: t }
      )

      // Sinistre 1 : créé par le chargé de clientèle pour l’assuré + doc carte grise
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
          insured_user_id: uIns.id,
          vehicle_registration_doc_id: docReg.id
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

      const step1 = await FolderStep.create(
        {
          folder_id: folder1.id,
          step_type: 'S1_EXPERT_REPORT',
          value: 'Rapport expert (donnée de seed)',
          action_date: now,
          document_id: docExpert.id,
          performed_by_id: uTo.id
        },
        { transaction: t }
      )

      // historique (aligné sur les clés d’action métier)
      await HistoryLog.bulkCreate(
        [
          {
            user_id: uCo.id,
            entity_type: 'sinister',
            entity_id: s1.id,
            action: HISTORY.SINISTER_CREATED,
            created_at: now
          },
          {
            user_id: uCo.id,
            entity_type: 'folder',
            entity_id: folder1.id,
            action: HISTORY.FOLDER_CREATED,
            created_at: now
          },
          {
            user_id: uTo.id,
            entity_type: 'folder_step',
            entity_id: step1.id,
            action: HISTORY.FOLDER_STEP_CREATED,
            created_at: now
          }
        ],
        { transaction: t }
      )

      // notifications : PUSH + EMAIL
      await Notification.bulkCreate(
        [
          {
            user_id: uIns.id,
            content: 'Démo seed : mise à jour sur votre sinistre (plaque ' + SINISTER_P_A + ').',
            channel: 'PUSH',
            is_read: false,
            created_at: now
          },
          {
            user_id: uPm.id,
            content: 'Démo seed (canal e-mail) : rappel revue périodique des dossiers.',
            channel: 'EMAIL',
            is_read: true,
            created_at: now
          }
        ],
        { transaction: t }
      )

      // invitation en attente (table invitations)
      await Invitation.create(
        {
          email: SEED_INVITE_EMAIL,
          role: 'TRACKING_OFFICER',
          status: 'pending',
          created_at: now,
          updated_at: now
        },
        { transaction: t }
      )

      // Sinistre 2 : créé par l’admin, même assuré (sans dossier)
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
      const usernames = SEED_USER_ROWS.map((r) => r.username)
      const users = await User.findAll({ where: { username: { [Op.in]: usernames } }, transaction: t })
      const userIds = users.map((u) => u.id)
      if (userIds.length === 0) {
        await t.commit()
        return
      }

      const plates = [SINISTER_P_A, SINISTER_P_B]
      const sinisters = await Sinister.findAll({
        where: { vehicle_plate: { [Op.in]: plates } },
        include: [{ model: SinisterFolder, as: 'folder', required: false }],
        transaction: t
      })

      const historyClauses = []
      for (const s of sinisters) {
        historyClauses.push({ entity_type: 'sinister', entity_id: s.id })
        if (s.folder) {
          historyClauses.push({ entity_type: 'folder', entity_id: s.folder.id })
        }
      }
      for (const s of sinisters) {
        if (s.folder) {
          const st = await FolderStep.findAll({ where: { folder_id: s.folder.id }, transaction: t })
          for (const row of st) {
            historyClauses.push({ entity_type: 'folder_step', entity_id: row.id })
          }
        }
      }
      if (historyClauses.length > 0) {
        await HistoryLog.destroy({ where: { [Op.or]: historyClauses }, transaction: t })
      }

      await Notification.destroy({ where: { user_id: { [Op.in]: userIds } }, transaction: t })
      await Invitation.destroy({ where: { email: SEED_INVITE_EMAIL }, transaction: t })

      for (const s of sinisters) {
        if (s.folder) {
          await FolderStep.destroy({ where: { folder_id: s.folder.id }, transaction: t })
          await s.folder.destroy({ transaction: t })
        }
        await s.destroy({ transaction: t })
      }

      await Document.destroy({
        where: { storage_url: { [Op.in]: [SEED_DOC_REG_URL, SEED_DOC_EXPERT_URL] } },
        transaction: t
      })
      await User.destroy({ where: { username: { [Op.in]: usernames } }, transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
