const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const { uploadDocumentFile } = require('../middlewares/documentUpload')
const {
  uploadDocumentValidators,
  documentIdValidators
} = require('../middlewares/documents')
const {
  uploadDocument,
  getDocumentFile,
  validateDocument
} = require('../services/documents')

const ROLES_READ = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER'
]

const ROLES_UPLOAD = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'CUSTOMER_OFFICER',
  'TRACKING_OFFICER'
]

const ROLES_VALIDATE = ['ADMIN', 'PORTFOLIO_MANAGER']

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
  '/',
  authenticate,
  requireRoles(...ROLES_UPLOAD),
  uploadDocumentFile,
  uploadDocumentValidators,
  uploadDocument
)

module.exports = router
