const Employee = require('../models/Employee');

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                      AI AGENT                                 ║
 * ║  "Lifting project performance through intelligent matching"  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * The AI Agent is an advanced AI module that uses a
 * multi-dimensional scoring system inspired by gravitational
 * physics to "lift" project outcomes by finding the optimal
 * employee-to-project assignment.
 *
 * CONCEPT:
 *   In physics, gravity pulls things down. The AI Agent
 *   calculates an "Uplift Score" — a composite force that measures
 *   how strongly an employee can "lift" a project upward.
 *
 *   Uplift = SkillGravity + PerformanceThrust + ExperienceMomentum
 *          + AvailabilityFuel + DepartmentAlignment + DeadlineFit
 *
 * SCORING DIMENSIONS (6 factors):
 *   1. Skill Gravity     (30%) — skill overlap × depth bonus
 *   2. Performance Thrust (20%) — past performance as engine power
 *   3. Experience Momentum(15%) — years of experience vs. requirement
 *   4. Availability Fuel  (15%) — workload capacity remaining
 *   5. Department Align.  (10%) — organizational fit
 *   6. Deadline Fit       (10%) — can they deliver in time?
 *
 * Unlike a simple weighted average, the agent also applies:
 *   - Penalty multipliers for critical mismatches
 *   - Bonus multipliers for exceptional fits
 *   - Confidence levels based on data completeness
 */

// ─── Configurable Weights ────────────────────────────────────────
const DIMENSIONS = {
  skillGravity:      { weight: 0.30, label: 'Skill Gravity' },
  performanceThrust: { weight: 0.20, label: 'Performance Thrust' },
  experienceMomentum:{ weight: 0.15, label: 'Experience Momentum' },
  availabilityFuel:  { weight: 0.15, label: 'Availability Fuel' },
  departmentAlign:   { weight: 0.10, label: 'Department Alignment' },
  deadlineFit:       { weight: 0.10, label: 'Deadline Fit' },
};

// ─── Skill Gravity ───────────────────────────────────────────────
// Measures skill overlap + rewards employees who have MORE skills
// than required (depth bonus). Partial matches get partial credit.
function calcSkillGravity(empSkills, reqSkills) {
  if (!reqSkills || reqSkills.length === 0) return { score: 50, matched: [], missing: [] };

  const empSet = new Set((empSkills || []).map(s => s.toLowerCase()));
  const reqNorm = reqSkills.map(s => s.toLowerCase());

  const matched = reqNorm.filter(s => empSet.has(s));
  const missing = reqNorm.filter(s => !empSet.has(s));

  // Base overlap score
  let score = (matched.length / reqNorm.length) * 100;

  // Depth bonus: +5 for each extra skill beyond requirements (max +15)
  const extraSkills = empSet.size - matched.length;
  if (extraSkills > 0 && score > 0) {
    score = Math.min(100, score + Math.min(extraSkills * 5, 15));
  }

  return { score: Math.round(score), matched, missing };
}

// ─── Performance Thrust ──────────────────────────────────────────
// Converts 1-5 rating to 0-100. Applies exponential scaling so
// top performers get disproportionately higher scores (like thrust).
function calcPerformanceThrust(perfScore) {
  if (perfScore == null) return { score: 40, label: 'No data' };
  // Exponential: 5/5 → 100, 4/5 → 80, 3/5 → 55, 2/5 → 32, 1/5 → 15
  const normalized = perfScore / 5;
  const score = Math.round(Math.pow(normalized, 1.3) * 100);
  const label = perfScore >= 4 ? 'Exceptional' : perfScore >= 3 ? 'Solid' : 'Developing';
  return { score, label };
}

// ─── Experience Momentum ─────────────────────────────────────────
// Experience has diminishing returns — 10yrs vs 12yrs matters less
// than 2yrs vs 5yrs. Uses logarithmic scaling.
function calcExperienceMomentum(empExp, reqExp) {
  const exp = empExp || 0;
  const req = Math.max(reqExp || 0, 1);

  if (exp >= req) {
    // Meets/exceeds: 80-100 range, log curve for diminishing returns
    const ratio = Math.min(exp / req, 3);
    const score = Math.round(80 + 20 * Math.log2(ratio) / Math.log2(3));
    return { score: Math.min(100, score), label: `${exp}yrs (meets ${req}yr req)` };
  } else {
    // Under-qualified: linear penalty
    const score = Math.round((exp / req) * 75);
    return { score, label: `${exp}yrs (needs ${req}yrs)` };
  }
}

// ─── Availability Fuel ───────────────────────────────────────────
// An overloaded employee can't lift anything. Measures remaining
// capacity as fuel percentage.
function calcAvailabilityFuel(workload, isAvailable) {
  if (!isAvailable) return { score: 0, label: 'Unavailable' };
  const load = workload || 0;
  const capacity = Math.max(0, 10 - load);
  const score = Math.round((capacity / 10) * 100);
  const label = capacity >= 7 ? 'High capacity' : capacity >= 4 ? 'Moderate load' : 'Near capacity';
  return { score, label: `${label} (${load}/10 tasks)` };
}

// ─── Department Alignment ────────────────────────────────────────
function calcDepartmentAlign(empDept, reqDept) {
  if (!reqDept || reqDept === '') return { score: 50, label: 'Any department' };
  if (empDept === reqDept) return { score: 100, label: `${empDept} ✓` };
  return { score: 15, label: `${empDept} (needs ${reqDept})` };
}

// ─── Deadline Fit ────────────────────────────────────────────────
// If a deadline is tight, prefer employees with proven fast delivery.
// Uses avgTaskCompletionDays vs estimatedDays.
function calcDeadlineFit(avgDays, estimatedDays, experience) {
  if (!estimatedDays || estimatedDays <= 0) return { score: 50, label: 'No deadline' };

  if (avgDays != null && avgDays > 0) {
    // Has track record
    const ratio = estimatedDays / avgDays;
    const score = Math.min(100, Math.round(ratio * 70));
    return { score, label: `Avg ${avgDays}d vs ${estimatedDays}d est.` };
  }

  // No track record — estimate from experience
  const estimatedSpeed = Math.max(1, 10 - (experience || 0) * 0.5);
  const score = Math.min(100, Math.round((estimatedDays / estimatedSpeed) * 50));
  return { score: Math.min(100, Math.max(20, score)), label: 'Estimated from exp.' };
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN: Calculate AI Uplift Score
// ═══════════════════════════════════════════════════════════════════
function calculateUplift(employee, requirements) {
  const skillResult   = calcSkillGravity(employee.skills, requirements.requiredSkills);
  const perfResult    = calcPerformanceThrust(employee.performanceScore);
  const expResult     = calcExperienceMomentum(employee.experience, requirements.requiredExperience);
  const availResult   = calcAvailabilityFuel(employee.currentWorkload, employee.availability !== false);
  const deptResult    = calcDepartmentAlign(employee.department, requirements.requiredDepartment);
  const deadlineResult = calcDeadlineFit(employee.avgTaskCompletionDays, requirements.estimatedDays, employee.experience);

  // Build dimension scores
  const dimensions = {
    skillGravity:       { ...skillResult,    weight: DIMENSIONS.skillGravity.weight },
    performanceThrust:  { ...perfResult,     weight: DIMENSIONS.performanceThrust.weight },
    experienceMomentum: { ...expResult,      weight: DIMENSIONS.experienceMomentum.weight },
    availabilityFuel:   { ...availResult,    weight: DIMENSIONS.availabilityFuel.weight },
    departmentAlign:    { ...deptResult,     weight: DIMENSIONS.departmentAlign.weight },
    deadlineFit:        { ...deadlineResult, weight: DIMENSIONS.deadlineFit.weight },
  };

  // Weighted sum
  let upliftScore =
    skillResult.score   * DIMENSIONS.skillGravity.weight +
    perfResult.score    * DIMENSIONS.performanceThrust.weight +
    expResult.score     * DIMENSIONS.experienceMomentum.weight +
    availResult.score   * DIMENSIONS.availabilityFuel.weight +
    deptResult.score    * DIMENSIONS.departmentAlign.weight +
    deadlineResult.score * DIMENSIONS.deadlineFit.weight;

  // ── Bonus / Penalty Multipliers ──
  let multiplier = 1.0;
  const bonuses = [];

  // CRITICAL PENALTY: zero skill overlap on a skill-heavy task → -30%
  if (requirements.requiredSkills?.length >= 3 && skillResult.score === 0) {
    multiplier *= 0.7;
    bonuses.push('⚠ No skill overlap');
  }

  // BONUS: perfect skill match + high performer → +10%
  if (skillResult.score >= 95 && perfResult.score >= 80) {
    multiplier *= 1.10;
    bonuses.push('🚀 Star candidate');
  }

  // PENALTY: overloaded → -15%
  if (availResult.score <= 20) {
    multiplier *= 0.85;
    bonuses.push('⚠ Near capacity');
  }

  // BONUS: exact department + high availability → +5%
  if (deptResult.score === 100 && availResult.score >= 80) {
    multiplier *= 1.05;
    bonuses.push('✓ Dept + Available');
  }

  upliftScore = Math.round(upliftScore * multiplier * 100) / 100;
  upliftScore = Math.max(0, Math.min(100, upliftScore));

  // ── Confidence Level ──
  // How much data do we have to trust this score?
  let dataPoints = 0;
  if (employee.skills?.length > 0) dataPoints++;
  if (employee.performanceScore != null) dataPoints++;
  if (employee.experience != null) dataPoints++;
  if (employee.currentWorkload != null) dataPoints++;
  if (employee.avgTaskCompletionDays != null) dataPoints++;
  const confidence = Math.round((dataPoints / 5) * 100);

  return {
    upliftScore,
    confidence,
    multiplier: Math.round(multiplier * 100) / 100,
    bonuses,
    dimensions,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  Build Natural-Language Reason
// ═══════════════════════════════════════════════════════════════════
function buildAgentReason(employee, upliftResult, requirements) {
  const d = upliftResult.dimensions;
  const parts = [];

  // Lead with strongest dimension
  const dimScores = [
    { name: 'skills', score: d.skillGravity.score, text: `Strong skill match (${(d.skillGravity.matched || []).join(', ')})` },
    { name: 'perf',   score: d.performanceThrust.score, text: `${d.performanceThrust.label} performer (${employee.performanceScore}/5)` },
    { name: 'exp',    score: d.experienceMomentum.score, text: `${employee.experience}yrs experience` },
    { name: 'avail',  score: d.availabilityFuel.score, text: d.availabilityFuel.label },
    { name: 'dept',   score: d.departmentAlign.score, text: d.departmentAlign.label },
  ];

  // Pick top 3 scoring dimensions for the reason
  dimScores.sort((a, b) => b.score - a.score);
  dimScores.slice(0, 3).forEach(dim => {
    if (dim.score >= 50) parts.push(dim.text);
  });

  // Add any bonuses
  upliftResult.bonuses.forEach(b => parts.push(b));

  if (parts.length === 0) parts.push('General profile fit');

  return parts.join(' • ');
}

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC API: Run the AI Agent
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze a project/task and return the top N recommended employees,
 * ranked by their AI Uplift Score.
 *
 * @param {Object} requirements - { requiredSkills[], requiredExperience, requiredDepartment, estimatedDays, difficulty }
 * @param {Number} topN - how many results to return (default 5)
 * @returns {Object} { agentName, requirements, recommendations[] }
 */
async function runAIAgent(requirements, topN = 5) {
  // Query only active employees from MongoDB
  const employees = await Employee.find({ status: 'Active' }).lean();

  // Score every candidate
  const candidates = employees.map(emp => {
    const uplift = calculateUplift(emp, requirements);
    const reason = buildAgentReason(emp, uplift, requirements);

    return {
      employee: {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        skills: emp.skills,
        performanceScore: emp.performanceScore,
        experience: emp.experience,
        currentWorkload: emp.currentWorkload,
        location: emp.location,
        completedProjects: emp.completedProjects,
      },
      upliftScore: uplift.upliftScore,
      confidence: uplift.confidence,
      multiplier: uplift.multiplier,
      bonuses: uplift.bonuses,
      dimensions: uplift.dimensions,
      reason,
    };
  });

  // Sort by uplift score descending
  candidates.sort((a, b) => b.upliftScore - a.upliftScore);

  return {
    agentName: 'AI Agent',
    agentVersion: '1.0.0',
    evaluatedCandidates: candidates.length,
    requirements,
    timestamp: new Date().toISOString(),
    recommendations: candidates.slice(0, topN),
  };
}

module.exports = { runAIAgent, calculateUplift, DIMENSIONS };
