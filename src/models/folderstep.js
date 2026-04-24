const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class FolderStep extends Model {
    static associate (models) {
      FolderStep.belongsTo(models.SinisterFolder, {
        foreignKey: 'folder_id',
        as: 'folder'
      })
      FolderStep.belongsTo(models.Document, {
        foreignKey: 'document_id',
        as: 'document'
      })
      FolderStep.belongsTo(models.User, {
        foreignKey: 'performed_by_id',
        as: 'performedBy'
      })
    }
  }

  FolderStep.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      folder_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      step_type: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      action_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      document_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      performed_by_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'FolderStep',
      tableName: 'folder_steps',
      underscored: true,
      timestamps: false
    }
  )

  return FolderStep
}
