import { useState } from 'react';
import './SignUpForm.css';

function SignUpForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Create an Account</h1>
        <p className="signup-subtitle">Enter your Information to create an account</p>
        
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
            />
          </div>

          <button type="submit" className="submit-button">
            Create an Account
          </button>
        </form>

        <p className="login-link">
          Already have an Account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default SignUpForm;