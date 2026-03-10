const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { login, register, getMe, getUsers, loginValidation, registerValidation, citizenRegister, updateProfile, citizenValidations } = require('../controllers/authController');

router.post('/login', loginValidation, login);
router.post('/citizen-register', citizenValidations, citizenRegister);
router.post('/register', authenticate, authorize('super_admin'), registerValidation, register);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.get('/users', authenticate, authorize('super_admin'), getUsers);

module.exports = router;
