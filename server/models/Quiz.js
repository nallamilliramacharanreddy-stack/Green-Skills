const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  youtubeLink: { type: String },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  lessonId: { type: mongoose.Schema.Types.ObjectId },
  isPublished: { type: Boolean, default: false },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number, // Index of options
    explanation: String
  }],
  duration: { type: Number, default: 15 }, // in minutes
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
