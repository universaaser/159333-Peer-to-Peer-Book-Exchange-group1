const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  materialType: { type: String, default: 'Textbook', trim: true },
  price: { type: Number, required: true },
  condition: { type: String, enum: ['New', 'Like New', 'Good', 'Fair'], required: true },
  availability: { type: String, enum: ['pending', 'available', 'reserved', 'sold', 'removed'], default: 'pending' },
  images: [{ type: String }],
  course: { type: String, trim: true },
  subject: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'available', 'sold', 'reserved', 'removed'], default: 'pending' },
  views: { type: Number, default: 0 },
  recommendScore: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '', trim: true }
}, { timestamps: true });

ListingSchema.index({ title: 'text', description: 'text', course: 'text', subject: 'text' });
ListingSchema.index({ course: 1, subject: 1, status: 1, condition: 1, price: 1 });

ListingSchema.methods.incrementViews = function() {
  this.views += 1;
};

module.exports = mongoose.model('Listing', ListingSchema);
