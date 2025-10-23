const mongoose = require('mongoose');

const LiveStreamSchema = new mongoose.Schema({
  title: String,
  description: String,
  stream_url: String,
  status: { type: String, enum: ['offline','live','scheduled'], default: 'offline' },
  scheduled_sessions: [{ title: String, description: String, scheduled_time: Date, duration: Number }],
  settings: {
    allow_comments: { type: Boolean, default: true },
    record_stream: { type: Boolean, default: true },
    is_public: { type: Boolean, default: true }
  },
  current_viewers: { type: Number, default: 0 },
  total_views: { type: Number, default: 0 },
  started_at: Date,
  ended_at: Date,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('LiveStream', LiveStreamSchema);
