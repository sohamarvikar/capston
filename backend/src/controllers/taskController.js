const Project = require('../models/Project');
const Submission = require('../models/Submission');
const Employee = require('../models/Employee');
const path = require('path');
const multer = require('multer');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// GET /api/tasks/my — get tasks assigned to the logged-in employee
exports.getMyTasks = async (req, res) => {
  try {
    const user = req.user;
    if (!user.employeeRef) {
      return res.json({ success: true, data: [], message: 'No employee record linked to this account.' });
    }

    // Find all projects that have tasks assigned to this employee
    const projects = await Project.find({ 'tasks.assignedTo': user.employeeRef }).lean();

    const myTasks = [];
    for (const project of projects) {
      for (const task of project.tasks) {
        if (task.assignedTo && task.assignedTo.toString() === user.employeeRef.toString()) {
          myTasks.push({
            projectKey: project.projectKey,
            projectName: project.projectName,
            issueKey: task.issueKey,
            summary: task.summary,
            issueType: task.issueType,
            status: task.status,
            priority: task.priority,
            requiredSkills: task.requiredSkills,
            estimatedDays: task.estimatedDays,
            createdDate: task.createdDate,
          });
        }
      }
    }

    res.json({ success: true, data: myTasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/complete — mark a task as completed
exports.completeTask = async (req, res) => {
  try {
    const { projectKey, issueKey } = req.body;
    if (!projectKey || !issueKey) {
      return res.status(400).json({ success: false, message: 'projectKey and issueKey are required.' });
    }

    const project = await Project.findOne({ projectKey: projectKey.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const task = project.tasks.find(t => t.issueKey === issueKey);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Verify ownership (if employee)
    if (req.user.role === 'employee' && req.user.employeeRef) {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user.employeeRef.toString()) {
        return res.status(403).json({ success: false, message: 'This task is not assigned to you.' });
      }
    }

    task.status = 'Closed';
    project.openTasks = project.tasks.filter(t => t.status === 'Open' || t.status === 'Needs Triage' || t.status === 'In Progress').length;

    // Check if all tasks are closed → mark project Completed
    const allClosed = project.tasks.every(t => t.status === 'Closed' || t.status === 'Resolved');
    if (allClosed && project.tasks.length > 0) {
      project.status = 'Completed';
    }

    // Decrease employee workload
    if (task.assignedTo) {
      await Employee.findByIdAndUpdate(task.assignedTo, { $inc: { currentWorkload: -1, completedProjects: 1 } });
    }

    await project.save();

    res.json({ success: true, message: 'Task marked as completed.', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/upload — upload a document for a task
exports.uploadDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

      const { projectKey, issueKey, notes } = req.body;
      if (!projectKey || !issueKey) {
        return res.status(400).json({ success: false, message: 'projectKey and issueKey are required.' });
      }

      const submission = await Submission.create({
        task: { projectKey: projectKey.toUpperCase(), issueKey },
        submittedBy: req.user._id,
        employee: req.user.employeeRef || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        notes: notes || '',
      });

      res.status(201).json({ success: true, data: submission });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

// GET /api/tasks/submissions/:projectKey/:issueKey — get submissions for a task
exports.getSubmissions = async (req, res) => {
  try {
    const { projectKey, issueKey } = req.params;
    const submissions = await Submission.find({
      'task.projectKey': projectKey.toUpperCase(),
      'task.issueKey': issueKey,
    })
      .populate('submittedBy', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/progress/:projectKey — get project progress
exports.getProjectProgress = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.projectKey.toUpperCase() }).lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const total = project.tasks.length;
    const completed = project.tasks.filter(t => t.status === 'Closed' || t.status === 'Resolved').length;
    const inProgress = project.tasks.filter(t => t.status === 'In Progress').length;
    const open = project.tasks.filter(t => t.status === 'Open' || t.status === 'Needs Triage').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        projectKey: project.projectKey,
        projectName: project.projectName,
        total,
        completed,
        inProgress,
        open,
        percentage,
        status: project.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
