const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  excerpt: String,
  author: { type: String },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, enum: ['economy','finance','agriculture','energy','innovation','other'], default: 'other' },
  image_url: String,
  tags: [String],
  status: { type: String, enum: ['draft','published','archived'], default: 'draft' },
  publish_date: Date,
  featured: { type: Boolean, default: false },
  read_time: Number,
  views_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Article', ArticleSchema);
