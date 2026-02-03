import { useState } from 'react';
import { users } from '../../services/api';
import { DEPARTMENTS, getCoursesByDepartment } from '../../utils/courseData';

function CreateProfessor() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    subject: '',
    temporaryPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If department changes, reset subject
    if (name === 'department') {
      setFormData({
        ...formData,
        department: value,
        subject: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, temporaryPassword: password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await users.createProfessor(formData);

      setSuccess(`✓ Professor account created successfully! 

Email: ${formData.email}
Temporary Password: ${formData.temporaryPassword}

Please provide these credentials to the professor.`);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        department: '',
        subject: '',
        temporaryPassword: ''
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to create professor account');
    } finally {
      setLoading(false);
    }
  };

  const availableCourses = formData.department ? getCoursesByDepartment(formData.department) : [];

  return (
    <div className="card">
      <h2>Create Professor Account</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Create a new professor account manually. You will need to provide credentials to the professor.
      </p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message" style={{ whiteSpace: 'pre-line' }}>{success}</div>}

           <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="department">Department *</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%'
            }}
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject/Course *</label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            disabled={!formData.department}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%',
              backgroundColor: !formData.department ? '#f5f5f5' : 'white'
            }}
          >
            <option value="">
              {formData.department ? 'Select Subject/Course' : 'Select Department First'}
            </option>
            {availableCourses.map((course, index) => (
              <option key={index} value={course}>
                {course}
              </option>
            ))}
          </select>
          <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
            The primary subject/course this professor teaches
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="fullName">Full Name *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Prof. Juan Dela Cruz"
            required
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%'
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="professor@school.edu"
            required
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%'
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="temporaryPassword">Temporary Password *</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              id="temporaryPassword"
              name="temporaryPassword"
              value={formData.temporaryPassword}
              onChange={handleChange}
              placeholder="Click generate or enter manually"
              required
              style={{ 
                flex: 1,
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px'
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={generateTemporaryPassword}
              style={{
                padding: '10px 20px',
                whiteSpace: 'nowrap'
              }}
            >
              Generate
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
            Provide this password to the professor
          </small>
        </div>

        <div className="disclaimer-box" style={{
          background: '#fff3e0',
          border: '2px solid #ff9800',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>⚠️ Important:</strong>
          <p style={{ marginTop: '5px', fontSize: '14px', marginBottom: 0 }}>
            The professor will be required to change their password on first login.
          </p>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Professor Account'}
        </button>
      </form>
    </div>
  );
}

export default CreateProfessor;