
const mongoose = require('mongoose');

const EmissionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: "" // Made optional with default value
  },
  duration: {
    type: String,
    required: true
  },
  audio_url: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['economy', 'finance', 'agriculture', 'interview', 'politics', 'technology', 'news'] // Fixed enum values
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  publish_date: {
    type: Date,
    default: Date.now
  },
  guest_speakers: [{
    name: String,
    role: String,
    avatar: String
  }],
  key_topics: [String],
  views: {
    type: Number,
    default: 0
  },
  comments_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
EmissionSchema.index({ status: 1, publish_date: -1 });
EmissionSchema.index({ featured: 1, status: 1 });
EmissionSchema.index({ category: 1 });

module.exports = mongoose.model('Emission', EmissionSchema);
