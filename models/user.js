const { Model } = require('sequelize')

const USER_ROLES = Object.freeze([
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER',
  'INSURED'
])

const User = (sequelize, DataTypes) => {
  class User extends Model {
    static associate () {}
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      first_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      session_token: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      two_factor_code: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      defaultScope: {
        attributes: {
          exclude: [
            'password_hash',
            'session_token',
            'refresh_token',
            'two_factor_code'
          ]
        }
      }
    }
  )

  return User
}

module.exports = User
module.exports.USER_ROLES = USER_ROLES
