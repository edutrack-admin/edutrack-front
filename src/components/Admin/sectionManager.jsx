import { useState, useEffect } from 'react';
import { sections } from '../../services/api';
import { DEPARTMENTS } from '../../utils/courseData';

function SectionManager() {
  const [sectionList, setSectionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [viewingSection, setViewingSection] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    yearLevel: 1,
    sectionNumber: 1
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await sections.getAll();
      setSectionList(data);
    } catch (error) {
      console.error('Error loading sections:', error);
      setMessage('Error loading sections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingSection(null);
    setFormData({ department: '', yearLevel: 1, sectionNumber: 1 });
    setShowModal(true);
    setMessage('');
  };

  const handleEditClick = (section) => {
    setEditingSection(section);
    setFormData({
      department: section.department,
      yearLevel: section.yearLevel,
      sectionNumber: section.sectionNumber
    });
    setShowModal(true);
    setMessage('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingSection) {
        await sections.update(editingSection._id, formData);
        setMessage('✓ Section updated successfully');
      } else {
        await sections.create(formData);
        setMessage('✓ Section created successfully');
      }
      setShowModal(false);
      loadSections();
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (sectionId, sectionName) => {
    const section = sectionList.find(s => s._id === sectionId);
    
    if (section.students && section.students.length > 0) {
      alert(`Cannot delete section "${sectionName}" - it has ${section.students.length} students assigned. Remove students first.`);
      return;
    }

    const confirmed = confirm(`Delete section "${sectionName}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      await sections.delete(sectionId);
      setMessage(`✓ Section "${sectionName}" deleted successfully`);
      loadSections();
    } catch (error) {
      setMessage(`✗ Error deleting section: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleViewStudents = async (section) => {
    try {
      // Load full section details with populated students
      const fullSection = await sections.getById(section._id);
      setViewingSection(fullSection);
      setShowStudentsModal(true);
    } catch (error) {
      setMessage(`✗ Error loading section students: ${error.message}`);
    }
  };


  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Section Management</h2>
        <button className="btn btn-primary" onClick={handleCreateClick}>
          + Create Section
        </button>
      </div>

      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {sectionList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No sections created yet.</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Click "Create Section" to get started.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Section Name</th>
                <th>Department</th>
                <th>Year Level</th>
                <th>Students</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sectionList.map(section => (
                <tr key={section._id}>
                  <td><strong>{section.name}</strong></td>
                  <td>
                    <span className="badge badge-primary">{section.department}</span>
                  </td>
                  <td>Year {section.yearLevel}</td>
                  <td>
                    <button
                      onClick={() => handleViewStudents(section)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit'
                      }}
                      title="Click to view students"
                      >
                    <span className="badge badge-info">
                      {section.students?.length || 0} students
                    </span>
                    </button>
                  </td>
                  <td>
                    {section.isActive ? (
                      <span className="badge" style={{ background: '#4caf50', color: 'white' }}>
                        Active
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#999', color: 'white' }}>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    {section.createdAt ? 
                      new Date(section.createdAt).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditClick(section)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(section._id, section.name)}
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
        <strong>Total Sections:</strong> {sectionList.length}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingSection ? 'Edit Section' : 'Create New Section'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

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
                      {dept.id} - {dept.name.split(' - ')[1]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label htmlFor="yearLevel">Year Level *</label>
                  <select
                    id="yearLevel"
                    name="yearLevel"
                    value={formData.yearLevel}
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
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sectionNumber">Section # *</label>
                  <input
                    type="number"
                    id="sectionNumber"
                    name="sectionNumber"
                    value={formData.sectionNumber}
                    onChange={handleChange}
                    min="1"
                    max="20"
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
              </div>

              <div style={{
                padding: '12px',
                background: '#e3f2fd',
                borderRadius: '8px',
                marginTop: '15px',
                fontSize: '14px'
              }}>
                <strong>Preview:</strong> {formData.department || '___'} {formData.yearLevel || '_'}-{formData.sectionNumber || '_'}
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
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionManager;