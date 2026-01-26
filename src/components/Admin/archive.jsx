import { useState, useEffect } from 'react';
import { users, archive } from '../../services/api';
import './archive.css';

function ArchiveManager() {
  const [summary, setSummary] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  
  // Filter states - simplified to current month only
  const [filters, setFilters] = useState({
    professorId: '',
    startDay: '',
    endDay: ''
  });

  useEffect(() => {
    loadSummary();
    loadProfessors();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await archive.getSummary();
      setSummary(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading summary:', error);
      setMessage('Error loading archive status');
      setLoading(false);
    }
  };

  const loadProfessors = async () => {
    try {
      const profList = await users.getProfessors();
      setProfessors(profList);
    } catch (error) {
      console.error('Error loading professors:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // Helper to get current month date range
  const getCurrentMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDay = filters.startDay || '01';
    const endDay = filters.endDay || String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0');
    
    return {
      startDate: `${year}-${month}-${startDay}`,
      endDate: `${year}-${month}-${endDay}`
    };
  };

  // Export current month attendance with filters
  const handleExportCurrentMonthAttendance = async () => {
    setExporting(true);
    setMessage('Exporting current month attendance...');
    
    try {
      const { startDate, endDate } = getCurrentMonthDates();
      
      const response = await archive.exportAssessments(filters.professorId || null);
      downloadFile(response, `assessments_current_month_${new Date().toISOString().split('T')[0]}.xlsx`);

      setMessage('✓ Attendance exported successfully!');
    } catch (error) {
  console.error('Export error:', error);

  // ✅ If backend responds with JSON but axios expects Blob,
  // error.response.data will be a Blob → we must decode it
  if (error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();

      // try parse as JSON
      const json = JSON.parse(text);

      setMessage(
        `✗ Export failed: ${json.error || json.message || 'Unknown error'}`
      );
      return;
    } catch (e) {
      // If it's not JSON, fallback to showing raw text
      try {
        const text = await error.response.data.text();
        setMessage(`✗ Export failed: ${text}`);
        return;
      } catch {
        // ignore
      }
    }
  }

  // fallback for normal axios JSON responses
  setMessage(
    `✗ Export failed: ${error.response?.data?.message || error.message}`
  );
} finally {
  setExporting(false);
}
  };

  // Export current month assessments with filters
  const handleExportCurrentMonthAssessments = async () => {
    setExporting(true);
    setMessage('Exporting current month assessments...');
    
    try {
      const response = await archive.exportAttendance(
      filters.professorId || null,
      startDate,
      endDate
    );
  // now backend returns ZIP (per professor) instead of XLSX
    downloadFile(response, `attendance_current_month_${new Date().toISOString().split('T')[0]}.zip`);
      setMessage('✓ Assessments exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setMessage(`✗ Export failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Mark current month as archived
  const handleMarkComplete = async () => {
    const confirmed = confirm(
      '📦 Mark Current Month as Complete?\n\n' +
      'Before marking complete, make sure you have:\n' +
      '✓ Exported all attendance data\n' +
      '✓ Exported all assessment data\n' +
      '✓ Backed up all files\n\n' +
      'Data will be permanently deleted on the 1st-3rd of next month.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage('Marking archive as complete...');
    
    try {
      await archive.markComplete();
      setMessage('✓ Archive marked complete! Cleanup will run automatically next month.');
      loadSummary();
    } catch (error) {
      console.error('Mark complete error:', error);
      setMessage(`✗ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual cleanup trigger (admin override)
  const handleManualCleanup = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: Manual Cleanup\n\n' +
      'This will PERMANENTLY DELETE:\n' +
      '• All attendance records from previous month\n' +
      '• All assessment records from previous month\n' +
      '• All associated photos\n\n' +
      '⚠️ This action CANNOT be undone!\n\n' +
      'Only proceed if you have:\n' +
      '✓ Exported and backed up all data\n' +
      '✓ Verified exports are complete\n' +
      '✓ Uploaded to external storage\n\n' +
      'Continue with cleanup?'
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage('Executing cleanup... This may take a moment...');
    
    try {
      const result = await archive.executeCleanup();
      setMessage(`✓ ${result.message || 'Cleanup completed successfully!'}`);
      loadSummary();
    } catch (error) {
      console.error('Cleanup error:', error);
      setMessage(`✗ Cleanup failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      professorId: '',
      startDay: '',
      endDay: ''
    });
  };

  const getFilenameFromResponse = (response, fallbackName) => {
  const disposition = response?.headers?.['content-disposition'];
  if (!disposition) return fallbackName;

  // Example: attachment; filename=attendance_2026-01-26.zip
  const match = disposition.match(/filename="?([^"]+)"?/);
  return match?.[1] || fallbackName;
};

  const downloadFile = (responseOrBlob, fallbackFilename) => {
  const blob = responseOrBlob?.data instanceof Blob ? responseOrBlob.data : responseOrBlob;

  const filename =
    responseOrBlob?.headers
      ? getFilenameFromResponse(responseOrBlob, fallbackFilename)
      : fallbackFilename;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};


  if (loading || !summary) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // Get current month/year for display
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="card">
      <h2>📦 Monthly Archive & Cleanup System</h2>
      
      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {/* Status Overview */}
      <div className="archive-status">
        <div className="status-row">
          <span className="label">Current Month:</span>
          <span className="value">{currentMonthName}</span>
        </div>
        <div className="status-row">
          <span className="label">Days Until Month End:</span>
          <span className="value bold">{summary.daysUntilMonthEnd} days</span>
        </div>
        <div className="status-row">
          <span className="label">Archive Status:</span>
          <span className={`badge ${summary.archiveStatus?.completed ? 'badge-success' : 'badge-warning'}`}>
            {summary.archiveStatus?.completed ? '✓ Completed' : '⏳ Pending'}
          </span>
        </div>
      </div>

      {/* Month-End Reminder */}
      {summary.shouldShowReminder && !summary.archiveStatus?.completed && (
        <div className="warning-box">
          <h3>⚠️ Month-End Archive Reminder</h3>
          <p>You have <strong>{summary.daysUntilMonthEnd} days</strong> remaining to complete monthly archiving.</p>
          <p><strong>Required Actions:</strong></p>
          <ol>
            <li>Export all current month data (see sections below)</li>
            <li>Verify exports are complete</li>
            <li>Back up files to external storage</li>
            <li>Mark archive as complete</li>
          </ol>
        </div>
      )}

      {/* Archive Complete Status */}
      {summary.archiveStatus?.completed && (
        <div className="info-box-green">
          <h3>✓ Current Month Archived</h3>
          <p><strong>Completed by:</strong> {summary.archiveStatus.completedByName || 'Admin'}</p>
          <p><strong>Completed at:</strong> {new Date(summary.archiveStatus.completedAt).toLocaleString()}</p>
          {summary.isCleanupWindow && (
            <p className="warning-text">⚠️ Automatic cleanup window is active (Day 1-3). Data will be deleted soon.</p>
          )}
        </div>
      )}

      {/* SECTION 1: Export Current Month Data */}
      <div className="action-section">
        <h3>📊 Export Current Month Data ({currentMonthName})</h3>
        <p>Export attendance and assessment records from the current month. Use filters to narrow results.</p>
        
        {/* Filters */}
        <div className="filter-grid">
          <div className="form-group">
            <label>Professor (Optional)</label>
            <select
              name="professorId"
              value={filters.professorId}
              onChange={handleFilterChange}
            >
              <option value="">All Professors</option>
              {professors.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.fullName} - {prof.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>From Day (Optional)</label>
            <input
              type="number"
              name="startDay"
              value={filters.startDay}
              onChange={handleFilterChange}
              min="1"
              max="31"
              placeholder="1"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Leave empty for day 1</small>
          </div>

          <div className="form-group">
            <label>To Day (Optional)</label>
            <input
              type="number"
              name="endDay"
              value={filters.endDay}
              onChange={handleFilterChange}
              min="1"
              max="31"
              placeholder="31"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Leave empty for last day</small>
          </div>

          <div className="form-group">
            <button 
              className="btn btn-secondary"
              onClick={clearFilters}
              style={{ marginTop: '24px' }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="button-group" style={{ marginTop: '15px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleExportCurrentMonthAttendance}
            disabled={exporting}
          >
            📄 Export Attendance
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleExportCurrentMonthAssessments}
            disabled={exporting}
          >
            📋 Export Assessments
          </button>
        </div>

        <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
          💡 Tip: Export without filters to get all current month data, or use filters for specific reports.
        </small>
      </div>

      {/* SECTION 2: Mark Archive Complete */}
      {!summary.archiveStatus?.completed && (
        <div className="action-section">
          <h3>✅ Mark Current Month as Archived</h3>
          <p>After exporting and backing up all data, mark the current month as archived.</p>
          <p className="warning-text">⚠️ Only mark complete after you've exported and verified ALL data!</p>
          
          <button 
            className="btn btn-success" 
            onClick={handleMarkComplete}
            disabled={loading}
          >
            ✓ Mark Current Month as Complete
          </button>

          <div style={{ marginTop: '15px', padding: '15px', background: '#fff3e0', borderRadius: '5px' }}>
            <strong>What happens next?</strong>
            <ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Archive is marked as complete</li>
              <li>Data remains accessible for the rest of the month</li>
              <li>On the 1st-3rd of next month, cleanup runs automatically</li>
              <li>Old data is permanently deleted</li>
            </ol>
          </div>
        </div>
      )}

      {/* SECTION 3: Manual Cleanup (Admin Override) */}
      {summary.archiveStatus?.completed && (
        <div className="action-section danger-section">
          <h3>🗑️ Manual Cleanup (Emergency Override)</h3>
          <p className="warning-text">
            ⚠️ <strong>DANGER ZONE:</strong> Only use if automatic cleanup fails or immediate cleanup is required.
          </p>
          <p>
            <strong>Normal behavior:</strong> Automatic cleanup runs on Day 1-3 of each month.<br/>
            <strong>Use manual cleanup if:</strong> You need immediate cleanup or automatic process failed.
          </p>
          
          <button 
            className="btn btn-danger" 
            onClick={handleManualCleanup}
            disabled={loading}
          >
            ⚠️ Execute Manual Cleanup Now
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-box">
        <h4>📖 How the Archive System Works</h4>
        
        <h5>📅 Monthly Workflow:</h5>
        <ol>
          <li><strong>Throughout the month:</strong> System collects attendance and assessment data</li>
          <li><strong>Day 25-31:</strong> Export all data using the "Export Current Month Data" section</li>
          <li><strong>After exporting:</strong> Back up files to external storage (Google Drive, etc.)</li>
          <li><strong>Before month end:</strong> Mark archive as complete</li>
          <li><strong>Day 1-3 of next month:</strong> Automatic cleanup deletes previous month's data</li>
          <li><strong>New month begins:</strong> Fresh data collection starts</li>
        </ol>

        <h5>💡 Best Practices:</h5>
        <ul>
          <li><strong>Export early:</strong> Don't wait until the last day</li>
          <li><strong>Verify exports:</strong> Open files to ensure data is complete</li>
          <li><strong>Multiple backups:</strong> Store exports in multiple locations</li>
          <li><strong>Document storage:</strong> Upload to Google Drive/OneDrive for permanent storage</li>
          <li><strong>Mark complete only after:</strong> All data is safely backed up</li>
        </ul>

        <h5>🔄 Automatic Cleanup:</h5>
        <p>The system automatically deletes old data on Day 1-3 of each month <strong>ONLY IF</strong> the previous month was marked as complete. This prevents accidental data loss.</p>
        
        <h5>🚨 Emergency Manual Cleanup:</h5>
        <p>Use manual cleanup only if:</p>
        <ul>
          <li>Automatic cleanup failed to run</li>
          <li>Immediate cleanup is required</li>
          <li>Database storage is critically low</li>
        </ul>
        <p className="warning-text">⚠️ Manual cleanup permanently deletes data. Ensure backups exist first!</p>
      </div>
    </div>
  );
}

export default ArchiveManager;