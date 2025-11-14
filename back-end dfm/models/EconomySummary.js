const mongoose = require('mongoose');

const economySummarySchema = new mongoose.Schema({
  stockMarket: {
    type: String,
    default: '+3.2%'
  },
  inflation: {
    type: String,
    default: '2.3%'
  },
  currency: {
    type: String,
    default: '582.50'
  },
  businessRegistrations: {
    type: String,
    default: '+15%'
  },
  agriculture: {
    type: String,
    default: '+8%'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EconomySummary', economySummarySchema);