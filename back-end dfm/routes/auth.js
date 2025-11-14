const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

// Public: login
router.post('/login', authController.login);

// Optional: register (useful for seeding or initial setup)
router.post('/register', authController.register);

// Protected: get current user
router.get('/me', auth, authController.me);

module.exports = router;
