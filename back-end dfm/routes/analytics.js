const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Dashboard stats (admin only)
router.get('/', auth, adminAuth, analyticsController.dashboardStats);

module.exports = router;
