const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  careerGoal: { type: String, required: true },
  currentSkills: [{ type: String }],
  targetSkills: [{ type: String }],
  readinessScore: { type: Number, default: 0 },
  milestones: [{
    title: { type: String },
    timeline: { type: String }, // e.g., 'Month 1-2'
    status: { type: String, enum: ['active', 'locked', 'completed'], default: 'locked' },
    coursesToComplete: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
  }],
  greenJobPaths: [{
    title: { type: String },
    matchPercentage: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
