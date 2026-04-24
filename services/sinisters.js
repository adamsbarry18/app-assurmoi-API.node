const { Op } = require('sequelize')
const {
  Sinister,
  SinisterFolder,
  Document,
  User,
  dbInstance
} = require('../models')
const { logError } = require('../core/logError')
const { ERROR_CODES } = require('../core/errors')
const { AppError } = require('../core/errors')
const { FOLDER_STATUSES } = require('../models/sinisterfolder')
const { assertDocumentType } = require('./documents')
const {
  sinisterIsComplete,
  ensureFolderIfComplete
} = require('./folderCore')
const { recordHistory, HISTORY_ACTION } = require('./historyAudit')

function parseListPagination (query) {
  const rawLimit = query.limit
  const rawOffset = query.offset
  let limit = Number.parseInt(String(rawLimit ?? '20'), 10)
  let offset = Number.parseInt(String(rawOffset ?? '0'), 10)
  if (Number.isNaN(limit) || limit < 1) limit = 20
  if (limit > 100) limit = 100
  if (Number.isNaN(offset) || offset < 0) offset = 0
  return { limit, offset }
}

function computeSinisterStatus (sinisterJson) {
  const folder = sinisterJson.folder
  if (folder && folder.status) {
    return `FOLDER_${folder.status}`
  }
  if (sinisterJson.is_validated_by_manager) {
    return 'validated'
  }
  return 'pending_validation'
}

function attachComputedStatus (row) {
  const j = typeof row.toJSON === 'function' ? row.toJSON() : { ...row }
  j.status = computeSinisterStatus(j)
  return j
}

const sinisterIncludeDetail = [
  { model: User, as: 'creator', attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name'] },
  { model: User, as: 'insuredUser', attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name'] },
  { model: Document, as: 'cniDocument' },
  { model: Document, as: 'registrationDocument' },
  { model: Document, as: 'insuranceDocument' },
  {
    model: SinisterFolder,
    as: 'folder',
    include: [{ model: User, as: 'assignedOfficer', attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name'] }]
  }
]

const sinisterIncludeList = [
  {
    model: SinisterFolder,
    as: 'folder',
    attributes: ['id', 'folder_reference', 'status', 'scenario', 'is_closed', 'created_at']
  }
]

async function resolveInsuredUserId (rawId, { transaction } = {}) {
  if (rawId === undefined || rawId === null || rawId === '') {
    return null
  }
  const id = Number(rawId)
  if (Number.isNaN(id)) {
    throw new AppError('insured_user_id invalide', 400, ERROR_CODES.BAD_REQUEST.code)
  }
  const u = await User.findByPk(id, { transaction })
  if (!u) {
    throw new AppError('Utilisateur assuré introuvable', 400, ERROR_CODES.BAD_REQUEST.code)
  }
  if (u.role !== 'INSURED') {
    throw new AppError(
      'insured_user_id doit désigner un compte au rôle INSURED',
      400,
      ERROR_CODES.BAD_REQUEST.code
    )
  }
  if (!u.is_active) {
    throw new AppError('Compte assuré inactif', 400, ERROR_CODES.BAD_REQUEST.code)
  }
  return id
}

async function assertSinisterDocumentSlots (body, { transaction } = {}) {
  if (body.cni_driver !== undefined && body.cni_driver != null) {
    await assertDocumentType(body.cni_driver, 'ID_CARD', { transaction })
  }
  if (
    body.vehicle_registration_doc_id !== undefined &&
    body.vehicle_registration_doc_id != null
  ) {
    await assertDocumentType(
      body.vehicle_registration_doc_id,
      'REGISTRATION_CARD',
      { transaction }
    )
  }
  if (
    body.insurance_certificate_id !== undefined &&
    body.insurance_certificate_id != null
  ) {
    await assertDocumentType(
      body.insurance_certificate_id,
      'INSURANCE_CERT',
      { transaction }
    )
  }
}

const listSinisters = async (req, res) => {
  try {
    const { limit, offset } = parseListPagination(req.query)
    const where = {}

    if (req.query.vehicle_plate) {
      where.vehicle_plate = {
        [Op.like]: `%${req.query.vehicle_plate}%`
      }
    }

    if (req.query.call_datetime_from) {
      where.call_datetime = where.call_datetime || {}
      where.call_datetime[Op.gte] = new Date(req.query.call_datetime_from)
    }
    if (req.query.call_datetime_to) {
      where.call_datetime = where.call_datetime || {}
      where.call_datetime[Op.lte] = new Date(req.query.call_datetime_to)
    }

    if (req.query.incident_datetime_from) {
      where.incident_datetime = where.incident_datetime || {}
      where.incident_datetime[Op.gte] = new Date(req.query.incident_datetime_from)
    }
    if (req.query.incident_datetime_to) {
      where.incident_datetime = where.incident_datetime || {}
      where.incident_datetime[Op.lte] = new Date(req.query.incident_datetime_to)
    }

    if (req.user.role === 'INSURED') {
      where.insured_user_id = req.user.id
    }

    const status = req.query.status
    const include = [...sinisterIncludeList]

    if (status === 'pending_validation') {
      where.is_validated_by_manager = false
    } else if (status === 'validated') {
      where.is_validated_by_manager = true
    } else if (status && FOLDER_STATUSES.includes(status)) {
      include[0] = {
        model: SinisterFolder,
        as: 'folder',
        attributes: ['id', 'folder_reference', 'status', 'scenario', 'is_closed', 'created_at'],
        where: { status },
        required: true
      }
    }

    const { rows, count } = await Sinister.findAndCountAll({
      where,
      include,
      limit,
      offset,
      distinct: true,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      data: rows.map(attachComputedStatus),
      meta: { total: count, limit, offset }
    })
  } catch (err) {
    return logError(res, err, {
      context: 'sinisters.listSinisters',
      defaultMessage: 'Erreur lors de la liste des sinistres'
    })
  }
}

const getSinister = async (req, res) => {
  try {
    const id = req.params.id
    const sinister = await Sinister.findByPk(id, {
      include: sinisterIncludeDetail
    })
    if (!sinister) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Sinistre introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    if (req.user.role === 'INSURED' && sinister.insured_user_id !== req.user.id) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Sinistre introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    const data = attachComputedStatus(sinister)
    return res.status(200).json({ data })
  } catch (err) {
    return logError(res, err, {
      context: 'sinisters.getSinister',
      defaultMessage: 'Erreur lors de la récupération du sinistre'
    })
  }
}

const createSinister = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    await assertSinisterDocumentSlots(req.body, { transaction })

    const {
      vehicle_plate: vehiclePlate,
      driver_first_name: driverFirstName,
      driver_last_name: driverLastName,
      is_driver_insured: isDriverInsured,
      call_datetime: callDatetime,
      incident_datetime: incidentDatetime,
      description,
      driver_responsability: driverResponsability,
      driver_engaged_responsibility: driverEngagedResponsibility,
      cni_driver: cniDriver,
      vehicle_registration_doc_id: vehicleRegistrationDocId,
      insurance_certificate_id: insuranceCertificateId
    } = req.body

    let insuredUserId = await resolveInsuredUserId(req.body.insured_user_id, {
      transaction
    })
    if (req.user.role === 'INSURED') {
      insuredUserId = req.user.id
    }

    const created = await Sinister.create(
      {
        vehicle_plate: vehiclePlate,
        driver_first_name: driverFirstName ?? null,
        driver_last_name: driverLastName ?? null,
        is_driver_insured: Boolean(isDriverInsured),
        call_datetime: callDatetime,
        incident_datetime: incidentDatetime,
        description: description ?? null,
        driver_responsability: Boolean(driverResponsability),
        driver_engaged_responsibility:
          driverEngagedResponsibility != null
            ? Number(driverEngagedResponsibility)
            : null,
        cni_driver: cniDriver ?? null,
        vehicle_registration_doc_id: vehicleRegistrationDocId ?? null,
        insurance_certificate_id: insuranceCertificateId ?? null,
        created_by_id: req.user.id,
        insured_user_id: insuredUserId
      },
      { transaction }
    )

    await transaction.commit()

    const full = await Sinister.findByPk(created.id, {
      include: sinisterIncludeDetail
    })
    await recordHistory({
      userId: req.user.id,
      entityType: 'sinister',
      entityId: created.id,
      action: HISTORY_ACTION.SINISTER_CREATED
    })
    return res.status(201).json({ data: attachComputedStatus(full) })
  } catch (err) {
    await transaction.rollback()
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      })
    }
    return logError(res, err, {
      context: 'sinisters.createSinister',
      defaultMessage: 'Erreur lors de la création du sinistre'
    })
  }
}

const updateSinister = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const id = req.params.id
    const sinister = await Sinister.findByPk(id, { transaction })
    if (!sinister) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Sinistre introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    if (sinister.is_validated_by_manager) {
      await transaction.rollback()
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message: 'Sinistre validé : mise à jour interdite',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    await assertSinisterDocumentSlots(req.body, { transaction })

    const {
      vehicle_plate: vehiclePlate,
      driver_first_name: driverFirstName,
      driver_last_name: driverLastName,
      is_driver_insured: isDriverInsured,
      call_datetime: callDatetime,
      incident_datetime: incidentDatetime,
      description,
      driver_responsability: driverResponsability,
      driver_engaged_responsibility: driverEngagedResponsibility,
      cni_driver: cniDriver,
      vehicle_registration_doc_id: vehicleRegistrationDocId,
      insurance_certificate_id: insuranceCertificateId
    } = req.body

    const updates = {}
    if (vehiclePlate !== undefined) updates.vehicle_plate = vehiclePlate
    if (driverFirstName !== undefined) updates.driver_first_name = driverFirstName
    if (driverLastName !== undefined) updates.driver_last_name = driverLastName
    if (isDriverInsured !== undefined) {
      updates.is_driver_insured = Boolean(isDriverInsured)
    }
    if (callDatetime !== undefined) updates.call_datetime = callDatetime
    if (incidentDatetime !== undefined) {
      updates.incident_datetime = incidentDatetime
    }
    if (description !== undefined) updates.description = description
    if (driverResponsability !== undefined) {
      updates.driver_responsability = Boolean(driverResponsability)
    }
    if (driverEngagedResponsibility !== undefined) {
      updates.driver_engaged_responsibility =
        driverEngagedResponsibility != null
          ? Number(driverEngagedResponsibility)
          : null
    }
    if (cniDriver !== undefined) updates.cni_driver = cniDriver
    if (vehicleRegistrationDocId !== undefined) {
      updates.vehicle_registration_doc_id = vehicleRegistrationDocId
    }
    if (insuranceCertificateId !== undefined) {
      updates.insurance_certificate_id = insuranceCertificateId
    }
    if (req.body.insured_user_id !== undefined) {
      updates.insured_user_id = await resolveInsuredUserId(req.body.insured_user_id, {
        transaction
      })
    }

    if (Object.keys(updates).length === 0) {
      await transaction.rollback()
      return res.status(ERROR_CODES.BAD_REQUEST.status).json({
        message: 'Aucun champ à mettre à jour',
        code: ERROR_CODES.BAD_REQUEST.code
      })
    }

    await sinister.update(updates, { transaction })
    await transaction.commit()

    const full = await Sinister.findByPk(id, { include: sinisterIncludeDetail })
    await recordHistory({
      userId: req.user.id,
      entityType: 'sinister',
      entityId: Number(id),
      action: HISTORY_ACTION.SINISTER_UPDATED
    })
    return res.status(200).json({ data: attachComputedStatus(full) })
  } catch (err) {
    await transaction.rollback()
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      })
    }
    return logError(res, err, {
      context: 'sinisters.updateSinister',
      defaultMessage: 'Erreur lors de la mise à jour du sinistre'
    })
  }
}

const validateSinisterByManager = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const id = req.params.id
    const sinister = await Sinister.findByPk(id, { transaction })
    if (!sinister) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Sinistre introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    if (sinister.is_validated_by_manager) {
      await transaction.rollback()
      const full = await Sinister.findByPk(id, { include: sinisterIncludeDetail })
      return res.status(200).json({
        message: 'Sinistre déjà validé',
        data: attachComputedStatus(full)
      })
    }

    await sinister.update({ is_validated_by_manager: true }, { transaction })

    const reloaded = await Sinister.findByPk(id, { transaction })
    const { folder, created, complete } = await ensureFolderIfComplete(
      reloaded,
      { transaction }
    )

    await transaction.commit()

    const full = await Sinister.findByPk(id, { include: sinisterIncludeDetail })
    await recordHistory({
      userId: req.user.id,
      entityType: 'sinister',
      entityId: Number(id),
      action: HISTORY_ACTION.SINISTER_VALIDATED
    })
    if (folder && created) {
      await recordHistory({
        userId: req.user.id,
        entityType: 'folder',
        entityId: folder.id,
        action: HISTORY_ACTION.FOLDER_CREATED
      })
    }
    return res.status(200).json({
      message: complete
        ? created
          ? 'Sinistre validé et dossier créé'
          : 'Sinistre validé (dossier déjà existant)'
        : 'Sinistre validé ; dossier non créé (dossier incomplet ou pièces non validées)',
      data: attachComputedStatus(full),
      meta: {
        folder_created: Boolean(created),
        folder_id: folder ? folder.id : null,
        dossier_complet: complete
      }
    })
  } catch (err) {
    await transaction.rollback()
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      })
    }
    return logError(res, err, {
      context: 'sinisters.validateSinisterByManager',
      defaultMessage: 'Erreur lors de la validation du sinistre'
    })
  }
}

module.exports = {
  listSinisters,
  getSinister,
  createSinister,
  updateSinister,
  validateSinisterByManager,
  computeSinisterStatus,
  sinisterIsComplete
}
