const mongoose = require('mongoose');

const FinanceArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: String,
  category: { 
    type: String, 
    enum: ['bank', 'budget', 'project', 'financial-update', 'market-trends', 'investment'],
    required: true 
  },
  image_url: String,
  image_alt: String,
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  featured: { type: Boolean, default: false },
  tags: [String],
  slug: { type: String, unique: true },
  views: { type: Number, default: 0 }
}, { timestamps: true });

// Generate slug before saving
FinanceArticleSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  next();
});

module.exports = mongoose.model('FinanceArticle', FinanceArticleSchema);