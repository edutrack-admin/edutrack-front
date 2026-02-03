import { useState, useEffect } from 'react';
import { users } from '../../services/api';
import { DEPARTMENTS, getCoursesByDepartment} from '../../utils/courseData';

function ProfessorList() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
  });
  const [editAssignments, setEditAssignments] = useState([
    { department: '', subject: '' }
  ]);

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
    });
    // Convert departments and subjects arrays to assignments format
    const departments = professor.departments || (professor.department ? [professor.department] : []);
    const subjects = professor.subjects || (professor.subject ? [professor.subject] : []);
    
    if (departments.length > 0 && subjects.length > 0) {
      const assignments = departments.map((dept, idx) => ({
        department: dept,
        subject: subjects[idx] || ''
      }));
      setEditAssignments(assignments);
    } else {
      setEditAssignments([{ department: '', subject: '' }]);
    }
    
    setShowEditModal(true);
    setMessage('');
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditAssignmentChange = (index, field, value) => {
    const newAssignments = [...editAssignments];
    newAssignments[index][field] = value;
    
    if (field === 'department') {
      newAssignments[index].subject = '';
    }
    
    setEditAssignments(newAssignments);
  };

  const addEditAssignment = () => {
    setEditAssignments([...editAssignments, { department: '', subject: '' }]);
  };

  const removeEditAssignment = (index) => {
    if (editAssignments.length === 1) {
      alert('Professor must have at least one subject assignment');
      return;
    }
    const newAssignments = editAssignments.filter((_, i) => i !== index);
    setEditAssignments(newAssignments);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all assignments
    const incompleteAssignments = editAssignments.filter(a => !a.department || !a.subject);
    if (incompleteAssignments.length > 0) {
      setMessage('✗ Please complete all department and subject selections');
      return;
    }
    
    try {
      const departments = editAssignments.map(a => a.department);
      const subjects = editAssignments.map(a => a.subject);
      
      await users.updateProfessor(editingProfessor._id, {
        ...editFormData,
        departments,
        subjects
      });
      
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
              {professors.map(prof => {
                const departments = prof.departments || (prof.department ? [prof.department] : []);
                const subjects = prof.subjects || (prof.subject ? [prof.subject] : []);
                
                return (
                  <tr key={prof._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        <strong>{prof.fullName}</strong>
                      </div>
                    </td>
                    <td>{prof.email}</td>
                    <td>
                      {departments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {departments.map((dept, idx) => (
                            <span key={idx} className="badge badge-primary" style={{ fontSize: '11px' }}>
                              {dept}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      {subjects.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '300px' }}>
                          {subjects.map((subj, idx) => (
                            <span key={idx} className="badge badge-info" style={{ 
                              fontSize: '11px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }} title={subj}>
                              {subj}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>N/A</span>
                      )}
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
                );
              })}
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
            maxWidth: '700px',
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
                <label htmlFor="edit-fullName">Full Name *</label>
                <input
                  type="text"
                  id="edit-fullName"
                  name="fullName"
                  value={editFormData.fullName}
                  onChange={handleEditFormChange}
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
                  onChange={handleEditFormChange}
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

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Subject Assignments</h3>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addEditAssignment}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    + Add Subject
                  </button>
                </div>

                {editAssignments.map((assignment, index) => (
                  <div key={index} style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>Subject #{index + 1}</strong>
                      {editAssignments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditAssignment(index)}
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
                        <label>Program *</label>
                        <select
                          value={assignment.department}
                          onChange={(e) => handleEditAssignmentChange(index, 'department', e.target.value)}
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
                          onChange={(e) => handleEditAssignmentChange(index, 'subject', e.target.value)}
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