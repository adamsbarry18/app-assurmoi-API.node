'use strict'

const INDEX_NAME = 'notifications_user_id_is_read_idx'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      const tables = await queryInterface.showAllTables({ transaction })
      const hasTable = tables.map((t) => String(t).toLowerCase()).includes('notifications')
      if (!hasTable) {
        await queryInterface.createTable(
          'notifications',
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
              onDelete: 'CASCADE'
            },
            content: {
              type: Sequelize.TEXT,
              allowNull: true
            },
            channel: {
              type: Sequelize.ENUM('EMAIL', 'PUSH'),
              allowNull: false,
              defaultValue: 'PUSH'
            },
            is_read: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false
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

      const indexes = await queryInterface.showIndex('notifications', { transaction })
      if (!indexes.some((i) => i.name === INDEX_NAME)) {
        await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
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
    await queryInterface.dropTable('notifications')
  }
}
