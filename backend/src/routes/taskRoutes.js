const express = require('express');
const router = express.Router();
const c = require('../controllers/taskController');
const { auth, authorize } = require('../middleware/auth');

// Employee routes
router.get('/my', auth, authorize('employee', 'manager'), c.getMyTasks);
router.patch('/complete', auth, authorize('employee', 'manager'), c.completeTask);
router.post('/upload', auth, authorize('employee', 'manager'), c.uploadDocument);

// Shared / Manager routes
router.get('/submissions/:projectKey/:issueKey', auth, c.getSubmissions);
router.get('/progress/:projectKey', auth, c.getProjectProgress);

module.exports = router;
