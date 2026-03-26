const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  loginValidators,
  refreshValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  inviteValidators,
  completeInviteValidators
} = require('../middlewares/authValidators')
const {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  sendInvitation,
  completeInvite
} = require('../services/auth')

router.post('/login', loginValidators, login)
router.post('/refresh', refreshValidators, refresh)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)
router.post('/forgot-password', forgotPasswordValidators, forgotPassword)
router.post('/reset-password', resetPasswordValidators, resetPassword)
router.post(
  '/invite',
  authenticate,
  requireRoles('ADMIN'),
  inviteValidators,
  sendInvitation
)
router.post('/complete-invite', completeInviteValidators, completeInvite)

module.exports = router
