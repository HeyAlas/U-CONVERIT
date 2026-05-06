import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../../services/authService';   // ← ADD THIS
import '../../styles/auth.css';


function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';

  // OTP state — array of 6 digits
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);

  // Refs for each input — to auto-focus next box
  const inputRefs = useRef([]);

  // Resend timer countdown
  useEffect(() => {
    if (resendDisabled && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setResendDisabled(false);
    }
  }, [resendDisabled, timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle typing in OTP boxes
  const handleChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit if user types fast
    setOtp(newOtp);
    setError('');

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace (move to previous box)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste (e.g., "123456" → fills all boxes)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setOtp(newOtp);
    
    // Focus the last filled box
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);

    // Call real Supabase OTP verification!
    const result = await verifyOtp({
      email: email,
      token: enteredOtp,
    });

    setLoading(false);

    if (result.success) {
      // Success! User is now verified and logged in
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    
    // Call real Supabase resend!
    const result = await resendOtp(email);
    
    if (!result.success) {
      setError(result.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Check Your Email</h1>
        <p className="signup-subtitle">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="signup-form">
          <div
            className="otp-container"
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                style={{
                  width: '45px',
                  height: '50px',
                  textAlign: 'center',
                  fontSize: '20px',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
            ))}
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>

        <p className="login-link" style={{ textAlign: 'center', marginTop: '16px' }}>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            style={{
              background: 'none',
              border: 'none',
              color: resendDisabled ? '#999' : '#2563eb',
              cursor: resendDisabled ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
          </button>
        </p>

        <p className="login-link" style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link to="/signup">← Back to Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default CheckEmail;