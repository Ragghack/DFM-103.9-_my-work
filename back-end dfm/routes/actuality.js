const express = require('express');
const router = express.Router();
const actualityController = require('../controllers/actualityController');
const { auth } = require('../middlewares/auth');
// Public routes
router.get('/programs', actualityController.getPrograms);
router.get('/programs/upcoming', actualityController.getUpcomingPrograms);
router.get('/programs/future', actualityController.getFuturePrograms);
router.get('/hot-news', actualityController.getHotNews);
router.get('/economy-summary', actualityController.getEconomySummary);
router.get('/comments', actualityController.getComments);

// Protected admin routes
router.post('/programs', auth, actualityController.createProgram);
router.put('/programs/:id', auth, actualityController.updateProgram);
router.delete('/programs/:id', auth, actualityController.deleteProgram);
router.post('/hot-news', auth, actualityController.createHotNews);
router.put('/hot-news/:id', auth, actualityController.updateHotNews);
router.delete('/hot-news/:id', auth, actualityController.deleteHotNews);
router.put('/economy-summary', auth, actualityController.updateEconomySummary);

module.exports = router;