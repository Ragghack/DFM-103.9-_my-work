const mongoose = require('mongoose');

const BankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo_url: String,
  market_share: Number,
  assets: String,
  loan_growth: Number,
  digital_transactions_growth: Number,
  contact_info: {
    website: String,
    phone: String,
    headquarters: String
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Bank', BankSchema);