const { Op } = require('sequelize')
const { SinisterFolder, Document } = require('../models')
const { AppError, ERROR_CODES } = require('../core/errors')

async function sinisterIsComplete (sinisterInstance, { transaction } = {}) {
  const s = sinisterInstance
  if (!s.vehicle_plate || !s.call_datetime || !s.incident_datetime) {
    return false
  }
  const ids = [s.cni_driver, s.vehicle_registration_doc_id, s.insurance_certificate_id]
  if (ids.some((x) => x == null)) return false

  const docs = await Document.findAll({
    where: { id: { [Op.in]: ids } },
    transaction
  })
  if (docs.length !== 3) return false
  return docs.every((d) => d.is_validated === true)
}

function generateFolderReference (sinisterId) {
  const y = new Date().getUTCFullYear()
  const r = Math.floor(Math.random() * 900000 + 100000)
  return `DOS-${y}-${sinisterId}-${r}`
}

async function createFolderRecord (sinisterId, { transaction }) {
  let folderReference = generateFolderReference(sinisterId)
  for (let i = 0; i < 5; i++) {
    try {
      return await SinisterFolder.create(
        {
          sinister_id: sinisterId,
          folder_reference: folderReference,
          status: 'INITIALIZED',
          is_closed: false
        },
        { transaction }
      )
    } catch (e) {
      if (e && e.name === 'SequelizeUniqueConstraintError') {
        folderReference = generateFolderReference(sinisterId)
        continue
      }
      throw e
    }
  }
  throw new AppError(
    'Impossible de générer une référence de dossier unique',
    409,
    ERROR_CODES.CONFLICT.code
  )
}

async function ensureFolderIfComplete (sinisterInstance, { transaction }) {
  const complete = await sinisterIsComplete(sinisterInstance, { transaction })
  if (!complete) {
    return { folder: null, created: false, complete: false }
  }

  const existing = await SinisterFolder.findOne({
    where: { sinister_id: sinisterInstance.id },
    transaction
  })
  if (existing) {
    return { folder: existing, created: false, complete: true }
  }

  const folder = await createFolderRecord(sinisterInstance.id, { transaction })
  return { folder, created: true, complete: true }
}

module.exports = {
  sinisterIsComplete,
  generateFolderReference,
  createFolderRecord,
  ensureFolderIfComplete
}
