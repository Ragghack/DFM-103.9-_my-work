// routes/community.js
const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const { auth } = require('../middleware/auth');

// Get community posts
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'approved', 
      limit = 10, 
      page = 1,
      category 
    } = req.query;

    let query = { status };
    if (category) query.category = category;

    const posts = await CommunityPost.find(query)
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await CommunityPost.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching community posts',
      error: error.message
    });
  }
});

// Create community post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    const post = new CommunityPost({
      title: title.trim(),
      content: content.trim(),
      category,
      author: req.user.id,
      status: 'pending' // Requires admin approval
    });

    await post.save();
    await post.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Post submitted for approval',
      post
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating community post',
      error: error.message
    });
  }
});

module.exports = router;