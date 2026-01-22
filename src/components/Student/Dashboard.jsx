// StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { assessments } from '../../services/api';
import AssessmentForm from './assessment';

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [studentAssessments, setStudentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await assessments.getByStudent();
      setStudentAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
      setMessage('Failed to load your submitted assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎓 Student Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {user?.fullName || 'Student'} ({user?.role || 'N/A'})</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Assessment Form */}
        <div className="card">
          <AssessmentForm />
        </div>

        {/* Submitted Assessments */}
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Your Submitted Assessments</h2>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : studentAssessments.length === 0 ? (
            <p>No assessments submitted yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Subject</th>
                  <th>Total Score</th>
                  <th>Average Rating</th>
                  <th>Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {studentAssessments.map(a => (
                  <tr key={a._id}>
                    <td>{a.professorName}</td>
                    <td>{a.subject}</td>
                    <td>{a.totalScore}</td>
                    <td>{a.averageRating}</td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Disclaimer */}
        <div className="card" style={{ marginTop: '30px', background: '#fff3e0', border: '2px solid #ff9800' }}>
          <h3>⚠️ Important Reminder</h3>
          <p>Please provide honest feedback. Misleading information may result in administrative actions.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
