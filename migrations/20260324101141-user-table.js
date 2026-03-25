'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('User', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        firstname: {
          type: Sequelize.STRING,
          allowNull: true
        },
        lastname: {
          type: Sequelize.STRING,
          allowNull: true
        },
        email: {
          type: Sequelize.STRING
        },
        // person_id: {
        //   type: Sequelize.INTEGER,
        //   references: {
        //     model: 'Person',
        //     key: 'id'
        //   }
        // },
        // updateAt: {
        //   allowNull: false,
        //   type: Sequelize.DATE,
        //   defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        // },
        // createdAt: {
        //   allowNull: false,
        //   type: Sequelize.DATE,
        //   defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        // }
      }, { transaction })
      transaction.commit();
    } catch(err) {
      transaction.rollback();
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('User')
  }
};
