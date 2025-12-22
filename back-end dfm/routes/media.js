// routes/media.js - DUAL STORAGE (Cloudinary + Local)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminAuth } = require('../middlewares/auth');

// Try to require Cloudinary (optional)
let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
} catch (err) {
  console.log('Cloudinary not installed, using local storage only');
}

// Configure Cloudinary if environment variables exist
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET;

if (useCloudinary && cloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured');
} else {
  console.log('Cloudinary not configured, using local storage');
}

// Configure local storage (always available as fallback)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create subdirectories based on file type
    if (file.mimetype.startsWith('audio/')) {
      const audioDir = path.join(uploadDir, 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      cb(null, audioDir);
    } else if (file.mimetype.startsWith('image/')) {
      const imageDir = path.join(uploadDir, 'images');
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }
      cb(null, imageDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-') + 
                     '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp3|wav|mpeg|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

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
    let storageType = 'local';
    
    // Option 1: Upload to Cloudinary (if configured and available)
    if (useCloudinary && cloudinary) {
      try {
        const resourceType = req.file.mimetype.startsWith('audio/') ? 'video' : 'image';
        
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: 'dfm_media',
              resource_type: resourceType,
              public_id: `dfm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }, 
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        storageType = 'cloudinary';
        console.log('File uploaded to Cloudinary:', result.secure_url);
        
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
        // Continue to local storage fallback
      }
    }
    
    // Option 2: Use local storage (always available)
    if (!result) {
      // Generate URL relative to public folder
      const filePath = req.file.path;
      const relativePath = path.relative(path.join(__dirname, '..', 'public'), filePath);
      const fileUrl = '/uploads/' + relativePath.split(path.sep).join('/');
      
      result = {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname
      };
      
      console.log('File saved locally:', fileUrl);
    }

    res.json({
      success: true,
      url: result.url,
      filename: result.filename || req.file.filename,
      originalname: result.originalname || req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      storage: storageType,
      message: `File uploaded successfully to ${storageType}`
    });

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