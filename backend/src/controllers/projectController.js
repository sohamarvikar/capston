const Project = require('../models/Project');
const axios = require('axios');

const MAX_WORKLOAD = 3;
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

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
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() }).populate('tasks.assignedTo', 'name employeeId department').lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    // Auto-calculate status for tasks
    await Promise.all(project.tasks.map(async (task) => {
      if (!task.deadline) {
        task.deadlineStatus = null;
        return;
      }
      if (task.status === 'completed' || task.status === 'Closed' || task.status === 'Resolved') {
        task.deadlineStatus = (task.completedAt && task.completedAt > task.deadline) ? 'Late' : 'On Time';
        task.delayProbability = 0;
      } else {
        const daysLeft = (task.deadline - new Date()) / (1000 * 60 * 60 * 24);
        if (daysLeft < 0) task.deadlineStatus = 'Late';
        else if (daysLeft <= 2) task.deadlineStatus = 'At Risk';
        else task.deadlineStatus = 'On Time';
        
        // AI Delay Prediction Logic (Using Python Microservice)
        if (task.assignedTo) {
          const emp = task.assignedTo;
          try {
            const aiRes = await axios.post(`${PYTHON_AI_URL}/predict/delay`, {
              num_tasks: project.tasks.length,
              workload: emp.currentWorkload || 1.0,
              avg_performance: emp.performanceScore || 3.0,
              days_to_deadline: Math.max(0, Math.ceil(daysLeft)),
              team_velocity: 15 // Placeholder for team velocity
            }, { timeout: 1500 });
            
            task.delayProbability = aiRes.data.delay_probability_percentage;
          } catch (error) {
            // Fallback JS Logic if Python API is unavailable
            let prob = 10;
            const workload = emp.currentWorkload || 0;
            if (workload >= MAX_WORKLOAD) prob += 50;
            else if (workload >= 2) prob += 30;
            else if (workload >= 1) prob += 10;
            
            const perf = emp.performanceScore || 3;
            if (perf < 3) prob += 25;
            else if (perf >= 4) prob -= 15;
            
            if (task.requiredSkills && task.requiredSkills.length > 3) prob += 15;
            
            if (daysLeft < 0) prob = 99; // Already late
            else if (daysLeft <= 2) prob += 20; // Proximate deadline
            
            task.delayProbability = Math.min(100, Math.max(0, Math.round(prob)));
          }
        } else {
          task.delayProbability = 0;
        }
      }
    }));

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
    task.status = 'ongoing';
    
    // AI Task Time Estimation
    const Employee = require('../models/Employee');
    const employee = await Employee.findById(req.body.employeeId);
    
    if (employee) {
      // Workload validation: reject if at capacity
      if ((employee.currentWorkload || 0) >= MAX_WORKLOAD) {
        return res.status(400).json({ success: false, message: `Employee is at maximum workload capacity (${MAX_WORKLOAD}/${MAX_WORKLOAD}). Cannot assign more tasks.` });
      }
      const baseDays = task.estimatedDays || 5;
      const complexity = 1 + ((task.requiredSkills?.length || 0) * 0.15);
      const expFactor = Math.max(1, (employee.experience || 1) / 3);
      
      const calculatedDays = Math.max(1, Math.round((baseDays * complexity) / expFactor));
      
      task.estimatedDaysMin = calculatedDays;
      task.estimatedDaysMax = calculatedDays + Math.max(1, Math.round(calculatedDays * 0.3)); // 30% buffer
      
      // Deadline Tracking System: Set deadline to estimatedDaysMax from now
      task.deadline = new Date(Date.now() + task.estimatedDaysMax * 24 * 60 * 60 * 1000);
    }
    
    project.openTasks = project.tasks.filter((t) => t.status === 'Open' || t.status === 'Needs Triage' || t.status === 'pending').length;
    await project.save();
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/projects/:key/tasks/:issueKey/reassign — AI auto reassign
exports.autoReassignTask = async (req, res) => {
  try {
    const project = await Project.findOne({ projectKey: req.params.key.toUpperCase() });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const task = project.tasks.find((t) => t.issueKey === req.params.issueKey);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // AI Recommendation Logic
    const { recommendEmployees } = require('../ai/recommendationEngine');
    const requirements = {
      requiredSkills: task.requiredSkills || [],
      requiredExperience: task.requiredExperience || 0,
      requiredDepartment: task.requiredDepartment || ''
    };
    
    const topMatches = await recommendEmployees(requirements, 5);
    if (topMatches.length > 0) {
      // Find the absolute best match that is NOT the current assignee
      const alternatives = topMatches.filter(m => m.employee._id.toString() !== task.assignedTo?.toString());
      
      let bestAlternative = null;
      let usedPython = false;

      // Try using Python AI Microservice for Smart Reassignment
      if (alternatives.length > 0) {
        try {
          const candidates = alternatives.map(m => ({
            employee_id: m.employee._id.toString(),
            workload: m.employee.currentWorkload || 1.0,
            experience_level: m.employee.experience || 1,
            skill_match_score: m.breakdown.skillMatch / 100
          }));

          const aiRes = await axios.post(`${PYTHON_AI_URL}/predict/assignment`, {
            task_complexity: Math.min(5, Math.max(1, Math.ceil((task.requiredSkills?.length || 0) / 2))),
            candidates: candidates
          }, { timeout: 1500 });
          
          const recommendedId = aiRes.data.recommended_employee_id;
          bestAlternative = alternatives.find(a => a.employee._id.toString() === recommendedId);
          usedPython = true;
        } catch (error) {
          // Fallback: Pick the highest scoring alternative from JS logic
          bestAlternative = alternatives[0];
        }
      }

      if (bestAlternative) {
        // Decrease old assignee workload if we know it
        const Employee = require('../models/Employee');
        if (task.assignedTo) {
          await Employee.findByIdAndUpdate(task.assignedTo, { $inc: { currentWorkload: -1 } });
        }
        
        task.assignedTo = bestAlternative.employee._id;
        task.status = 'ongoing';
        
        // Re-run time estimation for new employee
        const baseDays = task.estimatedDays || 5;
        const complexity = 1 + ((task.requiredSkills?.length || 0) * 0.15);
        const expFactor = Math.max(1, (bestAlternative.employee.experience || 1) / 3);
        const calculatedDays = Math.max(1, Math.round((baseDays * complexity) / expFactor));
        
        task.estimatedDaysMin = calculatedDays;
        task.estimatedDaysMax = calculatedDays + Math.max(1, Math.round(calculatedDays * 0.3));
        task.deadline = new Date(Date.now() + task.estimatedDaysMax * 24 * 60 * 60 * 1000);
        
        await project.save();
        return res.json({ 
          success: true, 
          message: 'Task successfully auto-reassigned', 
          newAssignee: bestAlternative.employee.name,
          reason: usedPython ? `Smart AI Reassignment. ${bestAlternative.employee.name} is the optimal match.` : `High delay risk mitigated. ${bestAlternative.employee.name} is a better match (${bestAlternative.score}% score).` 
        });
      }
    }
    
    res.json({ success: false, message: 'No better alternative found for reassignment' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
