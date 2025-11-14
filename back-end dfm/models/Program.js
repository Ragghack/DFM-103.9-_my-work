const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  host: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['economy', 'finance', 'agriculture', 'technology', 'business', 'interview']
  },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'future', 'inactive'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  reminderSettings: {
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Index for efficient queries
programSchema.index({ status: 1, startDate: 1 });
programSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Program', programSchema);