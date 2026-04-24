const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  createUserValidators,
  provisionInsuredUserValidators,
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
  provisionInsuredUser,
  resendInsuredWelcome,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser
} = require('../services/users')

/** Annuaire + fiche assuré (provision) : même périmètre métier que les invitations. */
const ROLES_USER_DIRECTORY = ['ADMIN', 'PORTFOLIO_MANAGER', 'CUSTOMER_OFFICER']

router.get(
  '/',
  authenticate,
  requireRoles(...ROLES_USER_DIRECTORY),
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

/** Compte assuré créé côté entreprise : identité renseignée, mot de passe par e-mail (recommandé). */
router.post(
  '/insured-provision',
  authenticate,
  requireRoles(...ROLES_USER_DIRECTORY),
  provisionInsuredUserValidators,
  provisionInsuredUser
)

/** Renvoyer l’e-mail de premier accès (mot de passe non encore défini). */
router.post(
  '/:id/resend-welcome',
  authenticate,
  requireRoles(...ROLES_USER_DIRECTORY),
  idParamValidator,
  resendInsuredWelcome
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
