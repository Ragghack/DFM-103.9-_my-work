const mongoose = require('mongoose');

const hotNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  link: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
hotNewsSchema.index({ status: 1, expiryDate: 1, priority: -1 });

module.exports = mongoose.model('HotNews', hotNewsSchema);