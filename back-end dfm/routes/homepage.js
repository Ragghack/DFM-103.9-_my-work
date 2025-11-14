const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');
const { auth, adminAuth } = require('../middlewares/auth');

// Public: get homepage data
router.get('/', homepageController.getHomepage);

// Protected (admin): update homepage data
router.put('/', auth, adminAuth, homepageController.updateHomepage);
router.put('/breaking-news', auth, adminAuth, homepageController.updateBreakingNews);
router.put('/featured-article', auth, adminAuth, homepageController.updateFeaturedArticle);
router.put('/quick-links', auth, adminAuth, homepageController.updateQuickLinks);

module.exports = router;