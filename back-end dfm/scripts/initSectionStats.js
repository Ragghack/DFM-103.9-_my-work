// scripts/initSectionStats.js
const mongoose = require('mongoose');
const EconomySectionStats = require('../models/EconomySectionStats');
require('dotenv').config();

const defaultStats = {
  'eco-africa': {
    total_gdp: '2.4T',
    intra_african_trade: '140B',
    urbanization_rate: '43',
    population: '1.3B'
  },
  'eco-agriculture': {
    workforce_percentage: '42',
    organic_growth: '18',
    yield_increase: '30',
    water_efficiency: '45'
  },
  'eco-innovation': {
    patent_increase: '35',
    renewable_energy_growth: '300',
    recycling_improvement: '65',
    wind_power_capacity: '120MW'
  }
};

async function initSectionStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dfm-media');
    
    for (const [section, stats] of Object.entries(defaultStats)) {
      const existing = await EconomySectionStats.findOne({ section });
      
      if (!existing) {
        const sectionStats = new EconomySectionStats({
          section,
          stats
        });
        await sectionStats.save();
        console.log(`Created default stats for ${section}`);
      } else {
        console.log(`Stats already exist for ${section}`);
      }
    }
    
    console.log('Section stats initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing section stats:', error);
    process.exit(1);
  }
}

initSectionStats();