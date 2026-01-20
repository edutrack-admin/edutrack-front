// dashboard.jsx - Admin Dashboard (Fixed for MongoDB)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/api';
import CreateProfessor from './prof';
import CreateStudent from './stud';
import ProfessorList from './profList';
import StudentList from './studList';
import ArchiveManager from './archive';
import './archive.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('createProf');
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
  const userName = userData.fullName || 'Admin';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>⚙️ Admin Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {userName}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'createProf' ? 'active' : ''}`}
            onClick={() => setActiveTab('createProf')}
          >
            Create Professor
          </button>
          <button 
            className={`tab ${activeTab === 'createStud' ? 'active' : ''}`}
            onClick={() => setActiveTab('createStud')}
          >
            Create Student
          </button>
          <button 
            className={`tab ${activeTab === 'professors' ? 'active' : ''}`}
            onClick={() => setActiveTab('professors')}
          >
            All Professors
          </button>
          <button 
            className={`tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            All Students
          </button>
          <button 
            className={`tab ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            📦 Archive & Cleanup
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'createProf' && <CreateProfessor />}
          {activeTab === 'createStud' && <CreateStudent />}
          {activeTab === 'professors' && <ProfessorList />}
          {activeTab === 'students' && <StudentList />}
          {activeTab === 'archive' && <ArchiveManager />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;