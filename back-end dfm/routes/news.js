const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { auth, adminAuth } = require('../middlewares/auth');

// Public: list and get
router.get('/', newsController.listNews);
router.get('/:idOrSlug', newsController.getNews);

// Protected (admin): create, update, delete, publish
router.post('/', auth, adminAuth, newsController.createNews);
router.put('/:id', auth, adminAuth, newsController.updateNews);
router.delete('/:id', auth, adminAuth, newsController.deleteNews);
router.patch('/:id/publish', auth, adminAuth, newsController.publishNews);

module.exports = router;
