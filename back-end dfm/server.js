const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

const app = express();

// Connect to database
connectDB();

// Middleware
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5000'
];

app.use(helmet());

// Explicit CORS options to ensure preflight responses include the expected headers
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like curl or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept'],
  credentials: true,
  maxAge: 600
};

app.use(cors(corsOptions));
// Ensure preflight (OPTIONS) requests are handled
app.options('*', cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
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

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 Handler - PATHLESS (no '*')
app.use((req, res, next) => {
  res.status(404).json({ 
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware - MUST BE LAST
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle CORS errors
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;