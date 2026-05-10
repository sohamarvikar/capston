import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Tasks & Progress (Role Based)
export const getMyTasks = () => api.get('/tasks/my');
export const startTask = (data) => api.patch('/tasks/start', data);
export const completeTask = (data) => api.patch('/tasks/complete', data);
export const uploadDocument = (data) => api.post('/tasks/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getProjectProgress = (projectKey) => api.get(`/tasks/progress/${projectKey}`);
export const getTaskSubmissions = (projectKey, issueKey) => api.get(`/tasks/submissions/${projectKey}/${issueKey}`);

// Notices & Communication
export const getNotices = () => api.get('/notices');
export const sendNotice = (data) => api.post('/notices', data);
export const replyToNotice = (id, data) => api.post(`/notices/${id}/reply`, data);
export const markNoticeAsRead = (id) => api.patch(`/notices/${id}/read`);

// Dashboard & Analytics
export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getTopEmployees = () => api.get('/analytics/top-performers?limit=5');

// Employee CRUD
export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const updateEmployeeSkills = (id, skills) => api.patch(`/employees/${id}/skills`, { skills });

// Project CRUD
export const getProjects = (params) => api.get('/projects', { params });
export const getProjectDetails = (projectKey) => api.get(`/projects/${projectKey}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (projectKey, data) => api.put(`/projects/${projectKey}`, data);
export const deleteProject = (projectKey) => api.delete(`/projects/${projectKey}`);
export const addTaskToProject = (projectKey, taskData) => api.post(`/projects/${projectKey}/tasks`, taskData);

// AI Recommendation
export const getRecommendationForTask = (taskData) => api.post('/recommendations/for-task', taskData);
export const getRecommendationForProject = (projectKey) => api.get(`/recommendations/for-project/${projectKey}`);
export const assignTask = (projectKey, issueKey, data) => api.patch(`/projects/${projectKey}/tasks/${issueKey}/assign`, data);
export const autoReassignTask = (projectKey, issueKey) => api.patch(`/projects/${projectKey}/tasks/${issueKey}/reassign`);
export const acceptRecommendation = (data) => api.post('/recommendations/accept', data);
export const getAssignments = (params) => api.get('/recommendations/assignments', { params });

// AI Agent
export const runAIAgent = (data) => api.post('/ai/analyze', data);
export const analyzeProjectWithAgent = (projectKey) => api.get(`/ai/project/${projectKey}`);
export const getAgentDimensions = () => api.get('/ai/dimensions');
export const generateTasks = (data) => api.post('/ai/generate-tasks', data);

export default api;
