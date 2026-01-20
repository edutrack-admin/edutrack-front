import { useState } from 'react';
import { users } from '../../services/api';

function CreateProfessor() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    temporaryPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Prof. Juan Dela Cruz"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="professor@school.edu"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject/Course</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., Mathematics, English, Science"
            required
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            The primary subject this professor teaches
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="temporaryPassword">Temporary Password</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              id="temporaryPassword"
              name="temporaryPassword"
              value={formData.temporaryPassword}
              onChange={handleChange}
              placeholder="Click generate or enter manually"
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={generateTemporaryPassword}
            >
              Generate
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '12px' }}>
            Provide this password to the professor
          </small>
        </div>

        <div className="disclaimer-box" style={{
          background: '#fff3e0',
          border: '2px solid #ff9800',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>⚠️ Important:</strong>
          <p style={{ marginTop: '5px', fontSize: '14px' }}>
            You will be asked for your admin password to complete this action. This prevents unauthorized account creation.
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