const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB for large dataset

// POST /api/upload/employees — upload employee CSV
router.post('/employees', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Upload a CSV file' });

  const results = [];
  let count = 0;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          count++;
          results.push({
            employeeId: parseInt(row['ID']),
            name: (row['Name'] || '').trim(),
            age: parseInt(row['Age']),
            gender: (row['Gender'] || '').trim(),
            department: (row['Department'] || '').trim(),
            salary: parseFloat(row['Salary']),
            joiningDate: new Date(row['Joining Date']),
            performanceScore: row['Performance Score'] ? parseFloat(row['Performance Score']) : null,
            experience: parseInt(row['Experience']),
            status: (row['Status'] || 'Active').trim(),
            location: (row['Location'] || '').trim(),
            session: (row['Session'] || '').trim(),
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Batch upsert in chunks of 500
    const BATCH = 500;
    let upserted = 0;
    for (let i = 0; i < results.length; i += BATCH) {
      const chunk = results.slice(i, i + BATCH);
      const ops = chunk.map((e) => ({ updateOne: { filter: { employeeId: e.employeeId }, update: { $set: e }, upsert: true } }));
      const r = await Employee.bulkWrite(ops);
      upserted += r.upsertedCount + r.modifiedCount;
    }

    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: `Imported ${upserted} employees from ${count} rows` });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/upload/projects — upload Jira CSV (GFG_FINAL.csv)
// Uses stream processing for the 113MB file
router.post('/projects', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Upload a CSV file' });

  const projectMap = new Map(); // group tasks by project key
  let rowCount = 0;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          const pKey = (row['Project key'] || row['Project.key'] || '').trim();
          if (!pKey) return;

          if (!projectMap.has(pKey)) {
            projectMap.set(pKey, {
              projectKey: pKey,
              projectName: (row['Project name'] || row['Project.name'] || pKey).trim(),
              projectType: (row['Project type'] || row['Project.type'] || 'software').trim(),
              projectLead: (row['Project lead'] || row['Project.lead'] || '').trim(),
              description: (row['Project description'] || row['Project.description'] || '').trim().substring(0, 500),
              tasks: [],
            });
          }

          // Map Jira issue types to our enum
          let issueType = (row['Issue Type'] || row['Issue.Type'] || 'Task').trim();
          const validTypes = ['Bug', 'Task', 'Story', 'Epic', 'Suggestion', 'Improvement', 'New Feature', 'Sub-task'];
          if (!validTypes.includes(issueType)) issueType = 'Other';

          // Map status
          let status = (row['Status'] || '').trim();
          const validStatuses = ['Open', 'In Progress', 'Closed', 'Resolved', 'Reopened', 'Needs Triage'];
          if (!validStatuses.includes(status)) status = 'Other';

          const proj = projectMap.get(pKey);
          // Limit to 50 tasks per project for manageability
          if (proj.tasks.length < 50) {
            proj.tasks.push({
              issueKey: (row['Issue key'] || row['Issue.key'] || `${pKey}-${rowCount}`).trim(),
              issueId: parseInt(row['Issue id'] || row['Issue.id'] || 0),
              summary: (row['Summary'] || '').trim().substring(0, 300),
              issueType,
              status,
              priority: 'Medium',
              requiredSkills: [],
              requiredDepartment: 'IT',
              estimatedDays: 5,
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Batch upsert projects
    const projects = Array.from(projectMap.values());
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < projects.length; i += BATCH) {
      const chunk = projects.slice(i, i + BATCH);
      const ops = chunk.map((p) => ({
        updateOne: {
          filter: { projectKey: p.projectKey },
          update: {
            $set: {
              ...p,
              totalTasks: p.tasks.length,
              openTasks: p.tasks.filter((t) => t.status === 'Open' || t.status === 'Needs Triage').length,
            },
          },
          upsert: true,
        },
      }));
      const r = await Project.bulkWrite(ops);
      inserted += r.upsertedCount + r.modifiedCount;
    }

    fs.unlinkSync(req.file.path);
    res.json({
      success: true,
      message: `Processed ${rowCount} rows → ${projects.length} projects imported`,
      stats: { totalRows: rowCount, projectsCreated: projects.length, tasksImported: projects.reduce((a, p) => a + p.tasks.length, 0) },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
