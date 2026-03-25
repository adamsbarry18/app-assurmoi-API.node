import Sequelize, { type QueryInterface } from 'sequelize';

export default {

  async up (queryInterface: QueryInterface, SequelizeTypes: typeof Sequelize) {
     await queryInterface.bulkInsert('users', [{
        userName: 'mabarry',
        password: 'password',
        email: 'mabarry@example.com',
        firstName: 'Mamadou',
        lastName: 'Barry'
     },
      {
        userName: 'jdoe',
        password: 'password',
        email: 'jdoe@example.com',
        firstName: 'John',
        lastName: 'Doe'
     }
    ], {});
    
  },

  async down (queryInterface: QueryInterface, SequelizeTypes: typeof Sequelize) {

    await queryInterface.bulkDelete('users', {userName: ['mabarry', 'jdoe']}, {});
  }
};
