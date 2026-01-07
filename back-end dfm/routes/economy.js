const express = require('express');
const router = express.Router();
const EconomyArticle = require('../models/EconomyArticle');
const EconomyIndicator = require('../models/EconomyIndicator');
const EconomySectionStats = require('../models/EconomySectionStats');
const { auth, adminAuth } = require('../middlewares/auth');

// Helper function to filter stats by section
function filterSectionStats(stats, section) {
  if (!stats) return {};
  
  if (section === 'eco-africa') {
    return {
      total_gdp: stats.total_gdp || '2.4T',
      intra_african_trade: stats.intra_african_trade || '140B',
      urbanization_rate: stats.urbanization_rate || '43',
      population: stats.population || '1.3B'
    };
  } else if (section === 'eco-agriculture') {
    return {
      workforce_percentage: stats.workforce_percentage || '42',
      organic_growth: stats.organic_growth || '18',
      yield_increase: stats.yield_increase || '30',
      water_efficiency: stats.water_efficiency || '45'
    };
  } else if (section === 'eco-innovation') {
    return {
      patent_increase: stats.patent_increase || '35',
      renewable_energy_growth: stats.renewable_energy_growth || '300',
      recycling_improvement: stats.recycling_improvement || '65',
      wind_power_capacity: stats.wind_power_capacity || '120MW'
    };
  }
  return {};
}

// ==================== PUBLIC ROUTES ====================

// Get all economy articles (public)
// ==================== PUBLIC ROUTES ====================

// Get all economy articles (public)
router.get('/articles', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, section } = req.query;
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (section) filter.section = section;

    const skip = (page - 1) * limit;
    const items = await EconomyArticle.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // IMPORTANT: Convert to plain objects first to apply virtual fields
    const itemsWithUrls = items.map(item => {
      const doc = new EconomyArticle(item);
      const json = doc.toJSON(); // This will apply the virtual field transformation
      return json;
    });

    const total = await EconomyArticle.countDocuments(filter);

    res.json({ 
      items: itemsWithUrls, 
      total, 
      page: Number(page), 
      limit: Number(limit) 
    });
  } catch (err) {
    console.error('Get economy articles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get economy article by ID or slug (public)
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

    // Convert to plain object to apply virtual fields
    const doc = new EconomyArticle(article);
    const articleWithUrls = doc.toJSON();

    // Increment views
    EconomyArticle.findByIdAndUpdate(article._id, { $inc: { views_count: 1 } }).exec();

    res.json({ article: articleWithUrls });
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
    const validSections = ['eco-africa', 'eco-agriculture', 'eco-innovation'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // Try to fetch from database
    let sectionStats = await EconomySectionStats.findOne({ section }).lean();
    
    if (!sectionStats) {
      // If not found in database, create default entry
      const defaultStats = {
        'eco-africa': {
          section: 'eco-africa',
          total_gdp: '2.4T',
          intra_african_trade: '140B',
          urbanization_rate: '43',
          population: '1.3B',
          last_updated: new Date()
        },
        'eco-agriculture': {
          section: 'eco-agriculture',
          workforce_percentage: '42',
          organic_growth: '18',
          yield_increase: '30',
          water_efficiency: '45',
          last_updated: new Date()
        },
        'eco-innovation': {
          section: 'eco-innovation',
          patent_increase: '35',
          renewable_energy_growth: '300',
          recycling_improvement: '65',
          wind_power_capacity: '120MW',
          last_updated: new Date()
        }
      };

      // Create the default entry
      const newSectionStats = new EconomySectionStats(defaultStats[section]);
      await newSectionStats.save();
      
      return res.json({ 
        section: section,
        stats: filterSectionStats(defaultStats[section], section),
        last_updated: new Date(),
        from_cache: true 
      });
    }

    const filteredStats = filterSectionStats(sectionStats, section);
    
    res.json({ 
      section: sectionStats.section, 
      stats: filteredStats,
      last_updated: sectionStats.last_updated,
      from_cache: false 
    });
  } catch (err) {
    console.error('Get section stats error:', err);
    
    // Return default values as fallback
    const defaultStats = {
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
    
    res.json({ 
      section: req.params.section, 
      stats: defaultStats[req.params.section] || {},
      error: true,
      message: 'Using cached data'
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all economy articles for admin (with filters)
// Get all economy articles for admin (with filters)
router.get('/admin/articles', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, section, status } = req.query;
    const filter = {};

    if (section) filter.section = section;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    
    // Use Mongoose documents to get virtual fields
    const itemsDocs = await EconomyArticle.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Convert to JSON to apply virtual fields
    const items = itemsDocs.map(doc => doc.toJSON());

    const total = await EconomyArticle.countDocuments(filter);

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
    const validSections = ['eco-africa', 'eco-agriculture', 'eco-innovation'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // Find existing stats or create new
    let sectionStats = await EconomySectionStats.findOne({ section });
    
    if (sectionStats) {
      // Update existing based on section type
      if (section === 'eco-africa') {
        sectionStats.total_gdp = stats.total_gdp || sectionStats.total_gdp;
        sectionStats.intra_african_trade = stats.intra_african_trade || sectionStats.intra_african_trade;
        sectionStats.urbanization_rate = stats.urbanization_rate || sectionStats.urbanization_rate;
        sectionStats.population = stats.population || sectionStats.population;
      } else if (section === 'eco-agriculture') {
        sectionStats.workforce_percentage = stats.workforce_percentage || sectionStats.workforce_percentage;
        sectionStats.organic_growth = stats.organic_growth || sectionStats.organic_growth;
        sectionStats.yield_increase = stats.yield_increase || sectionStats.yield_increase;
        sectionStats.water_efficiency = stats.water_efficiency || sectionStats.water_efficiency;
      } else if (section === 'eco-innovation') {
        sectionStats.patent_increase = stats.patent_increase || sectionStats.patent_increase;
        sectionStats.renewable_energy_growth = stats.renewable_energy_growth || sectionStats.renewable_energy_growth;
        sectionStats.recycling_improvement = stats.recycling_improvement || sectionStats.recycling_improvement;
        sectionStats.wind_power_capacity = stats.wind_power_capacity || sectionStats.wind_power_capacity;
      }
      
      sectionStats.last_updated = new Date();
      sectionStats.updated_by = req.user._id;
      await sectionStats.save();
    } else {
      // Create new
      const sectionData = { section };
      
      if (section === 'eco-africa') {
        sectionData.total_gdp = stats.total_gdp || '2.4T';
        sectionData.intra_african_trade = stats.intra_african_trade || '140B';
        sectionData.urbanization_rate = stats.urbanization_rate || '43';
        sectionData.population = stats.population || '1.3B';
      } else if (section === 'eco-agriculture') {
        sectionData.workforce_percentage = stats.workforce_percentage || '42';
        sectionData.organic_growth = stats.organic_growth || '18';
        sectionData.yield_increase = stats.yield_increase || '30';
        sectionData.water_efficiency = stats.water_efficiency || '45';
      } else if (section === 'eco-innovation') {
        sectionData.patent_increase = stats.patent_increase || '35';
        sectionData.renewable_energy_growth = stats.renewable_energy_growth || '300';
        sectionData.recycling_improvement = stats.recycling_improvement || '65';
        sectionData.wind_power_capacity = stats.wind_power_capacity || '120MW';
      }
      
      sectionData.updated_by = req.user._id;
      sectionStats = new EconomySectionStats(sectionData);
      await sectionStats.save();
    }

    res.json({ 
      section, 
      stats: filterSectionStats(sectionStats, section),
      last_updated: sectionStats.last_updated,
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
    const validSections = ['eco-africa', 'eco-agriculture', 'eco-innovation'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // Try to fetch from database
    let sectionStats = await EconomySectionStats.findOne({ section }).lean();
    
    if (!sectionStats) {
      // Default values
      const defaultStats = {
        'eco-africa': {
          total_gdp: '2.4T',
          intra_african_trade: '140B',
          urbanization_rate: '43',
          population: '1.3B'
        },
        'eco-agriculture': {
          workforce_percentage: '42',
          organic_growth: '18',
          yield_increase: '30',
          water_efficiency: '45'
        },
        'eco-innovation': {
          patent_increase: '35',
          renewable_energy_growth: '300',
          recycling_improvement: '65',
          wind_power_capacity: '120MW'
        }
      };

      return res.json({ 
        section, 
        stats: filterSectionStats(defaultStats[section], section),
        exists: false 
      });
    }

    res.json({ 
      section: sectionStats.section, 
      stats: filterSectionStats(sectionStats, section),
      last_updated: sectionStats.last_updated,
      exists: true 
    });
  } catch (err) {
    console.error('Get admin section stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;