const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  listSinistersQueryValidators,
  idParamValidator,
  createSinisterValidators,
  updateSinisterValidators
} = require('../middlewares/sinisters')
const {
  listSinisters,
  getSinister,
  createSinister,
  updateSinister,
  validateSinisterByManager
} = require('../services/sinisters')

const ROLES_READ = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER'
]

const ROLES_CREATE = ['ADMIN', 'PORTFOLIO_MANAGER', 'CUSTOMER_OFFICER']

const ROLES_VALIDATE = ['ADMIN', 'PORTFOLIO_MANAGER']

router.get(
  '/',
  authenticate,
  requireRoles(...ROLES_READ),
  listSinistersQueryValidators,
  listSinisters
)

router.post(
  '/',
  authenticate,
  requireRoles(...ROLES_CREATE),
  createSinisterValidators,
  createSinister
)

router.patch(
  '/:id/validate',
  authenticate,
  requireRoles(...ROLES_VALIDATE),
  idParamValidator,
  validateSinisterByManager
)

router.get(
  '/:id',
  authenticate,
  requireRoles(...ROLES_READ),
  idParamValidator,
  getSinister
)

router.put(
  '/:id',
  authenticate,
  requireRoles(...ROLES_CREATE),
  updateSinisterValidators,
  updateSinister
)

module.exports = router
