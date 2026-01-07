// models/EconomySectionStats.js
const mongoose = require('mongoose');

const EconomySectionStatsSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['eco-africa', 'eco-agriculture', 'eco-innovation'],
    required: true,
    unique: true
  },
  total_gdp: {
    type: String,
    default: '2.4T'
  },
  intra_african_trade: {
    type: String,
    default: '140B'
  },
  urbanization_rate: {
    type: String,
    default: '43'
  },
  population: {
    type: String,
    default: '1.3B'
  },
  workforce_percentage: {
    type: String,
    default: '42'
  },
  organic_growth: {
    type: String,
    default: '18'
  },
  yield_increase: {
    type: String,
    default: '30'
  },
  water_efficiency: {
    type: String,
    default: '45'
  },
  patent_increase: {
    type: String,
    default: '35'
  },
  renewable_energy_growth: {
    type: String,
    default: '300'
  },
  recycling_improvement: {
    type: String,
    default: '65'
  },
  wind_power_capacity: {
    type: String,
    default: '120MW'
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EconomySectionStats', EconomySectionStatsSchema);