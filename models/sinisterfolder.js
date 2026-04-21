const { Model } = require('sequelize')

const FOLDER_STATUSES = Object.freeze([
  'INITIALIZED',
  'EXPERTISE_PENDING',
  'REPAIR_PLANNED',
  'COMPENSATION_PENDING',
  'CLOSED'
])

const FOLDER_SCENARIOS = Object.freeze(['REPAIRABLE', 'TOTAL_LOSS'])

module.exports = (sequelize, DataTypes) => {
  class SinisterFolder extends Model {
    static associate (models) {
      SinisterFolder.belongsTo(models.Sinister, {
        foreignKey: 'sinister_id',
        as: 'sinister'
      })
      SinisterFolder.belongsTo(models.User, {
        foreignKey: 'assigned_officer_id',
        as: 'assignedOfficer'
      })
      SinisterFolder.hasMany(models.FolderStep, {
        foreignKey: 'folder_id',
        as: 'steps'
      })
    }
  }

  SinisterFolder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sinister_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      folder_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
      },
      status: {
        type: DataTypes.ENUM(...FOLDER_STATUSES),
        allowNull: true
      },
      scenario: {
        type: DataTypes.ENUM(...FOLDER_SCENARIOS),
        allowNull: true
      },
      is_closed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      assigned_officer_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'SinisterFolder',
      tableName: 'sinister_folders',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return SinisterFolder
}

module.exports.FOLDER_STATUSES = FOLDER_STATUSES
module.exports.FOLDER_SCENARIOS = FOLDER_SCENARIOS
