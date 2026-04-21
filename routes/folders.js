const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  listFoldersQueryValidators,
  folderIdParamValidator,
  createFolderValidators,
  assignOfficerValidators
} = require('../middlewares/folders')
const {
  listFolders,
  getFolder,
  createFolder,
  assignOfficer,
  closeFolder
} = require('../services/folders')

const ROLES_READ = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER'
]

const ROLES_CREATE = ['ADMIN', 'PORTFOLIO_MANAGER', 'CUSTOMER_OFFICER']

const ROLES_MANAGE = ['ADMIN', 'PORTFOLIO_MANAGER']

router.get(
  '/',
  authenticate,
  requireRoles(...ROLES_READ),
  listFoldersQueryValidators,
  listFolders
)

router.post(
  '/',
  authenticate,
  requireRoles(...ROLES_CREATE),
  createFolderValidators,
  createFolder
)

router.patch(
  '/:id/assign',
  authenticate,
  requireRoles(...ROLES_MANAGE),
  assignOfficerValidators,
  assignOfficer
)

router.patch(
  '/:id/close',
  authenticate,
  requireRoles(...ROLES_MANAGE),
  folderIdParamValidator,
  closeFolder
)

router.get(
  '/:id',
  authenticate,
  requireRoles(...ROLES_READ),
  folderIdParamValidator,
  getFolder
)

module.exports = router
