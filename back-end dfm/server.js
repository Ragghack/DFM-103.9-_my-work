const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
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

// Middleware
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5502',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5502',
  'http://localhost:5000'
];

app.use(helmet());

// Simplified CORS configuration
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 600
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// ==================== STATIC FILE SERVING ====================
// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin frontend and other HTML files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Specific route for admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin frontend.html'));
});

// Default route - serve admin frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin frontend.html'));
});

// Routes for other frontend pages
app.get('/economy', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'economy.html'));
});

app.get('/finance', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'finance.html'));
});
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin-login.html'));
});

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
// This should be in your main server file
app.use('/api/actuality', require('./routes/actuality'));
app.use('/api/economy', require('./routes/economy'));
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ 
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: 'CORS policy blocked this request'
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = 5000; // Hardcoded to only run on port 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`Economy Page: http://localhost:${PORT}/economy`);
  console.log(`Finance Page: http://localhost:${PORT}/finance`);
  console.log(`API Health: http://localhost:${PORT}/health`);
  console.log(`Login Page: http://localhost:${PORT}/admin-login`);
});

module.exports = app;