/**
 * Seed Projects.
 *
 * If GFG_FINAL.csv exists in data/ → streams it and imports projects.
 * Otherwise → creates realistic sample projects for demonstration.
 *
 * The GFG_FINAL.csv is 113MB from Google Drive.
 * This script handles it with stream processing + batch inserts.
 *
 * Usage: npm run seed:projects
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Project = require('../models/Project');

const CSV_PATH = path.join(__dirname, '../../data/GFG_FINAL.csv');

// Sample projects for when the large CSV isn't available
const SAMPLE_PROJECTS = [
  {
    projectKey: 'WEBAPP',
    projectName: 'Customer Portal Redesign',
    projectType: 'software',
    projectLead: 'admin',
    description: 'Redesign the customer-facing web portal with modern UI/UX',
    requiredSkills: ['javascript', 'react', 'api-design', 'typescript'],
    requiredDepartment: 'IT',
    tasks: [
      { issueKey: 'WEBAPP-1', summary: 'Setup React project with TypeScript', issueType: 'Task', status: 'Open', priority: 'High', requiredSkills: ['react', 'typescript'], requiredDepartment: 'IT', requiredExperience: 3, estimatedDays: 3 },
      { issueKey: 'WEBAPP-2', summary: 'Design REST API endpoints for user management', issueType: 'Task', status: 'Open', priority: 'High', requiredSkills: ['node.js', 'api-design', 'mongodb'], requiredDepartment: 'IT', requiredExperience: 5, estimatedDays: 5 },
      { issueKey: 'WEBAPP-3', summary: 'Fix authentication token expiration bug', issueType: 'Bug', status: 'Open', priority: 'Critical', requiredSkills: ['javascript', 'node.js', 'testing'], requiredDepartment: 'IT', requiredExperience: 4, estimatedDays: 2 },
      { issueKey: 'WEBAPP-4', summary: 'Build dashboard analytics component', issueType: 'Story', status: 'Open', priority: 'Medium', requiredSkills: ['react', 'javascript', 'sql'], requiredDepartment: 'IT', requiredExperience: 3, estimatedDays: 7 },
      { issueKey: 'WEBAPP-5', summary: 'Deploy to AWS with CI/CD pipeline', issueType: 'Task', status: 'Open', priority: 'Medium', requiredSkills: ['aws', 'docker', 'devops', 'git'], requiredDepartment: 'IT', requiredExperience: 6, estimatedDays: 4 },
    ],
  },
  {
    projectKey: 'HRMOD',
    projectName: 'HR Onboarding Automation',
    projectType: 'software',
    projectLead: 'hr_lead',
    description: 'Automate the new employee onboarding process',
    requiredSkills: ['recruitment', 'onboarding', 'compliance'],
    requiredDepartment: 'HR',
    tasks: [
      { issueKey: 'HRMOD-1', summary: 'Create digital onboarding checklist system', issueType: 'Story', status: 'Open', priority: 'High', requiredSkills: ['onboarding', 'policy-writing'], requiredDepartment: 'HR', requiredExperience: 4, estimatedDays: 10 },
      { issueKey: 'HRMOD-2', summary: 'Build compliance verification workflow', issueType: 'Task', status: 'Open', priority: 'Critical', requiredSkills: ['compliance', 'labor-law'], requiredDepartment: 'HR', requiredExperience: 6, estimatedDays: 8 },
      { issueKey: 'HRMOD-3', summary: 'Design automated benefits enrollment form', issueType: 'Task', status: 'Open', priority: 'Medium', requiredSkills: ['benefits-admin', 'payroll'], requiredDepartment: 'HR', requiredExperience: 3, estimatedDays: 5 },
    ],
  },
  {
    projectKey: 'SALESAI',
    projectName: 'AI-Powered Sales Pipeline',
    projectType: 'software',
    projectLead: 'sales_mgr',
    description: 'Implement AI-driven lead scoring and sales predictions',
    requiredSkills: ['crm', 'salesforce', 'market-analysis'],
    requiredDepartment: 'Sales',
    tasks: [
      { issueKey: 'SALESAI-1', summary: 'Integrate Salesforce CRM with analytics dashboard', issueType: 'Story', status: 'Open', priority: 'High', requiredSkills: ['salesforce', 'crm', 'pipeline-mgmt'], requiredDepartment: 'Sales', requiredExperience: 5, estimatedDays: 12 },
      { issueKey: 'SALESAI-2', summary: 'Build lead scoring algorithm based on market data', issueType: 'Task', status: 'Open', priority: 'High', requiredSkills: ['market-analysis', 'lead-generation', 'b2b-sales'], requiredDepartment: 'Sales', requiredExperience: 7, estimatedDays: 10 },
      { issueKey: 'SALESAI-3', summary: 'Create client presentation templates', issueType: 'Task', status: 'Open', priority: 'Low', requiredSkills: ['presentation', 'account-mgmt'], requiredDepartment: 'Sales', requiredExperience: 2, estimatedDays: 3 },
    ],
  },
  {
    projectKey: 'DEVOPS',
    projectName: 'Infrastructure Modernization',
    projectType: 'software',
    projectLead: 'infra_lead',
    description: 'Migrate legacy infrastructure to cloud-native architecture',
    requiredSkills: ['aws', 'docker', 'linux', 'devops'],
    requiredDepartment: 'IT',
    tasks: [
      { issueKey: 'DEVOPS-1', summary: 'Containerize all microservices with Docker', issueType: 'Epic', status: 'Open', priority: 'Critical', requiredSkills: ['docker', 'linux', 'devops'], requiredDepartment: 'IT', requiredExperience: 8, estimatedDays: 20 },
      { issueKey: 'DEVOPS-2', summary: 'Set up monitoring and alerting system', issueType: 'Task', status: 'Open', priority: 'High', requiredSkills: ['aws', 'devops', 'linux'], requiredDepartment: 'IT', requiredExperience: 5, estimatedDays: 7 },
      { issueKey: 'DEVOPS-3', summary: 'Implement database backup automation', issueType: 'Task', status: 'Open', priority: 'High', requiredSkills: ['mongodb', 'sql', 'aws'], requiredDepartment: 'IT', requiredExperience: 4, estimatedDays: 5 },
    ],
  },
  {
    projectKey: 'MOBILE',
    projectName: 'Employee Mobile App',
    projectType: 'software',
    projectLead: 'mobile_lead',
    description: 'Build a cross-platform mobile app for employee self-service',
    requiredSkills: ['react', 'javascript', 'api-design'],
    requiredDepartment: 'IT',
    tasks: [
      { issueKey: 'MOBILE-1', summary: 'Build cross-platform React Native app shell', issueType: 'Story', status: 'Open', priority: 'High', requiredSkills: ['react', 'javascript', 'typescript'], requiredDepartment: 'IT', requiredExperience: 4, estimatedDays: 10 },
      { issueKey: 'MOBILE-2', summary: 'Implement push notification service', issueType: 'Task', status: 'Open', priority: 'Medium', requiredSkills: ['node.js', 'aws', 'api-design'], requiredDepartment: 'IT', requiredExperience: 3, estimatedDays: 5 },
      { issueKey: 'MOBILE-3', summary: 'Write end-to-end test suite', issueType: 'Task', status: 'Open', priority: 'Medium', requiredSkills: ['testing', 'javascript'], requiredDepartment: 'IT', requiredExperience: 2, estimatedDays: 7 },
    ],
  },
];

async function seedFromCSV() {
  console.log('📄 Found GFG_FINAL.csv — streaming large dataset...');

  const projectMap = new Map();
  let rowCount = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        if (rowCount % 50000 === 0) process.stdout.write(`  Processed ${rowCount} rows...\r`);

        const pKey = (row['Project key'] || row['Project.key'] || '').trim();
        if (!pKey) return;

        if (!projectMap.has(pKey)) {
          projectMap.set(pKey, {
            projectKey: pKey,
            projectName: (row['Project name'] || row['Project.name'] || pKey).trim(),
            projectType: (row['Project type'] || row['Project.type'] || 'software').trim(),
            projectLead: (row['Project lead'] || row['Project.lead'] || '').trim(),
            description: (row['Project description'] || row['Project.description'] || '').trim().substring(0, 500),
            requiredSkills: [],
            requiredDepartment: 'IT',
            tasks: [],
          });
        }

        const proj = projectMap.get(pKey);
        if (proj.tasks.length < 50) { // cap tasks per project
          let issueType = (row['Issue Type'] || row['Issue.Type'] || 'Task').trim();
          const validTypes = ['Bug', 'Task', 'Story', 'Epic', 'Suggestion', 'Improvement', 'New Feature', 'Sub-task'];
          if (!validTypes.includes(issueType)) issueType = 'Other';

          let status = (row['Status'] || '').trim();
          const validStatuses = ['Open', 'In Progress', 'Closed', 'Resolved', 'Reopened', 'Needs Triage'];
          if (!validStatuses.includes(status)) status = 'Other';

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

  console.log(`\n📊 Parsed ${rowCount} rows → ${projectMap.size} unique projects`);

  // Batch insert
  const projects = Array.from(projectMap.values()).map((p) => ({
    ...p,
    totalTasks: p.tasks.length,
    openTasks: p.tasks.filter((t) => t.status === 'Open' || t.status === 'Needs Triage').length,
  }));

  await Project.deleteMany({});
  const BATCH = 50;
  for (let i = 0; i < projects.length; i += BATCH) {
    await Project.insertMany(projects.slice(i, i + BATCH), { ordered: false });
  }

  return projects.length;
}

async function seedSampleData() {
  console.log('📋 Using sample project data (GFG_FINAL.csv not found in data/)');

  const projects = SAMPLE_PROJECTS.map((p) => ({
    ...p,
    totalTasks: p.tasks.length,
    openTasks: p.tasks.filter((t) => t.status === 'Open').length,
  }));

  await Project.deleteMany({});
  await Project.insertMany(projects);
  return projects.length;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    let count;
    if (fs.existsSync(CSV_PATH)) {
      count = await seedFromCSV();
    } else {
      count = await seedSampleData();
      console.log('\n💡 To import the full Jira dataset:');
      console.log('   1. Download GFG_FINAL.csv from Google Drive');
      console.log('   2. Place it at: data/GFG_FINAL.csv');
      console.log('   3. Run: npm run seed:projects');
    }

    console.log(`\n✅ Seeded ${count} projects`);
    process.exit(0);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

seed();
