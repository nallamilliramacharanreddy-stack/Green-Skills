const mongoose = require('mongoose');

const translationHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional user identification
  videoName: { type: String, required: true },
  videoUrl: { type: String, required: true },
  targetLanguage: { type: String, required: true },
  translationStyle: { type: String, default: 'natural' },
  voiceStyle: { type: String, default: 'standard' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  logs: [{ type: String }],
  originalLanguage: { type: String },
  originalTranscript: [{
    start: { type: Number },
    end: { type: Number },
    speaker: { type: String },
    text: { type: String },
    emotion: { type: String },
    tone: { type: String },
    technicalTerms: [{ type: String }]
  }],
  translatedTranscript: [{
    start: { type: Number },
    end: { type: Number },
    speaker: { type: String },
    text: { type: String }
  }],
  translatedVideoUrl: { type: String },
  srtUrl: { type: String },
  vttUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TranslationHistory', translationHistorySchema);
