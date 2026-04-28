import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    // Simulate auth — replace this with your real auth call
    setTimeout(() => {
      setLoading(false);
      // On success, navigate to dashboard (triggers PageTransition)
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back, Teknoy!</h1>

        <form onSubmit={handleSubmit} className="login-form">
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

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>{error}</p>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account?{' '}
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signup');
            }}
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;