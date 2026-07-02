const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, default: 'Green Skill' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' },
  duration: String,
  skillTags: [String],
  thumbnail: String,
  coverImage: String,
  lessons: [{
    moduleTitle: { type: String, required: true },
    title: { type: String, required: true },
    videoSource: { type: String, enum: ['youtube', 'direct', 'upload'], default: 'youtube' },
    youtubeLink: { type: String },
    directVideoUrl: { type: String },
    directVideoPublicId: { type: String, default: '' },
    duration: { type: String, default: '10:00' },
    isMandatory: { type: Boolean, default: false },
    // AI Video Engine Fields
    youtube_video_id: { type: String },
    internalVideoUrl: { type: String },
    internalVideoPublicId: { type: String, default: '' },
    thumbnail_url: { type: String },
    file_size: { type: Number },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'uploading'], default: 'pending' },
    processed_at: { type: Date },
    // AI Translation Engine Fields
    audioTracks: [{
      language: { type: String },
      languageCode: { type: String },
      url: { type: String },
      status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] }
    }],
    subtitles: [{
      language: { type: String },
      languageCode: { type: String },
      url: { type: String }
    }],
    quiz: [{
      question: { type: String, required: true },
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
              return this.options && this.options.includes(v);
            }
            if (type === 'multiple') {
              if (Array.isArray(v)) {
                return v.length > 0 && v.every(opt => this.options.includes(opt));
              }
              if (typeof v === 'string') {
                return this.options.includes(v);
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
    }]
  }],
  tasks: [{
    title: String,
    description: String,
    type: { type: String, default: 'Assignment' }
  }],
  quiz: [{
    question: { type: String, required: true },
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
            return this.options && this.options.includes(v);
          }
          if (type === 'multiple') {
            if (Array.isArray(v)) {
              return v.length > 0 && v.every(opt => this.options.includes(opt));
            }
            if (typeof v === 'string') {
              return this.options.includes(v);
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
    explanation: String,
    difficulty: String
  }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

courseSchema.pre('save', async function() {
  if (this.isModified('quiz') || this.isModified('lessons')) {
    const { checkForDuplicates } = require('../utils/duplicateChecker');
    const allQuestions = [];
    if (this.quiz) {
      allQuestions.push(...this.quiz);
    }
    if (this.lessons) {
      this.lessons.forEach(l => {
        if (l.quiz) {
          allQuestions.push(...l.quiz);
        }
      });
    }
    if (allQuestions.length > 0) {
      await checkForDuplicates(allQuestions, this._id, 'Course');
    }
  }
});

module.exports = mongoose.model('Course', courseSchema);
