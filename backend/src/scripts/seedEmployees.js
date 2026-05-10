/**
 * Seed Employees from CSV.
 * Also auto-assigns skills based on department for AI matching.
 * Usage: npm run seed:employees
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Employee = require('../models/Employee');
const CSV_PATH = path.join(__dirname, '../../data/Employe_Performance_dataset.csv');

// Department-based skill pools for realistic AI matching
const SKILL_POOLS = {
  IT: ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker', 'git', 'mongodb', 'typescript', 'api-design', 'devops', 'testing', 'linux'],
  HR: ['recruitment', 'onboarding', 'compliance', 'payroll', 'training', 'conflict-resolution', 'policy-writing', 'benefits-admin', 'performance-mgmt', 'labor-law'],
  Sales: ['crm', 'lead-generation', 'negotiation', 'cold-calling', 'salesforce', 'b2b-sales', 'pipeline-mgmt', 'presentation', 'market-analysis', 'account-mgmt'],
};

function assignSkills(dept, experience) {
  const pool = SKILL_POOLS[dept] || SKILL_POOLS.IT;
  // More experienced = more skills (3–8 skills based on experience)
  const count = Math.min(3 + Math.floor(experience / 4), 8);
  // Shuffle and pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    if (!fs.existsSync(CSV_PATH)) {
      console.error('❌ CSV not found at:', CSV_PATH);
      process.exit(1);
    }

    const employees = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          const exp = parseInt(row['Experience']) || 0;
          const dept = (row['Department'] || 'IT').trim();
          employees.push({
            employeeId: parseInt(row['ID']),
            name: (row['Name'] || '').trim(),
            age: parseInt(row['Age']),
            gender: (row['Gender'] || '').trim(),
            department: dept,
            salary: parseFloat(row['Salary']),
            joiningDate: new Date(row['Joining Date']),
            performanceScore: row['Performance Score'] ? parseFloat(row['Performance Score']) : null,
            experience: exp,
            status: (row['Status'] || 'Active').trim(),
            location: (row['Location'] || '').trim(),
            session: (row['Session'] || '').trim(),
            // AI fields
            skills: assignSkills(dept, exp),
            currentWorkload: Math.floor(Math.random() * 4), // 0–3 random initial load (MAX_WORKLOAD = 3)
            availability: (row['Status'] || '').trim() === 'Active',
            completedProjects: Math.floor(Math.random() * exp * 2),
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await Employee.deleteMany({});
    await Employee.insertMany(employees, { ordered: false });

    console.log(`✅ Seeded ${employees.length} employees with skills`);

    // Summary
    const depts = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, avgPerf: { $avg: '$performanceScore' } } },
      { $sort: { _id: 1 } },
    ]);
    console.log('\n📊 Department Summary:');
    depts.forEach((d) => console.log(`  ${d._id}: ${d.count} employees, Avg Performance: ${(d.avgPerf || 0).toFixed(2)}`));

    process.exit(0);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

seed();
