const mongoose = require('mongoose');

const BankProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  bank_name: { type: String, required: true },
  amount: String,
  duration: String,
  status: { 
    type: String, 
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  image_url: String,
  start_date: Date,
  end_date: Date,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('BankProject', BankProjectSchema);