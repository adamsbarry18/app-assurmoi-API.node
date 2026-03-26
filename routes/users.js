const express = require('express')
const router = express.Router()
const { authenticate, requireRoles } = require('../middlewares/auth')
const {
  createUserValidators,
  updateUserValidators,
  idParamValidator,
  listUsersQueryValidators
} = require('../middlewares/users')
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser
} = require('../services/users')

router.get('/', authenticate, listUsersQueryValidators, getAllUsers)
router.post(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  createUserValidators,
  createUser
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
router.delete(
  '/:id',
  authenticate,
  requireRoles('ADMIN'),
  idParamValidator,
  deleteUser
)

module.exports = router
