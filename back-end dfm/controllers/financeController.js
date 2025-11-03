const FinancialData = require('../models/FinancialData');
const FinanceArticle = require('../models/FinanceArticle');
const BankProject = require('../models/BankProject');
const CurrencyRate = require('../models/CurrencyRate');
const BudgetData = require('../models/BudgetData');
const axios = require('axios');


// External API configuration
const EXTERNAL_APIS = {
  currency: 'https://api.exchangerate-api.com/v4/latest/USD',
  stockMarket: 'https://api.twelvedata.com/quote?symbol=DJIA&apikey=demo',
  economicData: 'https://api.worldbank.org/v2/country/CM/indicator'
};

// Get comprehensive financial overview with mixed data
exports.getFinancialOverview = async (req, res) => {
  try {
    const [adminData, externalData] = await Promise.all([
      getAdminManagedData(),
      getExternalFinancialData()
    ]);

    res.json({
      ...adminData,
      externalData,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Finance overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin-managed data
async function getAdminManagedData() {
  try {
    const [financialData, bankProjects, financeArticles, budgetData] = await Promise.all([
      FinancialData.findOne().sort({ createdAt: -1 }).lean(),
      BankProject.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).lean(),
      FinanceArticle.find({ status: 'published' }).sort({ createdAt: -1 }).limit(8).lean(),
      BudgetData.findOne().sort({ createdAt: -1 }).lean()
    ]);

    return {
      financialData: financialData || getDefaultFinancialData(),
      bankProjects: bankProjects || [],
      financeArticles: financeArticles || [],
      budgetData: budgetData || getDefaultBudgetData()
    };
  } catch (error) {
    console.error('Error getting admin managed data:', error);
    return {
      financialData: getDefaultFinancialData(),
      bankProjects: [],
      financeArticles: [],
      budgetData: getDefaultBudgetData()
    };
  }
}

// Get external financial data
async function getExternalFinancialData() {
  try {
    const [currencyRates, marketTrends, dailyStats] = await Promise.allSettled([
      fetchCurrencyRates(),
      fetchMarketTrends(),
      fetchDailyFinancialStats()
    ]);

    return {
      currencyRates: currencyRates.status === 'fulfilled' ? currencyRates.value : getFallbackCurrencyRates(),
      marketTrends: marketTrends.status === 'fulfilled' ? marketTrends.value : getFallbackMarketTrends(),
      dailyStats: dailyStats.status === 'fulfilled' ? dailyStats.value : getFallbackDailyStats(),
      lastExternalFetch: new Date().toISOString()
    };
  } catch (error) {
    console.error('External data fetch failed:', error);
    return getFallbackExternalData();
  }
}

// External API calls
async function fetchCurrencyRates() {
  try {
    // Using a free currency API
    const response = await axios.get('https://api.exchangerate.host/latest?base=USD');
    const rates = response.data.rates;
    
    return [
      { currency: 'US Dollar', code: 'USD', value: 1, change: 0, change_percentage: 0 },
      { currency: 'Euro', code: 'EUR', value: rates.EUR || 0.85, change: 0.002, change_percentage: 0.02 },
      { currency: 'British Pound', code: 'GBP', value: rates.GBP || 0.73, change: 0.001, change_percentage: 0.01 },
      { currency: 'Central African CFA Franc', code: 'XAF', value: rates.XAF || 655.5, change: 0.3, change_percentage: 0.05 }
    ];
  } catch (error) {
    throw new Error('Currency API failed');
  }
}

async function fetchMarketTrends() {
  try {
    // Simulate market data - in production, use real financial APIs
    return {
      banking: { value: 3.2, change: 0.4, trend: 'up' },
      energy: { value: 4.7, change: 0.8, trend: 'up' },
      agriculture: { value: 2.8, change: 0.2, trend: 'up' },
      technology: { value: 5.1, change: 1.2, trend: 'up' }
    };
  } catch (error) {
    throw new Error('Market trends API failed');
  }
}

async function fetchDailyFinancialStats() {
  try {
    // Simulate daily statistics - in production, use real financial data APIs
    return {
      stockMarketIndex: 4328.75,
      unemploymentRate: 5.8,
      foreignReserves: 4.2,
      governmentDebt: 42.3,
      inflationRate: 2.1
    };
  } catch (error) {
    throw new Error('Daily stats API failed');
  }
}

// Fallback data
function getFallbackCurrencyRates() {
  return [
    { currency: 'US Dollar', code: 'USD', value: 1, change: 0, change_percentage: 0 },
    { currency: 'Euro', code: 'EUR', value: 0.85, change: 0.002, change_percentage: 0.02 },
    { currency: 'British Pound', code: 'GBP', value: 0.73, change: 0.001, change_percentage: 0.01 },
    { currency: 'Central African CFA Franc', code: 'XAF', value: 655.5, change: 0.3, change_percentage: 0.05 }
  ];
}

function getFallbackMarketTrends() {
  return {
    banking: { value: 3.2, change: 0.4, trend: 'up' },
    energy: { value: 4.7, change: 0.8, trend: 'up' },
    agriculture: { value: 2.8, change: 0.2, trend: 'up' }
  };
}

function getFallbackDailyStats() {
  return {
    stockMarketIndex: 4328.75,
    unemploymentRate: 5.8,
    foreignReserves: 4.2,
    governmentDebt: 42.3,
    inflationRate: 2.1
  };
}

function getFallbackExternalData() {
  return {
    currencyRates: getFallbackCurrencyRates(),
    marketTrends: getFallbackMarketTrends(),
    dailyStats: getFallbackDailyStats(),
    lastExternalFetch: new Date().toISOString()
  };
}

function getDefaultFinancialData() {
  return {
    stock_market_growth: 2.3,
    interest_rate: 3.5,
    usd_xaf: 655.5,
    credit_growth: 5.2
  };
}

function getDefaultBudgetData() {
  return {
    total_budget: '12.5B',
    education_allocation: 24,
    healthcare_allocation: 15,
    infrastructure_allocation: 18,
    revenue_sources: {
      tax_revenue: 48,
      oil_gas: 22,
      grants_aid: 15,
      other_sources: 15
    }
  };
}

// Update financial statistics (admin managed)
exports.updateFinancialStats = async (req, res) => {
  try {
    const { stock_market_growth, interest_rate, credit_growth, usd_xaf } = req.body;
    
    const financialData = new FinancialData({
      stock_market_growth,
      interest_rate,
      credit_growth,
      usd_xaf,
      period: 'Current',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      updated_by: req.user._id
    });

    await financialData.save();
    res.json({ financialData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update budget data with expiration timer
exports.updateBudgetData = async (req, res) => {
  try {
    const { 
      total_budget, 
      education_allocation, 
      healthcare_allocation, 
      infrastructure_allocation,
      revenue_sources,
      expires_at 
    } = req.body;

    const budgetData = new BudgetData({
      total_budget,
      education_allocation,
      healthcare_allocation,
      infrastructure_allocation,
      revenue_sources,
      expires_at: expires_at ? new Date(expires_at) : null,
      updated_by: req.user._id
    });

    await budgetData.save();
    res.json({ budgetData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active budget data (respects expiration)
exports.getActiveBudget = async (req, res) => {
  try {
    const now = new Date();
    const budgetData = await BudgetData.findOne({
      $or: [
        { expires_at: null },
        { expires_at: { $gt: now } }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({ budgetData: budgetData || getDefaultBudgetData() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bank projects management
exports.getBankProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      BankProject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      BankProject.countDocuments(filter)
    ]);
    
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBankProject = async (req, res) => {
  try {
    const payload = req.body;
    if (req.user) payload.created_by = req.user._id;
    
    const project = new BankProject(payload);
    await project.save();
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBankProject = async (req, res) => {
  try {
    const project = await BankProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteBankProject = async (req, res) => {
  try {
    const project = await BankProject.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Finance articles management
exports.getFinanceArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      FinanceArticle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      FinanceArticle.countDocuments(filter)
    ]);
    
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createFinanceArticle = async (req, res) => {
  try {
    const payload = req.body;
    if (req.user) payload.author_id = req.user._id;
    
    const article = new FinanceArticle(payload);
    await article.save();
    res.status(201).json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFinanceArticle = async (req, res) => {
  try {
    const article = await FinanceArticle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) return res.status(404).json({ message: 'Not found' });
    res.json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFinanceArticle = async (req, res) => {
  try {
    const article = await FinanceArticle.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};