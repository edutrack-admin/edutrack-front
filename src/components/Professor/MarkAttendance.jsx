import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { attendance } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function MarkAttendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [captureType, setCaptureType] = useState(null);
  const [stream, setStream] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [notes, setNotes] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const startFileInputRef = useRef(null);
  const endFileInputRef = useRef(null);

  const subjects = user?.subjects || [];
  const sections = ['Section A', 'Section B', 'Section C', 'Section D'];

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream to video when both are ready
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        video.play()
          .then(() => {
            setCameraLoading(false);
          })
          .catch(err => {
            console.error('❌ Play error:', err);
            setCameraLoading(false);
          });
      };
    }
  }, [stream, showCamera]);

  const startCamera = async (type) => {
    setCameraLoading(true);
    setShowCamera(true);
    setCaptureType(type);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      setStream(mediaStream);
      
    } catch (error) {
      console.error('❌ Camera error:', error);
      alert('Error accessing camera: ' + error.message);
      setCameraLoading(false);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCaptureType(null);
    setCameraLoading(false);
  };

  const capturePhoto = () => {
    console.log('📸 Capturing photo...');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        console.log('Photo captured, blob size:', blob.size);
        const imageUrl = URL.createObjectURL(blob);
        handlePhotoCapture(imageUrl, blob);
      }, 'image/jpeg', 0.95);
    } else {
      console.error('Canvas or video ref is null');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      console.log('✅ Valid image file selected:', file.name, file.size);
      const imageUrl = URL.createObjectURL(file);
      handlePhotoCapture(imageUrl, file);
    } else {
      console.log('❌ No valid image file selected');
      if (file) {
        alert('Please select an image file (JPG, PNG, etc.)');
      }
    }
    
    // Reset file input so same file can be selected again
    event.target.value = '';
  };

  const handlePhotoCapture = async (imageUrl, imageBlob) => {
    const timestamp = new Date();
    
    if (captureType === 'start') {
      if (!selectedSubject || !selectedSection) {
        alert('Please select subject and section before starting class');
        return;
      }
    if (!classRoom || classRoom.trim() === '') {
       alert('Please enter a classroom before starting class');
      return;
      }

      try {
        setLoading(true);

        const result = await attendance.start(
          {
            subject: selectedSubject,
            section: selectedSection,
            classRoom: classRoom,
            notes: notes
          },
          imageBlob
        );

        const newSession = {
          ...result.data,
          id: result.data._id || result.data.id || Date.now(),
          startImage: imageUrl,
          startImageBlob: imageBlob,
          status: 'ongoing'
        };
        
        setSessions(prev => [...prev, newSession]);
        setActiveSession(newSession);
        
        setSelectedSubject('');
        setSelectedSection('');
        setClassRoom('');
        setNotes('');

        stopCamera();
        console.log('Session created successfully');
      } catch (error) {
        console.error('❌ Error starting attendance:', error);
        alert('Error starting attendance: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    } else if (captureType === 'end' && activeSession) {
      try {
        setLoading(true);

        const result = await attendance.end(
          activeSession._id || activeSession.id,
          imageBlob
        );

        const updatedSession = {
          ...result.data,
          id: result.data._id || result.data.id,
          endImage: imageUrl,
          status: 'completed'
        };
        
        setSessions(prev => 
          prev.map(s => 
            (s._id || s.id) === (activeSession._id || activeSession.id) 
              ? updatedSession 
              : s
          )
        );
        setActiveSession(null);

        stopCamera();
        console.log('Session ended successfully');
      } catch (error) {
        console.error('❌ Error ending attendance:', error);
        alert('Error ending attendance: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCurrentDuration = () => {
  if (!activeSession) return 0;

  // If backend already finalized duration, trust it
  if (activeSession.duration != null) {
    return activeSession.duration;
  }

  // UI-only estimate while session is ongoing
  return Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
};


  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        setCurrentDuration(getCurrentDuration());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // Load today's sessions on mount
  useEffect(() => {
    const loadTodaySessions = async () => {
      try {
        const result = await attendance.getToday();
        
        if (result.success && result.data) {
          const transformedSessions = result.data.map(s => ({
            ...s,
            id: s._id,
            startImage: s.startImage?.url,
            endImage: s.endImage?.url
          }));
          setSessions(transformedSessions);
          
          const ongoing = transformedSessions.find(s => s.status === 'ongoing');
          if (ongoing) {
            setActiveSession(ongoing);
          }
        }
      } catch (error) {
        console.error('❌ Error loading today\'s sessions:', error);
      }
    };

    loadTodaySessions();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
  }, [selectedSubject]);

  useEffect(() => {
  }, [selectedSection]);

  useEffect(() => {
  }, [loading]);

  const handleCameraButtonClick = () => {
    if (!selectedSubject || !selectedSection) {
      alert('Please select both subject and section first!');
      return;
    }
    
    startCamera('start');
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style> 

      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px', borderRadius: '8px' }}>
        <strong>Debug Info:</strong>
        <div>Selected Subject: {selectedSubject || 'None'}</div>
        <div>Selected Section: {selectedSection || 'None'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Button Enabled: {selectedSubject && selectedSection && !loading ? 'Yes' : 'No'}</div>
      </div>

      {showCamera && (
        <div style={styles.cameraModal}>
          <div style={styles.cameraContainer}>
            <div style={styles.cameraHeader}>
              <h3>📸 {captureType === 'start' ? 'Start Class' : 'End Class'}</h3>
              <button onClick={stopCamera} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              style={styles.video}
            />
            
            {cameraLoading && (
              <div style={styles.cameraLoading}>
                <div style={styles.spinner}></div>
                <p>Loading camera...</p>
              </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={styles.cameraActions}>
              <button 
                onClick={capturePhoto} 
                style={styles.captureBtn}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '📷 Capture Photo'}
              </button>
              <button 
                onClick={() => {
                  fileInputRef.current?.click();
                }} 
                style={styles.uploadBtn}
                disabled={loading}
              >
                <Upload size={20} /> Upload Instead
              </button>
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                onClick={(e) => {
                  console.log('📂 File input clicked');
                  e.stopPropagation();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeSession && (
        <div style={styles.activeSessionCard}>
          <div style={styles.sessionHeader}>
            <div>
              <h3 style={styles.sessionTitle}>
                <CheckCircle size={20} color="#10b981" />
                Class in Progress
              </h3>
              <p style={styles.sessionSubject}>{activeSession.subject} - {activeSession.section}</p>
            </div>
            <div style={styles.timerDisplay}>
              <Clock size={24} />
              <span style={styles.timerText}>{formatDuration(currentDuration)}</span>
            </div>
          </div>
          
          <div style={styles.sessionDetails}>
            <div style={styles.detailItem}>
              <span style={styles.label}>Started:</span>
              <span style={styles.value}>{formatTime(activeSession.startTime)}</span>
            </div>
            {activeSession.classRoom && (
              <div style={styles.detailItem}>
                <span style={styles.label}>Room:</span>
                <span style={styles.value}>{activeSession.classRoom}</span>
              </div>
            )}
          </div>

          <div style={styles.sessionActions}>
            <button 
              onClick={() => startCamera('end')}
              style={styles.endClassBtn}
            >
              <Camera size={20} /> End Class
            </button>
            <button 
              onClick={() => {
                console.log('🖱️ End upload button clicked');
                setCaptureType('end');
                if (endFileInputRef.current) {
                  endFileInputRef.current.click();
                } else {
                  console.error('End file input ref is null');
                }
              }}
              style={styles.uploadEndBtn}
            >
              <Upload size={20} /> Upload Photo
            </button>
            <input 
              ref={endFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {!activeSession && (
        <div style={styles.startClassCard}>
          <h2 style={styles.cardTitle}>Start New Class</h2>
          
          {(!user?.subjects || user.subjects.length === 0) && (
            <div style={{
              background: '#fff3e0',
              border: '2px solid #ff9800',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong>⚠️ No Subjects Assigned</strong>
              <p style={{ marginTop: '5px', fontSize: '14px', marginBottom: 0 }}>
                You don't have any subjects assigned yet. Please contact the admin to assign subjects to your account before marking attendance.
              </p>
            </div>
          )}
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Subject *</label>
              <select 
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                }}
                style={styles.select}
                disabled={!user?.subjects || user.subjects.length === 0}
              >
                <option value="">
                  {user?.subjects && user.subjects.length > 0 ? 'Select Subject' : 'No Subjects Assigned'}
                </option>
                {subjects.map((subject, idx) => (
                  <option key={idx} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Section *</label>
              <select 
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                }}
                style={styles.select}
              >
                <option value="">Select Section</option>
                {sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Classroom *</label>
              <input 
                type="text"
                value={classRoom}
                onChange={(e) => setClassRoom(e.target.value)}
                placeholder="e.g., Room 301"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this class..."
                style={styles.textarea}
                rows={3}
              />
            </div>
          </div>

          <div style={styles.startActions}>
            <button 
              onClick={handleCameraButtonClick}
              style={{
                ...styles.startCameraBtn,
                opacity: (!selectedSubject || !selectedSection || loading) ? 0.5 : 1,
                cursor: (!selectedSubject || !selectedSection || loading) ? 'not-allowed' : 'pointer'
              }}
              disabled={!selectedSubject || !selectedSection || loading}
            >
              <Camera size={20} /> {loading ? 'Starting...' : 'Start with Camera'}
            </button>
            <button 
              onClick={() => {
                
                if (!selectedSubject || !selectedSection) {
                  alert('Please select subject and section');
                  return;
                }
                
                setCaptureType('start');
                
                // Use the separate file input for start button
                if (startFileInputRef.current) {
                  startFileInputRef.current.click();
                } else {
                  console.error('Start file input ref is null');
                }
              }}
              style={{
                ...styles.startUploadBtn,
                opacity: (!selectedSubject || !selectedSection || loading) ? 0.5 : 1,
                cursor: (!selectedSubject || !selectedSection || loading) ? 'not-allowed' : 'pointer'
              }}
              disabled={!selectedSubject || !selectedSection || loading}
            >
              <Upload size={20} /> Start with Upload
            </button>
            
            {/* Hidden file input for Start with Upload button */}
            <input 
              ref={startFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      <div style={styles.sessionsCard}>
        <h2 style={styles.cardTitle}>Today's Sessions</h2>
        
        {sessions.length === 0 ? (
          <div style={styles.emptyState}>
            <AlertCircle size={48} color="#9ca3af" />
            <p style={styles.emptyText}>No classes recorded today</p>
          </div>
        ) : (
          <div style={styles.sessionsList}>
            {sessions.slice().reverse().map(session => (
              <div key={session.id} style={styles.sessionItem}>
                <div style={styles.sessionItemHeader}>
                  <div>
                    <h4 style={styles.sessionItemTitle}>{session.subject}</h4>
                    <p style={styles.sessionItemSubtitle}>{session.section}</p>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    ...(session.status === 'ongoing' ? styles.statusOngoing : styles.statusCompleted)
                  }}>
                    {session.status === 'ongoing' ? 'In Progress' : 'Completed'}
                  </div>
                </div>

                <div style={styles.sessionImages}>
                  <div style={styles.imageContainer}>
                    <img src={session.startImage} alt="Start" style={styles.image} />
                    <div style={styles.imageLabel}>
                      <Clock size={14} />
                      Start: {formatTime(session.startTime)}
                    </div>
                  </div>
                  
                  {session.endImage && (
                    <div style={styles.imageContainer}>
                      <img src={session.endImage} alt="End" style={styles.image} />
                      <div style={styles.imageLabel}>
                        <Clock size={14} />
                        End: {formatTime(session.endTime)}
                      </div>
                    </div>
                  )}
                </div>

                {session.duration && (
                  <div style={styles.durationInfo}>
                    <strong>Duration:</strong> {formatDuration(session.duration)}
                  </div>
                )}

                {session.status === 'completed' && (
                  <div style={styles.savedBadge}>
                    ✓ Saved to Database
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  cameraModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  cameraContainer: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '20px',
    maxWidth: '600px',
    width: '100%',
    position: 'relative'
  },
  cameraHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px'
  },
  video: {
    width: '100%',
    height: 'auto',
    minHeight: '300px',
    borderRadius: '10px',
    marginBottom: '15px',
    backgroundColor: '#000',
    objectFit: 'cover'
  },
  cameraLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'white',
    zIndex: 10
  },
  spinner: {
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 10px'
  },
  cameraActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  captureBtn: {
    flex: 1,
    minWidth: '150px',
    padding: '15px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  uploadBtn: {
    flex: 1,
    minWidth: '150px',
    padding: '15px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  activeSessionCard: {
    backgroundColor: '#ecfdf5',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  sessionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 5px 0',
    fontSize: '18px',
    color: '#065f46'
  },
  sessionSubject: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#047857'
  },
  timerDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'white',
    padding: '15px 25px',
    borderRadius: '50px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  timerText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea'
  },
  sessionDetails: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  detailItem: {
    display: 'flex',
    gap: '8px'
  },
  sessionActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  endClassBtn: {
    flex: 1,
    minWidth: '150px',
    padding: '12px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  uploadEndBtn: {
    flex: 1,
    minWidth: '150px',
    padding: '12px 20px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  startClassCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  value: {
    fontSize: '14px',
    color: '#6b7280'
  },
  select: {
    padding: '10px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  input: {
    padding: '10px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  startActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  startCameraBtn: {
    flex: 1,
    minWidth: '180px',
    padding: '15px 25px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s'
  },
  startUploadBtn: {
    flex: 1,
    minWidth: '180px',
    padding: '15px 25px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  sessionsCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af'
  },
  emptyText: {
    marginTop: '15px',
    fontSize: '16px'
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sessionItem: {
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#fafafa'
  },
  sessionItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  sessionItemTitle: {
    margin: '0 0 5px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937'
  },
  sessionItemSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  statusOngoing: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
    color: '#065f46'
  },
  sessionImages: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  imageContainer: {
    position: 'relative'
  },
  image: {
    width: '100%',
    borderRadius: '8px',
    border: '2px solid #e5e7eb'
  },
  imageLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '8px',
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600'
  },
  durationInfo: {
    backgroundColor: '#ede9fe',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#5b21b6'
  },
  savedBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '10px 15px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  }
};

export default MarkAttendance;