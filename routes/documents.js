const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const { uploadDocumentFile } = require('../middlewares/documentUpload')
const {
  uploadDocumentValidators,
  documentIdValidators,
  signDocumentValidators
} = require('../middlewares/documents')
const {
  uploadDocument,
  getDocumentFile,
  validateDocument,
  signDocument
} = require('../services/documents')

const ROLES_READ = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER',
  'INSURED'
]

const ROLES_UPLOAD = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'CUSTOMER_OFFICER',
  'TRACKING_OFFICER',
  'INSURED'
]

const ROLES_VALIDATE = ['ADMIN', 'PORTFOLIO_MANAGER']

const ROLES_SIGN = ['ADMIN', 'PORTFOLIO_MANAGER']

router.patch(
  '/:id/validate',
  authenticate,
  requireRoles(...ROLES_VALIDATE),
  documentIdValidators,
  validateDocument
)

router.get(
  '/:id',
  authenticate,
  requireRoles(...ROLES_READ),
  documentIdValidators,
  getDocumentFile
)

router.post(
  '/:id/sign',
  authenticate,
  requireRoles(...ROLES_SIGN),
  signDocumentValidators,
  signDocument
)

router.post(
  '/',
  authenticate,
  requireRoles(...ROLES_UPLOAD),
  uploadDocumentFile,
  uploadDocumentValidators,
  uploadDocument
)

module.exports = router
