import { useState, useEffect } from 'react';
import { users } from '../../services/api';

function ProfessorList() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
                <th>Subject</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {professors.map(prof => (
                <tr key={prof.id}>
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
                    <span className="badge badge-info">
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
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteProfessor(prof.id, prof.fullName)}
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
        <strong>Total Professors:</strong> {professors.length}
      </div>
    </div>
  );
}

export default ProfessorList;