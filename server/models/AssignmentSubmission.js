const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: String, required: true },
  essayContent: { type: String, required: true },
  wordCount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Pending', 'Reviewed', 'Approved', 'Needs Revision'],
    default: 'Draft'
  },
  adminFeedback: { type: String, default: '' },
  score: { type: Number },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
