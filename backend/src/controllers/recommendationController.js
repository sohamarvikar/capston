const { recommendEmployees, recommendForProject } = require('../ai/recommendationEngine');
const { analyzeTask } = require('../ai/aiApiIntegration');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');

// POST /api/recommendations/for-task — recommend employees for a task
exports.recommendForTask = async (req, res) => {
  try {
    const { requiredSkills, requiredExperience, requiredDepartment, taskSummary, topN = 5 } = req.body;

    let requirements = { requiredSkills: requiredSkills || [], requiredExperience: requiredExperience || 0, requiredDepartment: requiredDepartment || '' };

    // If taskSummary is provided, try AI analysis to auto-extract requirements
    if (taskSummary && (!requiredSkills || requiredSkills.length === 0)) {
      const aiAnalysis = await analyzeTask(taskSummary);
      if (aiAnalysis) {
        requirements = {
          requiredSkills: aiAnalysis.requiredSkills || requirements.requiredSkills,
          requiredExperience: aiAnalysis.requiredExperience || requirements.requiredExperience,
          requiredDepartment: aiAnalysis.requiredDepartment || requirements.requiredDepartment,
        };
        res.locals.aiSource = aiAnalysis.source;
      }
    }

    const recommendations = await recommendEmployees(requirements, Number(topN));

    res.json({
      success: true,
      requirements,
      aiSource: res.locals.aiSource || 'local-scoring',
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/recommendations/for-project/:key — recommend for all open tasks
exports.recommendForProjectTasks = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const topN = Number(req.query.topN) || 3;
    const recommendations = await recommendForProject(project, topN);

    res.json({
      success: true,
      project: { key: project.projectKey, name: project.projectName },
      totalOpenTasks: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/recommendations/accept — accept a recommendation & create assignment
exports.acceptRecommendation = async (req, res) => {
  try {
    const { employeeId, projectId, taskIssueKey, score, reason } = req.body;

    const assignment = await Assignment.create({
      employee: employeeId,
      project: projectId,
      taskIssueKey,
      recommendationScore: score || 0,
      recommendationReason: reason || '',
      status: 'Assigned',
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('employee', 'name employeeId department')
      .populate('project', 'projectKey projectName');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/recommendations/assignments — list all assignments
exports.getAssignments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('employee', 'name employeeId department skills')
        .populate('project', 'projectKey projectName')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Assignment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: assignments,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalRecords: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
