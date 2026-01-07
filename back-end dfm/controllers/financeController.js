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
    const { 
      stock_market_growth, 
      interest_rate, 
      credit_growth, 
      usd_xaf,
      period = 'Current',
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1
    } = req.body;
    
    // Validate required fields
    if (typeof stock_market_growth === 'undefined' || 
        typeof interest_rate === 'undefined' || 
        typeof credit_growth === 'undefined' || 
        typeof usd_xaf === 'undefined') {
      return res.status(400).json({ 
        message: 'Missing required financial data fields' 
      });
    }

    const financialData = new FinancialData({
      stock_market_growth: parseFloat(stock_market_growth),
      interest_rate: parseFloat(interest_rate),
      credit_growth: parseFloat(credit_growth),
      usd_xaf: parseFloat(usd_xaf),
      period: period,
      year: parseInt(year),
      month: parseInt(month),
      updated_by: req.user?._id || null
    });

    await financialData.save();
    
    res.json({ 
      success: true,
      message: 'Financial statistics updated successfully',
      financialData 
    });
  } catch (err) {
    console.error('Update financial stats error:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate entry found' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error updating financial statistics' 
    });
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

    // Validate required fields
    if (!total_budget || 
        typeof education_allocation === 'undefined' || 
        typeof healthcare_allocation === 'undefined' || 
        typeof infrastructure_allocation === 'undefined') {
      return res.status(400).json({ 
        message: 'Missing required budget data fields' 
      });
    }

    const budgetData = new BudgetData({
      total_budget,
      education_allocation: parseInt(education_allocation),
      healthcare_allocation: parseInt(healthcare_allocation),
      infrastructure_allocation: parseInt(infrastructure_allocation),
      revenue_sources: revenue_sources || {
        tax_revenue: 48,
        oil_gas: 22,
        grants_aid: 15,
        other_sources: 15
      },
      expires_at: expires_at ? new Date(expires_at) : null,
      updated_by: req.user?._id || null
    });

    await budgetData.save();
    
    res.json({ 
      success: true,
      message: 'Budget data updated successfully',
      budgetData 
    });
  } catch (err) {
    console.error('Update budget data error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Server error updating budget data' 
    });
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

    res.json({ 
      success: true,
      budgetData: budgetData || getDefaultBudgetData() 
    });
  } catch (err) {
    console.error('Get active budget error:', err);
    res.status(500).json({ 
      message: 'Server error fetching budget data' 
    });
  }
};

// Bank projects management
exports.getBankProjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      category,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const [items, total] = await Promise.all([
      BankProject.find(filter)
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BankProject.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({ 
      success: true,
      items, 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    });
  } catch (err) {
    console.error('Get bank projects error:', err);
    res.status(500).json({ 
      message: 'Server error fetching bank projects' 
    });
  }
};

exports.createBankProject = async (req, res) => {
  try {
    const payload = req.body;
    
    // Validate required fields
    if (!payload.title || !payload.description) {
      return res.status(400).json({ 
        message: 'Title and description are required' 
      });
    }
    
    if (req.user) payload.created_by = req.user._id;
    
    const project = new BankProject(payload);
    await project.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Bank project created successfully',
      project 
    });
  } catch (err) {
    console.error('Create bank project error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Server error creating bank project' 
    });
  }
};

exports.updateBankProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const project = await BankProject.findById(id);
    if (!project) {
      return res.status(404).json({ 
        message: 'Bank project not found' 
      });
    }
    
    // Update project
    Object.keys(updates).forEach(key => {
      project[key] = updates[key];
    });
    
    await project.save();
    
    res.json({ 
      success: true,
      message: 'Bank project updated successfully',
      project 
    });
  } catch (err) {
    console.error('Update bank project error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid bank project ID' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error updating bank project' 
    });
  }
};

exports.deleteBankProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await BankProject.findById(id);
    if (!project) {
      return res.status(404).json({ 
        message: 'Bank project not found' 
      });
    }
    
    await project.deleteOne();
    
    res.json({ 
      success: true,
      message: 'Bank project deleted successfully' 
    });
  } catch (err) {
    console.error('Delete bank project error:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid bank project ID' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error deleting bank project' 
    });
  }
};

// ==================== FINANCE ARTICLES MANAGEMENT ====================
// Get finance articles with pagination, filtering, and sorting
exports.getFinanceArticles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status,
      search,
      sort = 'createdAt',
      order = 'desc',
      featured
    } = req.query;
    
    // Build filter
    const filter = {};
    
    // Category filter
    if (category) {
      if (Array.isArray(category)) {
        filter.category = { $in: category };
      } else {
        filter.category = category;
      }
    }
    
    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }
    
    // Featured filter
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;
    let sortObj = { [sort]: sortOrder };
    
    // Special handling for featured articles
    if (sort === 'featured') {
      sortObj = { featured: -1, createdAt: -1 };
    }
    
    // Execute queries
    const [items, total] = await Promise.all([
      FinanceArticle.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author_id', 'name email')
        .lean(),
      FinanceArticle.countDocuments(filter)
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // Add view count for each article (simulated or real)
    const articlesWithViews = items.map(article => ({
      ...article,
      views: article.views || Math.floor(Math.random() * 1000), // Mock views for demo
      author: article.author_id ? {
        name: article.author_id.name,
        email: article.author_id.email
      } : null,
      readTime: calculateReadTime(article.content || '')
    }));
    
    // Remove author_id from response
    const cleanArticles = articlesWithViews.map(({ author_id, ...article }) => article);
    
    res.json({ 
      success: true,
      items: cleanArticles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('Get finance articles error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching finance articles',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create new finance article
exports.createFinanceArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      image_url,
      image_alt,
      status = 'draft',
      featured = false,
      tags = []
    } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and content are required' 
      });
    }
    
    if (!category || !['bank', 'budget', 'project', 'financial-update', 'market-trends', 'investment'].includes(category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid category is required' 
      });
    }
    
    // Prepare article data
    const articleData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      category,
      image_url: image_url || null,
      image_alt: image_alt || title,
      status,
      featured: Boolean(featured),
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      author_id: req.user?._id || null
    };
    
    // Create and save article
    const article = new FinanceArticle(articleData);
    await article.save();
    
    // Populate author info
    await article.populate('author_id', 'name email');
    
    res.status(201).json({ 
      success: true,
      message: 'Finance article created successfully',
      article: {
        ...article.toObject(),
        author: article.author_id ? {
          name: article.author_id.name,
          email: article.author_id.email
        } : null,
        readTime: calculateReadTime(content)
      }
    });
  } catch (err) {
    console.error('Create finance article error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors 
      });
    }
    
    // Handle duplicate key errors (e.g., unique slug)
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'An article with similar title already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error creating finance article',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update existing finance article
exports.updateFinanceArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find article
    const article = await FinanceArticle.findById(id);
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Finance article not found' 
      });
    }
    
    // Validate category if provided
    if (updates.category && !['bank', 'budget', 'project', 'financial-update', 'market-trends', 'investment'].includes(updates.category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category' 
      });
    }
    
    // Handle tags
    if (updates.tags) {
      updates.tags = Array.isArray(updates.tags) 
        ? updates.tags 
        : updates.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Handle excerpt
    if (updates.content && !updates.excerpt) {
      updates.excerpt = updates.content.substring(0, 150) + '...';
    }
    
    // Update article fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        article[key] = updates[key];
      }
    });
    
    // Save updates
    await article.save();
    
    // Populate author info
    await article.populate('author_id', 'name email');
    
    res.json({ 
      success: true,
      message: 'Finance article updated successfully',
      article: {
        ...article.toObject(),
        author: article.author_id ? {
          name: article.author_id.name,
          email: article.author_id.email
        } : null,
        readTime: calculateReadTime(article.content)
      }
    });
  } catch (err) {
    console.error('Update finance article error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors 
      });
    }
    
    // Handle cast errors (invalid ID)
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid article ID format' 
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'An article with similar title already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error updating finance article',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete finance article
exports.deleteFinanceArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete article
    const article = await FinanceArticle.findByIdAndDelete(id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Finance article not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Finance article deleted successfully',
      deletedArticle: {
        id: article._id,
        title: article.title,
        category: article.category
      }
    });
  } catch (err) {
    console.error('Delete finance article error:', err);
    
    // Handle cast errors (invalid ID)
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid article ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting finance article',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get single finance article by ID
exports.getFinanceArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find article and increment views
    const article = await FinanceArticle.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author_id', 'name email');
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Finance article not found' 
      });
    }
    
    res.json({ 
      success: true,
      article: {
        ...article.toObject(),
        author: article.author_id ? {
          name: article.author_id.name,
          email: article.author_id.email
        } : null,
        readTime: calculateReadTime(article.content)
      }
    });
  } catch (err) {
    console.error('Get finance article by ID error:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid article ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching article',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get featured finance articles
exports.getFeaturedFinanceArticles = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const articles = await FinanceArticle.find({ 
      featured: true,
      status: 'published'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('author_id', 'name email')
      .lean();
    
    res.json({ 
      success: true,
      articles: articles.map(article => ({
        ...article,
        author: article.author_id ? {
          name: article.author_id.name,
          email: article.author_id.email
        } : null,
        readTime: calculateReadTime(article.content || '')
      }))
    });
  } catch (err) {
    console.error('Get featured articles error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching featured articles' 
    });
  }
};

// Get articles by category
exports.getFinanceArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;
    
    // Validate category
    const validCategories = ['bank', 'budget', 'project', 'financial-update', 'market-trends', 'investment'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category' 
      });
    }
    
    const articles = await FinanceArticle.find({ 
      category,
      status: 'published'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('author_id', 'name email')
      .lean();
    
    res.json({ 
      success: true,
      category,
      articles: articles.map(article => ({
        ...article,
        author: article.author_id ? {
          name: article.author_id.name,
          email: article.author_id.email
        } : null,
        readTime: calculateReadTime(article.content || '')
      }))
    });
  } catch (err) {
    console.error('Get articles by category error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching articles by category' 
    });
  }
};

// Helper function to calculate read time
function calculateReadTime(content) {
  if (!content) return 1;
  
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readTime); // Minimum 1 minute
}

// Statistics for dashboard
exports.getFinanceArticlesStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total articles count
      FinanceArticle.countDocuments(),
      
      // Published articles count
      FinanceArticle.countDocuments({ status: 'published' }),
      
      // Draft articles count
      FinanceArticle.countDocuments({ status: 'draft' }),
      
      // Featured articles count
      FinanceArticle.countDocuments({ featured: true }),
      
      // Articles by category
      FinanceArticle.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      
      // Total views
      FinanceArticle.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      
      // Recent articles (last 7 days)
      FinanceArticle.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);
    
    const [total, published, draft, featured, byCategory, totalViews, recent] = stats;
    
    res.json({
      success: true,
      stats: {
        total,
        published,
        draft,
        featured,
        byCategory: byCategory.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        totalViews: totalViews[0]?.totalViews || 0,
        recent,
        averageViews: total > 0 ? Math.round((totalViews[0]?.totalViews || 0) / total) : 0
      }
    });
  } catch (err) {
    console.error('Get finance articles stats error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching article statistics' 
    });
  }
};

// Batch update finance articles (e.g., bulk status change)
exports.batchUpdateFinanceArticles = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Article IDs are required' 
      });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ 
        success: false,
        message: 'Updates are required' 
      });
    }
    
    // Validate status if provided
    if (updates.status && !['draft', 'published', 'archived'].includes(updates.status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status value' 
      });
    }
    
    // Update articles
    const result = await FinanceArticle.updateMany(
      { _id: { $in: ids } },
      { $set: updates },
      { runValidators: true }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} article(s)`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (err) {
    console.error('Batch update finance articles error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error batch updating articles',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};