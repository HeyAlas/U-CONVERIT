import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpForm.css';

function SignUpForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // Simulate account creation — replace with your real signup call
    setTimeout(() => {
      setLoading(false);
      // On success, go straight to dashboard (triggers PageTransition)
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Create an Account</h1>
        <p className="signup-subtitle">Enter your information to create an account</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Type Here"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Type Here"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Type Here"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Type Here"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>{error}</p>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating account…' : 'Create an Account'}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignUpForm;