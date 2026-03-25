import Sequelize, { type QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface, SequelizeTypes: typeof Sequelize) {
    await queryInterface.createTable('users', {
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
      createdAt: {
        type: SequelizeTypes.DATE,
        defaultValue: SequelizeTypes.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      updatedAt: {
        type: SequelizeTypes.DATE,
        defaultValue: SequelizeTypes.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('users');
  },
};
