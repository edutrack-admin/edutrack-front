import { useState, useEffect } from 'react';
import { users, sections } from '../../services/api';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [sectionList, setSectionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    loadStudents();
    loadSections();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentList = await users.getStudents();
      setStudents(studentList);
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage(`Error loading students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const data = await sections.getAll();
      setSectionList(data);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const handleAssignSection = (student) => {
    setSelectedStudent(student);
    setSelectedSection(student.section?._id || '');
    setShowAssignModal(true);
    setMessage('');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!selectedSection) {
        setMessage('Please select a section');
        return;
      }

      // Add student to section
      await sections.addStudents(selectedSection, [selectedStudent._id]);
      
      setMessage(`✓ ${selectedStudent.fullName} assigned to section successfully`);
      setShowAssignModal(false);
      loadStudents();
    } catch (error) {
      setMessage(`✗ Error assigning section: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    const confirmed = confirm(`Delete student "${studentName}"?\n\nThis will delete both the account and authentication. This action cannot be undone.`);
    if (!confirmed) return;

    setMessage('Deleting student...');

    try {
      await users.deleteUser(studentId);
      setMessage(`✓ Student "${studentName}" deleted successfully`);
      loadStudents();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage(`✗ Error deleting student: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="card">
      <h2>All Students</h2>
      
      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No students registered yet.</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Students can be created in the "Create Student" tab.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Section</th>
                <th>Class Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {student.profilePicture ? (
                        <img 
                          src={student.profilePicture} 
                          alt={student.fullName}
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
                          background: '#4caf50',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                      )}
                      <strong>{student.fullName}</strong>
                    </div>
                  </td>
                  <td>{student.email}</td>
                  <td>
                    {student.section ? (
                      <span className="badge badge-primary">
                        {student.section.name || student.section}
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#999', color: 'white' }}>
                        No Section
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {student.role === 'president' ? 'President' :
                       student.role === 'vp' ? 'Vice President' :
                       student.role === 'secretary' ? 'Secretary' :
                       'N/A'}
                    </span>
                  </td>
                  <td>
                    {student.createdAt ? 
                      new Date(student.createdAt).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAssignSection(student)}
                      >
                        Assign Section
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteStudent(student._id, student.fullName)}
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
        <strong>Total Students:</strong> {students.length}
      </div>

      {/* Assign Section Modal */}
      {showAssignModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Assign Section</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Student:</strong> {selectedStudent.fullName}
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label htmlFor="section">Select Section *</label>
                <select
                  id="section"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  required
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    width: '100%'
                  }}
                >
                  <option value="">Select a section</option>
                  {sectionList.map(section => (
                    <option key={section._id} value={section._id}>
                      {section.name} ({section.students?.length || 0} students)
                    </option>
                  ))}
                </select>
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
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;