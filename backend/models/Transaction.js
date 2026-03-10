const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  seller:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  price:   { type: Number, required: true },
  type:    { type: String, enum: ['sale', 'exchange'], default: 'sale' },
  status:  { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
