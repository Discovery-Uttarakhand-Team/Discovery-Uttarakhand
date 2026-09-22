import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000 // safe limit for message length
  },
  evidenceRefs: [{
    type: String
  }],
  provenance: {
    type: String,
    enum: ['GROUNDED', 'FALLBACK', 'LIVE', 'UNKNOWN', 'SYSTEM', 'USER'],
    default: 'GROUNDED'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

const ChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedTrip',
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Conversation',
    maxlength: 100
  },
  messages: {
    type: [MessageSchema],
    validate: [arrayLimit, '{PATH} exceeds the limit of 100 messages']
  }
}, { timestamps: true });

function arrayLimit(val) {
  return val.length <= 100;
}

export default mongoose.model('Chat', ChatSchema);
