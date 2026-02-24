import { useState, useEffect } from 'react';
import { attendanceSubmissions, users } from '../../services/api';

function StudentAttendanceUpload() {
  const [formData, setFormData] = useState({
    professorId: '',
    professorName: '',
    subject: '',
    attendanceDate: '',
    notes: '',
    file: null
  });
  const [professors, setProfessors] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  useEffect(() => {
    loadProfessors();
    loadMySubmissions();
  }, []);

  const loadProfessors = async () => {
    try {
      const data = await users.getProfessors();
      setProfessors(data);
    } catch (error) {
      console.error('Error loading professors:', error);
    }
  };

  const loadMySubmissions = async () => {
    try {
      setLoading(true);
      const data = await attendanceSubmissions.getMySubmissions();
      setMySubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setMessage('Error loading your submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-fill professor name when professor is selected
    if (name === 'professorId') {
      const prof = professors.find(p => p._id === value);
      if (prof) {
        setFormData(prev => ({
          ...prev,
          professorId: value,
          professorName: prof.fullName
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setMessage('✗ File size must be less than 10MB');
        e.target.value = '';
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (!allowedTypes.includes(file.type)) {
        setMessage('✗ Only PDF, Word, Excel, and CSV files are allowed');
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, file });
      setSelectedFileName(file.name);
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('professorId', formData.professorId);
      uploadFormData.append('professorName', formData.professorName);
      uploadFormData.append('subject', formData.subject);
      uploadFormData.append('attendanceDate', formData.attendanceDate);
      if (formData.notes) {
        uploadFormData.append('notes', formData.notes);
      }

      await attendanceSubmissions.upload(uploadFormData);

      setMessage('✓ Attendance file uploaded successfully!');
      
      // Reset form
      setFormData({
        professorId: '',
        professorName: '',
        subject: '',
        attendanceDate: '',
        notes: '',
        file: null
      });
      setSelectedFileName('');
      document.getElementById('fileInput').value = '';

      // Reload submissions
      loadMySubmissions();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`✗ ${error.response?.data?.message || 'Error uploading file'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!confirm('Delete this submission? This action cannot be undone.')) return;

    try {
      await attendanceSubmissions.delete(submissionId);
      setMessage('✓ Submission deleted successfully');
      loadMySubmissions();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`✗ ${error.response?.data?.message || 'Error deleting submission'}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="card">
      <h2>📄 Upload Attendance</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Upload your attendance document (PDF, Word, Excel, or CSV)
      </p>

      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
        <div className="form-group">
          <label htmlFor="professorId">Professor *</label>
          <select
            id="professorId"
            name="professorId"
            value={formData.professorId}
            onChange={handleChange}
            required
          >
            <option value="">Select Professor</option>
            {professors.map(prof => (
              <option key={prof._id} value={prof._id}>
                {prof.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., COMP 002, MATH 101"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="attendanceDate">Attendance Date *</label>
          <input
            type="date"
            id="attendanceDate"
            name="attendanceDate"
            value={formData.attendanceDate}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fileInput">Attendance File * (Max 10MB)</label>
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
            required
          />
          {selectedFileName && (
            <small style={{ color: '#4caf50', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              ✓ Selected: {selectedFileName}
            </small>
          )}
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Accepted: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), CSV
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this attendance..."
            maxLength={500}
            rows={3}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            {formData.notes.length}/500 characters
          </small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? '⏳ Uploading...' : '📤 Upload Attendance'}
        </button>
      </form>

      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

      <h3>My Submissions</h3>
      
      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : mySubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No submissions yet.</p>
          <p style={{ fontSize: '14px' }}>Upload your first attendance file above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Professor</th>
                <th>Subject</th>
                <th>File</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mySubmissions.map(submission => (
                <tr key={submission._id}>
                  <td>
                    {new Date(submission.attendanceDate).toLocaleDateString()}
                  </td>
                  <td>{submission.professorName}</td>
                  <td>
                    <span className="badge badge-primary">{submission.subject}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{submission.file.originalFilename}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        {formatFileSize(submission.file.fileSize)}
                      </small>
                    </div>
                  </td>
                  <td>
                    {submission.reviewed ? (
                      <span className="badge" style={{ background: '#4caf50', color: 'white' }}>
                        ✓ Reviewed
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#ff9800', color: 'white' }}>
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <a
                        href={submission.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        📥 Download
                      </a>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(submission._id)}
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
        <strong>Total Submissions:</strong> {mySubmissions.length}
        {' | '}
        <strong>Reviewed:</strong> {mySubmissions.filter(s => s.reviewed).length}
        {' | '}
        <strong>Pending:</strong> {mySubmissions.filter(s => !s.reviewed).length}
      </div>
    </div>
  );
}

export default StudentAttendanceUpload;