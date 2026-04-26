import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <img src="/logo.png" alt="U-ConvertIT Logo" width={65} height={65} />
        <span className="brand-name">U-ConvertIT</span>
      </div>
      <nav className="header-nav">
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/signup" className="nav-button">Sign Up</Link>
      </nav>
    </header>
  );
}

export default Header;