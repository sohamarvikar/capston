const mongoose = require('mongoose');

const WorkflowExecutionSchema = new mongoose.Schema({
  runId: { type: String, required: true },
  repoName: { type: String, required: true },
  commitMessage: { type: String },
  developer: { type: String },
  status: { type: String, enum: ['success', 'failure', 'pending'] },
  logs: { type: String },
  aiAnalysis: {
    category: { type: String },
    priority: { type: String },
    summary: { type: String }
  },
  assignedTo: { type: String }, // Developer ID assigned to fix it
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkflowExecution', WorkflowExecutionSchema);
