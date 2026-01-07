const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config({ path: './dfm.env' });

const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const newsRoutes = require('./routes/news');
const economyRoutes = require('./routes/economy');
const financeRoutes = require('./routes/finance');
const emissionRoutes = require('./routes/emissions');
const mediaRoutes = require('./routes/media');
const analyticsRoutes = require('./routes/analytics');
const newsletterRoutes = require('./routes/newsletter');
const usersRoutes = require('./routes/users');
const homepageRoutes = require('./routes/homepage');
const communityRoutes = require('./routes/community');
const actualityRoutes = require('./routes/actuality');

const app = express();

// Connect to database
connectDB();

// ==================== SERVER CONFIGURATION ====================

const UPLOAD_DIR = path.join(__dirname, 'public/uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
  }
  fs.chmodSync(UPLOAD_DIR, 0o755);
} catch (error) {
  console.error('Failed to setup upload directory:', error);
  process.exit(1);
}

// ==================== CORS & SECURITY CONFIGURATION ====================

// 1. Define allowed origins first to avoid ReferenceErrors
// In server.js, update the CORS middleware section:

// ==================== CORS & SECURITY CONFIGURATION ====================

// 1. Define allowed origins first to avoid ReferenceErrors
const allowedOrigins = [
  'http://127.0.0.1:5502',
  'http://127.0.0.1:5503',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://localhost:5502',
  'http://localhost:5503',
  'http://localhost:5504', // Add this if you're using another port
  'null'
];

// 2. Define CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      // Allow for development - remove in production
      callback(null, true); // Temporarily allow all for debugging
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// 3. APPLY MIDDLEWARE IN CORRECT ORDER
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for media
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Temporarily disable for debugging
}));

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// ==================== FILE UPLOAD CONFIGURATION (UPDATED) ====================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname).toLowerCase();
    // Replace non-alphanumeric chars with dashes
    const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // UPDATED: Regex now includes audio extensions (mp3, wav, m4a, etc.)
    const filetypes = /jpeg|jpg|png|gif|webp|mp3|wav|m4a|mpeg|ogg/;
    
    // Check both mime type and extension
    const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('audio/');
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('File type not supported. Only images and audio files are allowed.'));
  },
  // UPDATED: Limit increased to 100MB for audio files
  limits: { fileSize: 100 * 1024 * 1024 } 
});

// UPDATED: Upload route with better error handling
app.post('/api/media/upload', (req, res) => {
  upload.single('file')(req, res, function (err) {
    // Handle Multer-specific errors (like File Too Large)
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload Error: ${err.message}` });
    } else if (err) {
      // Handle file type errors or other unknowns
      return res.status(400).json({ success: false, message: err.message });
    }

    // If no error, proceed to send response
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Upload processing failed: ' + error.message });
    }
  });
});

// ==================== STATIC FILE SERVING ====================

// Serve static files from 'public' directory with proper headers
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers for all static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Cache control for different file types
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp') {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours for images
    } else if (ext === '.mp3' || ext === '.wav' || ext === '.m4a' || ext === '.ogg') {
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week for audio
      res.setHeader('Accept-Ranges', 'bytes'); // Allow byte range requests for audio
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for others
    }
  }
}));

// Serve uploads with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    
    // Set content-type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp3' || ext === '.wav' || ext === '.m4a') {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    }
    
    // Allow byte range requests for audio files
    if (ext === '.mp3' || ext === '.wav' || ext === '.m4a') {
      res.setHeader('Accept-Ranges', 'bytes');
    }
    
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache for uploads
  }
}));
// In server.js, add a debug endpoint:
app.get('/api/debug/media', (req, res) => {
  try {
    const fs = require('fs');
    const uploadDir = path.join(__dirname, 'public/uploads');
    
    // Check if upload directory exists
    const dirExists = fs.existsSync(uploadDir);
    
    // List files in upload directory
    let files = [];
    if (dirExists) {
      files = fs.readdirSync(uploadDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => ({
          name: dirent.name,
          path: `/uploads/${dirent.name}`,
          fullPath: `http://localhost:5000/uploads/${dirent.name}`
        }));
    }
    
    res.json({
      success: true,
      uploadDir: uploadDir,
      dirExists: dirExists,
      fileCount: files.length,
      files: files,
      permissions: dirExists ? fs.statSync(uploadDir).mode.toString(8) : 'N/A'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// ==================== HTML ROUTES ====================

// Serve admin pages from the correct directory
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin frontend.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/admin frontend.html')));
app.get('/economy', (req, res) => res.sendFile(path.join(__dirname, 'public/economy.html')));
app.get('/finance', (req, res) => res.sendFile(path.join(__dirname, 'public/finance.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin-login.html')));
app.get('/articles', (req, res) => res.sendFile(path.join(__dirname, 'public/articles.html')));
app.get('/emissions', (req, res) => res.sendFile(path.join(__dirname, 'public/emissions.html')));

// ==================== API ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/emissions', emissionRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/actuality', actualityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uploadDir: UPLOAD_DIR });
});

// 404 & Error Handlers
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ==================== START SERVER ====================

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;