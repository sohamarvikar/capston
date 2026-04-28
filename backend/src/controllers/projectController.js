const Project = require('../models/Project');

// GET /api/projects — list with filters & pagination
exports.getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt', status, search, projectKey } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (projectKey) filter.projectKey = projectKey;
    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectKey: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    // Exclude embedded tasks from list view for performance
    const [projects, total] = await Promise.all([
      Project.find(filter, { tasks: 0 }).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalRecords: total, perPage: limitNum },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:key — get project with tasks
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() }).populate('tasks.assignedTo', 'name employeeId department');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/projects/:key
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { projectKey: req.params.key.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/projects/:key
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ projectKey: req.params.key.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:key/tasks — add task to project
exports.addTask = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.tasks.push(req.body);
    project.totalTasks = project.tasks.length;
    project.openTasks = project.tasks.filter((t) => t.status === 'Open' || t.status === 'Needs Triage').length;
    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/projects/:key/tasks/:issueKey/assign — assign employee to task
exports.assignTask = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const task = project.tasks.find((t) => t.issueKey === req.params.issueKey);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.assignedTo = req.body.employeeId;
    task.status = 'In Progress';
    project.openTasks = project.tasks.filter((t) => t.status === 'Open' || t.status === 'Needs Triage').length;
    await project.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
