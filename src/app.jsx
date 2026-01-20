import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './services/api';

import Login from './components/Auth/login';
import ProfessorDashboard from './components/Professor/Dashboard';
import StudentDashboard from './components/Student/Dashboard';
import AdminDashboard from './components/Admin/dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        setUserType(data.role); // admin | professor | student
      } catch (err) {
        setUser(null);
        setUserType(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        <Route
          path="/"
          element={
            user ? (
              userType === 'professor' ? <ProfessorDashboard /> :
              userType === 'student' ? <StudentDashboard /> :
              userType === 'admin' ? <AdminDashboard /> :
              <Navigate to="/login" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
