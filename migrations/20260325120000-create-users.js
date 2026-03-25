'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.createTable(
        'users',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          username: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          email: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          password_hash: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          first_name: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          last_name: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          role: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          session_token: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          refresh_token: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          two_factor_code: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
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

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down (queryInterface) {
    await queryInterface.dropTable('users')
  }
}
