const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Employee = require('../models/Employee');

dotenv.config();

/**
 * Run this script to automatically generate User accounts 
 * for all Employees in your dataset.
 * 
 * Usage: node src/scripts/createUsersForEmployees.js
 */
const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karmavyuha');
    console.log('📦 Connected to MongoDB');

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees. Generating user accounts...`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      // Create a generic email based on their name
      // Example: "John Doe" -> "john.doe@company.com"
      const email = `${emp.name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
      
      // Check if user already exists
      const exists = await User.findOne({ email });
      
      if (!exists) {
        await User.create({
          name: emp.name,
          email: email,
          password: 'password123', // Default generic password
          role: 'employee',
          department: emp.department,
          employeeRef: emp._id, // Standard Mongoose reference
          employeeId: emp.employeeId, // Numeric ID for $lookup
        });
        createdCount++;
      } else {
        // If user exists, just ensure their employeeId is mapped correctly
        if (!exists.employeeId) {
          exists.employeeId = emp.employeeId;
          exists.employeeRef = emp._id;
          await exists.save();
        }
        skippedCount++;
      }
    }

    console.log(`✅ Finished! Created ${createdCount} new users. Skipped ${skippedCount} existing.`);
    console.log(`Employees can now log in using their new email (e.g., firstname.lastname@company.com)`);
    console.log(`and the default password "password123" OR the master password "man123".`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

createUsers();
