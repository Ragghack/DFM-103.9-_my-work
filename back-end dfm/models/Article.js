// models/Article.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 300
  },
  category: {
    type: String,
    required: true,
    enum: ['economy', 'finance', 'agriculture', 'energy', 'innovation', 'other']
  },
  featured: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image_url: {
    type: String,
    default: null
  },
  image_alt: {
    type: String,
    default: ''
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  scheduled_publish: {
    type: Date,
    default: null
  },
  meta_title: {
    type: String,
    trim: true,
    maxlength: 60
  },
  meta_description: {
    type: String,
    trim: true,
    maxlength: 160
  }
}, {
  timestamps: true
});

// Index for better performance
articleSchema.index({ category: 1, featured: 1, createdAt: -1 });
articleSchema.index({ status: 1, scheduled_publish: 1 });
articleSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Virtual for comment count
articleSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for like count
articleSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if user liked the article
articleSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Pre-save middleware to generate excerpt if not provided
articleSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.substring(0, 200) + '...';
  }
  next();
});

module.exports = mongoose.model('Article', articleSchema);