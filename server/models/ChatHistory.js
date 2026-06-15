const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  messages: [{
    text: { type: String, required: true },
    isBot: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  backupMessages: [{
    text: { type: String },
    isBot: { type: Boolean },
    timestamp: { type: Date }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
