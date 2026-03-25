'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('User', [
      {
        username: 'saittirite',
        password: 'MotDeP@ss123',
        firstname: 'Soufian',
        lastname: 'AIT TIRITE',
        email: 's.aittirite@websociety.fr'
      }
    ], {})
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('User', { username: 'saittirite' })
  }
};
