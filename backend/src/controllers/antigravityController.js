const { runAntigravityAgent, DIMENSIONS } = require('../ai/antigravityAgent');
const Project = require('../models/Project');

/**
 * Antigravity Agent Controller
 * Dedicated endpoints for the AI agent module.
 */

// POST /api/antigravity/analyze — Run agent for a custom task/project
exports.analyzeTask = async (req, res) => {
  try {
    const {
      requiredSkills = [],
      requiredExperience = 0,
      requiredDepartment = '',
      estimatedDays = 5,
      difficulty = 'Medium',
      taskSummary = '',
      topN = 5,
    } = req.body;

    const requirements = {
      requiredSkills,
      requiredExperience: Number(requiredExperience),
      requiredDepartment,
      estimatedDays: Number(estimatedDays),
      difficulty,
      taskSummary,
    };

    const result = await runAntigravityAgent(requirements, Number(topN));

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/antigravity/project/:key — Run agent for all open tasks in a project
exports.analyzeProject = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const openTasks = (project.tasks || []).filter(
      t => t.status === 'Open' || t.status === 'Needs Triage'
    );

    const topN = Number(req.query.topN) || 3;

    const taskResults = [];
    for (const task of openTasks) {
      const requirements = {
        requiredSkills: task.requiredSkills || project.requiredSkills || [],
        requiredExperience: task.requiredExperience || 0,
        requiredDepartment: task.requiredDepartment || project.requiredDepartment || '',
        estimatedDays: task.estimatedDays || 5,
      };

      const result = await runAntigravityAgent(requirements, topN);

      taskResults.push({
        task: {
          issueKey: task.issueKey,
          summary: task.summary,
          issueType: task.issueType,
          priority: task.priority,
          requiredSkills: task.requiredSkills,
        },
        bestMatch: result.recommendations[0] || null,
        allRecommendations: result.recommendations,
      });
    }

    res.json({
      success: true,
      agentName: 'Antigravity Agent',
      project: { key: project.projectKey, name: project.projectName },
      totalOpenTasks: openTasks.length,
      data: taskResults,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/antigravity/dimensions — Show scoring dimensions (for UI display)
exports.getDimensions = (req, res) => {
  const dims = Object.entries(DIMENSIONS).map(([key, val]) => ({
    key,
    label: val.label,
    weight: val.weight,
    percentage: Math.round(val.weight * 100),
  }));
  res.json({ success: true, agentName: 'Antigravity Agent', dimensions: dims });
};
