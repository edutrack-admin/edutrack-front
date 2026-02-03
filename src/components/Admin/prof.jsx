import { useState } from 'react';
import { users } from '../../services/api';
import { DEPARTMENTS, getCoursesByDepartment } from '../../utils/courseData';

function CreateProfessor() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    temporaryPassword: ''
  });

    // Array of department-subject pairs
  const [assignments, setAssignments] = useState([
    { department: '', subject: '' }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    
    // If department changes, reset subject for that assignment
    if (field === 'department') {
      newAssignments[index].subject = '';
    }
    
    setAssignments(newAssignments);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { department: '', subject: '' }]);
  };

  const removeAssignment = (index) => {
    if (assignments.length === 1) {
      alert('Professor must have at least one subject assignment');
      return;
    }
    const newAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(newAssignments);
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

    // Validate all assignments are complete
    const incompleteAssignments = assignments.filter(a => !a.department || !a.subject);
    if (incompleteAssignments.length > 0) {
      setError('Please complete all department and subject selections');
      return;
    }

    setLoading(true);

    try {
      // Extract departments and subjects arrays
      const departments = assignments.map(a => a.department);
      const subjects = assignments.map(a => a.subject);

      await users.createProfessor({
        ...formData,
        departments,
        subjects
      });

      setSuccess(`✓ Professor account created successfully! 

Email: ${formData.email}
Temporary Password: ${formData.temporaryPassword}
Assigned Subjects: ${subjects.length}

Please provide these credentials to the professor.`);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        temporaryPassword: ''
      });
      setAssignments([{ department: '', subject: '' }]);
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
        Create a new professor account. Professors can be assigned multiple subjects across different departments.
      </p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message" style={{ whiteSpace: 'pre-line' }}>{success}</div>}

      <form onSubmit={handleSubmit}>
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
        </div>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Subject Assignments</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addAssignment}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              + Add Subject
            </button>
          </div>

          {assignments.map((assignment, index) => (
            <div key={index} style={{
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>Assignment #{index + 1}</strong>
                {assignments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAssignment(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '0',
                      lineHeight: '1'
                    }}
                    title="Remove assignment"
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Department *</label>
                  <select
                    value={assignment.department}
                    onChange={(e) => handleAssignmentChange(index, 'department', e.target.value)}
                    required
                    style={{
                      padding: '10px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  >
                    <option value="">Select</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Subject/Course *</label>
                  <select
                    value={assignment.subject}
                    onChange={(e) => handleAssignmentChange(index, 'subject', e.target.value)}
                    required
                    disabled={!assignment.department}
                    style={{
                      padding: '10px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      width: '100%',
                      backgroundColor: !assignment.department ? '#f5f5f5' : 'white'
                    }}
                  >
                    <option value="">
                      {assignment.department ? 'Select Subject' : 'Select Department First'}
                    </option>
                    {assignment.department && getCoursesByDepartment(assignment.department).map((course, idx) => (
                      <option key={idx} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
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