const mongoose = require('mongoose');

/**
 * Assignment Schema — tracks which employee is assigned to which
 * project/task, including the AI recommendation score.
 */
const assignmentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    taskIssueKey: { type: String, default: null },
    recommendationScore: { type: Number, default: 0 },
    recommendationReason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Recommended', 'Assigned', 'Completed', 'Rejected'],
      default: 'Recommended',
    },
    assignedDate: { type: Date, default: Date.now },
    completedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

assignmentSchema.index({ employee: 1, project: 1 });
assignmentSchema.index({ status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
