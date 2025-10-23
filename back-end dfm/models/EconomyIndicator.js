const mongoose = require('mongoose');

const EconomyIndicatorSchema = new mongoose.Schema({
  gdp_growth: Number,
  industrial_growth: Number,
  unemployment_rate: Number,
  inflation_rate: Number,
  period: String,
  year: Number,
  quarter: Number,
  source: String,
  last_updated: { type: Date, default: Date.now },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EconomyIndicator', EconomyIndicatorSchema);
