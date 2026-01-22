// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const auth = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }
};

// Users (Admin only)
export const users = {
  createProfessor: async (data) => {
    const response = await api.post('/users/professor', data);
    return response.data;
  },
  
  createStudent: async (data) => {
    const response = await api.post('/users/student', data);
    return response.data;
  },
  
  getProfessors: async () => {
    const response = await api.get('/users/professors');
    return response.data;
  },
  
  getStudents: async () => {
    const response = await api.get('/users/students');
    return response.data;
  },
  
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Assessments
export const assessments = {
  create: async (data) => {
    const response = await api.post('/assessments', data);
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/assessments');
    return response.data;
  },
  
  getByProfessor: async (professorId) => {
    const response = await api.get(`/assessments/professor/${professorId}`);
    return response.data;
  },

  getByStudent: async () => {
    const response = await api.get('/assessments/student');
    return response.data;
  }
};

// Archive (Admin only)
export const archive = {
  getSummary: async () => {
    const response = await api.get('/archive/summary');
    return response.data;
  },
  
  markComplete: async () => {
    const response = await api.post('/archive/mark-complete');
    return response.data;
  },
  
  executeCleanup: async () => {
    const response = await api.post('/archive/cleanup');
    return response.data;
  },
  
  exportAttendance: async (professorId = null, startDate = null, endDate = null) => {
    const params = {};
    if (professorId) params.professorId = professorId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/archive/export/attendance', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  
  exportAssessments: async (professorId = null) => {
    const params = professorId ? { professorId } : {};
    const response = await api.get('/archive/export/assessments', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

export default api;