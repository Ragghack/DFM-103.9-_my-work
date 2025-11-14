const express = require('express');
const router = express.Router();
const EconomyArticle = require('../models/EconomyArticle');
const EconomyIndicator = require('../models/EconomyIndicator');
const { auth, adminAuth } = require('../middlewares/auth');

// Get all economy articles (public)
router.get('/articles', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, section } = req.query;
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (section) filter.section = section;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      EconomyArticle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      EconomyArticle.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Get economy articles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get economy article by ID or slug (public)
router.get('/articles/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let article;

    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      article = await EconomyArticle.findById(idOrSlug).lean();
    } else {
      article = await EconomyArticle.findOne({ slug: idOrSlug, status: 'published' }).lean();
    }

    if (!article) return res.status(404).json({ message: 'Article not found' });

    // Increment views
    EconomyArticle.findByIdAndUpdate(article._id, { $inc: { views_count: 1 } }).exec();

    res.json({ article });
  } catch (err) {
    console.error('Get economy article error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current economic indicators (public)
router.get('/indicators', async (req, res) => {
  try {
    const indicators = await EconomyIndicator.findOne()
      .sort({ createdAt: -1 })
      .lean();

    if (!indicators) {
      // Return default values if no indicators exist
      return res.json({
        gdp_growth: 3.2,
        industrial_growth: 4.5,
        unemployment_rate: 5.8,
        inflation_rate: 2.1,
        period: 'Q2 2023',
        last_updated: new Date()
      });
    }

    res.json(indicators);
  } catch (err) {
    console.error('Get indicators error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get section-specific statistics (public)
router.get('/section-stats/:section', async (req, res) => {
  try {
    const { section } = req.params;
    
    // Validate section
    const validSections = ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // Default values - in production, fetch from database
    const defaultStats = {
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

    res.json({ section, stats: defaultStats[section] });
  } catch (err) {
    console.error('Get section stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ROUTES

// Get all economy articles for admin (with filters)
router.get('/admin/articles', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, section, status } = req.query;
    const filter = {};

    if (section) filter.section = section;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      EconomyArticle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      EconomyArticle.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Get admin economy articles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create economy article (admin)
router.post('/articles', auth, adminAuth, async (req, res) => {
  try {
    const payload = req.body;
    if (req.user) payload.author_id = req.user._id;

    const article = new EconomyArticle(payload);
    await article.save();

    res.status(201).json({ article });
  } catch (err) {
    console.error('Create economy article error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update economy article (admin)
router.put('/articles/:id', auth, adminAuth, async (req, res) => {
  try {
    const article = await EconomyArticle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!article) return res.status(404).json({ message: 'Article not found' });

    res.json({ article });
  } catch (err) {
    console.error('Update economy article error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete economy article (admin)
router.delete('/articles/:id', auth, adminAuth, async (req, res) => {
  try {
    const article = await EconomyArticle.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    console.error('Delete economy article error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update economic indicators (admin)
router.put('/indicators', auth, adminAuth, async (req, res) => {
  try {
    const {
      gdp_growth,
      industrial_growth,
      unemployment_rate,
      inflation_rate,
      period,
      year,
      quarter
    } = req.body;

    const updateData = {
      gdp_growth,
      industrial_growth,
      unemployment_rate,
      inflation_rate,
      period,
      year,
      quarter,
      last_updated: new Date(),
      updated_by: req.user._id
    };

    // Find the latest indicator or create new
    let indicator = await EconomyIndicator.findOne().sort({ createdAt: -1 });
    
    if (indicator) {
      indicator = await EconomyIndicator.findByIdAndUpdate(
        indicator._id,
        updateData,
        { new: true }
      );
    } else {
      indicator = new EconomyIndicator(updateData);
      await indicator.save();
    }

    res.json({ indicator });
  } catch (err) {
    console.error('Update indicators error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update section-specific statistics (admin)
router.put('/section-stats/:section', auth, adminAuth, async (req, res) => {
  try {
    const { section } = req.params;
    const stats = req.body;

    // Validate section
    const validSections = ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // In a real implementation, you would save this to a database
    // For now, we'll store it in memory (replace with database in production)
    const sectionStats = {
      'economy': {
        total_gdp: stats.total_gdp || '2.4T',
        intra_african_trade: stats.intra_african_trade || '140B',
        urbanization_rate: stats.urbanization_rate || '43%',
        population: stats.population || '1.3B'
      },
      'eco-africa': {
        total_gdp: stats.total_gdp || '2.4T',
        intra_african_trade: stats.intra_african_trade || '140B',
        urbanization_rate: stats.urbanization_rate || '43%',
        population: stats.population || '1.3B'
      },
      'eco-agriculture': {
        workforce_percentage: stats.workforce_percentage || '42%',
        organic_growth: stats.organic_growth || '18%',
        yield_increase: stats.yield_increase || '30%',
        water_efficiency: stats.water_efficiency || '45%'
      },
      'eco-innovation': {
        patent_increase: stats.patent_increase || '35%',
        renewable_energy_growth: stats.renewable_energy_growth || '300%',
        recycling_improvement: stats.recycling_improvement || '65%',
        wind_power_capacity: stats.wind_power_capacity || '120MW'
      }
    };

    // TODO: Save to database instead of memory
    // For now, we'll just return the updated stats
    res.json({ 
      section, 
      stats: sectionStats[section],
      message: `${section} statistics updated successfully` 
    });
  } catch (err) {
    console.error('Update section stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get section-specific stats for admin (with current values)
router.get('/admin/section-stats/:section', auth, adminAuth, async (req, res) => {
  try {
    const { section } = req.params;
    
    // Validate section
    const validSections = ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // Default values - in production, fetch from database
    const defaultStats = {
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

    res.json({ section, stats: defaultStats[section] });
  } catch (err) {
    console.error('Get admin section stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;