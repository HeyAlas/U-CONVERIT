import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import '../../styles/auth.css';

// 🎯 Mock OTP for testing — change this to whatever you want
// In production, this code will be sent via your backend (e.g., Supabase, SendGrid)
const MOCK_OTP = '123456';

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

  // Verify OTP
  const handleVerify = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);

    // Simulate verification delay (mock backend)
    setTimeout(() => {
      setLoading(false);

      if (enteredOtp === MOCK_OTP) {
        // ✅ Success — redirect to dashboard
        navigate('/dashboard');
      } else {
        // ❌ Wrong code
        setError('Invalid code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 800);
  };

  // Resend OTP
  const handleResend = () => {
    setResendDisabled(true);
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    // TODO: Call your backend to resend the code
    console.log('Resending OTP to:', email);
  };

  return (
    <div className="check-email-container">
      <div className="check-email-card">
        {/* Email Icon */}
        <div className="check-email-icon">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="check-email-title">Verify Your Email</h1>

        {/* Message */}
        <p className="check-email-message">
          We've sent a 6-digit code to:
        </p>
        <div className="check-email-address">
          {email}
        </div>
        <p className="check-email-message">
          Enter the code below to verify your account.
        </p>

        {/* OTP Form */}
        <form onSubmit={handleVerify}>
          <div className="otp-input-group" onPaste={handlePaste}>
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
                className={`otp-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                disabled={loading}
              />
            ))}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="verify-button"
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>

        {/* Resend Section */}
        <div className="resend-section">
          Didn't receive the code?{' '}
          <button
            className="resend-link"
            onClick={handleResend}
            disabled={resendDisabled}
          >
            {resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
          </button>
        </div>

        {/* Back to Login */}
        <p className="back-to-login">
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default CheckEmail;