const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Sinister extends Model {
    static associate (models) {
      Sinister.belongsTo(models.User, {
        foreignKey: 'created_by_id',
        as: 'creator'
      })
      Sinister.belongsTo(models.Document, {
        foreignKey: 'cni_driver',
        as: 'cniDocument'
      })
      Sinister.belongsTo(models.Document, {
        foreignKey: 'vehicle_registration_doc_id',
        as: 'registrationDocument'
      })
      Sinister.belongsTo(models.Document, {
        foreignKey: 'insurance_certificate_id',
        as: 'insuranceDocument'
      })
      Sinister.hasOne(models.SinisterFolder, {
        foreignKey: 'sinister_id',
        as: 'folder'
      })
    }
  }

  Sinister.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vehicle_plate: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      driver_first_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      driver_last_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_driver_insured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      call_datetime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      incident_datetime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      driver_responsability: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      driver_engaged_responsibility: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cni_driver: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      vehicle_registration_doc_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      insurance_certificate_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      is_validated_by_manager: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Sinister',
      tableName: 'sinisters',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  )

  return Sinister
}
