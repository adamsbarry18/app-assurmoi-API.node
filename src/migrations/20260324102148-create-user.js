'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('User', { 
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING,
        },
        firsname: {
          type: Sequelize.STRING,
          allowNull: true
        },
        lastname: {
          type: Sequelize.STRING,
          allowNull: true
        },
     });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('User');
  }
};
