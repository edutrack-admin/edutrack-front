import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CreateProfessor from './prof';
import CreateStudent from './stud';
import ProfessorList from './profList';
import StudentList from './studList';
import ArchiveManager from './archive';
import SectionManager from './sectionManager';
import './archive.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('createProf');
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
          <h1>⚙️ Admin Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {user?.fullName || 'Admin'}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container">
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
            className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            📚 Sections
          </button>
          <button 
            className={`tab ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            📦 Archive & Cleanup
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'createProf' && <CreateProfessor />}
          {activeTab === 'createStud' && <CreateStudent />}
          {activeTab === 'professors' && <ProfessorList />}
          {activeTab === 'students' && <StudentList />}
          {activeTab === 'sections' && <SectionManager />}
          {activeTab === 'archive' && <ArchiveManager />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;