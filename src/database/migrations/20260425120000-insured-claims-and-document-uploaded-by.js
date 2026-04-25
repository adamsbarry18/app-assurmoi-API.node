'use strict'

/** @type {import('sequelize-cli').Migration} */
const IDX_SINISTERS = 'idx_sinisters_insured_user_id'
const IDX_DOCS = 'idx_documents_uploaded_by_id'

module.exports = {
  async up (queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction()
    try {
      const sin = await queryInterface.describeTable('sinisters', { transaction: t })
      if (!sin.insured_user_id) {
        await queryInterface.addColumn(
          'sinisters',
          'insured_user_id',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          { transaction: t }
        )
      }
      const sinIdx = await queryInterface.showIndex('sinisters', { transaction: t })
      if (!sinIdx.some((i) => i.name === IDX_SINISTERS)) {
        await queryInterface.addIndex('sinisters', ['insured_user_id'], {
          name: IDX_SINISTERS,
          transaction: t
        })
      }

      const doc = await queryInterface.describeTable('documents', { transaction: t })
      if (!doc.uploaded_by_id) {
        await queryInterface.addColumn(
          'documents',
          'uploaded_by_id',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          { transaction: t }
        )
      }
      const docIdx = await queryInterface.showIndex('documents', { transaction: t })
      if (!docIdx.some((i) => i.name === IDX_DOCS)) {
        await queryInterface.addIndex('documents', ['uploaded_by_id'], {
          name: IDX_DOCS,
          transaction: t
        })
      }

      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down (queryInterface) {
    const t = await queryInterface.sequelize.transaction()
    try {
      const docIdx = await queryInterface.showIndex('documents', { transaction: t })
      if (docIdx.some((i) => i.name === IDX_DOCS)) {
        await queryInterface.removeIndex('documents', IDX_DOCS, { transaction: t })
      }
      const doc = await queryInterface.describeTable('documents', { transaction: t })
      if (doc.uploaded_by_id) {
        await queryInterface.removeColumn('documents', 'uploaded_by_id', { transaction: t })
      }

      const sinIdx = await queryInterface.showIndex('sinisters', { transaction: t })
      if (sinIdx.some((i) => i.name === IDX_SINISTERS)) {
        await queryInterface.removeIndex('sinisters', IDX_SINISTERS, { transaction: t })
      }
      const sin = await queryInterface.describeTable('sinisters', { transaction: t })
      if (sin.insured_user_id) {
        await queryInterface.removeColumn('sinisters', 'insured_user_id', { transaction: t })
      }

      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
