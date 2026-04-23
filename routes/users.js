const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  createUserValidators,
  updateUserValidators,
  idParamValidator,
  listUsersQueryValidators,
  listInsuredOptionsQueryValidators
} = require('../middlewares/users')
const {
  getAllUsers,
  getUser,
  listInsuredOptions,
  listTrackingOfficerOptions,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser
} = require('../services/users')

router.get(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  listUsersQueryValidators,
  getAllUsers
)
router.post(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  createUserValidators,
  createUser
)
router.get(
  '/insured-options',
  authenticate,
  requireRoles('ADMIN', 'PORTFOLIO_MANAGER', 'CUSTOMER_OFFICER'),
  listInsuredOptionsQueryValidators,
  listInsuredOptions
)
router.get(
  '/tracking-officer-options',
  authenticate,
  requireRoles('ADMIN', 'PORTFOLIO_MANAGER'),
  listInsuredOptionsQueryValidators,
  listTrackingOfficerOptions
)
router.get('/:id', authenticate, idParamValidator, getUser)
router.put('/:id', authenticate, updateUserValidators, updateUser)
router.patch(
  '/:id/deactivate',
  authenticate,
  requireRoles('ADMIN'),
  idParamValidator,
  deactivateUser
)
router.patch(
  '/:id/activate',
  authenticate,
  requireRoles('ADMIN'),
  idParamValidator,
  activateUser
)
router.delete(
  '/:id',
  authenticate,
  requireRoles('ADMIN'),
  idParamValidator,
  deleteUser
)

module.exports = router
