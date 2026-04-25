'use strict'

/** @type {import('sequelize-cli').Migration} */
const INDEX_NAME = 'history_logs_entity_type_entity_id_idx'

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      const tables = await queryInterface.showAllTables({ transaction })
      const hasTable = tables.map((t) => String(t).toLowerCase()).includes('history_logs')
      if (!hasTable) {
        await queryInterface.createTable(
          'history_logs',
          {
            id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER
            },
            user_id: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: 'users', key: 'id' },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL'
            },
            entity_type: {
              type: Sequelize.STRING(255),
              allowNull: true
            },
            entity_id: {
              type: Sequelize.INTEGER,
              allowNull: true
            },
            action: {
              type: Sequelize.STRING(255),
              allowNull: true
            },
            created_at: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
          },
          { transaction }
        )
      }

      const indexes = await queryInterface.showIndex('history_logs', { transaction })
      const hasIdx = indexes.some((i) => i.name === INDEX_NAME)
      if (!hasIdx) {
        await queryInterface.addIndex('history_logs', ['entity_type', 'entity_id'], {
          name: INDEX_NAME,
          transaction
        })
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down (queryInterface) {
    await queryInterface.dropTable('history_logs')
  }
}
