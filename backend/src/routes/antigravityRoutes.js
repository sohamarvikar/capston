const express = require('express');
const router = express.Router();
const c = require('../controllers/antigravityController');

// POST /api/antigravity/analyze — Run agent for a task
router.post('/analyze', c.analyzeTask);

// GET /api/antigravity/project/:key — Analyze full project
router.get('/project/:key', c.analyzeProject);

// GET /api/antigravity/dimensions — Show scoring factors
router.get('/dimensions', c.getDimensions);

module.exports = router;
