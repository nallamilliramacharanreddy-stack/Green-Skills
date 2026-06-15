const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // assuming company is a User role
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String },
  hiringExperience: { type: Number, min: 1, max: 5 },
  workEnvironment: { type: Number, min: 1, max: 5 },
  isVerifiedHire: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
