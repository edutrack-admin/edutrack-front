import { useState, useEffect } from 'react';
import { users } from '../../services/api';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStudents();
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

  const handleDeleteStudent = async (studentId, studentName) => {
    const confirmed = confirm(`Delete student "${studentName}"?\n\nThis will delete both the account and authentication. This action cannot be undone.`);
    if (!confirmed) return;

    setMessage('Deleting student...');

    try {
      await users.deleteUser(studentId);
      setMessage(`✓ Student "${studentName}" deleted successfully`);
      loadStudents(); // Reload list
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
                <th>Class Role</th>
                <th>Verified</th>
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
                    <span className="badge badge-success">
                      {student.role === 'president' ? 'President' :
                       student.role === 'vp' ? 'Vice President' :
                       student.role === 'secretary' ? 'Secretary' :
                       'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${student.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                      {student.emailVerified ? '✓ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td>
                    {student.createdAt ? 
                      new Date(student.createdAt).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteStudent(student._id, student.fullName)}
                    >
                      Delete
                    </button>
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
    </div>
  );
}

export default StudentList;