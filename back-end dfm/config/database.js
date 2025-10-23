const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGODB_URI from environment.
 * Returns the mongoose connection on success, or null on failure or when URI is not provided.
 * Does NOT exit the process on failure so the app can run in degraded mode for local dev.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set. Skipping database connection (useful for local dev).');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      // mongoose v6+ doesn't require these options but leaving for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message || error);
    return null;
  }
};

module.exports = connectDB;