const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: { 
    type: String, 
    enum: {
      values: ['admin', 'content_manager', 'editor'],
      message: 'Role must be admin, content_manager, or editor'
    },
    default: 'admin'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lockUntil: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number']
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'fr']
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  }
}, { 
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Set password changed timestamp
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token created after
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Reset login attempts on successful login
UserSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// Increment login attempts and lock account if needed
UserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart counting
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.resetLoginAttempts();
  }
  
  this.loginAttempts += 1;
  
  // Lock account for 30 minutes after 5 failed attempts
  if (this.loginAttempts >= 5 && !this.isLocked) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  }
  
  return this.save();
};

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (!isMatch) {
    await this.incrementLoginAttempts();
    return false;
  }
  
  // Reset attempts on successful login
  if (this.loginAttempts > 0 || this.isLocked) {
    await this.resetLoginAttempts();
  }
  
  return true;
};

// Check if password was changed after JWT was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
UserSchema.methods.createPasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Static method to find active users
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find by role
UserSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Query helper for recent users
UserSchema.query.recent = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where('createdAt').gte(date);
};

// Middleware to update lastLogin on login
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Virtual for user status
UserSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.isLocked) return 'locked';
  return 'active';
});

// Export the model
module.exports = mongoose.model('User', UserSchema);