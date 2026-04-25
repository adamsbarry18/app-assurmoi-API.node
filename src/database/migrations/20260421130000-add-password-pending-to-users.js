'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const users = await queryInterface.describeTable('users')
    if (users.password_pending) {
      return
    }
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn(
        'users',
        'password_pending',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        { transaction }
      )
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      throw e
    }
  },

  async down (queryInterface) {
    const users = await queryInterface.describeTable('users')
    if (!users.password_pending) {
      return
    }
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn('users', 'password_pending', { transaction })
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      throw e
    }
  }
}
