// Dashboard.jsx - Student Dashboard (Fixed for MongoDB)
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/api';

function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      // Clear localStorage
      auth.logout();
      
      // Redirect to login
      navigate('/login');
      
      // Force reload to clear state
      window.location.reload();
    }
  };

  // Get user info from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData.fullName || 'Student';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎓 Student Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {userName}</span>
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