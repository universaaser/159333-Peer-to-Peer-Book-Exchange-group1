const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  listing:      { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  seller:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  price:        { type: Number, required: true },
  type:         { type: String, enum: ['sale', 'exchange'], default: 'sale' },
  status:       { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  contactShared:{ type: Boolean, default: false },
  paymentMethod:{ type: String, default: 'cash' },
  notes:        { type: String, trim: true, default: '' },
  isDisputed:   { type: Boolean, default: false },
  disputeReason:{ type: String, trim: true, default: '' }
}, { timestamps: true });

TransactionSchema.index({ listing: 1, buyer: 1, seller: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
