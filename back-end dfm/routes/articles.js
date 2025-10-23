const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const { auth, adminAuth } = require('../middleware/auth');

// Public list and get
router.get('/', articlesController.listArticles);
router.get('/:id', articlesController.getArticle);

// Protected (admin)
router.post('/', auth, adminAuth, articlesController.createArticle);
router.put('/:id', auth, adminAuth, articlesController.updateArticle);
router.delete('/:id', auth, adminAuth, articlesController.deleteArticle);

module.exports = router;
// (placeholder removed) - articles routes defined above
