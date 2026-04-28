const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');

// GET /api/analytics/dashboard — full dashboard summary
exports.getDashboard = async (req, res) => {
  try {
    const [empStats, projectStats, assignmentStats] = await Promise.all([
      Employee.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            avgPerformance: { $avg: '$performanceScore' },
            avgSalary: { $avg: '$salary' },
            avgExperience: { $avg: '$experience' },
          },
        },
      ]),
      Project.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            totalTasks: { $sum: '$totalTasks' },
            openTasks: { $sum: '$openTasks' },
          },
        },
      ]),
      Assignment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const emp = empStats[0] || {};
    const proj = projectStats[0] || {};
    const assignments = {};
    assignmentStats.forEach((a) => { assignments[a._id] = a.count; });

    res.json({
      success: true,
      data: {
        employees: {
          total: emp.total || 0, active: emp.active || 0,
          avgPerformance: Math.round((emp.avgPerformance || 0) * 100) / 100,
          avgSalary: Math.round(emp.avgSalary || 0),
          avgExperience: Math.round((emp.avgExperience || 0) * 10) / 10,
        },
        projects: {
          total: proj.total || 0, active: proj.active || 0,
          totalTasks: proj.totalTasks || 0, openTasks: proj.openTasks || 0,
        },
        assignments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/departments
exports.getDepartmentStats = async (req, res) => {
  try {
    const data = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          avgPerformance: { $avg: '$performanceScore' },
          avgSalary: { $avg: '$salary' },
          avgExperience: { $avg: '$experience' },
        },
      },
      {
        $project: {
          _id: 0, department: '$_id', count: 1, activeCount: 1,
          avgPerformance: { $round: ['$avgPerformance', 2] },
          avgSalary: { $round: ['$avgSalary', 0] },
          avgExperience: { $round: ['$avgExperience', 1] },
        },
      },
      { $sort: { department: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/top-performers?limit=10&department=IT
exports.getTopPerformers = async (req, res) => {
  try {
    const { limit = 10, department } = req.query;
    const filter = { performanceScore: { $ne: null } };
    if (department) filter.department = department;

    const data = await Employee.find(filter)
      .sort({ performanceScore: -1, experience: -1 })
      .limit(Number(limit))
      .select('employeeId name department performanceScore salary experience location skills');

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/skill-distribution
exports.getSkillDistribution = async (req, res) => {
  try {
    const data = await Employee.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $project: { _id: 0, skill: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
