const mongoose = require('mongoose');

const EconomyIndicatorSchema = new mongoose.Schema({
  gdp_growth: { 
    type: Number, 
    required: true 
  },
  industrial_growth: { 
    type: Number, 
    required: true 
  },
  unemployment_rate: { 
    type: Number, 
    required: true 
  },
  inflation_rate: { 
    type: Number, 
    required: true 
  },
  period: { 
    type: String, 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  quarter: { 
    type: Number 
  },
  source: { 
    type: String, 
    default: 'National Statistics Institute' 
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

// Index for efficient queries
EconomyIndicatorSchema.index({ year: -1, quarter: -1 });

module.exports = mongoose.model('EconomyIndicator', EconomyIndicatorSchema);