const express = require('express')
const router = express.Router()
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

router.get('/', listUsersQueryValidators, getAllUsers)
router.post('/', createUserValidators, createUser)
router.get('/:id', idParamValidator, getUser)
router.put('/:id', updateUserValidators, updateUser)
router.patch('/:id/deactivate', idParamValidator, deactivateUser)
router.delete('/:id', idParamValidator, deleteUser)

module.exports = router
