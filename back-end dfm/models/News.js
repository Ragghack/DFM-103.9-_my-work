const mongoose = require('mongoose');
const slugify = require('slugify');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  content: { type: String, required: true },
  summary: { type: String },
  category: { type: String, enum: ['politics','economy','sports','entertainment','technology','other'], default: 'other' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [String],
  status: { type: String, enum: ['draft','published','scheduled'], default: 'draft' },
  isBreaking: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  tags: [String],
  location: { type: String },
  sources: [String],
  views: { type: Number, default: 0 },
  scheduleDate: { type: Date }
}, { timestamps: true });

NewsSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('News', NewsSchema);
