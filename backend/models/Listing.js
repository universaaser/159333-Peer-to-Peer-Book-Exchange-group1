const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  condition: { type: String, enum: ['New', 'Like New', 'Good', 'Fair'], required: true },
  images: [{ type: String }],
  course: { type: String, trim: true },
  subject: { type: String, trim: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'sold', 'reserved'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Listing', ListingSchema);