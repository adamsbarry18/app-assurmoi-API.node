const { FolderStep } = require('../models')
const { AppError, ERROR_CODES } = require('../core/errors')

/**
 * Types d’étape reconnus par le moteur (convention API).
 * Scénario 1 = véhicule réparable → REPAIRABLE. Scénario 2 = perte totale / indemnisation → TOTAL_LOSS.
 *
 * **Lecture cahier (synthèse)** — les libellés métier du cahier se regroupent ainsi :
 * - Parcours pièces sinistre : hors étapes dossier ; liens CNI / carte grise / attestation sur le sinistre,
 *   validation documents puis validation sinistre.
 * - REPAIRABLE : expertise & devis / facturation atelier → `S1_EXPERT_REPORT`, `S1_INVOICE`, échéances
 *   `EXPERTISE_ECHEANCE` / `GENERIC_ECHEANCE`, règlement `PAYMENT_SETTLED`, refacturation tiers si besoin.
 * - TOTAL_LOSS : expertise, indemnisation, RIB assuré → `S2_RIB`, `PAYMENT_SETTLED`, etc.
 */
const STEP_TYPE = Object.freeze({
  S1_EXPERT_REPORT: 'S1_EXPERT_REPORT',
  S1_INVOICE: 'S1_INVOICE',
  S2_RIB: 'S2_RIB',
  PAYMENT_SETTLED: 'PAYMENT_SETTLED',
  THIRD_PARTY_REBILLING_CONFIRMED: 'THIRD_PARTY_REBILLING_CONFIRMED',
  /** Échéance expertise (value = date / libellé) — déclenche une alerte interne */
  EXPERTISE_ECHEANCE: 'EXPERTISE_ECHEANCE',
  /** Autre échéance métier (value = date ou description) */
  GENERIC_ECHEANCE: 'GENERIC_ECHEANCE'
})

const HOURS_48_MS = 48 * 60 * 60 * 1000

/** Étapes qui imposent un type de document précis selon le scénario du dossier */
const STEP_DOCUMENT_BY_SCENARIO = [
  {
    stepType: STEP_TYPE.S1_EXPERT_REPORT,
    scenario: 'REPAIRABLE',
    documentType: 'EXPERT_REPORT'
  },
  {
    stepType: STEP_TYPE.S1_INVOICE,
    scenario: 'REPAIRABLE',
    documentType: 'INVOICE'
  },
  {
    stepType: STEP_TYPE.S2_RIB,
    scenario: 'TOTAL_LOSS',
    documentType: 'RIB'
  }
]

function findStructuredDocRule (stepType) {
  return STEP_DOCUMENT_BY_SCENARIO.find((r) => r.stepType === stepType)
}

function getEffectiveResponsibilityPct (sinister) {
  if (!sinister || !sinister.driver_responsability) return 0
  const v = sinister.driver_engaged_responsibility
  if (v === 50 || v === 100) return v
  return 0
}

/**
 * Vérifie document lié : existe, type conforme aux règles d’étape / scénario.
 * - `is_validated` est exigé pour les étapes expertise / facture (réparable).
 * - RIB sur l’étape S2 (perte totale) : dépôt enregistrable avant validation interne
 *   (assuré ou chargé de suivi).
 * - Pièces optionnelles sur d’autres types d’étape : liables avant validation.
 */
function assertStepDocumentRules (folder, { stepType, documentId }, documentInstance) {
  const rule = findStructuredDocRule(stepType)

  if (rule) {
    if (!folder.scenario) {
      throw new AppError(
        'Définir le scénario du dossier (REPAIRABLE ou TOTAL_LOSS) avant cette étape',
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
    if (folder.scenario !== rule.scenario) {
      throw new AppError(
        `L’étape ${stepType} est réservée au scénario ${rule.scenario}`,
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
    if (documentId == null) {
      throw new AppError(
        `L’étape ${stepType} exige un document_id (${rule.documentType})`,
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
  }

  if (documentId != null) {
    if (!documentInstance) {
      throw new AppError('Document introuvable', 400, ERROR_CODES.BAD_REQUEST.code)
    }
    const unvalidatedRibDepotOnS2Step =
      stepType === STEP_TYPE.S2_RIB &&
      documentInstance.type === 'RIB' &&
      !documentInstance.is_validated
    const structuredStepRequiresValidatedDocument = Boolean(rule)
    if (
      structuredStepRequiresValidatedDocument &&
      !documentInstance.is_validated &&
      !unvalidatedRibDepotOnS2Step
    ) {
      throw new AppError(
        'Document non validé : validation gestionnaire requise avant de lier cette étape',
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
    if (rule && documentInstance.type !== rule.documentType) {
      throw new AppError(
        `Le document doit être de type ${rule.documentType} pour l’étape ${stepType}`,
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
  }
}

async function loadFolderStepsOrdered (folderId, { transaction } = {}) {
  return FolderStep.findAll({
    where: { folder_id: folderId },
    order: [
      ['action_date', 'ASC'],
      ['id', 'ASC']
    ],
    transaction
  })
}

/**
 * Règles de clôture : délai 48h après dernier règlement enregistré ; refacturation tiers si resp. 0% ou 50%.
 */
function assertCloseBusinessRules (folder, sinister, steps) {
  const paymentSteps = steps.filter((s) => s.step_type === STEP_TYPE.PAYMENT_SETTLED)
  if (paymentSteps.length > 0) {
    const lastPayment = paymentSteps[paymentSteps.length - 1]
    const t = new Date(lastPayment.action_date).getTime()
    if (Number.isNaN(t)) {
      throw new AppError(
        'Date d’étape de règlement invalide',
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
    if (Date.now() < t + HOURS_48_MS) {
      throw new AppError(
        'Délai de 48h après le règlement non écoulé : clôture impossible pour l’instant',
        422,
        ERROR_CODES.UNPROCESSABLE_ENTITY.code
      )
    }
  }

  const pct = getEffectiveResponsibilityPct(sinister)
  if (pct === 100) {
    return
  }

  const hasRebilling = steps.some(
    (s) => s.step_type === STEP_TYPE.THIRD_PARTY_REBILLING_CONFIRMED
  )
  if (!hasRebilling) {
    throw new AppError(
      'Responsabilité 0% ou 50% : une étape THIRD_PARTY_REBILLING_CONFIRMED est requise avant clôture',
      422,
      ERROR_CODES.UNPROCESSABLE_ENTITY.code
    )
  }
}

module.exports = {
  STEP_TYPE,
  STEP_DOCUMENT_BY_SCENARIO,
  HOURS_48_MS,
  findStructuredDocRule,
  getEffectiveResponsibilityPct,
  assertStepDocumentRules,
  loadFolderStepsOrdered,
  assertCloseBusinessRules
}
