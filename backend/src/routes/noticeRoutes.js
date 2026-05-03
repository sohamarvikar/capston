const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { auth } = require('../middleware/auth');

router.use(auth); // All notice routes require authentication

router.post('/', noticeController.sendNotice);
router.get('/', noticeController.getNotices);
router.post('/:id/reply', noticeController.replyToNotice);
router.patch('/:id/read', noticeController.markAsRead);

module.exports = router;
