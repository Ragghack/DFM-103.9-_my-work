// routes/media.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, adminAuth } = require('../middleware/auth');
const Media = require('../models/Media');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Configure Cloudinary if available
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// POST /api/media/upload (admin only)
router.post('/upload', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    let result;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'dfm_media',
            resource_type: 'auto'
          }, 
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      // Save to database
      const media = new Media({
        filename: req.file.originalname,
        url: result.secure_url,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user.id
      });

      await media.save();

      res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        mediaId: media._id
      });
    } else {
      // Fallback: Return a placeholder or base64 (for development)
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      
      res.json({
        success: true,
        url: dataUrl,
        message: 'Cloudinary not configured - using base64 fallback',
        warning: 'For production, configure Cloudinary environment variables'
      });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed',
      error: err.message 
    });
  }
});

// Get all media (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const media = await Media.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media',
      error: error.message
    });
  }
});

module.exports = router;