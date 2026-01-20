import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import CreateProfessor from './prof';
import CreateStudent from './stud';
import ProfessorList from './profList';
import StudentList from './studList';
import ArchiveManager from './archive';
import './Archive.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('createProf');
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await signOut(auth);
      navigate('/login');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>⚙️ Admin Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, Admin</span>
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