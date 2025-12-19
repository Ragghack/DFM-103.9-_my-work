// routes/media.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, adminAuth } = require('../middlewares/auth');
const Media = require('../models/Media');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    // Allow both images AND audio files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});
// Simple fallback storage without database
const uploadToLocal = (file) => {
  // For development - return a mock URL
  const fileType = file.mimetype.startsWith('audio/') ? 'audio' : 'image';
  const mockUrls = {
    audio: '/uploads/audio/sample-episode.mp3',
    image: '/uploads/images/sample-thumbnail.jpg'
  };
  return mockUrls[fileType];
};
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
    console.log('Upload request received:', {
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    let result;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const resourceType = req.file.mimetype.startsWith('audio/') ? 'video' : 'image';
      
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'dfm_media',
            resource_type: resource_type
          }, 
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        message: 'File uploaded to Cloudinary successfully'
      });
    } else {
      // Development fallback - return a usable URL
      const fileType = req.file.mimetype.startsWith('audio/') ? 'audio' : 'image';
      
      // For audio files, return a test audio URL that actually works
      if (fileType === 'audio') {
        const testAudioUrls = [
          "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
          "https://www.soundjay.com/communication/sounds/telephone-ring-03.wav",
          "https://www.soundjay.com/mechanical/sounds/camera-shutter-click-05.wav"
        ];
        const audioUrl = testAudioUrls[Math.floor(Math.random() * testAudioUrls.length)];
        
        res.json({
          success: true,
          url: audioUrl,
          message: 'Using test audio URL (Cloudinary not configured)'
        });
      } else {
        // For images, return a placeholder
        const placeholderImage = "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250&q=80";
        
        res.json({
          success: true,
          url: placeholderImage,
          message: 'Using placeholder image (Cloudinary not configured)'
        });
      }
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

// Simple media list endpoint
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    // Return empty array or mock data for now
    res.json({
      success: true,
      media: [],
      message: 'Media storage not fully implemented'
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

module.exports = router;