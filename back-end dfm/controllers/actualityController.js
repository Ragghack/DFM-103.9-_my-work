const Program = require('../models/Program');
const HotNews = require('../models/HotNews');
const EconomySummary = require('../models/EconomySummary');
const Article = require('../models/Article');

// Get all programs
exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ status: 'active' })
      .sort({ schedule: 1 })
      .limit(10);
    
    res.json({
      success: true,
      programs
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching programs'
    });
  }
};

// Get upcoming programs
exports.getUpcomingPrograms = async (req, res) => {
  try {
    const upcomingPrograms = await Program.find({
      status: 'upcoming',
      startDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .limit(5);
    
    res.json({
      success: true,
      programs: upcomingPrograms
    });
  } catch (error) {
    console.error('Error fetching upcoming programs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming programs'
    });
  }
};

// Get future programs
exports.getFuturePrograms = async (req, res) => {
  try {
    const futurePrograms = await Program.find({
      status: 'future',
      startDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .limit(5);
    
    res.json({
      success: true,
      programs: futurePrograms
    });
  } catch (error) {
    console.error('Error fetching future programs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching future programs'
    });
  }
};

// Get hot news
exports.getHotNews = async (req, res) => {
  try {
    const hotNews = await HotNews.find({ 
      status: 'active',
      expiryDate: { $gte: new Date() }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(5);
    
    res.json({
      success: true,
      hotNews
    });
  } catch (error) {
    console.error('Error fetching hot news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot news'
    });
  }
};

// Get economy summary
exports.getEconomySummary = async (req, res) => {
  try {
    const economySummary = await EconomySummary.findOne()
      .sort({ createdAt: -1 });
    
    if (!economySummary) {
      // Return default values if no summary exists
      return res.json({
        success: true,
        summary: {
          stockMarket: '+3.2%',
          inflation: '2.3%',
          currency: '582.50',
          businessRegistrations: '+15%',
          agriculture: '+8%'
        }
      });
    }
    
    res.json({
      success: true,
      summary: economySummary
    });
  } catch (error) {
    console.error('Error fetching economy summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching economy summary'
    });
  }
};

// Get comments from articles
exports.getComments = async (req, res) => {
  try {
    const articlesWithComments = await Article.find({
      'comments.0': { $exists: true }
    })
    .select('title comments')
    .populate('comments.user', 'name avatar')
    .sort({ 'comments.createdAt': -1 })
    .limit(10);
    
    // Flatten comments from all articles
    const allComments = articlesWithComments.flatMap(article => 
      article.comments.map(comment => ({
        ...comment.toObject(),
        articleTitle: article.title
      }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8); // Limit to 8 comments
    
    res.json({
      success: true,
      comments: allComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// Create program (Admin)
exports.createProgram = async (req, res) => {
  try {
    const program = new Program(req.body);
    await program.save();
    
    res.status(201).json({
      success: true,
      message: 'Program created successfully',
      program
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating program'
    });
  }
};

// Update program (Admin)
exports.updateProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Program updated successfully',
      program
    });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating program'
    });
  }
};

// Delete program (Admin)
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Program deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting program'
    });
  }
};

// Create hot news (Admin)
exports.createHotNews = async (req, res) => {
  try {
    const hotNews = new HotNews(req.body);
    await hotNews.save();
    
    res.status(201).json({
      success: true,
      message: 'Hot news created successfully',
      hotNews
    });
  } catch (error) {
    console.error('Error creating hot news:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating hot news'
    });
  }
};

// Update hot news (Admin)
exports.updateHotNews = async (req, res) => {
  try {
    const hotNews = await HotNews.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!hotNews) {
      return res.status(404).json({
        success: false,
        message: 'Hot news not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hot news updated successfully',
      hotNews
    });
  } catch (error) {
    console.error('Error updating hot news:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hot news'
    });
  }
};

// Delete hot news (Admin)
exports.deleteHotNews = async (req, res) => {
  try {
    const hotNews = await HotNews.findByIdAndDelete(req.params.id);
    
    if (!hotNews) {
      return res.status(404).json({
        success: false,
        message: 'Hot news not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hot news deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hot news:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting hot news'
    });
  }
};

// Update economy summary (Admin)
exports.updateEconomySummary = async (req, res) => {
  try {
    let economySummary = await EconomySummary.findOne();
    
    if (!economySummary) {
      economySummary = new EconomySummary(req.body);
    } else {
      economySummary = await EconomySummary.findByIdAndUpdate(
        economySummary._id,
        req.body,
        { new: true }
      );
    }
    
    await economySummary.save();
    
    res.json({
      success: true,
      message: 'Economy summary updated successfully',
      summary: economySummary
    });
  } catch (error) {
    console.error('Error updating economy summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating economy summary'
    });
  }
};