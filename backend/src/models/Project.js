const mongoose = require('mongoose');

/**
 * Project Schema — maps to GFG_FINAL.csv (Public Jira Dataset).
 * Key columns used: Project.key, Project.name, Summary, Issue.key,
 * Issue.Type, Status, Priority, plus our added AI fields.
 */
const projectSchema = new mongoose.Schema(
  {
    projectKey: { type: String, required: true, trim: true, index: true },
    projectName: { type: String, required: true, trim: true },
    projectType: { type: String, default: 'software' },
    projectLead: { type: String, trim: true },
    description: { type: String, default: '' },

    // Issue-level details (tasks within the project)
    tasks: [
      {
        issueKey: { type: String, required: true },
        issueId: { type: Number },
        summary: { type: String, required: true },
        issueType: {
          type: String,
          enum: ['Bug', 'Task', 'Story', 'Epic', 'Suggestion', 'Improvement', 'New Feature', 'Sub-task', 'Other'],
          default: 'Task',
        },
        status: {
          type: String,
          enum: ['Open', 'In Progress', 'Closed', 'Resolved', 'Reopened', 'Needs Triage', 'Other'],
          default: 'Open',
        },
        priority: {
          type: String,
          enum: ['Critical', 'High', 'Medium', 'Low', 'Trivial'],
          default: 'Medium',
        },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
        requiredSkills: [{ type: String, lowercase: true, trim: true }],
        requiredExperience: { type: Number, default: 0 },
        requiredDepartment: { type: String, enum: ['HR', 'IT', 'Sales', ''], default: '' },
        estimatedDays: { type: Number, default: 5 },
        createdDate: { type: Date, default: Date.now },
      },
    ],

    // Project-level aggregates
    totalTasks: { type: Number, default: 0 },
    openTasks: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'On Hold'],
      default: 'Active',
    },
    requiredSkills: [{ type: String, lowercase: true, trim: true }],
    requiredDepartment: { type: String, enum: ['HR', 'IT', 'Sales', ''], default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.index({ projectKey: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'tasks.assignedTo': 1 });
projectSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model('Project', projectSchema);
