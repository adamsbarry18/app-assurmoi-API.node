'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction()
    try {
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
      await queryInterface.addIndex('sinisters', ['insured_user_id'], {
        name: 'idx_sinisters_insured_user_id',
        transaction: t
      })
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
      await queryInterface.addIndex('documents', ['uploaded_by_id'], {
        name: 'idx_documents_uploaded_by_id',
        transaction: t
      })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down (queryInterface) {
    const t = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeIndex('documents', 'idx_documents_uploaded_by_id', { transaction: t })
      await queryInterface.removeColumn('documents', 'uploaded_by_id', { transaction: t })
      await queryInterface.removeIndex('sinisters', 'idx_sinisters_insured_user_id', { transaction: t })
      await queryInterface.removeColumn('sinisters', 'insured_user_id', { transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
