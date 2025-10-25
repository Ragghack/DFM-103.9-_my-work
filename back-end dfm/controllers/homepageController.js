const Homepage = require('../models/Homepage');
const Article = require('../models/Article');
const News = require('../models/News');

// Get homepage data
exports.getHomepage = async (req, res) => {
  try {
    let homepage = await Homepage.findOne();
    
    if (!homepage) {
      // Create default homepage content if none exists
      homepage = new Homepage({
        breakingNews: "DFM Radio launches its news portal | Follow economy, politics and sports live | New tax reform announced for 2025 | World Cup preparations underway | Inflation down for the 3rd consecutive month",
        featuredArticle: null,
        quickLinks: {
          economy: "Market trends and analysis",
          finance: "Banking and investment news", 
          articles: "In-depth analysis and reports",
          actuality: "Current events and programs"
        }
      });
      await homepage.save();
    }

    // Populate featured article if exists
    let populatedHomepage = homepage.toObject();
    
    if (homepage.featuredArticle) {
      const featuredArticle = await Article.findById(homepage.featuredArticle);
      populatedHomepage.featuredArticleData = featuredArticle;
    }
    
    res.json({ homepage: populatedHomepage });
  } catch (err) {
    console.error('Get homepage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update homepage data
exports.updateHomepage = async (req, res) => {
  try {
    const { breakingNews, featuredArticle, quickLinks } = req.body;
    
    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({ breakingNews, featuredArticle, quickLinks });
    } else {
      if (breakingNews !== undefined) homepage.breakingNews = breakingNews;
      if (featuredArticle !== undefined) homepage.featuredArticle = featuredArticle;
      if (quickLinks !== undefined) homepage.quickLinks = quickLinks;
    }
    
    await homepage.save();
    res.json({ homepage });
  } catch (err) {
    console.error('Update homepage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update breaking news only
exports.updateBreakingNews = async (req, res) => {
  try {
    const { breakingNews } = req.body;
    
    if (!breakingNews) {
      return res.status(400).json({ message: 'Breaking news content is required' });
    }
    
    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({ breakingNews });
    } else {
      homepage.breakingNews = breakingNews;
    }
    
    await homepage.save();
    res.json({ homepage });
  } catch (err) {
    console.error('Update breaking news error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update featured article only
exports.updateFeaturedArticle = async (req, res) => {
  try {
    const { featuredArticle } = req.body;
    
    // Validate if featuredArticle is a valid ObjectId if provided
    if (featuredArticle && !require('mongoose').Types.ObjectId.isValid(featuredArticle)) {
      return res.status(400).json({ message: 'Invalid featured article ID' });
    }
    
    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({ featuredArticle });
    } else {
      homepage.featuredArticle = featuredArticle || null;
    }
    
    await homepage.save();
    res.json({ homepage });
  } catch (err) {
    console.error('Update featured article error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update quick links only
exports.updateQuickLinks = async (req, res) => {
  try {
    const { quickLinks } = req.body;
    
    if (!quickLinks || typeof quickLinks !== 'object') {
      return res.status(400).json({ message: 'Quick links object is required' });
    }
    
    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({ quickLinks });
    } else {
      homepage.quickLinks = { ...homepage.quickLinks, ...quickLinks };
    }
    
    await homepage.save();
    res.json({ homepage });
  } catch (err) {
    console.error('Update quick links error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};