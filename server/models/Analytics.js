const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  eventType: { 
    type: String, 
    required: true, 
    enum: ['page_view', 'course_started', 'course_completed', 'job_applied', 'login', 'quiz_taken', 'chat_interaction'] 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Flexible data based on eventType
  timestamp: { type: Date, default: Date.now },
  device: { type: String }, // e.g., 'mobile', 'desktop'
  ipAddress: { type: String }
});

// Index for fast querying on common analytics dimensions
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
