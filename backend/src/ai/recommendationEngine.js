const Employee = require('../models/Employee');

const MAX_WORKLOAD = 3;

/**
 * AI Recommendation Engine
 *
 * Uses a weighted multi-factor scoring algorithm to recommend
 * the best employee for a given project/task.
 *
 * Scoring Factors (configurable weights):
 *   1. Skill Match        (40%) — how many required skills the employee has
 *   2. Performance Score  (25%) — past performance rating (1–5)
 *   3. Experience         (15%) — years of experience
 *   4. Availability       (10%) — current workload (lower = better)
 *   5. Department Match   (10%) — does department match requirement?
 *
 * This is a "Random-Forest-like" approach using manual feature engineering
 * and weighted scoring. For a college capstone this demonstrates the concept
 * without needing Python ML libraries.
 */

const WEIGHTS = {
  skillMatch: 0.40,
  performance: 0.25,
  experience: 0.15,
  availability: 0.10,
  departmentMatch: 0.10,
};

/**
 * Normalizes employee skills from the database.
 * Handles arrays, comma-separated strings, and null/undefined values.
 */
function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s).toLowerCase().trim());
  }
  if (typeof skills === 'string') {
    return skills.split(',').map((s) => s.toLowerCase().trim());
  }
  return [];
}

/**
 * Calculate the recommendation score for a single employee
 * against a set of project/task requirements.
 */
function calculateScore(employee, requirements) {
  const scores = {};

  // 1. Skill Match Score (0–100) using Partial Matching
  if (requirements.requiredSkills && requirements.requiredSkills.length > 0) {
    const empSkills = normalizeSkills(employee.skills);
    const reqSkills = requirements.requiredSkills.map((s) => s.toLowerCase().trim());
    
    // Partial Match: Check if any employee skill contains the required skill, or vice versa
    const matched = reqSkills.filter((reqSkill) => {
      return empSkills.some(empSkill => empSkill.includes(reqSkill) || reqSkill.includes(empSkill));
    }).length;
    
    scores.skillMatch = (matched / reqSkills.length) * 100;
  } else {
    scores.skillMatch = 50; // neutral if no skills required
  }

  // 2. Performance Score (0–100)
  if (employee.performanceScore != null) {
    scores.performance = (employee.performanceScore / 5) * 100;
  } else {
    scores.performance = 50; // neutral if no score
  }

  // 3. Experience Score (0–100) — normalized, capped at 20 years
  const expNorm = Math.min(employee.experience || 0, 20);
  const reqExp = requirements.requiredExperience || 0;
  if (reqExp > 0) {
    // Bonus if exceeds requirement, penalty if under
    scores.experience = Math.min((expNorm / reqExp) * 100, 100);
  } else {
    scores.experience = Math.min((expNorm / 20) * 100, 100);
  }

  // 4. Availability Score (0–100) — lower workload = higher score
  const workload = employee.currentWorkload || 0;
  scores.availability = Math.max(0, ((MAX_WORKLOAD - workload) / MAX_WORKLOAD) * 100);
  if (!employee.availability) scores.availability = 0;

  // 5. Department Match (0 or 100)
  if (requirements.requiredDepartment && requirements.requiredDepartment !== '') {
    scores.departmentMatch =
      employee.department === requirements.requiredDepartment ? 100 : 20;
  } else {
    scores.departmentMatch = 50;
  }

  // Weighted final score
  const finalScore =
    scores.skillMatch * WEIGHTS.skillMatch +
    scores.performance * WEIGHTS.performance +
    scores.experience * WEIGHTS.experience +
    scores.availability * WEIGHTS.availability +
    scores.departmentMatch * WEIGHTS.departmentMatch;

  return {
    finalScore: Math.round(finalScore * 100) / 100,
    breakdown: scores,
  };
}

/**
 * Build a human-readable reason string for why this employee was recommended.
 */
function buildReason(employee, breakdown, requirements) {
  const reasons = [];
  const empSkills = normalizeSkills(employee.skills);
  const reqSkills = (requirements.requiredSkills || []).map(s => s.toLowerCase().trim());
  
  const matchedSkills = empSkills.filter(empSkill => 
    reqSkills.some(reqSkill => empSkill.includes(reqSkill) || reqSkill.includes(empSkill))
  );

  if (matchedSkills.length > 0) {
    reasons.push(`Skills matched: ${matchedSkills.join(', ')}`);
  }
  if (breakdown.performance >= 80) reasons.push(`High performer (${employee.performanceScore}/5)`);
  if (breakdown.experience >= 70) reasons.push(`${employee.experience}yrs experience`);
  if (breakdown.availability >= 80) reasons.push('Low workload — available');
  if (breakdown.departmentMatch === 100) reasons.push(`${employee.department} dept match`);

  return {
    reasonText: reasons.length > 0 ? reasons.join(' • ') : 'General fit based on profile',
    matchedSkills
  };
}

/**
 * Main recommendation function.
 * Finds the top N employees best suited for a project/task.
 *
 * @param {Object} requirements - { requiredSkills, requiredExperience, requiredDepartment }
 * @param {Number} topN - how many recommendations to return
 * @returns {Array} Sorted list of { employee, score, breakdown, reason }
 */
async function recommendEmployees(requirements, topN = 5) {
  // Only consider active, available employees
  const filter = { status: { $ne: 'Inactive' } };
  if (requirements.requiredDepartment && requirements.requiredDepartment !== '') {
    // Include both matching department AND others (they get scored lower)
    // so we still consider cross-department talent
  }

  const employees = await Employee.find(filter).lean();

  const ranked = [];
  
  for (const emp of employees) {
    // Skip employees at or above max workload
    if ((emp.currentWorkload || 0) >= MAX_WORKLOAD) continue;
    try {
      const empSkills = normalizeSkills(emp.skills);
      // Optional defensive logging if needed: console.log("[AI Matchmaker] Normalized Skills:", emp.name, empSkills);
      
      const { finalScore, breakdown } = calculateScore(emp, requirements);
      const { reasonText, matchedSkills } = buildReason(emp, breakdown, requirements);
      
      ranked.push({
        employee: {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          department: emp.department,
          skills: empSkills, // Return normalized skills to frontend
          performanceScore: emp.performanceScore,
          experience: emp.experience,
          currentWorkload: emp.currentWorkload,
          location: emp.location,
        },
        score: finalScore,
        breakdown,
        reason: reasonText,
        matchedSkills,
      });
    } catch (err) {
      console.error(`[AI Matchmaker] Error scoring employee ${emp.employeeId} (${emp.name}):`, err.message);
      // Continue to next employee instead of crashing the whole recommendation
    }
  }

  // Sort by score descending
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, topN);
}

/**
 * Recommend employees for all open tasks in a project.
 */
async function recommendForProject(project, topN = 3) {
  const openTasks = (project.tasks || []).filter(
    (t) => t.status === 'Open' || t.status === 'Needs Triage'
  );

  const recommendations = [];
  for (const task of openTasks) {
    const reqs = {
      requiredSkills: task.requiredSkills || project.requiredSkills || [],
      requiredExperience: task.requiredExperience || 0,
      requiredDepartment: task.requiredDepartment || project.requiredDepartment || '',
    };
    const topEmployees = await recommendEmployees(reqs, topN);
    recommendations.push({
      task: {
        issueKey: task.issueKey,
        summary: task.summary,
        issueType: task.issueType,
        priority: task.priority,
      },
      recommendations: topEmployees,
    });
  }

  return recommendations;
}

module.exports = { recommendEmployees, recommendForProject, calculateScore };
