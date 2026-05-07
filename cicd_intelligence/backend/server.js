require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const WorkflowExecution = require('./models/WorkflowExecution');

const app = express();
app.use(cors());
app.use(express.json());

const AI_URL = process.env.AI_URL || 'http://localhost:8001';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cicd_intelligence', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected for CI/CD Module'))
  .catch(err => console.log('DB Connection Error:', err));

// 1. Webhook Receiver (GitHub Actions)
app.post('/api/webhook/github', async (req, res) => {
  const { workflow_run } = req.body;
  if (!workflow_run) return res.status(200).send('Not a workflow run event.');

  const status = workflow_run.conclusion || 'pending';
  // Mock fetching logs (In reality, use GitHub API to fetch raw logs)
  const simulatedLog = status === 'failure' 
    ? "npm ERR! missing dependency [process ID: 404]" 
    : "build successful [process ID: 200]";

  let aiAnalysis = null;
  if (status === 'failure') {
    try {
      const aiResponse = await axios.post(`${AI_URL}/api/classify`, { log_text: simulatedLog });
      aiAnalysis = aiResponse.data;
    } catch (err) {
      console.error('AI Classification failed:', err.message);
    }
  }

  // Auto-Assignment Logic Heuristic
  let assignedTo = null;
  if (aiAnalysis && aiAnalysis.category === 'Dependency issue') {
    assignedTo = 'Senior DevOps Engineer'; // Example matching
  }

  const execution = new WorkflowExecution({
    runId: workflow_run.id,
    repoName: workflow_run.repository.name,
    commitMessage: workflow_run.head_commit?.message || 'Update',
    developer: workflow_run.actor.login,
    status: status,
    logs: simulatedLog,
    aiAnalysis: aiAnalysis,
    assignedTo: assignedTo
  });

  await execution.save();
  res.status(200).json({ success: true, message: 'Workflow recorded and analyzed' });
});

// 2. Frontend Analytics API
app.get('/api/analytics', async (req, res) => {
  try {
    const executions = await WorkflowExecution.find().sort({ createdAt: -1 }).limit(50);
    const failures = executions.filter(e => e.status === 'failure');
    
    res.json({
      success: true,
      data: {
        totalRuns: executions.length,
        totalFailures: failures.length,
        failureRate: executions.length ? (failures.length / executions.length) * 100 : 0,
        recentExecutions: executions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`CI/CD Intelligence Backend running on port ${PORT}`));
