const express = require('express')
const router = express.Router()
const { authenticate } = require('../middlewares/auth')
const {
  listNotificationsQueryValidators,
  notificationIdParamValidator
} = require('../middlewares/notifications')
const {
  listMyNotifications,
  markNotificationRead,
  markAllMyNotificationsRead
} = require('../services/notifications')

router.post('/mark-all-read', authenticate, markAllMyNotificationsRead)

router.get(
  '/',
  authenticate,
  listNotificationsQueryValidators,
  listMyNotifications
)

router.patch(
  '/:id/read',
  authenticate,
  notificationIdParamValidator,
  markNotificationRead
)

module.exports = router
