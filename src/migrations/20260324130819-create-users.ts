import Sequelize, { type QueryInterface } from 'sequelize';

/** Sequelize CLI passe le constructeur Sequelize (DataTypes, etc.) en 2e argument. */
export default {
  async up(queryInterface: QueryInterface, SequelizeTypes: typeof Sequelize) {
    await queryInterface.createTable('User', {
      id: {
        type: SequelizeTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userName: {
        type: SequelizeTypes.STRING,
        allowNull: false,
      },
      password: {
        type: SequelizeTypes.STRING,
        allowNull: false,
      },
      email: {
        type: SequelizeTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: SequelizeTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: SequelizeTypes.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('User');
  },
};
