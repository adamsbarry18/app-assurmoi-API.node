import Sequelize, { type QueryInterface } from 'sequelize';

export default {

  async up (queryInterface: QueryInterface, SequelizeTypes: typeof Sequelize) {
     await queryInterface.bulkInsert('User', [{
        userName: 'mabarry',
        password: 'password',
        email: 'mabarry@example.com',
        firstName: 'Mamadou',
        lastName: 'Barry'
     }], {});
    
  },

  async down (queryInterface: QueryInterface, SequelizeTypes: typeof Sequelize) {

    await queryInterface.bulkDelete('User', {userName: 'mabarry'}, {});
  }
};
