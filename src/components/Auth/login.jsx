import { useState } from 'react';
import { auth } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await auth.login(email, password);
      
      // Check if email verification is needed
      if (data.needsVerification) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }

      // Successful login - navigate to dashboard
      navigate('/');
      window.location.reload(); // Refresh to update auth state
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await auth.forgotPassword(email);
      setResetEmailSent(true);
      alert('Password reset email sent! Check your inbox for instructions.');
      setShowForgotPassword(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🔐 Reset Password</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {resetEmailSent && (
            <div className="success-message">
              ✓ Password reset email sent! Check your inbox.
            </div>
          )}

          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@school.com"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-full"
              style={{ marginTop: '10px' }}
              onClick={() => setShowForgotPassword(false)}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📚 Teacher Attendance</h1>
          <p>Welcome back! Please login to continue.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@school.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <button 
              type="button" 
              className="link-button"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            All accounts are created by administrators
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;