const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const { listHistoryQueryValidators } = require('../middlewares/history')
const { listHistory } = require('../services/historyAudit')

const ROLES_READ = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER'
]

router.get(
  '/',
  authenticate,
  requireRoles(...ROLES_READ),
  listHistoryQueryValidators,
  listHistory
)

module.exports = router
