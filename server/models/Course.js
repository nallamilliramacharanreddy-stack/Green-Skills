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
    duration: { type: String, default: '10:00' },
    isMandatory: { type: Boolean, default: false },
    // AI Video Engine Fields
    youtube_video_id: { type: String },
    internalVideoUrl: { type: String },
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
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String
    }]
  }],
  tasks: [{
    title: String,
    description: String,
    type: { type: String, default: 'Assignment' }
  }],
  quiz: [{
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    difficulty: String
  }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
