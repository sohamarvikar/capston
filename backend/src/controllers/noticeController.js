const Notice = require('../models/Notice');
const User = require('../models/User');

// POST /api/notices — Send a notice (Manager -> Employee)
exports.sendNotice = async (req, res) => {
  try {
    const { message, receiverId, taskId } = req.body;
    
    if (!message || !receiverId) {
      return res.status(400).json({ success: false, message: 'Message and receiver are required.' });
    }

    let finalReceiverId = receiverId;
    
    // Check if receiverId is an Employee ID rather than a User ID
    const isUser = await User.findById(receiverId);
    if (!isUser) {
      const userByEmp = await User.findOne({ employeeRef: receiverId });
      if (userByEmp) {
        finalReceiverId = userByEmp._id;
      } else {
        return res.status(404).json({ success: false, message: 'Receiver has no active user account to receive notices.' });
      }
    }

    const notice = await Notice.create({
      message,
      senderId: req.user._id,
      receiverId: finalReceiverId,
      taskId: taskId || null,
      status: 'Pending Response',
      isRead: false
    });

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notices — Get notices for logged-in user (Employee or Manager)
exports.getNotices = async (req, res) => {
  try {
    // If manager, fetch notices they sent OR received (replies). 
    // If employee, fetch notices they received.
    const query = req.user.role === 'manager' 
      ? { $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] }
      : { receiverId: req.user._id };

    const notices = await Notice.find(query)
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role')
      .populate('replies.senderId', 'name role')
      .sort('-createdAt');

    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notices/:id/reply — Reply to a notice
exports.replyToNotice = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message is required.' });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });

    notice.replies.push({
      message,
      senderId: req.user._id
    });

    // If the employee replies, set status to Replied
    if (req.user._id.toString() === notice.receiverId.toString()) {
      notice.status = 'Replied';
    }

    // Mark unread for the other party (we can just toggle isRead to false)
    notice.isRead = false; 

    await notice.save();

    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notices/:id/read — Mark notice as read
exports.markAsRead = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
