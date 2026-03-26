const { Model } = require('sequelize')

const USER_ROLES = Object.freeze([
  'ADMIN', // Super administrateur de l'application
  'PORTFOLIO_MANAGER', // Superviseur de portefeuille 
  'TRACKING_OFFICER', // Chargé de suivi de dossier
  'CUSTOMER_OFFICER', // Chargé de clientèle de sinistre
  'INSURED' // Assuré (utilisateur final)
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
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM(...USER_ROLES),
        allowNull: false,
        defaultValue: 'INSURED'
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
        type: DataTypes.STRING,
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
