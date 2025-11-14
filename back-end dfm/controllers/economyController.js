// controllers/economyController.js
const EconomyArticle = require('../models/EconomyArticle');
const EconomyIndicator = require('../models/EconomyIndicator');
const SectionStats = require('../models/SectionStats');

// Get economic indicators
exports.getIndicators = async (req, res) => {
  try {
    const indicators = await EconomyIndicator.findOne()
      .sort({ createdAt: -1 });
    
    if (!indicators) {
      return res.json({
        success: true,
        indicators: {
          gdp_growth: '3.2',
          industrial_growth: '4.5',
          unemployment_rate: '5.8',
          inflation_rate: '2.1',
          period: 'Current',
          year: new Date().getFullYear()
        }
      });
    }
    
    res.json({
      success: true,
      indicators
    });
  } catch (error) {
    console.error('Error fetching indicators:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching economic indicators'
    });
  }
};

// Get economy articles (public)
exports.getArticles = async (req, res) => {
  try {
    const { section, limit = 10, page = 1 } = req.query;
    
    let query = { status: 'published' };
    if (section && section !== 'all') {
      query.section = section;
    }
    
    const articles = await EconomyArticle.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await EconomyArticle.countDocuments(query);
    
    res.json({
      success: true,
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching economy articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching economy articles'
    });
  }
};

// Get economy article by ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await EconomyArticle.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article'
    });
  }
};

// Get section statistics
exports.getSectionStats = async (req, res) => {
  try {
    const { section } = req.params;
    const stats = await SectionStats.findOne({ section });
    
    if (!stats) {
      // Return default values based on section
      const defaultStats = getDefaultSectionStats(section);
      return res.json({
        success: true,
        stats: defaultStats
      });
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching section stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching section statistics'
    });
  }
};

// Get admin articles (with drafts)
exports.getAdminArticles = async (req, res) => {
  try {
    const { limit = 10, page = 1, section } = req.query;
    
    let query = {};
    if (section && section !== 'all') {
      query.section = section;
    }
    
    const articles = await EconomyArticle.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await EconomyArticle.countDocuments(query);
    
    res.json({
      success: true,
      items: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles'
    });
  }
};

// Create economy article
exports.createArticle = async (req, res) => {
  try {
    const article = new EconomyArticle(req.body);
    await article.save();
    
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article'
    });
  }
};

// Update economy article
exports.updateArticle = async (req, res) => {
  try {
    const article = await EconomyArticle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating article'
    });
  }
};

// Delete economy article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await EconomyArticle.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article'
    });
  }
};

// Update indicators
exports.updateIndicators = async (req, res) => {
  try {
    let indicators = await EconomyIndicator.findOne();
    
    if (!indicators) {
      indicators = new EconomyIndicator(req.body);
    } else {
      indicators = await EconomyIndicator.findByIdAndUpdate(
        indicators._id,
        req.body,
        { new: true }
      );
    }
    
    await indicators.save();
    
    res.json({
      success: true,
      message: 'Indicators updated successfully',
      indicators
    });
  } catch (error) {
    console.error('Error updating indicators:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating indicators'
    });
  }
};

// Update section stats
exports.updateSectionStats = async (req, res) => {
  try {
    const { section } = req.params;
    let stats = await SectionStats.findOne({ section });
    
    if (!stats) {
      stats = new SectionStats({ section, ...req.body });
    } else {
      stats = await SectionStats.findByIdAndUpdate(
        stats._id,
        req.body,
        { new: true }
      );
    }
    
    await stats.save();
    
    res.json({
      success: true,
      message: 'Section statistics updated successfully',
      stats
    });
  } catch (error) {
    console.error('Error updating section stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating section statistics'
    });
  }
};

// Helper function for default section stats
function getDefaultSectionStats(section) {
  const defaults = {
    'economy': {
      total_gdp: '2.4T',
      intra_african_trade: '140B',
      urbanization_rate: '43%',
      population: '1.3B'
    },
    'eco-africa': {
      total_gdp: '2.4T',
      intra_african_trade: '140B',
      urbanization_rate: '43%',
      population: '1.3B'
    },
    'eco-agriculture': {
      workforce_percentage: '42%',
      organic_growth: '18%',
      yield_increase: '30%',
      water_efficiency: '45%'
    },
    'eco-innovation': {
      patent_increase: '35%',
      renewable_energy_growth: '300%',
      recycling_improvement: '65%',
      wind_power_capacity: '120MW'
    }
  };
  
  return defaults[section] || {};
}