// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response); // Update state immediately
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null); // Update state immediately
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};