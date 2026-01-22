import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './assessment.css';

function AssessmentForm({ onSubmitted }) {
  const { user } = useAuth();

  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [classDateTime, setClassDateTime] = useState('');
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Assessment questions exactly as provided
  const assessmentSections = [
    {
      section: 'A. Management of Teaching and Learning',
      description:
        'Management of Teaching and Learning refers to the intentional and organized handling of classroom presence, clear communication of academic expectations, efficient use of time, and the purposeful use of student-centered activities that promote critical thinking, independent learning, reflection, decision-making, and continuous academic improvement through constructive feedback.',
      questions: [
        '1. Comes to class on time.',
        '2. Explains learning outcomes, expectations, grading system, and various requirements of the subject/course.',
        '3. Maximizes the allocated time/learning hours effectively.',
        '4. Facilitates students to think critically and creatively by providing appropriate learning activities.',
        '5. Guides students to learn on their own, reflect on new ideas and experiences, and make decisions in accomplishing given tasks.',
        '6. Communicates constructive feedback to students for their academic growth.'
      ]
    },
    {
      section: 'B. Content Knowledge, Pedagogy and Technology',
      description:
        "Content Knowledge, Pedagogy, and Technology refer to a teacher's ability to demonstrate a strong grasp of subject matter, present complex concepts in a clear and accessible way, relate content to real-world contexts and current developments, engage students through appropriate instructional strategies and digital tools, and apply assessment methods aligned with intended learning outcomes.",
      questions: [
        '7. Demonstrates extensive and broad knowledge of the subject/course.',
        '8. Simplifies complex ideas in the lesson for ease of understanding.',
        '9. Relates the subject matter to contemporary issues and developments in the discipline and/or daily life activities.',
        '10. Promotes active learning and student engagement by using appropriate teaching and learning resources including ICT tools and platforms.',
        '11. Uses appropriate assessments (projects, exams, quizzes, assignments, etc.) aligned with the learning outcomes.'
      ]
    },
    {
      section: 'C. Commitment and Transparency',
      description:
        "Commitment and Transparency refer to the teacher's consistent dedication to supporting student learning by acknowledging learner diversity, offering timely academic support and feedback, and upholding fairness and accountability through the use of clear and openly communicated performance criteria.",
      questions: [
        '12. Recognizes and values the unique diversity and individual differences among students.',
        '13. Assists students with their learning challenges during consultation hours.',
        '14. Provides immediate feedback on student outputs and performance.',
        "15. Provides transparent and clear criteria in rating student's performance."
      ]
    }
  ];

  const ratingScale = [
    { value: 5, label: 'Always manifested', description: 'Evident in nearly all relevant situations (91–100% of instances).' },
    { value: 4, label: 'Often manifested', description: 'Evident most of the time, with occasional lapses (61–90%).' },
    { value: 3, label: 'Sometimes manifested', description: 'Evident about half the time (31–60%).' },
    { value: 2, label: 'Seldom manifested', description: 'Infrequently demonstrated; rarely evident in relevant situations (11–30%).' },
    { value: 1, label: 'Never/Rarely manifested', description: 'Seldom demonstrated; almost never evident, with only isolated cases (0–10%).' }
  ];

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
  try {
    const profList = await publicApi.getProfessors();
    setProfessors(Array.isArray(profList) ? profList : []); // <-- safe coercion
  } catch (error) {
    console.error('Error loading professors:', error);
    setMessage('Error loading professors. Please refresh the page.');
    setProfessors([]); // fallback
  }
  };

  const handleRatingChange = (questionIndex, value) => {
    setRatings({
      ...ratings,
      [questionIndex]: value
    });
  };

  const calculateTotalScore = () => {
    return Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // 🚫 Only students can submit assessments
    if (user?.role !== 'student') {
      setMessage('Only students are allowed to submit assessments.');
      return;
    }

    // Validate all questions answered
    const totalQuestions = assessmentSections.reduce((sum, section) => sum + section.questions.length, 0);
    if (Object.keys(ratings).length !== totalQuestions) {
      setMessage('Please answer all questions before submitting.');
      return;
    }

    if (!selectedProfessor) {
      setMessage('Please select a professor to evaluate.');
      return;
    }

    if (!classDateTime) {
      setMessage('Please enter the date and time the class was held.');
      return;
    }

    if (!user?._id) {
      setMessage('Session expired. Please login again.');
      return;
    }

    setLoading(true);

    try {
      const totalScore = calculateTotalScore();
      const averageRating = (totalScore / totalQuestions).toFixed(2);

      await assessments.create({
        // ✅ cleaner naming (recommended)
        professorId: selectedProfessor._id,

        // optional copies (handy for reports)
        professorName: selectedProfessor.fullName,
        professorEmail: selectedProfessor.email,
        subject: selectedProfessor.subject,

        studentId: user._id,
        studentName: user.fullName,
        studentEmail: user.email,
        studentRole: user.role || 'N/A',

        // class held datetime
        classHeldDateTime: classDateTime,

        ratings,
        totalScore,
        averageRating: parseFloat(averageRating),
        comments,
        academicYear: 'Faculty Evaluation 1st Semester of SY 2025-2026'
        // createdAt is automatic on backend (timestamps)
      });

      setMessage('✓ Assessment submitted successfully! Thank you for your feedback.');
      setRatings({});
      setComments('');
      setSelectedProfessor(null);
      setClassDateTime('');

      // refresh dashboard list
      onSubmitted?.();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setMessage('✗ Error submitting assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assessment-form">
      <div className="form-header">
        <h1>Professor Assessment Form</h1>
      </div>

      {message && (
        <div className={message.startsWith('✓') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section A: Faculty Information */}
        <div className="form-section">
          <h2 className="section-title">A. Faculty Information</h2>

          <div className="form-group">
            <label>Name of Faculty being Evaluated</label>
            <select
              value={selectedProfessor?._id || ''}
              onChange={(e) => {
                const prof = professors.find(p => p._id === e.target.value);
                setSelectedProfessor(prof || null);
              }}
              required
            >
              <option value="">Select Professor</option>
              {professors.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.fullName} - {prof.subject}
                </option>
              ))}
            </select>
          </div>

          {selectedProfessor && (
            <>
              <div className="form-group">
                <label>Date and Time of Class</label>
                <input
                  type="datetime-local"
                  value={classDateTime}
                  onChange={(e) => setClassDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>College/Department</label>
                <input type="text" value="INSTITUTE OF TECHNOLOGY" disabled />
              </div>

              <div className="form-group">
                <label>Course Code/Title</label>
                <input type="text" value={selectedProfessor.subject} disabled />
              </div>

              <div className="form-group">
                <label>Semester or Term/Academic Year</label>
                <input type="text" value="Faculty Evaluation 1st Semester of SY 2025-2026" disabled />
              </div>
            </>
          )}
        </div>

        {/* Section B: Rating Scale */}
        <div className="form-section rating-scale-section">
          <h2 className="section-title">B. Rating Scale</h2>

          <table className="rating-scale-table">
            <thead>
              <tr>
                <th>Scale</th>
                <th>Qualitative Description</th>
                <th>Operational Definition</th>
              </tr>
            </thead>
            <tbody>
              {ratingScale.map(scale => (
                <tr key={scale.value}>
                  <td><strong>{scale.value}</strong></td>
                  <td>{scale.label}</td>
                  <td>{scale.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section C: Assessment Questions */}
        <div className="form-section">
          <h2 className="section-title">C. Instruction:</h2>
          <p className="instruction-text">
            Read the benchmark statements carefully. Please rate the faculty on each of the following statements below using the above-listed rating scale. Encircle your rating.
          </p>

          <div className="benchmark-header">
            <div className="benchmark-title">Benchmark Statements for Faculty Teaching Effectiveness</div>
            <div className="rating-header">Rating</div>
          </div>

          {assessmentSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="assessment-section">
              <h3 className="subsection-title">{section.section}</h3>
              <p className="section-description">{section.description}</p>

              {section.questions.map((question, qIndex) => {
                const globalIndex = assessmentSections
                  .slice(0, sectionIndex)
                  .reduce((sum, s) => sum + s.questions.length, qIndex);

                return (
                  <div key={globalIndex} className="question-row">
                    <div className="question-text">{question}</div>
                    <div className="rating-options">
                      {[5, 4, 3, 2, 1].map(value => (
                        <label key={value} className="rating-option">
                          <input
                            type="radio"
                            name={`question-${globalIndex}`}
                            value={value}
                            checked={ratings[globalIndex] === value}
                            onChange={() => handleRatingChange(globalIndex, value)}
                            required
                          />
                          <span>{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Total Score */}
          <div className="total-score-row">
            <div className="total-label">Total score</div>
            <div className="total-value">{calculateTotalScore()}</div>
          </div>

          {/* Comments */}
          <div className="form-group">
            <label>Other comments and suggestions (Optional):</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              placeholder="Enter your feedback here..."
            />
          </div>

          {/* Note */}
          <div className="note-box">
            <strong>Note</strong>
            <p>
              Your feedback is important in enhancing the educational programs of State Universities and Colleges (SUCs).
              Please be informed that any information provided in this instrument will be treated as strictly confidential.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer-box">
            <h3>⚠️ Important Reminder</h3>
            <p><strong>Be honest and fair in your assessments.</strong> False or misleading assessments may result in disciplinary action.</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              All assessment data is archived by administrators at the end of each month for record-keeping purposes.
            </p>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssessmentForm;
