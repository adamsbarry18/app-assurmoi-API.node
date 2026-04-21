const {
  SinisterFolder,
  Sinister,
  Document,
  User,
  FolderStep,
  dbInstance
} = require('../models')
const { logError } = require('../core/logError')
const { ERROR_CODES, AppError } = require('../core/errors')
const {
  sinisterIsComplete,
  createFolderRecord
} = require('./folderCore')

const OFFICER_ROLES_FOR_ASSIGNMENT = ['TRACKING_OFFICER', 'ADMIN']

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

const sinisterIncludeForFolderDetail = [
  { model: User, as: 'creator', attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name'] },
  { model: Document, as: 'cniDocument' },
  { model: Document, as: 'registrationDocument' },
  { model: Document, as: 'insuranceDocument' }
]

const folderIncludeDetail = [
  {
    model: Sinister,
    as: 'sinister',
    include: sinisterIncludeForFolderDetail
  },
  {
    model: User,
    as: 'assignedOfficer',
    attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name']
  },
  {
    model: FolderStep,
    as: 'steps',
    separate: true,
    order: [
      ['action_date', 'ASC'],
      ['id', 'ASC']
    ],
    include: [
      { model: Document, as: 'document' },
      {
        model: User,
        as: 'performedBy',
        attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name']
      }
    ]
  }
]

const folderIncludeList = [
  {
    model: Sinister,
    as: 'sinister',
    attributes: [
      'id',
      'vehicle_plate',
      'incident_datetime',
      'is_validated_by_manager'
    ]
  },
  {
    model: User,
    as: 'assignedOfficer',
    attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name']
  }
]

const listFolders = async (req, res) => {
  try {
    const { limit, offset } = parseListPagination(req.query)
    const where = {}

    if (req.query.status !== undefined && req.query.status !== '') {
      where.status = req.query.status
    }
    if (req.query.scenario !== undefined && req.query.scenario !== '') {
      where.scenario = req.query.scenario
    }
    if (req.query.assigned_officer_id !== undefined && req.query.assigned_officer_id !== '') {
      const aid = Number.parseInt(String(req.query.assigned_officer_id), 10)
      if (!Number.isNaN(aid)) {
        where.assigned_officer_id = aid
      }
    }

    const { rows, count } = await SinisterFolder.findAndCountAll({
      where,
      include: folderIncludeList,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      data: rows,
      meta: { total: count, limit, offset }
    })
  } catch (err) {
    return logError(res, err, {
      context: 'folders.listFolders',
      defaultMessage: 'Erreur lors de la liste des dossiers'
    })
  }
}

const getFolder = async (req, res) => {
  try {
    const id = req.params.id
    const folder = await SinisterFolder.findByPk(id, {
      include: folderIncludeDetail
    })
    if (!folder) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Dossier introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }
    return res.status(200).json({ data: folder })
  } catch (err) {
    return logError(res, err, {
      context: 'folders.getFolder',
      defaultMessage: 'Erreur lors de la récupération du dossier'
    })
  }
}

const createFolder = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const sinisterId = req.body.sinister_id
    const force = Boolean(req.body.force)

    const sinister = await Sinister.findByPk(sinisterId, { transaction })
    if (!sinister) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Sinistre introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    const existing = await SinisterFolder.findOne({
      where: { sinister_id: sinisterId },
      transaction
    })
    if (existing) {
      await transaction.rollback()
      return res.status(ERROR_CODES.CONFLICT.status).json({
        message: 'Un dossier existe déjà pour ce sinistre',
        code: ERROR_CODES.CONFLICT.code
      })
    }

    if (!sinister.is_validated_by_manager) {
      await transaction.rollback()
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message: 'Le sinistre doit être validé par un gestionnaire avant ouverture de dossier',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    const complete = await sinisterIsComplete(sinister, { transaction })
    const canForce =
      force && ['ADMIN', 'PORTFOLIO_MANAGER'].includes(req.user.role)

    if (!complete && !canForce) {
      await transaction.rollback()
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message:
          'Sinistre incomplet ou pièces non validées ; utilisez force (gestionnaire/admin) pour forcer la création',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    const created = await createFolderRecord(sinisterId, { transaction })
    await transaction.commit()

    const full = await SinisterFolder.findByPk(created.id, {
      include: folderIncludeDetail
    })
    return res.status(201).json({ data: full })
  } catch (err) {
    await transaction.rollback()
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      })
    }
    return logError(res, err, {
      context: 'folders.createFolder',
      defaultMessage: 'Erreur lors de la création du dossier'
    })
  }
}

async function assertAssignableOfficer (userId, { transaction } = {}) {
  const user = await User.findByPk(userId, { transaction })
  if (!user || !user.is_active) {
    throw new AppError(
      'Utilisateur introuvable ou inactif',
      400,
      ERROR_CODES.BAD_REQUEST.code
    )
  }
  if (!OFFICER_ROLES_FOR_ASSIGNMENT.includes(user.role)) {
    throw new AppError(
      'Le chargé assigné doit être TRACKING_OFFICER ou ADMIN',
      400,
      ERROR_CODES.BAD_REQUEST.code
    )
  }
}

const assignOfficer = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const id = req.params.id
    const officerId = req.body.assigned_officer_id

    const folder = await SinisterFolder.findByPk(id, { transaction })
    if (!folder) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Dossier introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    if (folder.is_closed) {
      await transaction.rollback()
      return res.status(ERROR_CODES.UNPROCESSABLE_ENTITY.status).json({
        message: 'Dossier clôturé : assignation impossible',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    await assertAssignableOfficer(officerId, { transaction })

    await folder.update({ assigned_officer_id: officerId }, { transaction })
    await transaction.commit()

    const full = await SinisterFolder.findByPk(id, {
      include: folderIncludeDetail
    })
    return res.status(200).json({ data: full })
  } catch (err) {
    await transaction.rollback()
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      })
    }
    return logError(res, err, {
      context: 'folders.assignOfficer',
      defaultMessage: 'Erreur lors de l’assignation'
    })
  }
}

const closeFolder = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const id = req.params.id
    const folder = await SinisterFolder.findByPk(id, { transaction })
    if (!folder) {
      await transaction.rollback()
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Dossier introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    if (folder.is_closed) {
      await transaction.rollback()
      const full = await SinisterFolder.findByPk(id, {
        include: folderIncludeDetail
      })
      return res.status(200).json({
        message: 'Dossier déjà clôturé',
        data: full
      })
    }

    await folder.update(
      {
        is_closed: true,
        status: 'CLOSED'
      },
      { transaction }
    )
    await transaction.commit()

    const full = await SinisterFolder.findByPk(id, {
      include: folderIncludeDetail
    })
    return res.status(200).json({
      message: 'Dossier clôturé',
      data: full
    })
  } catch (err) {
    await transaction.rollback()
    return logError(res, err, {
      context: 'folders.closeFolder',
      defaultMessage: 'Erreur lors de la clôture'
    })
  }
}

module.exports = {
  listFolders,
  getFolder,
  createFolder,
  assignOfficer,
  closeFolder
}
