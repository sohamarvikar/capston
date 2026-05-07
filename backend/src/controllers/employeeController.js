const Employee = require('../models/Employee');

// GET /api/employees — list with filtering, pagination, sorting
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-employeeId', department, status, location, search, skills, minAge, maxAge, minSalary, maxSalary, availability } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (location) filter.location = location;
    if (availability !== undefined) filter.availability = availability === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (skills) filter.skills = { $in: skills.split(',').map((s) => s.trim().toLowerCase()) };
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }
    if (minSalary || maxSalary) {
      filter.salary = {};
      if (minSalary) filter.salary.$gte = Number(minSalary);
      if (maxSalary) filter.salary.$lte = Number(maxSalary);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalRecords: total, perPage: limitNum },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/:id
exports.getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOne({ employeeId: Number(req.params.id) }).lean();
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    
    // Add Burnout & Performance ML Prediction
    try {
      const axios = require('axios');
      const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';
      
      const burnoutRes = await axios.post(`${PYTHON_AI_URL}/predict/burnout`, {
        weekly_hours: 40 + ((emp.currentWorkload || 0) * 3), 
        pending_tasks: emp.currentWorkload || 0,
        attendance_rate: 0.95,
        days_since_vacation: 90
      }, { timeout: 1000 });
      
      const perfRes = await axios.post(`${PYTHON_AI_URL}/predict/performance`, {
        tasks_completed: emp.completedProjects || 5,
        on_time_rate: 0.9,
        communication_score: 4.0
      }, { timeout: 1000 });
      
      emp.mlPredictions = {
        burnoutRisk: burnoutRes.data.burnout_risk_level,
        burnoutScore: burnoutRes.data.burnout_score,
        projectedPerformance: perfRes.data.employee_performance_score
      };
    } catch (err) {
      // Python AI service not running, fail gracefully
      emp.mlPredictions = null;
    }

    res.json({ success: true, data: emp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    if (!req.body.employeeId) {
      const last = await Employee.findOne().sort('-employeeId');
      req.body.employeeId = last ? last.employeeId + 1 : 1;
    }
    const emp = await Employee.create(req.body);
    res.status(201).json({ success: true, data: emp });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate({ employeeId: Number(req.params.id) }, req.body, { new: true, runValidators: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndDelete({ employeeId: Number(req.params.id) });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/employees/:id/skills — update skills array
exports.updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    if (!Array.isArray(skills)) return res.status(400).json({ success: false, message: 'skills must be an array' });
    const emp = await Employee.findOneAndUpdate(
      { employeeId: Number(req.params.id) },
      { skills: skills.map((s) => s.toLowerCase().trim()) },
      { new: true }
    );
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
