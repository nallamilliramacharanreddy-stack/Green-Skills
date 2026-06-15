const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['weekly', 'monthly', 'green-challenge', 'skill-challenge'], required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  tasks: [{
    title: { type: String },
    description: { type: String },
    points: { type: Number },
    type: { type: String, enum: ['coding', 'aptitude', 'logic', 'practical'] }
  }],
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, default: 0 },
    completedAt: { type: Date },
    codeLink: { type: String } // optional for coding challenges
  }],
  status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', contestSchema);
