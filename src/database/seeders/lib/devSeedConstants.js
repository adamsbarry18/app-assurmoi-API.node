'use strict'

const SEED_PREFIX = 'seed.'

const SEED_USER_ROWS = [
  { username: `${SEED_PREFIX}admin`, email: 'lucas.berthier@gmail.com', role: 'ADMIN', first_name: 'Lucas', last_name: 'BERTHIER' },
  { username: `${SEED_PREFIX}pm`, email: 'sophie.marchand@gmail.com', role: 'PORTFOLIO_MANAGER', first_name: 'Sophie', last_name: 'MARCHAND' },
  { username: `${SEED_PREFIX}to`, email: 'matteo.rousseau@gmail.com', role: 'TRACKING_OFFICER', first_name: 'Matteo', last_name: 'ROUSSEAU' },
  { username: `${SEED_PREFIX}co`, email: 'clara.fontaine@gmail.com', role: 'CUSTOMER_OFFICER', first_name: 'Clara', last_name: 'FONTAINE' },
  { username: `${SEED_PREFIX}insured`, email: 'jules.renaud@gmail.com', role: 'INSURED', first_name: 'Jules', last_name: 'RENAUD' },
  { username: `${SEED_PREFIX}insured2`, email: 'emilie.dubois@gmail.com', role: 'INSURED', first_name: 'Émilie', last_name: 'DUBOIS' }
]

const SEED_USERNAMES = SEED_USER_ROWS.map((r) => r.username)

const SINISTER_PLATES = ['DMO-0001', 'DMO-0002', 'DMO-0003', 'DMO-0004']
const FOLDER_REF_A = 'FOL-DMO-01'
const FOLDER_REF_B = 'FOL-DMO-02'

const SEED_DOC = Object.freeze({
  REG: 'demo://fichiers/carte-grise.pdf',
  EXPERT: 'demo://fichiers/rapport-expert-01.pdf',
  CNI: 'demo://fichiers/cni-conducteur.pdf',
  INVOICE: 'demo://fichiers/facture-atelier-01.pdf',
  ATTEST: 'demo://fichiers/attestation-assurance-01.pdf',
  RIB: 'demo://fichiers/rib-indemnisation.pdf',
  SIGN: 'demo://fichiers/signature-mandat.png',
  REG_EM: 'demo://fichiers/cg-emilie-dubois.pdf',
  ATTEST_EM: 'demo://fichiers/attestation-emilie-dubois.pdf',
  EXPERT_TL: 'demo://fichiers/rapport-expert-pt.pdf'
})
const SEED_ALL_DOC_URLS = Object.values(SEED_DOC)

const SEED_INVITE_EMAILS = [
  'antoine.veyrier@gmail.com',
  'maelle.rossi@gmail.com',
  'lea.guillot@gmail.com'
]

const HISTORY = {
  SINISTER_CREATED: 'sinister.created',
  FOLDER_CREATED: 'folder.created',
  FOLDER_STEP_S1: 'folder_step.created:S1_EXPERT_REPORT',
  FOLDER_STEP_INV: 'folder_step.created:S1_INVOICE',
  FOLDER_STEP_RIB: 'folder_step.created:S2_RIB',
  FOLDER_STEP_PAY: 'folder_step.created:PAYMENT_SETTLED'
}

const SEED_DEV_MARKER_USERNAME = `${SEED_PREFIX}admin`

function dApr20 (h, m) {
  return new Date(`2025-04-20T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
}

function demoTimeWindow () {
  return {
    now: new Date(),
    call: dApr20(10, 0),
    inc: dApr20(9, 30),
    call2: dApr20(14, 15),
    inc2: dApr20(13, 40)
  }
}

module.exports = {
  SEED_PREFIX,
  SEED_USER_ROWS,
  SEED_USERNAMES,
  SINISTER_PLATES,
  FOLDER_REF_A,
  FOLDER_REF_B,
  SEED_DOC,
  SEED_ALL_DOC_URLS,
  SEED_INVITE_EMAILS,
  HISTORY,
  SEED_DEV_MARKER_USERNAME,
  dApr20,
  demoTimeWindow
}
