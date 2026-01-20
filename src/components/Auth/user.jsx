import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function UserTypeSelect() {
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      setError('Please select a user type');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        userType: selectedType
      });
      navigate('/');
      window.location.reload(); // Refresh to update user type
    } catch (err) {
      setError('Failed to update user type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>👤 Select Your Role</h1>
          <p>Choose how you'll be using the system</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="role-options">
            <div 
              className={`role-card ${selectedType === 'professor' ? 'selected' : ''}`}
              onClick={() => setSelectedType('professor')}
            >
              <div className="role-icon">👨‍🏫</div>
              <h3>Professor</h3>
              <p>Mark attendance, view schedules, receive assessments</p>
            </div>

            <div 
              className={`role-card ${selectedType === 'student' ? 'selected' : ''}`}
              onClick={() => setSelectedType('student')}
            >
              <div className="role-icon">👨‍🎓</div>
              <h3>Student</h3>
              <p>Submit assessments, view class information</p>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            disabled={loading || !selectedType}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserTypeSelect;