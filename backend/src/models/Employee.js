const mongoose = require('mongoose');

/**
 * Employee Schema — redesigned for AI-driven workforce management.
 * Maps to Employe_Performance_dataset.csv with enriched skill fields
 * for intelligent project–employee matching.
 */
const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 18, max: 70 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    department: {
      type: String,
      required: true,
      enum: ['HR', 'IT', 'Sales'],
      index: true,
    },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    performanceScore: { type: Number, min: 1, max: 5, default: null },
    experience: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    location: { type: String, enum: ['New York', 'Los Angeles', 'Chicago'] },
    session: { type: String, enum: ['Morning', 'Evening', 'Night'] },

    // --- AI Enhancement Fields ---
    skills: [{ type: String, lowercase: true, trim: true }],
    currentWorkload: { type: Number, default: 0, min: 0, max: 3 },
    maxWorkload: { type: Number, default: 3 },
    availability: { type: Boolean, default: true },
    completedProjects: { type: Number, default: 0 },
    avgTaskCompletionDays: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: tenure in years
employeeSchema.virtual('tenure').get(function () {
  if (!this.joiningDate) return null;
  return Math.floor((Date.now() - this.joiningDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Indexes for AI queries
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ performanceScore: -1 });
employeeSchema.index({ skills: 1 });
employeeSchema.index({ availability: 1, currentWorkload: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
