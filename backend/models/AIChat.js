const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [
    {
      role: { type: String, enum: ['user', 'bot'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastInteraction: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure we only have one persistent chat document per user for now
// (Simplified session management)
aiChatSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('AIChat', aiChatSchema);
