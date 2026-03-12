const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reason: { type: String, required: true, trim: true },
  details: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['open', 'reviewing', 'closed'], default: 'open' },
  adminNote: { type: String, trim: true, default: '' }
}, { timestamps: true });

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedUser: 1, listing: 1 });

module.exports = mongoose.model('Report', ReportSchema);
