'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.createTable(
        'documents',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          type: {
            type: Sequelize.ENUM(
              'ID_CARD',
              'REGISTRATION_CARD',
              'INSURANCE_CERT',
              'EXPERT_REPORT',
              'INVOICE',
              'RIB',
              'SIGNATURE'
            ),
            allowNull: false
          },
          storage_url: {
            type: Sequelize.STRING(512),
            allowNull: true
          },
          is_validated: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          uploaded_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        { transaction }
      )

      await queryInterface.createTable(
        'sinisters',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          vehicle_plate: {
            type: Sequelize.STRING(50),
            allowNull: false
          },
          driver_first_name: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          driver_last_name: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          is_driver_insured: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          call_datetime: {
            type: Sequelize.DATE,
            allowNull: false
          },
          incident_datetime: {
            type: Sequelize.DATE,
            allowNull: false
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          driver_responsability: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          driver_engaged_responsibility: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          cni_driver: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'documents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          vehicle_registration_doc_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'documents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          insurance_certificate_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'documents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          is_validated_by_manager: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          created_by_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        { transaction }
      )

      await queryInterface.createTable(
        'sinister_folders',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          sinister_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'sinisters', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          folder_reference: {
            type: Sequelize.STRING(100),
            allowNull: true,
            unique: true
          },
          status: {
            type: Sequelize.ENUM(
              'INITIALIZED',
              'EXPERTISE_PENDING',
              'REPAIR_PLANNED',
              'COMPENSATION_PENDING',
              'CLOSED'
            ),
            allowNull: true
          },
          scenario: {
            type: Sequelize.ENUM('REPAIRABLE', 'TOTAL_LOSS'),
            allowNull: true
          },
          is_closed: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          assigned_officer_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            allowNull: true,
            type: Sequelize.DATE
          }
        },
        { transaction }
      )

      await queryInterface.createTable(
        'folder_steps',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          folder_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'sinister_folders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          step_type: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          value: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          action_date: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          document_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'documents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          performed_by_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        },
        { transaction }
      )

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.dropTable('folder_steps', { transaction })
      await queryInterface.dropTable('sinister_folders', { transaction })
      await queryInterface.dropTable('sinisters', { transaction })
      await queryInterface.dropTable('documents', { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
