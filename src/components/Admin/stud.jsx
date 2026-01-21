import { useState } from 'react';
import { users } from '../../services/api';

function CreateStudent() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'president',
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
      // ✅ FIXED: Call createStudent instead of createProfessor
      await users.createStudent(formData);

      setSuccess(`✓ Student account created successfully! 

Email: ${formData.email}
Temporary Password: ${formData.temporaryPassword}

Please provide these credentials to the student.`);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        role: 'president',
        temporaryPassword: ''
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to create student account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Student Account</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Create a new student account manually. You will need to provide credentials to the student.
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
            placeholder="Juan Dela Cruz"
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
            placeholder="student@school.edu"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Class Role</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="president">Class President</option>
            <option value="vp">Vice President</option>
            <option value="secretary">Secretary</option>
          </select>
          <small style={{ color: '#666', fontSize: '12px' }}>
            Only President, VP, and Secretary can submit assessments
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
            Provide this password to the student
          </small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Student Account'}
        </button>
      </form>
    </div>
  );
}

export default CreateStudent;