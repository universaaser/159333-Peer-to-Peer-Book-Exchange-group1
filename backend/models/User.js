const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bio: { type: String, default: '' },
  contactInfo: { type: String, default: '' },
  favorites: [{ type: String, trim: true }],
  rating: { type: Number, default: 0 },
  ratingTotal: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Helper to update running average when a new review is submitted.
UserSchema.methods.updateRating = function(newRating) {
  const totalScore = this.ratingTotal + newRating;
  const totalCount = this.reviewCount + 1;
  this.ratingTotal = totalScore;
  this.reviewCount = totalCount;
  this.rating = totalCount ? parseFloat((totalScore / totalCount).toFixed(2)) : 0;
  this.lastActiveAt = new Date();
};

module.exports = mongoose.model('User', UserSchema);
