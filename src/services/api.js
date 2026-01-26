// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

// Attendance (NEW)
export const attendance = {
  // Start attendance session with image
  start: async (data, imageBlob) => {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('section', data.section);
    if (data.classRoom) formData.append('classRoom', data.classRoom);
    if (data.notes) formData.append('notes', data.notes);
    formData.append('image', imageBlob, 'start-image.jpg');

    const response = await api.post('/attendance/start', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // End attendance session with image
  end: async (attendanceId, imageBlob) => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'end-image.jpg');

    const response = await api.post(`/attendance/end/${attendanceId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get today's attendance sessions
  getToday: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  // Get attendance history with filters
  getHistory: async (filters = {}) => {
    const response = await api.get('/attendance/history', {
      params: filters
    });
    return response.data;
  },

  // Get attendance statistics
  getStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },

  // Delete attendance session
  delete: async (attendanceId) => {
    const response = await api.delete(`/attendance/${attendanceId}`);
    return response.data;
  },

  // Export attendance to CSV
  exportCSV: async (filters = {}) => {
    const response = await api.get('/attendance/export/csv', {
      params: filters,
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  },

  // Export attendance to PDF
  exportPDF: async (filters = {}) => {
    const response = await api.get('/attendance/export/pdf', {
      params: filters,
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
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
    return response;
  },
  
exportAssessments: async (professorId = null, startDate = null, endDate = null) => {
  const params = {};
  if (professorId) params.professorId = professorId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get('/archive/export/assessments', {
    params,
    responseType: 'blob'
  });

  return response;
}
};

export const publicApi = {
  getProfessors: async () => {
    const response = await api.get('/public/professors');
    return response.data;
  }
};

export default api;