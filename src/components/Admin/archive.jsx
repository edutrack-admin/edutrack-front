import { useState, useEffect } from 'react';
import { users, archive } from '../../services/api';
import './archive.css';

function ArchiveManager() {
  const [summary, setSummary] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    professorId: '',
    startDate: '',
    endDate: '',
    month: '',
    year: new Date().getFullYear()
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

  // Export filtered attendance
  const handleExportFilteredAttendance = async () => {
    setExporting(true);
    setMessage('Exporting filtered attendance records...');
    
    try {
      const blob = await archive.exportAttendance(
        filters.professorId || null,
        filters.startDate || null,
        filters.endDate || null
      );
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage('✓ Attendance exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setMessage(`✗ Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Export filtered assessments
  const handleExportFilteredAssessments = async () => {
    setExporting(true);
    setMessage('Exporting filtered assessment records...');
    
    try {
      const blob = await archive.exportAssessments(filters.professorId || null);
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessments_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage('✓ Assessments exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setMessage(`✗ Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Export specific month (anytime manual archive)
  const handleExportSpecificMonth = async () => {
    if (!filters.month || !filters.year) {
      setMessage('✗ Please select month and year');
      return;
    }

    const confirmed = confirm(
      `Export all data for ${filters.month}/${filters.year}?\n\n` +
      'This will generate a complete report for the selected month.'
    );

    if (!confirmed) return;

    setExporting(true);
    setMessage(`Generating report for ${filters.month}/${filters.year}...`);
    
    try {
      const blob = await archive.exportMonthly(
        parseInt(filters.year),
        parseInt(filters.month)
      );
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly_report_${filters.year}_${String(filters.month).padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage('✓ Monthly report generated successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setMessage(`✗ Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Manual archive current month (before month-end)
  const handleManualArchiveNow = async () => {
    const confirmed = confirm(
      '📦 Manual Archive Current Month\n\n' +
      'This will:\n' +
      '1. Export all current month data\n' +
      '2. Mark as archived\n' +
      '3. Prepare for cleanup\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setExporting(true);
    setMessage('Archiving current month...');

    try {
    const now = new Date();

    // Export current month attendance
    const attendanceBlob = await archive.exportMonthlyAttendance(
      now.getFullYear(),
      now.getMonth() + 1
    );
    download(attendanceBlob, `attendance_${now.getFullYear()}_${now.getMonth()+1}.xlsx`);

    // Export assessments
    const assessmentBlob = await archive.exportMonthlyAssessments(
      now.getFullYear(),
      now.getMonth() + 1
    );
    download(assessmentBlob, `assessments_${now.getFullYear()}_${now.getMonth()+1}.xlsx`);

    // Generate monthly report
    const monthlyBlob = await archive.exportMonthly(
      now.getFullYear(),
      now.getMonth() + 1
    );
    download(monthlyBlob, `monthly_report_${now.getFullYear()}_${now.getMonth()+1}.xlsx`);

    // Mark archive complete in DB
    await archive.markComplete();

    setMessage('✓ Current month archived & marked complete!');
    loadSummary();
  } catch (error) {
    setMessage(`✗ Archive failed: ${error.message}`);
  }

  setExporting(false);
};

  // Standard month-end archive
  const handleExportAllCurrentMonth = async () => {
    setExporting(true);
    setMessage('Exporting all current month data...');
    
    try {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);

    // Export attendance (previous month)
    const attendanceBlob = await archive.exportMonthlyAttendance(
      now.getFullYear(),
      now.getMonth() + 1
    );

    download(attendanceBlob, `attendance_${now.getFullYear()}_${now.getMonth()+1}.xlsx`);

    // Export assessments
    const assessmentBlob = await archive.exportMonthlyAssessments(
      now.getFullYear(),
      now.getMonth() + 1
    );

    download(assessmentBlob, `assessments_${now.getFullYear()}_${now.getMonth()+1}.xlsx`);

    // Monthly combined report
    const monthlyBlob = await archive.exportMonthly(
      now.getFullYear(),
      now.getMonth() + 1
    );

    download(monthlyBlob, `monthly_report_${now.getFullYear()}_${now.getMonth()+1}.xlsx`);

    setMessage('✓ All previous month MongoDB data exported successfully!');
  } catch (error) {
    setMessage(`✗ Export failed: ${error.message}`);
  }

  setExporting(false);
};
  const handleMarkComplete = async () => {
    const confirmed = confirm(
      'Are you sure you have:\n' +
      '1. Exported all data to Google Sheets?\n' +
      '2. Printed/downloaded all necessary reports?\n' +
      '3. Verified all photos are backed up?\n\n' +
      'Once marked complete, old data will be permanently deleted on the 1st of next month.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await archive.markComplete();
      setMessage('✓ Archive marked as complete! Data will be cleaned up automatically.');
      loadSummary();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete:\n' +
      '- All photos from previous month\n' +
      '- All attendance records from previous month\n' +
      '- All assessment records from previous month\n\n' +
      'Make sure you have backed everything up!\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage('Executing cleanup...');
    try {
      const result = await archive.executeCleanup();
      setMessage(`✓ ${result.message}`);
      loadSummary();
    } catch (error) {
      setMessage(`✗ Cleanup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      professorId: '',
      startDate: '',
      endDate: '',
      month: '',
      year: new Date().getFullYear()
    });
  };

const download = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="card">
      <h2>📦 Monthly Archive & Cleanup</h2>
      
      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {/* Status Overview */}
      <div className="archive-status">
        <div className="status-row">
          <span className="label">Current Month:</span>
          <span className="value">{summary.currentMonth}</span>
        </div>
        <div className="status-row">
          <span className="label">Previous Month:</span>
          <span className="value">{summary.previousMonth}</span>
        </div>
        <div className="status-row">
          <span className="label">Days Until Month End:</span>
          <span className="value bold">{summary.daysUntilMonthEnd} days</span>
        </div>
        <div className="status-row">
          <span className="label">Archive Status:</span>
          <span className={`badge ${summary.archiveStatus.completed ? 'badge-success' : 'badge-warning'}`}>
            {summary.archiveStatus.completed ? '✓ Completed' : '⏳ Pending'}
          </span>
        </div>
      </div>

      {/* Warning Box */}
      {summary.shouldShowReminder && !summary.archiveStatus.completed && (
        <div className="warning-box">
          <h3>⚠️ Month-End Archive Required</h3>
          <p>You have <strong>{summary.daysUntilMonthEnd} days</strong> remaining to complete the monthly archive.</p>
          <p>Please export all data and mark as complete before month-end.</p>
        </div>
      )}

      {/* Archive Complete Info */}
      {summary.archiveStatus.completed && (
        <div className="info-box-green">
          <h3>✓ Archive Completed</h3>
          <p>Completed by: {summary.archiveStatus.completedByName || 'Admin'}</p>
          <p>Completed at: {new Date(summary.archiveStatus.completedAt).toLocaleString()}</p>
          {summary.isCleanupWindow && (
            <p className="warning-text">Data cleanup will execute automatically within 3 days.</p>
          )}
        </div>
      )}

      {/* SECTION 1: Quick Actions */}
      <div className="action-section">
        <h3>⚡ Quick Actions</h3>
        <p>Fast export options for standard monthly archiving.</p>
        
        <div className="button-group">
          <button 
            className="btn btn-primary" 
            onClick={handleExportAllCurrentMonth}
            disabled={exporting}
          >
            📦 Export All Previous Month Data
          </button>
          
          <button 
            className="btn btn-success" 
            onClick={handleManualArchiveNow}
            disabled={exporting}
          >
            🚀 Manual Archive Current Month Now
          </button>
        </div>
        
        <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
          "Export All" exports previous month data. "Manual Archive" archives current month immediately.
        </small>
      </div>

      {/* SECTION 2: Filtered Export */}
      <div className="action-section">
        <h3>🔍 Filtered Export (Specific Data)</h3>
        <p>Export specific attendance records or assessments with custom filters.</p>
        
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
                <option key={prof.id} value={prof.id}>
                  {prof.name} - {prof.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
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
            onClick={handleExportFilteredAttendance}
            disabled={exporting}
          >
            📄 Export Filtered Attendance
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleExportFilteredAssessments}
            disabled={exporting}
          >
            📋 Export Filtered Assessments
          </button>
        </div>
      </div>

      {/* SECTION 3: Specific Month Export */}
      <div className="action-section">
        <h3>📅 Export Specific Month</h3>
        <p>Generate a complete report for any past month.</p>
        
        <div className="filter-grid">
          <div className="form-group">
            <label>Month</label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
            >
              <option value="">Select Month</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              min="2020"
              max={new Date().getFullYear()}
            />
          </div>

          <div className="form-group">
            <button 
              className="btn btn-primary"
              onClick={handleExportSpecificMonth}
              disabled={exporting || !filters.month}
              style={{ marginTop: '24px' }}
            >
              📑 Generate Monthly Report
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Mark Complete (Standard Month-End) */}
      {!summary.archiveStatus.completed && (
        <div className="action-section">
          <h3>✅ Mark Archive Complete (Standard Month-End Process)</h3>
          <p>Only mark complete after you have exported and verified all data for previous month.</p>
          
          <button 
            className="btn btn-success" 
            onClick={handleMarkComplete}
            disabled={loading}
          >
            ✓ Mark Previous Month Archive as Complete
          </button>
        </div>
      )}

      {/* SECTION 5: Manual Cleanup (Admin Override) */}
      {summary.archiveStatus.completed && (
        <div className="action-section danger-section">
          <h3>🗑️ Manual Cleanup (Admin Override)</h3>
          <p className="warning-text">
            Only use this if you need to manually trigger the cleanup process.
            Automatic cleanup will run on Day 1-3 of the new month.
          </p>
          
          <button 
            className="btn btn-danger" 
            onClick={handleManualCleanup}
            disabled={loading}
          >
            ⚠️ Execute Cleanup Now
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-box">
        <h4>📖 Archive Process Instructions:</h4>
        
        <h5>Standard Month-End Process:</h5>
        <ol>
          <li>Day 25-31: Click "Export All Previous Month Data"</li>
          <li>Verify data exported successfully to your computer</li>
          <li>Print/download reports for physical archiving</li>
          <li>Upload to Google Sheets (external process)</li>
          <li>Mark archive as complete</li>
          <li>System automatically deletes old data on Day 1-3 of new month</li>
        </ol>

        <h5>Manual Archive Anytime:</h5>
        <ol>
          <li>Click "Manual Archive Current Month Now" at any time</li>
          <li>System exports all current month data immediately</li>
          <li>Marks as archived and prepares for cleanup</li>
          <li>Useful for mid-month reports or early archiving</li>
        </ol>

        <h5>Filtered Export (For Specific Needs):</h5>
        <ol>
          <li>Select professor, date range, or both</li>
          <li>Click "Export Filtered Attendance/Assessments"</li>
          <li>Useful for individual professor reports or date-specific queries</li>
          <li>Does not trigger cleanup process</li>
        </ol>
      </div>
    </div>
  );
}

export default ArchiveManager;