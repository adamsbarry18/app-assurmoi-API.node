const {
  FolderStep,
  SinisterFolder,
  Sinister,
  Document,
  User,
  dbInstance
} = require('../models')
const { logError } = require('../core/logError')
const { ERROR_CODES, AppError } = require('../core/errors')
const { assertStepDocumentRules } = require('./folderWorkflow')
const { recordHistory, HISTORY_ACTION } = require('./historyAudit')
const { dispatchForFolderStep } = require('./notificationDispatch')

const ROLES_STEP_WRITE = ['ADMIN', 'PORTFOLIO_MANAGER', 'TRACKING_OFFICER']

function canWriteSteps (req, folder) {
  if (['ADMIN', 'PORTFOLIO_MANAGER'].includes(req.user.role)) {
    return true
  }
  if (req.user.role === 'TRACKING_OFFICER') {
    return folder.assigned_officer_id === req.user.id
  }
  return false
}

async function resolvePerformedById (req, bodyPerformedById, { transaction } = {}) {
  if (bodyPerformedById == null) {
    return req.user.id
  }
  if (bodyPerformedById !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError(
      'Seul un administrateur peut renseigner performed_by_id pour un autre utilisateur',
      403,
      ERROR_CODES.FORBIDDEN.code
    )
  }
  const user = await User.findByPk(bodyPerformedById, { transaction })
  if (!user || !user.is_active) {
    throw new AppError(
      'Utilisateur introuvable ou inactif (performed_by_id)',
      400,
      ERROR_CODES.BAD_REQUEST.code
    )
  }
  return bodyPerformedById
}

const listFolderSteps = async (req, res) => {
  try {
    const folderId = req.params.id
    const folder = await SinisterFolder.findByPk(folderId)
    if (!folder) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        message: 'Dossier introuvable',
        code: ERROR_CODES.NOT_FOUND.code
      })
    }

    const steps = await FolderStep.findAll({
      where: { folder_id: folderId },
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
    })

    return res.status(200).json({ data: steps })
  } catch (err) {
    return logError(res, err, {
      context: 'folderSteps.listFolderSteps',
      defaultMessage: 'Erreur lors de la liste des étapes'
    })
  }
}

const createFolderStep = async (req, res) => {
  const transaction = await dbInstance.transaction()
  try {
    const folderId = req.params.id
    const folder = await SinisterFolder.findByPk(folderId, { transaction })
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
        message: 'Dossier clôturé : aucune nouvelle étape',
        code: ERROR_CODES.UNPROCESSABLE_ENTITY.code
      })
    }

    if (!canWriteSteps(req, folder)) {
      await transaction.rollback()
      return res.status(ERROR_CODES.FORBIDDEN.status).json({
        message:
          'Droit insuffisant : chargé de suivi non assigné à ce dossier, ou rôle non autorisé',
        code: ERROR_CODES.FORBIDDEN.code
      })
    }

    const stepType = req.body.step_type
    const value = req.body.value !== undefined ? req.body.value : null
    const documentId =
      req.body.document_id !== undefined && req.body.document_id !== null
        ? Number(req.body.document_id)
        : null

    let documentInstance = null
    if (documentId != null) {
      documentInstance = await Document.findByPk(documentId, { transaction })
    }

    assertStepDocumentRules(folder, { stepType, documentId }, documentInstance)

    const performedById = await resolvePerformedById(req, req.body.performed_by_id, {
      transaction
    })

    const step = await FolderStep.create(
      {
        folder_id: folderId,
        step_type: stepType,
        value,
        document_id: documentId,
        performed_by_id: performedById
      },
      { transaction }
    )

    await transaction.commit()

    const full = await FolderStep.findByPk(step.id, {
      include: [
        { model: Document, as: 'document' },
        {
          model: User,
          as: 'performedBy',
          attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name']
        }
      ]
    })

    await recordHistory({
      userId: req.user.id,
      entityType: 'folder_step',
      entityId: step.id,
      action: `${HISTORY_ACTION.FOLDER_STEP_CREATED}:${stepType}`
    })

    const sinister = await Sinister.findByPk(folder.sinister_id)
    if (sinister) {
      await dispatchForFolderStep({
        folder,
        sinister,
        step
      })
    }

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
      context: 'folderSteps.createFolderStep',
      defaultMessage: 'Erreur lors de la création de l’étape'
    })
  }
}

module.exports = {
  listFolderSteps,
  createFolderStep,
  ROLES_STEP_WRITE
}
