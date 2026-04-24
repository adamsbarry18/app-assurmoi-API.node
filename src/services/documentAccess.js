const { Op } = require('sequelize')
const { Sinister, SinisterFolder, FolderStep, Document } = require('../models')

const STAFF_ROLES = new Set([
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER'
])

/**
 * Un assuré peut lire un document s’il l’a uploadé, s’il est rattaché à *son* sinistre
 * (pièces constitutives) ou s’il apparaît sur une étape d’un *ses* dossiers.
 */
async function insuredCanReadDocument (userId, documentId) {
  const [selfUpload, onSinister, onStep] = await Promise.all([
    Document.findOne({ where: { id: documentId, uploaded_by_id: userId } }),
    Sinister.findOne({
      where: {
        insured_user_id: userId,
        [Op.or]: [
          { cni_driver: documentId },
          { vehicle_registration_doc_id: documentId },
          { insurance_certificate_id: documentId }
        ]
      }
    }),
    (async () => {
      const step = await FolderStep.findOne({
        where: { document_id: documentId },
        include: [
          {
            model: SinisterFolder,
            as: 'folder',
            required: true,
            include: [
              {
                model: Sinister,
                as: 'sinister',
                required: true,
                where: { insured_user_id: userId }
              }
            ]
          }
        ]
      })
      return step != null
    })()
  ])
  return Boolean(selfUpload != null || onSinister != null || onStep)
}

async function userCanReadDocument (user, documentId) {
  if (!user || documentId == null) return false
  if (STAFF_ROLES.has(user.role)) return true
  if (user.role === 'INSURED') {
    return insuredCanReadDocument(user.id, documentId)
  }
  return false
}

module.exports = {
  userCanReadDocument,
  STAFF_ROLES
}
