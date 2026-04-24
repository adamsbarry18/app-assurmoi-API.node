const { Model } = require('sequelize')

const ENTITY_TYPES = Object.freeze([
  'sinister',
  'document',
  'folder',
  'folder_step',
  'user'
])

module.exports = (sequelize, DataTypes) => {
  class HistoryLog extends Model {
    static associate (models) {
      HistoryLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'actor'
      })
    }
  }

  HistoryLog.init(
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
      entity_type: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'HistoryLog',
      tableName: 'history_logs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  )

  return HistoryLog
}

module.exports.ENTITY_TYPES = ENTITY_TYPES
