const express = require('express');
const router = express.Router();
const c = require('../controllers/recommendationController');

router.post('/for-task', c.recommendForTask);
router.get('/for-project/:key', c.recommendForProjectTasks);
router.post('/accept', c.acceptRecommendation);
router.get('/assignments', c.getAssignments);

module.exports = router;
