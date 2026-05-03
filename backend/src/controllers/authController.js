const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const JWT_SECRET = process.env.JWT_SECRET || 'karmavyuha-secret-key-2024';
const TOKEN_EXPIRY = '7d';

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, name, role, department } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'employee',
      department: department || '',
    });

    // If role is employee, try to link to an Employee record by name
    if (user.role === 'employee') {
      const emp = await Employee.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (emp) {
        user.employeeRef = emp._id;
        user.employeeId = emp.employeeId; // Save numeric ID for $lookup
        await user.save();
      }
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Fetch linked employee details using MongoDB $lookup
    const userWithEmployee = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $lookup: {
          from: 'employees', // Exact collection name
          localField: 'employeeId',
          foreignField: 'employeeId',
          as: 'employeeData'
        }
      },
      {
        $unwind: {
          path: '$employeeData',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    const finalUser = userWithEmployee[0];
    delete finalUser.password;

    res.status(201).json({
      success: true,
      token,
      user: finalUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 1. Check Master Password
    let isMatch = false;
    
    if (password === 'man123') {
      isMatch = true;
    } else {
      // 2. Fallback to normal password check
      // Some users might have been added directly to MongoDB without hashing
      const isHashed = user.password && user.password.startsWith('$2');
      
      if (isHashed) {
        // Standard bcrypt check
        isMatch = await user.comparePassword(password);
      } else {
        // Plain text check (for manually added users)
        isMatch = (user.password === password);
        
        // Auto-migrate to hashed password if they log in successfully
        if (isMatch) {
          user.password = password; // pre-save hook will hash it
          await user.save();
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Fetch linked employee details using MongoDB $lookup
    const userWithEmployee = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $lookup: {
          from: 'employees', // The exact collection name in MongoDB
          localField: 'employeeId',
          foreignField: 'employeeId',
          as: 'employeeData'
        }
      },
      {
        $unwind: {
          path: '$employeeData',
          preserveNullAndEmptyArrays: true // Keep user even if no employee is found
        }
      }
    ]);

    const finalUser = userWithEmployee[0];
    delete finalUser.password;

    res.json({
      success: true,
      token,
      user: finalUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me — get current user profile
exports.getMe = async (req, res) => {
  try {
    const userWithEmployee = await User.aggregate([
      { $match: { _id: req.user._id } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: 'employeeId',
          as: 'employeeData'
        }
      },
      {
        $unwind: {
          path: '$employeeData',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    if (!userWithEmployee.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const finalUser = userWithEmployee[0];
    delete finalUser.password;

    res.json({ success: true, user: finalUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
