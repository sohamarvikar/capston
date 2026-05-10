const express = require('express');
const router = express.Router();
const c = require('../controllers/aiAgentController');
const { callGeminiAPI } = require('../ai/aiApiIntegration');

// POST /api/ai/analyze — Run agent for a task
router.post('/analyze', c.analyzeTask);

// GET /api/ai/project/:key — Analyze full project
router.get('/project/:key', c.analyzeProject);

// GET /api/ai/dimensions — Show scoring factors
router.get('/dimensions', c.getDimensions);

// POST /api/ai/generate-tasks — Auto-generate tasks using AI
router.post('/generate-tasks', async (req, res) => {
  try {
    const { projectName, description, skills } = req.body;
    console.log("AI Task Generation Request:", req.body);

    // Validate input
    if (!projectName || !description) {
      return res.status(400).json({ error: "Missing data" });
    }

    // Gemini API call
    const response = await callGeminiAPI(projectName, description, skills);
    console.log("AI Task Generation Response:", response);

    return res.json({
      success: true,
      tasks: response
    });
  } catch (err) {
    console.error("AI TASK ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
