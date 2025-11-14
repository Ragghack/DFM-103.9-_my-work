const mongoose = require('mongoose');

const EconomyIndicatorSchema = new mongoose.Schema({
  gdp_growth: { 
    type: mongoose.Schema.Types.Mixed,
    default: 3.2,
    validate: {
      validator: function(value) {
        // Allow numbers or strings that can be converted to numbers
        if (typeof value === 'number') {
          return value >= -100 && value <= 100; // Reasonable range for GDP growth
        }
        if (typeof value === 'string') {
          const num = parseFloat(value.replace('%', ''));
          return !isNaN(num) && num >= -100 && num <= 100;
        }
        return false;
      },
      message: 'GDP growth must be a number between -100 and 100'
    }
  },
  industrial_growth: { 
    type: mongoose.Schema.Types.Mixed,
    default: 4.5,
    validate: {
      validator: function(value) {
        if (typeof value === 'number') {
          return value >= -100 && value <= 500; // Industrial growth can be higher
        }
        if (typeof value === 'string') {
          const num = parseFloat(value.replace('%', ''));
          return !isNaN(num) && num >= -100 && num <= 500;
        }
        return false;
      },
      message: 'Industrial growth must be a number between -100 and 500'
    }
  },
  unemployment_rate: { 
    type: mongoose.Schema.Types.Mixed,
    default: 5.8,
    validate: {
      validator: function(value) {
        if (typeof value === 'number') {
          return value >= 0 && value <= 100; // Unemployment rate 0-100%
        }
        if (typeof value === 'string') {
          const num = parseFloat(value.replace('%', ''));
          return !isNaN(num) && num >= 0 && num <= 100;
        }
        return false;
      },
      message: 'Unemployment rate must be a number between 0 and 100'
    }
  },
  inflation_rate: { 
    type: mongoose.Schema.Types.Mixed,
    default: 2.1,
    validate: {
      validator: function(value) {
        if (typeof value === 'number') {
          return value >= -50 && value <= 1000; // Allow for hyperinflation edge cases
        }
        if (typeof value === 'string') {
          const num = parseFloat(value.replace('%', ''));
          return !isNaN(num) && num >= -50 && num <= 1000;
        }
        return false;
      },
      message: 'Inflation rate must be a number between -50 and 1000'
    }
  },
  interest_rate: {
    type: mongoose.Schema.Types.Mixed,
    default: 3.5,
    validate: {
      validator: function(value) {
        if (typeof value === 'number') {
          return value >= 0 && value <= 50;
        }
        if (typeof value === 'string') {
          const num = parseFloat(value.replace('%', ''));
          return !isNaN(num) && num >= 0 && num <= 50;
        }
        return false;
      },
      message: 'Interest rate must be a number between 0 and 50'
    }
  },
  currency_stability: {
    type: mongoose.Schema.Types.Mixed,
    default: 582.50,
    validate: {
      validator: function(value) {
        if (typeof value === 'number') {
          return value > 0;
        }
        if (typeof value === 'string') {
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        }
        return false;
      },
      message: 'Currency stability must be a positive number'
    }
  },
  period: { 
    type: String, 
    default: () => {
      const now = new Date();
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      return `Q${quarter} ${now.getFullYear()}`;
    },
    enum: {
      values: ['Monthly', 'Quarterly', 'Annual', 'Current'],
      message: 'Period must be one of: Monthly, Quarterly, Annual, Current'
    }
  },
  year: { 
    type: Number, 
    default: () => new Date().getFullYear(),
    min: [2000, 'Year must be 2000 or later'],
    max: [2030, 'Year cannot be beyond 2030']
  },
  quarter: { 
    type: Number,
    default: () => Math.ceil((new Date().getMonth() + 1) / 3),
    min: [1, 'Quarter must be between 1 and 4'],
    max: [4, 'Quarter must be between 1 and 4']
  },
  month: {
    type: Number,
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12'],
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional
        return value >= 1 && value <= 12;
      },
      message: 'Month must be a number between 1 and 12'
    }
  },
  source: { 
    type: String, 
    default: 'National Statistics Institute',
    enum: {
      values: [
        'National Statistics Institute',
        'Central Bank',
        'World Bank',
        'IMF',
        'African Development Bank',
        'Ministry of Economy',
        'Custom Research'
      ],
      message: 'Invalid source provided'
    }
  },
  reliability_score: {
    type: Number,
    default: 85,
    min: [0, 'Reliability score cannot be negative'],
    max: [100, 'Reliability score cannot exceed 100']
  },
  last_updated: { 
    type: Date, 
    default: Date.now 
  },
  updated_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Updated by user ID is required']
  },
  is_forecast: {
    type: Boolean,
    default: false
  },
  forecast_period: {
    type: String,
    enum: ['1-month', '3-month', '6-month', '1-year', '2-year', '5-year'],
    default: '1-year'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  region: {
    type: String,
    default: 'National',
    enum: {
      values: ['National', 'Urban', 'Rural', 'Northern', 'Southern', 'Eastern', 'Western', 'Central'],
      message: 'Invalid region specified'
    }
  },
  sector: {
    type: String,
    enum: {
      values: [
        'Overall',
        'Agriculture',
        'Manufacturing',
        'Services',
        'Technology',
        'Construction',
        'Mining',
        'Tourism',
        'Financial'
      ],
      message: 'Invalid sector specified'
    },
    default: 'Overall'
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
EconomyIndicatorSchema.index({ year: -1, quarter: -1 });
EconomyIndicatorSchema.index({ period: 1, year: -1 });
EconomyIndicatorSchema.index({ is_forecast: 1, forecast_period: 1 });
EconomyIndicatorSchema.index({ sector: 1, region: 1 });
EconomyIndicatorSchema.index({ 'createdAt': -1 });
EconomyIndicatorSchema.index({ source: 1, reliability_score: -1 });

// Enhanced pre-save middleware for data normalization
EconomyIndicatorSchema.pre('save', function(next) {
  const numberFields = [
    'gdp_growth', 
    'industrial_growth', 
    'unemployment_rate', 
    'inflation_rate',
    'interest_rate',
    'currency_stability'
  ];
  
  numberFields.forEach(field => {
    if (this[field] !== undefined && this[field] !== null) {
      if (typeof this[field] === 'string') {
        // Remove percentage signs, commas, and convert to number
        const cleanValue = String(this[field])
          .replace('%', '')
          .replace(',', '')
          .trim();
        
        const numValue = parseFloat(cleanValue);
        this[field] = isNaN(numValue) ? this.getDefaultValue(field) : numValue;
      }
      
      // Round to 2 decimal places for consistency
      if (typeof this[field] === 'number') {
        this[field] = Math.round(this[field] * 100) / 100;
      }
    }
  });
  
  // Ensure quarter is valid (1-4)
  if (this.quarter && (this.quarter < 1 || this.quarter > 4)) {
    this.quarter = Math.ceil((new Date().getMonth() + 1) / 3);
  }
  
  // Auto-generate period string if not provided
  if (!this.period || this.isModified('year') || this.isModified('quarter')) {
    this.generatePeriodString();
  }
  
  // Update last_updated timestamp
  this.last_updated = new Date();
  
  next();
});

// Pre-validate middleware for data consistency
EconomyIndicatorSchema.pre('validate', function(next) {
  // Validate quarter-month consistency
  if (this.month && this.quarter) {
    const expectedQuarter = Math.ceil(this.month / 3);
    if (this.quarter !== expectedQuarter) {
      this.invalidate('quarter', `Quarter ${this.quarter} does not match month ${this.month}`);
    }
  }
  
  // Validate year is not in future for non-forecast data
  if (!this.is_forecast && this.year > new Date().getFullYear()) {
    this.invalidate('year', 'Year cannot be in future for non-forecast data');
  }
  
  next();
});

// Instance method to generate period string
EconomyIndicatorSchema.methods.generatePeriodString = function() {
  if (this.period && !this.isModified('period')) return;
  
  if (this.month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    this.period = `${monthNames[this.month - 1]} ${this.year}`;
  } else if (this.quarter) {
    this.period = `Q${this.quarter} ${this.year}`;
  } else {
    this.period = `Annual ${this.year}`;
  }
};

// Instance method to get default value for a field
EconomyIndicatorSchema.methods.getDefaultValue = function(field) {
  const defaults = {
    gdp_growth: 3.2,
    industrial_growth: 4.5,
    unemployment_rate: 5.8,
    inflation_rate: 2.1,
    interest_rate: 3.5,
    currency_stability: 582.50
  };
  return defaults[field] || 0;
};

// Instance method to format value for display
EconomyIndicatorSchema.methods.formatValue = function(field, includeSymbol = true) {
  const value = this[field];
  if (value === undefined || value === null) return 'N/A';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return 'N/A';
  
  const percentageFields = ['gdp_growth', 'industrial_growth', 'unemployment_rate', 'inflation_rate', 'interest_rate'];
  
  if (percentageFields.includes(field)) {
    return includeSymbol ? `${numericValue}%` : numericValue.toString();
  }
  
  return numericValue.toString();
};

// Instance method to check if data is current (within last 90 days)
EconomyIndicatorSchema.methods.isCurrent = function() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  return this.last_updated >= ninetyDaysAgo;
};

// Instance method to get trend direction
EconomyIndicatorSchema.methods.getTrend = function(previousIndicator, field) {
  if (!previousIndicator || !this[field] || !previousIndicator[field]) {
    return 'stable';
  }
  
  const current = typeof this[field] === 'string' ? parseFloat(this[field]) : this[field];
  const previous = typeof previousIndicator[field] === 'string' ? parseFloat(previousIndicator[field]) : previousIndicator[field];
  
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
};

// Static method to get latest indicators
EconomyIndicatorSchema.statics.getLatest = function() {
  return this.findOne()
    .sort({ year: -1, quarter: -1, month: -1, createdAt: -1 })
    .exec();
};

// Static method to get indicators by period
EconomyIndicatorSchema.statics.getByPeriod = function(year, quarter = null, month = null) {
  const query = { year };
  
  if (quarter) query.quarter = quarter;
  if (month) query.month = month;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .exec();
};

// Static method to get historical data for a field
EconomyIndicatorSchema.statics.getHistorical = function(field, limit = 12) {
  return this.find({ 
    [field]: { $exists: true, $ne: null },
    is_forecast: false 
  })
  .select(`year quarter month ${field} period last_updated`)
  .sort({ year: -1, quarter: -1, month: -1 })
  .limit(limit)
  .exec();
};

// Static method to get forecasts
EconomyIndicatorSchema.statics.getForecasts = function(forecastPeriod = '1-year') {
  return this.find({
    is_forecast: true,
    forecast_period: forecastPeriod
  })
  .sort({ year: 1, quarter: 1 })
  .exec();
};

// Static method to calculate averages
EconomyIndicatorSchema.statics.calculateAverages = function(year, quarter = null) {
  const query = { 
    year, 
    is_forecast: false 
  };
  
  if (quarter) query.quarter = quarter;
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avg_gdp_growth: { $avg: '$gdp_growth' },
        avg_industrial_growth: { $avg: '$industrial_growth' },
        avg_unemployment_rate: { $avg: '$unemployment_rate' },
        avg_inflation_rate: { $avg: '$inflation_rate' },
        avg_interest_rate: { $avg: '$interest_rate' },
        count: { $sum: 1 }
      }
    }
  ]).exec();
};

// Static method to get indicators by reliability
EconomyIndicatorSchema.statics.getByReliability = function(minScore = 80) {
  return this.find({
    reliability_score: { $gte: minScore },
    is_forecast: false
  })
  .sort({ reliability_score: -1, last_updated: -1 })
  .exec();
};

// Virtual for formatted period display
EconomyIndicatorSchema.virtual('formatted_period').get(function() {
  if (this.month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[this.month - 1]} ${this.year}`;
  } else if (this.quarter) {
    return `Q${this.quarter} ${this.year}`;
  }
  return this.period || `Annual ${this.year}`;
});

// Virtual for data age in days
EconomyIndicatorSchema.virtual('data_age_days').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.last_updated);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for data freshness status
EconomyIndicatorSchema.virtual('freshness_status').get(function() {
  const age = this.data_age_days;
  if (age <= 7) return 'very-fresh';
  if (age <= 30) return 'fresh';
  if (age <= 90) return 'moderate';
  return 'stale';
});

// Ensure virtual fields are serialized
EconomyIndicatorSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Format numbers for display in API responses
    const percentageFields = ['gdp_growth', 'industrial_growth', 'unemployment_rate', 'inflation_rate', 'interest_rate'];
    percentageFields.forEach(field => {
      if (ret[field] !== undefined && ret[field] !== null) {
        ret[`${field}_formatted`] = doc.formatValue(field, true);
        ret[`${field}_raw`] = typeof ret[field] === 'string' ? parseFloat(ret[field]) : ret[field];
      }
    });
    return ret;
  }
});

EconomyIndicatorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EconomyIndicator', EconomyIndicatorSchema);