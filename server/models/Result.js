const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  duration: { type: Number }, // in seconds
  trustScore: { type: Number, default: 100 },
  warnings: { type: Number, default: 0 },
  status: { type: String, enum: ['Pass', 'Fail'], default: 'Fail' },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  notAttemptedCount: { type: Number, default: 0 },
  submissionType: { 
    type: String, 
    enum: ['Normal Submission', 'Time Expired Submission', 'Auto Submission Due To Violations'], 
    default: 'Normal Submission' 
  },
  violationTimeline: [{
    timestamp: String,
    type: String,
    description: String,
    severity: String
  }],
  autoSubmitReason: String,
  screenshots: [String],
  screenActivityLog: [{
    timestamp: String,
    event: String,
    severity: String
  }],
  audioActivityLog: [{
    timestamp: String,
    event: String,
    severity: String
  }],
  objectDetectionLog: [{
    timestamp: String,
    event: String,
    severity: String
  }],
  aiSuspicionScore: { type: Number, default: 0 },
  answers: [{
    questionIndex: Number,
    candidateAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timeTaken: Number,
    violationCountDuringQuestion: Number
  }],
  videoRecordingUrl: String,
  screenRecordingUrl: String,
  audioRecordingUrl: String,
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
