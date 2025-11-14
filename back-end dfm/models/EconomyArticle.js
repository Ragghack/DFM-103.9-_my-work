const mongoose = require('mongoose');
const slugify = require('slugify');

const EconomyArticleSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Article title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: { 
    type: String, 
    unique: true, 
    index: true,
    sparse: true
  },
  content: { 
    type: String, 
    required: [true, 'Article content is required'],
    minlength: [100, 'Content must be at least 100 characters long']
  },
  excerpt: { 
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    trim: true
  },
  section: {
    type: String,
    enum: {
      values: ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation'],
      message: 'Section must be one of: economy, eco-africa, eco-agriculture, eco-innovation'
    },
    required: [true, 'Section is required']
  },
  category: {
    type: String,
    enum: {
      values: ['news', 'analysis', 'report', 'interview'],
      message: 'Category must be one of: news, analysis, report, interview'
    },
    default: 'news'
  },
  author: { 
    type: String,
    default: 'DFM Media',
    trim: true
  },
  author_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Author ID is required']
  },
  image_url: {
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true; // Optional field
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      },
      message: 'Image URL must be a valid URL or path starting with http://, https://, or /'
    },
    trim: true
  },
  image_alt: {
    type: String,
    maxlength: [125, 'Image alt text cannot exceed 125 characters'],
    trim: true,
    default: ''
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 10; // Maximum 10 tags
      },
      message: 'Cannot have more than 10 tags'
    },
    default: []
  },
  status: { 
    type: String, 
    enum: {
      values: ['draft', 'published', 'archived'],
      message: 'Status must be one of: draft, published, archived'
    }, 
    default: 'draft' 
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  read_time: { 
    type: Number, 
    default: 5,
    min: [1, 'Read time must be at least 1 minute']
  },
  views_count: { 
    type: Number, 
    default: 0,
    min: [0, 'Views count cannot be negative']
  },
  likes_count: {
    type: Number,
    default: 0,
    min: [0, 'Likes count cannot be negative']
  },
  shares_count: {
    type: Number,
    default: 0,
    min: [0, 'Shares count cannot be negative']
  },
  meta_title: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
    trim: true
  },
  meta_description: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
    trim: true
  },
  published_at: {
    type: Date,
    default: null
  },
  scheduled_publish: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
EconomyArticleSchema.index({ section: 1, status: 1, published_at: -1 });
EconomyArticleSchema.index({ featured: 1, status: 1, published_at: -1 });
EconomyArticleSchema.index({ category: 1, status: 1 });
EconomyArticleSchema.index({ tags: 1 });
EconomyArticleSchema.index({ 'createdAt': -1 });
EconomyArticleSchema.index({ status: 1, scheduled_publish: 1 });

// Generate slug before saving with collision handling
EconomyArticleSchema.pre('save', async function(next) {
  try {
    // Only generate slug if title is modified or slug doesn't exist
    if (this.isModified('title') || !this.slug) {
      let baseSlug = slugify(this.title, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g,
        locale: 'en'
      });
      
      // Check for existing slugs and append counter if needed
      let slug = baseSlug;
      let counter = 1;
      let existingArticle = null;
      
      do {
        existingArticle = await mongoose.models.EconomyArticle.findOne({ 
          slug, 
          _id: { $ne: this._id } // Exclude current document when updating
        });
        
        if (existingArticle) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      } while (existingArticle && counter < 100); // Safety limit
      
      this.slug = slug;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-generate excerpt if not provided
EconomyArticleSchema.pre('save', function(next) {
  // Generate excerpt from content if not provided
  if ((!this.excerpt || this.isModified('content')) && this.content) {
    // Remove HTML tags and create excerpt
    const plainText = this.content.replace(/<[^>]*>/g, '');
    const words = plainText.split(/\s+/);
    
    // Take first 40 words or less
    let excerpt = words.slice(0, 40).join(' ');
    if (words.length > 40) {
      excerpt += '...';
    }
    
    // Ensure excerpt doesn't exceed maxlength
    if (excerpt.length > 300) {
      excerpt = excerpt.substring(0, 297) + '...';
    }
    
    this.excerpt = excerpt;
  }
  
  next();
});

// Calculate read time before saving
EconomyArticleSchema.pre('save', function(next) {
  if (this.content && this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.read_time = Math.max(1, Math.ceil(wordCount / wordsPerMinute)); // At least 1 minute
  }
  next();
});

// Handle published_at date based on status
EconomyArticleSchema.pre('save', function(next) {
  // Set published_at when status changes to 'published'
  if (this.isModified('status') && this.status === 'published' && !this.published_at) {
    this.published_at = new Date();
  }
  
  // Clear published_at if article is unpublished
  if (this.isModified('status') && this.status !== 'published' && this.published_at) {
    this.published_at = null;
  }
  
  next();
});

// Auto-generate meta fields if not provided
EconomyArticleSchema.pre('save', function(next) {
  // Generate meta_title from title if not provided
  if (!this.meta_title && this.title) {
    this.meta_title = this.title.substring(0, 60);
  }
  
  // Generate meta_description from excerpt if not provided
  if (!this.meta_description && this.excerpt) {
    this.meta_description = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Virtual for formatted published date
EconomyArticleSchema.virtual('formatted_published_date').get(function() {
  if (!this.published_at) return null;
  return this.published_at.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for is_scheduled
EconomyArticleSchema.virtual('is_scheduled').get(function() {
  return this.scheduled_publish && this.scheduled_publish > new Date();
});

// Virtual for is_published
EconomyArticleSchema.virtual('is_published').get(function() {
  return this.status === 'published' && 
         (!this.scheduled_publish || this.scheduled_publish <= new Date());
});

// Instance method to increment views
EconomyArticleSchema.methods.incrementViews = function() {
  this.views_count += 1;
  return this.save();
};

// Instance method to increment likes
EconomyArticleSchema.methods.incrementLikes = function() {
  this.likes_count += 1;
  return this.save();
};

// Instance method to increment shares
EconomyArticleSchema.methods.incrementShares = function() {
  this.shares_count += 1;
  return this.save();
};

// Static method to get featured articles
EconomyArticleSchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    featured: true,
    status: 'published',
    $or: [
      { scheduled_publish: null },
      { scheduled_publish: { $lte: new Date() } }
    ]
  })
  .sort({ published_at: -1 })
  .limit(limit)
  .exec();
};

// Static method to get articles by section
EconomyArticleSchema.statics.getBySection = function(section, limit = 10, page = 1) {
  const skip = (page - 1) * limit;
  
  return this.find({
    section,
    status: 'published',
    $or: [
      { scheduled_publish: null },
      { scheduled_publish: { $lte: new Date() } }
    ]
  })
  .sort({ published_at: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

// Static method to get trending articles
EconomyArticleSchema.statics.getTrending = function(limit = 5) {
  return this.find({
    status: 'published',
    $or: [
      { scheduled_publish: null },
      { scheduled_publish: { $lte: new Date() } }
    ]
  })
  .sort({ views_count: -1, likes_count: -1 })
  .limit(limit)
  .exec();
};

// Static method to process scheduled publications
EconomyArticleSchema.statics.processScheduled = function() {
  return this.updateMany(
    {
      status: 'published',
      scheduled_publish: { $lte: new Date() }
    },
    {
      $set: { published_at: new Date() },
      $unset: { scheduled_publish: 1 }
    }
  );
};

// Ensure virtual fields are serialized
EconomyArticleSchema.set('toJSON', { virtuals: true });
EconomyArticleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EconomyArticle', EconomyArticleSchema);