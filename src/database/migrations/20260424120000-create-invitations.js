'use strict'

const INDEX_EMAIL = 'invitations_email_idx'
const INDEX_STATUS_EMAIL = 'invitations_status_email_idx'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      const tables = await queryInterface.showAllTables({ transaction })
      const hasTable = tables.map((t) => String(t).toLowerCase()).includes('invitations')
      if (!hasTable) {
        await queryInterface.createTable(
          'invitations',
          {
            id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER
            },
            email: {
              type: Sequelize.STRING,
              allowNull: false
            },
            role: {
              type: Sequelize.ENUM(
                'ADMIN',
                'PORTFOLIO_MANAGER',
                'TRACKING_OFFICER',
                'CUSTOMER_OFFICER',
                'INSURED'
              ),
              allowNull: false,
              defaultValue: 'INSURED'
            },
            status: {
              type: Sequelize.ENUM('pending', 'cancelled', 'accepted'),
              allowNull: false,
              defaultValue: 'pending'
            },
            created_at: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
              allowNull: true,
              type: Sequelize.DATE
            }
          },
          { transaction }
        )
      }

      const indexes = await queryInterface.showIndex('invitations', { transaction })
      const names = new Set(indexes.map((i) => i.name))
      if (!names.has(INDEX_EMAIL)) {
        await queryInterface.addIndex('invitations', ['email'], {
          name: INDEX_EMAIL,
          transaction
        })
      }
      if (!names.has(INDEX_STATUS_EMAIL)) {
        await queryInterface.addIndex('invitations', ['status', 'email'], {
          name: INDEX_STATUS_EMAIL,
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
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.dropTable('invitations', { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
