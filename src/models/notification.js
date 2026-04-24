const { Model } = require('sequelize')

const NOTIFICATION_CHANNELS = Object.freeze(['EMAIL', 'PUSH'])

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate (models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'recipient'
      })
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      channel: {
        type: DataTypes.ENUM(...NOTIFICATION_CHANNELS),
        allowNull: false,
        defaultValue: 'PUSH'
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  )

  return Notification
}

module.exports.NOTIFICATION_CHANNELS = NOTIFICATION_CHANNELS
