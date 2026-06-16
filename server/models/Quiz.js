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
    questionText: { type: String, required: true },
    options: [String],
    questionType: { type: String, enum: ['single', 'multiple', 'boolean', 'text'], default: 'single' },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(v) {
          if (v === undefined || v === null || v === '') return false;
          const type = this.questionType || 'single';
          if (type === 'single' || type === 'boolean') {
            if (this.options && this.options.includes(v)) return true;
            const idx = Number(v);
            return !isNaN(idx) && idx >= 0 && idx < this.options.length;
          }
          if (type === 'multiple') {
            if (Array.isArray(v)) {
              if (v.every(opt => this.options.includes(opt))) return true;
              return v.length > 0 && v.every(idx => {
                const n = Number(idx);
                return !isNaN(n) && n >= 0 && n < this.options.length;
              });
            }
            if (typeof v === 'string') {
              try {
                const parsed = JSON.parse(v);
                if (Array.isArray(parsed)) {
                  if (parsed.every(opt => this.options.includes(opt))) return true;
                  return parsed.length > 0 && parsed.every(idx => {
                    const n = Number(idx);
                    return !isNaN(n) && n >= 0 && n < this.options.length;
                  });
                }
              } catch (e) {
                const parts = v.split(',').map(part => part.trim());
                if (parts.every(opt => this.options.includes(opt))) return true;
                return parts.length > 0 && parts.every(part => {
                  const n = Number(part);
                  return !isNaN(n) && n >= 0 && n < this.options.length;
                });
              }
            }
            return false;
          }
          if (type === 'text') {
            if (typeof v === 'string') return v.trim().length > 0;
            if (Array.isArray(v)) return v.length > 0 && v.every(str => typeof str === 'string' && str.trim().length > 0);
            return false;
          }
          return true;
        },
        message: 'A valid correctAnswer is required'
      }
    },
    explanation: String
  }],
  duration: { type: Number, default: 15 }, // in minutes
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

quizSchema.pre('save', async function() {
  if (this.isModified('questions')) {
    const { checkForDuplicates } = require('../utils/duplicateChecker');
    await checkForDuplicates(this.questions, this._id, 'Quiz');
  }
});

module.exports = mongoose.model('Quiz', quizSchema);
