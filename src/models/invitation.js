const { Model } = require('sequelize')
const userModelFile = require('./user')
const USER_ROLES = userModelFile.USER_ROLES

const Invitation = (sequelize, DataTypes) => {
  class Invitation extends Model {
    static associate (models) {}
  }

  Invitation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM(...USER_ROLES),
        allowNull: false,
        defaultValue: 'INSURED'
      },
      status: {
        type: DataTypes.ENUM('pending', 'cancelled', 'accepted'),
        allowNull: false,
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'Invitation',
      tableName: 'invitations',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return Invitation
}

module.exports = Invitation
