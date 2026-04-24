const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  loginValidators,
  refreshValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  inviteValidators,
  completeInviteValidators,
  invitationIdParamValidators
} = require('../middlewares/authValidators')
const {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  sendInvitation,
  resendInvitation,
  cancelInvitation,
  completeInvite
} = require('../services/auth')

/** Invitation (tous rôles cibles) : back-office habilité — aligné contrat / provision assuré. */
const ROLES_CAN_MANAGE_INVITATIONS = ['ADMIN', 'PORTFOLIO_MANAGER', 'CUSTOMER_OFFICER']

router.post('/login', loginValidators, login)
router.post('/refresh', refreshValidators, refresh)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)
router.post('/forgot-password', forgotPasswordValidators, forgotPassword)
router.post('/reset-password', resetPasswordValidators, resetPassword)
router.post(
  '/invite',
  authenticate,
  requireRoles(...ROLES_CAN_MANAGE_INVITATIONS),
  inviteValidators,
  sendInvitation
)
router.post(
  '/invitations/:id/resend',
  authenticate,
  requireRoles(...ROLES_CAN_MANAGE_INVITATIONS),
  invitationIdParamValidators,
  resendInvitation
)
router.post(
  '/invitations/:id/cancel',
  authenticate,
  requireRoles(...ROLES_CAN_MANAGE_INVITATIONS),
  invitationIdParamValidators,
  cancelInvitation
)
router.post('/complete-invite', completeInviteValidators, completeInvite)

module.exports = router
