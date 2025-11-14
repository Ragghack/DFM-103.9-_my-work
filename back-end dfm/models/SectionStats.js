const mongoose = require('mongoose');

const sectionStatsSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation']
  },
  total_gdp: String,
  intra_african_trade: String,
  urbanization_rate: String,
  population: String,
  workforce_percentage: String,
  organic_growth: String,
  yield_increase: String,
  water_efficiency: String,
  patent_increase: String,
  renewable_energy_growth: String,
  recycling_improvement: String,
  wind_power_capacity: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SectionStats', sectionStatsSchema);