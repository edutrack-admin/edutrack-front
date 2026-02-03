import { useState, useEffect } from 'react';
import { users } from '../../services/api';

function ProfessorList() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    subject: ''
  });


  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    try {
      setLoading(true);
      const profList = await users.getProfessors();
      setProfessors(profList);
    } catch (error) {
      console.error('Error loading professors:', error);
      setMessage(`Error loading professors: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (professor) => {
    setEditingProfessor(professor);
    setEditFormData({
      fullName: professor.fullName,
      email: professor.email,
      department: professor.department || '',
      subject: professor.subject || ''
    });
    setShowEditModal(true);
    setMessage('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // If department changes, reset subject
    if (name === 'department') {
      setEditFormData({
        ...editFormData,
        department: value,
        subject: ''
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await users.updateProfessor(editingProfessor._id, editFormData);
      setMessage(`✓ Professor "${editFormData.fullName}" updated successfully`);
      setShowEditModal(false);
      setEditingProfessor(null);
      loadProfessors();
    } catch (error) {
      setMessage(`✗ Error updating professor: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteProfessor = async (professorId, professorName) => {
    const confirmed = confirm(`Delete professor "${professorName}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      await users.deleteUser(professorId);
      setMessage(`✓ Professor "${professorName}" deleted successfully`);
      loadProfessors(); // Reload list
    } catch (error) {
      setMessage(`✗ Error deleting professor: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }
  return (
    <div className="card">
      <h2>All Professors</h2>
      
      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {professors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No professors found.</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Create professors in the "Create Professor" tab.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Subject</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {professors.map(prof => (
                <tr key={prof._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {prof.profilePicture ? (
                        <img 
                          src={prof.profilePicture} 
                          alt={prof.fullName}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#667eea',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {prof.fullName?.charAt(0) || 'P'}
                        </div>
                      )}
                      <strong>{prof.fullName}</strong>
                    </div>
                  </td>
                  <td>{prof.email}</td>
                  <td>
                    <span className="badge badge-primary">
                      {prof.department || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ 
                      fontSize: '11px',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block'
                    }}>
                      {prof.subject || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {prof.createdAt ? 
                      new Date(prof.createdAt).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditClick(prof)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteProfessor(prof._id, prof.fullName)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
        <strong>Total Professors:</strong> {professors.length}
      </div>
    
    {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="modal-header">
              <h2>Edit Professor</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-department">Department *</label>
                <select
                  id="edit-department"
                  name="department"
                  value={editFormData.department}
                  onChange={handleEditChange}
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
                <label htmlFor="edit-subject">Subject/Course *</label>
                <select
                  id="edit-subject"
                  name="subject"
                  value={editFormData.subject}
                  onChange={handleEditChange}
                  required
                  disabled={!editFormData.department}
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    width: '100%',
                    backgroundColor: !editFormData.department ? '#f5f5f5' : 'white'
                  }}
                >
                  <option value="">
                    {editFormData.department ? 'Select Subject/Course' : 'Select Department First'}
                  </option>
                  {availableCourses.map((course, index) => (
                    <option key={index} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-fullName">Full Name *</label>
                <input
                  type="text"
                  id="edit-fullName"
                  name="fullName"
                  value={editFormData.fullName}
                  onChange={handleEditChange}
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
                <label htmlFor="edit-email">Email Address *</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
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

              <div className="modal-actions" style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '20px'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfessorList;