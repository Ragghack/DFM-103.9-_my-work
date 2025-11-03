const mongoose = require('mongoose');

const BudgetDataSchema = new mongoose.Schema({
  total_budget: String,
  education_allocation: Number,
  healthcare_allocation: Number,
  infrastructure_allocation: Number,
  defense_allocation: Number,
  revenue_sources: {
    tax_revenue: Number,
    oil_gas: Number,
    grants_aid: Number,
    other_sources: Number
  },
  investment_initiatives: [{
    title: String,
    description: String,
    amount: String,
    status: { type: String, enum: ['active', 'completed', 'planned'], default: 'active' },
    start_date: Date,
    end_date: Date
  }],
  expires_at: Date, // For automatic expiration
  fiscal_year: String,
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('BudgetData', BudgetDataSchema);