const express = require('express');
const router = express.Router();
const c = require('../controllers/aiAgentController');

// POST /api/ai/analyze — Run agent for a task
router.post('/analyze', c.analyzeTask);

// GET /api/ai/project/:key — Analyze full project
router.get('/project/:key', c.analyzeProject);

// GET /api/ai/dimensions — Show scoring factors
router.get('/dimensions', c.getDimensions);

module.exports = router;
