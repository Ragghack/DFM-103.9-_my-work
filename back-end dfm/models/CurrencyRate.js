const mongoose = require('mongoose');

const CurrencyRateSchema = new mongoose.Schema({
  currency: { type: String, required: true },
  code: { type: String, required: true },
  value: { type: Number, required: true },
  change: { type: Number, default: 0 },
  change_percentage: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CurrencyRate', CurrencyRateSchema);