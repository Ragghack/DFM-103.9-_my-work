const express = require('express');
const router = express.Router();
const Emission = require('../models/Emission');
const LiveStream = require('../models/LiveStream');
const EmissionComment = require('../models/EmissionComment');
const { auth, adminAuth } = require('../middlewares/auth');

// ==================== PUBLIC ROUTES ====================

// Get all emissions (public)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      limit = 10, 
      page = 1, 
      featured,
      search 
    } = req.query;

    let query = { status: 'published' };
    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const emissions = await Emission.find(query)
      .sort({ publish_date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Emission.countDocuments(query);

    res.json({
      success: true,
      emissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching emissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emissions'
    });
  }
});

// Get featured emission
router.get('/featured', async (req, res) => {
  try {
    const featuredEmission = await Emission.findOne({ 
      featured: true, 
      status: 'published' 
    }).sort({ publish_date: -1 });

    res.json({
      success: true,
      emission: featuredEmission
    });
  } catch (error) {
    console.error('Error fetching featured emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured emission'
    });
  }
});

// Get emission by ID
router.get('/:id', async (req, res) => {
  try {
    const emission = await Emission.findById(req.params.id);
    
    if (!emission) {
      return res.status(404).json({
        success: false,
        message: 'Emission not found'
      });
    }

    // Increment views
    emission.views += 1;
    await emission.save();

    res.json({
      success: true,
      emission
    });
  } catch (error) {
    console.error('Error fetching emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emission'
    });
  }
});

// Get emission comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await EmissionComment.find({ 
      emission_id: req.params.id,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

// Add comment to emission
router.post('/:id/comments', async (req, res) => {
  try {
    const { user_name, user_email, content } = req.body;

    if (!user_name || !user_email || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and comment content are required'
      });
    }

    const comment = new EmissionComment({
      emission_id: req.params.id,
      user_name,
      user_email,
      content
    });

    await comment.save();

    // Update comments count in emission
    await Emission.findByIdAndUpdate(req.params.id, {
      $inc: { comments_count: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

// Get live stream status
router.get('/stream/status', async (req, res) => {
  try {
    const stream = await LiveStream.findOne();
    
    if (!stream) {
      // Create default stream if none exists
      const defaultStream = new LiveStream();
      await defaultStream.save();
      return res.json({
        success: true,
        stream: defaultStream
      });
    }

    res.json({
      success: true,
      stream
    });
  } catch (error) {
    console.error('Error fetching stream status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stream status'
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all emissions (admin)
router.get('/admin/emissions', auth, adminAuth, async (req, res) => {
  try {
    const { limit = 50, page = 1, status, category, search } = req.query;

    let query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const emissions = await Emission.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Emission.countDocuments(query);

    res.json({
      success: true,
      emissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching emissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emissions'
    });
  }
});

// Create emission
router.post('/admin/emissions', auth, adminAuth, async (req, res) => {
  try {
    const emission = new Emission(req.body);
    await emission.save();

    res.status(201).json({
      success: true,
      message: 'Emission created successfully',
      emission
    });
  } catch (error) {
    console.error('Error creating emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating emission'
    });
  }
});

// Update emission
router.put('/admin/emissions/:id', auth, adminAuth, async (req, res) => {
  try {
    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!emission) {
      return res.status(404).json({
        success: false,
        message: 'Emission not found'
      });
    }

    res.json({
      success: true,
      message: 'Emission updated successfully',
      emission
    });
  } catch (error) {
    console.error('Error updating emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating emission'
    });
  }
});

// Delete emission
router.delete('/admin/emissions/:id', auth, adminAuth, async (req, res) => {
  try {
    const emission = await Emission.findByIdAndDelete(req.params.id);

    if (!emission) {
      return res.status(404).json({
        success: false,
        message: 'Emission not found'
      });
    }

    // Also delete associated comments
    await EmissionComment.deleteMany({ emission_id: req.params.id });

    res.json({
      success: true,
      message: 'Emission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting emission'
    });
  }
});

// Update live stream
router.put('/admin/stream', auth, adminAuth, async (req, res) => {
  try {
    let stream = await LiveStream.findOne();

    if (!stream) {
      stream = new LiveStream(req.body);
    } else {
      stream = await LiveStream.findByIdAndUpdate(
        stream._id,
        req.body,
        { new: true }
      );
    }

    await stream.save();

    res.json({
      success: true,
      message: 'Stream updated successfully',
      stream
    });
  } catch (error) {
    console.error('Error updating stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stream'
    });
  }
});

// Toggle stream status
router.post('/admin/stream/toggle', auth, adminAuth, async (req, res) => {
  try {
    let stream = await LiveStream.findOne();

    if (!stream) {
      stream = new LiveStream();
    }

    stream.status = stream.status === 'live' ? 'offline' : 'live';
    
    if (stream.status === 'live') {
      stream.started_at = new Date();
      stream.current_viewers = Math.floor(Math.random() * 100) + 50; // Simulate viewers
    } else {
      stream.ended_at = new Date();
      stream.total_views += stream.current_viewers;
      stream.current_viewers = 0;
    }

    await stream.save();

    res.json({
      success: true,
      message: `Stream ${stream.status === 'live' ? 'started' : 'stopped'} successfully`,
      stream
    });
  } catch (error) {
    console.error('Error toggling stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling stream status'
    });
  }
});
router.post('/admin/emissions', auth, adminAuth, async (req, res) => {
  try {
    // Ensure required fields are present with defaults
    const emissionData = {
      ...req.body,
      content: req.body.content || "Content coming soon...",
      duration: req.body.duration || "00:00",
      audio_url: req.body.audio_url || "/uploads/default-audio.mp3",
      // Convert category to lowercase to match enum
      category: req.body.category ? req.body.category.toLowerCase() : 'news',
      // Convert status to lowercase to match enum
      status: req.body.status ? req.body.status.toLowerCase() : 'draft'
    };

    const emission = new Emission(emissionData);
    await emission.save();

    res.status(201).json({
      success: true,
      message: 'Emission created successfully',
      emission
    });
  } catch (error) {
    console.error('Error creating emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating emission: ' + error.message
    });
  }
});

// Update emission
router.put('/admin/emissions/:id', auth, adminAuth, async (req, res) => {
  try {
    // Normalize category and status if provided
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }
    if (req.body.status) {
      req.body.status = req.body.status.toLowerCase();
    }

    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!emission) {
      return res.status(404).json({
        success: false,
        message: 'Emission not found'
      });
    }

    res.json({
      success: true,
      message: 'Emission updated successfully',
      emission
    });
  } catch (error) {
    console.error('Error updating emission:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating emission: ' + error.message
    });
  }
});

module.exports = router;