const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    task: {
      projectKey: { type: String, required: true },
      issueKey: { type: String, required: true },
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

submissionSchema.index({ 'task.projectKey': 1, 'task.issueKey': 1 });
submissionSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
