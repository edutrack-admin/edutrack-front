// Professor Dashboard - Updated with MarkAttendance Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MarkAttendance from './MarkAttendance';
import './prof.css';

function ProfessorDashboard() {
  const [activeTab, setActiveTab] = useState('mark');
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
          <h1>📚 Professor Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {user?.fullName || 'Professor'}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>TOTAL CLASSES</h3>
            <div className="stat-number">0</div>
          </div>
          <div className="stat-card">
            <h3>THIS WEEK</h3>
            <div className="stat-number">0</div>
          </div>
          <div className="stat-card">
            <h3>THIS MONTH</h3>
            <div className="stat-number">0</div>
          </div>
          <div className="stat-card">
            <h3>AVG. RATING</h3>
            <div className="stat-number">-</div>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'mark' ? 'active' : ''}`}
            onClick={() => setActiveTab('mark')}
          >
            Mark Attendance
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Schedule
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'mark' && <MarkAttendance />}
          {activeTab === 'history' && (
            <div className="card">
              <h2>Attendance History</h2>
              <p className="placeholder">History component will be added here...</p>
            </div>
          )}
          {activeTab === 'calendar' && (
            <div className="card">
              <h2>Class Schedule</h2>
              <p className="placeholder">Calendar component will be added here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfessorDashboard;