// Student Dashboard - Using AuthContext
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎓 Student Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {user?.fullName || 'Student'}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <h2>Welcome, Student!</h2>
          <p>Student dashboard features will be added here...</p>
          <p>You will be able to:</p>
          <ul>
            <li>Submit professor assessments</li>
            <li>View class schedules</li>
            <li>Update your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;