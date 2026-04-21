const { Model } = require('sequelize')

const DOCUMENT_TYPES = Object.freeze([
  'ID_CARD',
  'REGISTRATION_CARD',
  'INSURANCE_CERT',
  'EXPERT_REPORT',
  'INVOICE',
  'RIB',
  'SIGNATURE'
])

module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    static associate () {}
  }

  Document.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM(...DOCUMENT_TYPES),
        allowNull: false
      },
      storage_url: {
        type: DataTypes.STRING(512),
        allowNull: true
      },
      is_validated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'Document',
      tableName: 'documents',
      underscored: true,
      timestamps: true,
      createdAt: 'uploaded_at',
      updatedAt: false
    }
  )

  return Document
}

module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES
