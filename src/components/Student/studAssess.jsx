// StudentAssessments.jsx
import React from 'react';

function StudentAssessments({ assessments, loading }) {
  return (
    <>
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : assessments.length === 0 ? (
        <p>No assessments submitted yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Professor</th>
              <th>Subject</th>
              <th>Total Score</th>
              <th>Average Rating</th>
              <th>Submitted On</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(a => (
              <tr key={a._id}>
                <td>{a.professorName || a.professor?.fullName || 'N/A'}</td>
                <td>{a.subject || a.professor?.subject || 'N/A'}</td>
                <td>{a.totalScore ?? '-'}</td>
                <td>{a.averageRating ?? '-'}</td>
                <td>
                  {a.createdAt
                    ? new Date(a.createdAt).toLocaleString([], { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default StudentAssessments;
