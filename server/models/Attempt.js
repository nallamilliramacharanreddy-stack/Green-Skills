const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  lessonIndex: { type: Number },
  questions: [{
    questionText: String,
    options: [String],
    questionType: String,
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    dbQuestionId: String
  }],
  userAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
  startedAt: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Attempt', attemptSchema);
