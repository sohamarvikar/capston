const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/antigravity', require('./routes/antigravityRoutes'));
app.use('/uploads', express.static('uploads')); // serve uploaded files

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Karmavyuha AI API is running',
    version: '2.0.0',
    timestamp: new Date(),
    aiKeys: {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Karmavyuha — AI-Driven Workforce & Project Management',
    version: '2.0.0',
    endpoints: {
      employees: 'GET /api/employees',
      projects: 'GET /api/projects',
      recommendations: 'POST /api/recommendations/for-task',
      analytics: 'GET /api/analytics/dashboard',
      upload: 'POST /api/upload/employees | /api/upload/projects',
      health: 'GET /api/health',
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Karmavyuha AI running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
