const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  reviewer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing:    { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  transaction:{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, trim: true, default: '' },
  type:       { type: String, enum: ['buyer', 'seller'], default: 'seller' },
  isPublic:   { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
