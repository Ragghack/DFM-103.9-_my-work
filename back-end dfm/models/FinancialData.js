const mongoose = require('mongoose');

const FinancialDataSchema = new mongoose.Schema({
  stock_market_growth: Number,
  interest_rate: Number,
  credit_growth: Number,
  period: String,
  year: Number,
  month: Number,
  last_updated: { type: Date, default: Date.now },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FinancialData', FinancialDataSchema);
