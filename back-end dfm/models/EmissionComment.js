const mongoose = require('mongoose');

const EmissionCommentSchema = new mongoose.Schema({
  emission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emission',
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

EmissionCommentSchema.index({ emission_id: 1, createdAt: -1 });

module.exports = mongoose.model('EmissionComment', EmissionCommentSchema);