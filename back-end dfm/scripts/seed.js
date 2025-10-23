// scripts/seed.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'dfm.env') });
const connectDB = require('../config/database');
const seedDatabase = require('../config/seedDatabase');

(async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('No database connection. Please set MONGODB_URI in dfm.env');
      process.exit(1);
    }

    await seedDatabase();
    console.log('Seeding finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
