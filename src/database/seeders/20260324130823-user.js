'use strict'

const bcrypt = require('bcryptjs')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const password_hash = await bcrypt.hash('MotDeP@ss123', 12)
    await queryInterface.bulkInsert('users', [
      {
        username: 'saittirite',
        email: 's.aittirite@websociety.fr',
        password_hash,
        first_name: 'Soufian',
        last_name: 'AIT TIRITE',
        role: 'ADMIN',
        session_token: null,
        refresh_token: null,
        two_factor_code: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { username: 'saittirite' })
  }
}
