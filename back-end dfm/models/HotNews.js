const mongoose = require('mongoose');

const HotNewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  image_url: String,
  status: { type: String, enum: ['active','inactive'], default: 'active' },
  priority: { type: String, enum: ['high','medium','low'], default: 'medium' },
  expiry_date: Date,
  clicks_count: { type: Number, default: 0 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('HotNews', HotNewsSchema);
