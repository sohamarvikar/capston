import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardStats = () => api.get('/analytics/dashboard');

export const getEmployees = (params) => api.get('/employees', { params });
export const getTopEmployees = () => api.get('/analytics/top-performers?limit=5');
export const createEmployee = (data) => api.post('/employees', data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

export const getProjects = (params) => api.get('/projects', { params });
export const getProjectDetails = (projectKey) => api.get(`/projects/${projectKey}`);
export const createProject = (data) => api.post('/projects', data);
export const addTaskToProject = (projectKey, taskData) => api.post(`/projects/${projectKey}/tasks`, taskData);

// AI Recommendation APIs
export const getRecommendationForTask = (taskData) => api.post('/recommendations/for-task', taskData);
export const assignTask = (projectKey, issueKey, data) => api.patch(`/projects/${projectKey}/tasks/${issueKey}/assign`, data);
export const acceptRecommendation = (data) => api.post('/recommendations/accept', data);

export default api;
