'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
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

      await queryInterface.addIndex('invitations', ['email'], {
        name: 'invitations_email_idx',
        transaction
      })
      await queryInterface.addIndex('invitations', ['status', 'email'], {
        name: 'invitations_status_email_idx',
        transaction
      })

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
