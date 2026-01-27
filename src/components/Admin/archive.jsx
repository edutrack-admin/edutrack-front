import { useState, useEffect } from 'react';
import { users, archive } from '../../services/api';
import './archive.css';

function ArchiveManager() {
  const [summary, setSummary] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [showClearAll, setShowClearAll] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
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

  const handleExportCurrentMonthAttendance = async () => {
    setExporting(true);
    setMessage('Exporting current month attendance...');

    try {
      const { startDate, endDate } = getCurrentMonthDates();
      const response = await archive.exportAttendance(filters.professorId || null, startDate, endDate);
      
      downloadFile(
        response,
        `attendance_current_month_${new Date().toISOString().split('T')[0]}.zip`
      );

      setMessage('✓ Attendance exported successfully!');
    } catch (error) {
      console.error('Export error:', error);

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          setMessage(`✗ Export failed: ${json.error || json.message || 'Unknown error'}`);
          return;
        } catch {
          try {
            const text = await error.response.data.text();
            setMessage(`✗ Export failed: ${text}`);
            return;
          } catch {}
        }
      }

      setMessage(`✗ Export failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCurrentMonthAssessments = async () => {
    setExporting(true);
    setMessage('Exporting current month assessments...');

    try {
      const { startDate, endDate } = getCurrentMonthDates();
      const response = await archive.exportAssessments(filters.professorId || null, startDate, endDate);

      downloadFile(
        response,
        `assessments_current_month_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      setMessage('✓ Assessments exported successfully!');
    } catch (error) {
      console.error('Export error:', error);

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          setMessage(`✗ Export failed: ${json.error || json.message || 'Unknown error'}`);
          return;
        } catch {
          try {
            const text = await error.response.data.text();
            setMessage(`✗ Export failed: ${text}`);
            return;
          } catch {}
        }
      }

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
      'Data will be automatically deleted on the 1st-3rd of next month.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage('Marking archive as complete...');
    
    try {
      await archive.markComplete();
      setMessage('✓ Archive marked complete! Automatic cleanup will run on Day 1-3 of next month.');
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
      '• All associated Cloudinary images\n\n' +
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

  // NEW: Clear ALL data (keeps user accounts)
  const handleClearAllData = async () => {
    if (confirmText !== 'DELETE_ALL_DATA') {
      setMessage('✗ Please type "DELETE_ALL_DATA" exactly to confirm');
      return;
    }

    const finalConfirm = confirm(
      '🚨 FINAL WARNING: Clear ALL Data\n\n' +
      'This will PERMANENTLY DELETE:\n' +
      '• ALL attendance records (all time)\n' +
      '• ALL assessment records (all time)\n' +
      '• ALL archives\n' +
      '• ALL Cloudinary images\n\n' +
      '✅ User accounts will be PRESERVED\n\n' +
      '⚠️ THIS CANNOT BE UNDONE!\n\n' +
      'Are you absolutely sure?'
    );

    if (!finalConfirm) return;

    setLoading(true);
    setMessage('Clearing all data... This will take a few moments...');
    
    try {
      const result = await archive.clearAllData(confirmText);
      if (result.success) {
        setMessage(
          `✓ All data cleared successfully!\n\n` +
          `Deleted:\n` +
          `• ${result.deleted.attendance} attendance records\n` +
          `• ${result.deleted.assessments} assessments\n` +
          `• ${result.deleted.archives} archives\n` +
          `• ${result.deleted.cloudinaryImages} Cloudinary images`
        );
        setConfirmText('');
        setShowClearAll(false);
        loadSummary();
      }
    } catch (error) {
      console.error('Clear all error:', error);
      setMessage(`✗ Failed to clear data: ${error.response?.data?.message || error.message}`);
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
    const match = disposition.match(/filename="?([^"]+)"?/);
    return match?.[1] || fallbackName;
  };

  const downloadFile = (responseOrBlob, fallbackFilename) => {
    const blob = responseOrBlob?.data instanceof Blob ? responseOrBlob.data : responseOrBlob;
    const filename = responseOrBlob?.headers
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

  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="card">
      <h2>📦 Monthly Archive & Cleanup System</h2>
      
      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{message}</pre>
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
        {summary.currentData && (
          <>
            <div className="status-row">
              <span className="label">Current Attendance Records:</span>
              <span className="value">{summary.currentData.attendance || 0}</span>
            </div>
            <div className="status-row">
              <span className="label">Current Assessments:</span>
              <span className="value">{summary.currentData.assessments || 0}</span>
            </div>
          </>
        )}
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
              <li>On the 1st-3rd of next month, cleanup runs <strong>automatically in the background</strong></li>
              <li>Old data and Cloudinary images are permanently deleted</li>
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

      {/* SECTION 4: Clear ALL Data (Danger Zone) */}
      <div className="action-section danger-section" style={{ marginTop: '30px', background: '#fef2f2', border: '2px solid #fecaca' }}>
        <h3>🚨 Danger Zone: Clear ALL Data</h3>
        <p className="warning-text">
          <strong>⚠️ EXTREME CAUTION:</strong> This will permanently delete ALL attendance, assessments, and archives from ALL TIME.
        </p>
        <p>
          <strong>What gets deleted:</strong> Everything (attendance, assessments, archives, Cloudinary images)<br/>
          <strong>What's preserved:</strong> User accounts (professors, students, admins)
        </p>

        {!showClearAll ? (
          <button 
            className="btn btn-secondary"
            onClick={() => setShowClearAll(true)}
            style={{ background: '#f3f4f6', color: '#991b1b', border: '2px solid #fecaca' }}
          >
            Show Clear All Option
          </button>
        ) : (
          <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '8px', border: '2px solid #fecaca' }}>
            <p style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '10px' }}>
              Type <code style={{ background: '#fee', padding: '2px 6px' }}>DELETE_ALL_DATA</code> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE_ALL_DATA"
              style={{ 
                width: '100%', 
                padding: '10px', 
                marginBottom: '10px',
                border: '2px solid #fecaca',
                borderRadius: '5px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
            <div className="button-group">
              <button 
                className="btn btn-danger"
                onClick={handleClearAllData}
                disabled={loading || confirmText !== 'DELETE_ALL_DATA'}
                style={{ opacity: confirmText !== 'DELETE_ALL_DATA' ? 0.5 : 1 }}
              >
                🗑️ Clear All Data
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowClearAll(false);
                  setConfirmText('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions-box">
        <h4>📖 How the Archive System Works</h4>
        
        <h5>📅 Monthly Workflow:</h5>
        <ol>
          <li><strong>Throughout the month:</strong> System collects attendance and assessment data</li>
          <li><strong>Day 25-31:</strong> Export all data using the "Export Current Month Data" section</li>
          <li><strong>After exporting:</strong> Back up files to external storage (Google Drive, etc.)</li>
          <li><strong>Before month end:</strong> Mark archive as complete</li>
          <li><strong>Day 1-3 of next month:</strong> <strong>Automatic background cleanup</strong> deletes previous month's data</li>
          <li><strong>New month begins:</strong> Fresh data collection starts</li>
        </ol>

        <h5>🤖 Automatic Background Cleanup:</h5>
        <p>A cron job checks every hour and automatically runs cleanup on Day 1-3 if:</p>
        <ul>
          <li>✓ Previous month was marked as complete by admin</li>
          <li>✓ Current date is between 1st-3rd of the month</li>
          <li>✓ Cleanup hasn't already been executed this month</li>
        </ul>
        <p><strong>No manual intervention needed!</strong> The system handles it automatically.</p>

        <h5>💡 Best Practices:</h5>
        <ul>
          <li><strong>Export early:</strong> Don't wait until the last day</li>
          <li><strong>Verify exports:</strong> Open files to ensure data is complete</li>
          <li><strong>Multiple backups:</strong> Store exports in multiple locations</li>
          <li><strong>Document storage:</strong> Upload to Google Drive/OneDrive for permanent storage</li>
          <li><strong>Mark complete only after:</strong> All data is safely backed up</li>
        </ul>

        <h5>🚨 Emergency Options:</h5>
        <p><strong>Manual Cleanup:</strong> Use if automatic cleanup fails or immediate cleanup needed</p>
        <p><strong>Clear All Data:</strong> Nuclear option for testing or fresh starts (preserves user accounts)</p>
      </div>
    </div>
  );
}

export default ArchiveManager;