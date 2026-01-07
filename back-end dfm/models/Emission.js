const mongoose = require('mongoose');

const EmissionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: 10,
    maxlength: 2000
  },
  content: {
    type: String,
    default: "Content coming soon..."
  },
  duration: {
    type: String,
    default: "00:00"
  },
  audio_url: {
    type: String,
    default: ""
  },
  thumbnail: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    enum: ['economy', 'finance', 'agriculture', 'interview', 'politics', 'technology', 'news'],
    default: 'news'
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
  key_topics: {
    type: [String],
    default: ["Current Events", "Market Analysis", "Expert Insights"]
  },
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

// Create indexes
EmissionSchema.index({ status: 1, publish_date: -1 });
EmissionSchema.index({ featured: 1, status: 1 });
EmissionSchema.index({ category: 1 });
EmissionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Emission', EmissionSchema);