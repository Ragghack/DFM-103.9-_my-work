const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/overview', financeController.getFinancialOverview);
router.get('/budget/active', financeController.getActiveBudget);
router.get('/bank-projects', financeController.getBankProjects);
router.get('/articles', financeController.getFinanceArticles);

// Protected admin routes
router.put('/stats', auth, adminAuth, financeController.updateFinancialStats);
router.put('/budget', auth, adminAuth, financeController.updateBudgetData);

// Bank projects admin routes
router.post('/bank-projects', auth, adminAuth, financeController.createBankProject);
router.put('/bank-projects/:id', auth, adminAuth, financeController.updateBankProject);
router.delete('/bank-projects/:id', auth, adminAuth, financeController.deleteBankProject);

// Finance articles admin routes
router.post('/articles', auth, adminAuth, financeController.createFinanceArticle);
router.put('/articles/:id', auth, adminAuth, financeController.updateFinanceArticle);
router.delete('/articles/:id', auth, adminAuth, financeController.deleteFinanceArticle);

module.exports = router;