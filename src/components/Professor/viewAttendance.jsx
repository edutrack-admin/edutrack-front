import { useState, useEffect } from 'react';
import { attendanceSubmissions, sections } from '../../services/api';

function AttendanceSubmissionsView({ userType }) {
  const [submissions, setSubmissions] = useState([]);
  const [sectionList, setSectionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ total: 0, reviewed: 0, pending: 0, thisMonth: 0 });
  const [filters, setFilters] = useState({
    section: '',
    subject: '',
    startDate: '',
    endDate: '',
    reviewed: 'all'
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadSubmissions();
    loadStats();
    if (userType === 'admin') {
      loadSections();
    }
  }, []);

  const loadSections = async () => {
    try {
      const data = await sections.getAll();
      setSectionList(data);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.section) params.section = filters.section;
      if (filters.subject) params.subject = filters.subject;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.reviewed !== 'all') params.reviewed = filters.reviewed;

      const data = await attendanceSubmissions.getAll(params);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setMessage('Error loading submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await attendanceSubmissions.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    loadSubmissions();
  };

  const clearFilters = () => {
    setFilters({
      section: '',
      subject: '',
      startDate: '',
      endDate: '',
      reviewed: 'all'
    });
    setTimeout(() => loadSubmissions(), 100);
  };

  const handleReviewClick = (submission) => {
    setReviewingSubmission(submission);
    setReviewNotes(submission.reviewNotes || '');
    setShowReviewModal(true);
    setMessage('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      await attendanceSubmissions.markReviewed(reviewingSubmission._id, reviewNotes);
      setMessage(`✓ Submission marked as reviewed`);
      setShowReviewModal(false);
      loadSubmissions();
      loadStats();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`✗ ${error.response?.data?.message || 'Error marking as reviewed'}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get unique subjects for filter
  const uniqueSubjects = [...new Set(submissions.map(s => s.subject))].sort();

  return (
    <div className="card">
      <h2>📋 Student Attendance Submissions</h2>
      
      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div className="stat-card">
          <h4>Total Submissions</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', margin: 0 }}>
            {stats.total}
          </p>
        </div>
        <div className="stat-card">
          <h4>Reviewed</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50', margin: 0 }}>
            {stats.reviewed}
          </p>
        </div>
        <div className="stat-card">
          <h4>Pending</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9800', margin: 0 }}>
            {stats.pending}
          </p>
        </div>
        <div className="stat-card">
          <h4>This Month</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196f3', margin: 0 }}>
            {stats.thisMonth}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        padding: '20px', 
        background: '#f9f9f9', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {userType === 'admin' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label>Section</label>
              <select name="section" value={filters.section} onChange={handleFilterChange}>
                <option value="">All Sections</option>
                {sectionList.map(section => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label>Subject</label>
            <select name="subject" value={filters.subject} onChange={handleFilterChange}>
              <option value="">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>From Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Status</label>
            <select name="reviewed" value={filters.reviewed} onChange={handleFilterChange}>
              <option value="all">All</option>
              <option value="true">Reviewed</option>
              <option value="false">Pending</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={applyFilters}>
            Apply Filters
          </button>
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No submissions found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                {userType === 'admin' && <th>Section</th>}
                <th>Subject</th>
                <th>Date</th>
                <th>File</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(submission => (
                <tr key={submission._id}>
                  <td>
                    <strong>{submission.studentName || submission.student?.fullName}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      {submission.studentEmail || submission.student?.email}
                    </small>
                  </td>
                  {userType === 'admin' && (
                    <td>
                      {submission.section?.name || submission.sectionName || 'N/A'}
                    </td>
                  )}
                  <td>
                    <span className="badge badge-primary">{submission.subject}</span>
                  </td>
                  <td>
                    {new Date(submission.attendanceDate).toLocaleDateString()}
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
                      <div>
                        <span className="badge" style={{ background: '#4caf50', color: 'white' }}>
                          ✓ Reviewed
                        </span>
                        {submission.reviewNotes && (
                          <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                            {submission.reviewNotes}
                          </div>
                        )}
                      </div>
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
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <a
                        href={submission.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        📥 Download
                      </a>
                      {!submission.reviewed && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleReviewClick(submission)}
                        >
                          ✓ Mark Reviewed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingSubmission && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Mark as Reviewed</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Student:</strong> {reviewingSubmission.studentName}
              <br />
              <strong>Subject:</strong> {reviewingSubmission.subject}
              <br />
              <strong>Date:</strong> {new Date(reviewingSubmission.attendanceDate).toLocaleDateString()}
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label htmlFor="reviewNotes">Review Notes (Optional)</label>
                <textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this submission..."
                  maxLength={500}
                  rows={4}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  {reviewNotes.length}/500 characters
                </small>
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
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Mark as Reviewed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceSubmissionsView;