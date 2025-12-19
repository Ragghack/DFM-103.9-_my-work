const mongoose = require('mongoose');

const LiveStreamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'DFM Media Studio'
  },
  description: {
    type: String,
    default: 'Watch our live studio sessions, interviews, and behind-the-scenes content.'
  },
  stream_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['offline', 'live', 'scheduled'],
    default: 'offline'
  },
  current_viewers: {
    type: Number,
    default: 0
  },
  total_views: {
    type: Number,
    default: 0
  },
  scheduled_sessions: [{
    title: String,
    description: String,
    scheduled_time: Date,
    duration: Number,
    guest_speakers: [{
      name: String,
      role: String
    }]
  }],
  studio_personnel: [{
    name: String,
    role: String,
    avatar: String,
    is_active: Boolean
  }],
  settings: {
    allow_comments: { type: Boolean, default: true },
    record_stream: { type: Boolean, default: true },
    is_public: { type: Boolean, default: true }
  },
  started_at: Date,
  ended_at: Date
}, { 
  timestamps: true 
});

module.exports = mongoose.model('LiveStream', LiveStreamSchema);