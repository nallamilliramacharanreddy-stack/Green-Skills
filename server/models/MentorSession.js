const mongoose = require('mongoose');

const mentorSessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  meetingLink: { type: String },
  topic: { type: String },
  notes: { type: String },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MentorSession', mentorSessionSchema);
