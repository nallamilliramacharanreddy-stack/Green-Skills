const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateName: { type: String, required: true },
  courseName: { type: String, required: true },
  issueDate: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  pdfData: { type: String }, // Store PDF base64 persistently
  thumbnailData: { type: String }, // Store Thumbnail base64 persistently
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
