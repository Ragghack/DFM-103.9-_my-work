const mongoose = require('mongoose');
const slugify = require('slugify');

const EconomyArticleSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: { 
    type: String, 
    unique: true, 
    index: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  excerpt: { 
    type: String,
    maxlength: 300
  },
  section: {
    type: String,
    enum: ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation'],
    required: true
  },
  category: {
    type: String,
    enum: ['news', 'analysis', 'report', 'interview'],
    default: 'news'
  },
  author: { 
    type: String 
  },
  author_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  image_url: String,
  image_alt: String,
  tags: [String],
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  read_time: { 
    type: Number, 
    default: 5 
  },
  views_count: { 
    type: Number, 
    default: 0 
  },
  meta_title: String,
  meta_description: String
}, { 
  timestamps: true 
});

// Generate slug before saving
EconomyArticleSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Calculate read time before saving
EconomyArticleSchema.pre('save', function(next) {
  if (this.content && this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.read_time = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

module.exports = mongoose.model('EconomyArticle', EconomyArticleSchema);