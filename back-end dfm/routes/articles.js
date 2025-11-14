// routes/articles.js - COMPLETELY CORRECTED VERSION
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
console.log('Auth type:', typeof auth);

// Get single article with populated data
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('likes', 'name');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Increment view count (optional)
    article.views = (article.views || 0) + 1;
    await article.save();

    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
});

// Get articles with filtering (for featured articles)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      featured, 
      limit = 10, 
      page = 1,
      search 
    } = req.query;

    let query = {};
    
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await Article.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      articles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

// Like/Unlike article
router.post('/:id/like', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    const userId = req.user.id;

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const likeIndex = article.likes.indexOf(userId);
    let liked = false;

    if (likeIndex > -1) {
      article.likes.splice(likeIndex, 1);
    } else {
      article.likes.push(userId);
      liked = true;
    }

    await article.save();

    res.json({
      success: true,
      liked,
      likes: article.likes.length
    });
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking article',
      error: error.message
    });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const comment = {
      user: req.user.id,
      content: content.trim(),
      createdAt: new Date()
    };

    article.comments.push(comment);
    await article.save();

    // Populate the new comment with user data
    await article.populate('comments.user', 'name email avatar');

    const newComment = article.comments[article.comments.length - 1];

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
});

// Save/Unsave article
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const articleId = req.params.id;

    const saveIndex = user.savedArticles.indexOf(articleId);
    let saved = false;

    if (saveIndex > -1) {
      user.savedArticles.splice(saveIndex, 1);
    } else {
      user.savedArticles.push(articleId);
      saved = true;
    }

    await user.save();

    res.json({
      success: true,
      saved
    });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving article',
      error: error.message
    });
  }
});

// Share article
router.post('/:id/share', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    article.shares = (article.shares || 0) + 1;
    await article.save();

    res.json({
      success: true,
      shares: article.shares
    });
  } catch (error) {
    console.error('Error sharing article:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing article',
      error: error.message
    });
  }
});
// routes/articles.js - ADD THESE ROUTES

// Create new article (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      featured = false,
      image_url,
      image_alt,
      tags = [],
      meta_title,
      meta_description
    } = req.body;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    const article = new Article({
      title,
      content,
      excerpt,
      category,
      featured,
      author: req.user.id,
      image_url: image_url || null,
      image_alt: image_alt || '',
      tags,
      meta_title: meta_title || title.substring(0, 60),
      meta_description: meta_description || excerpt?.substring(0, 160) || content.substring(0, 160)
    });

    await article.save();
    
    // Populate author info
    await article.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
});

// Update article
router.put('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar');

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
      message: 'Error updating article',
      error: error.message
    });
  }
});

// Delete article
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

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
      message: 'Error deleting article',
      error: error.message
    });
  }
});


module.exports = router;