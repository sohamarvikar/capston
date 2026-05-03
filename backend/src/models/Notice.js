const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Receiver is an Employee's User ID or Employee ID. 
    // Since employees log in as Users, it's best to link to User.
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: String, default: null }, // Optional issueKey e.g. "MYAPP-1"
    status: { 
      type: String, 
      enum: ['Pending Response', 'Replied'], 
      default: 'Pending Response' 
    },
    isRead: { type: Boolean, default: false }, // Highlight unread
    replies: [
      {
        message: { type: String, required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
