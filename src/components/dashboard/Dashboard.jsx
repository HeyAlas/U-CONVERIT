import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Profile from './Profile';
import QuizHistory from './QuizHistory';
import Paraphraser from './tools/Paraphraser';
import Humanizer from './tools/Humanizer';
import OCR from './tools/OCR';
import QuizMaker from './tools/QuizMaker';
import ConvertPDF from './tools/ConvertPDF';
import { logout } from '../../services/authService';
import '../../styles/dashboard.css';


const tools = [
  {
    id: 'paraphraser',
    label: 'Paraphraser',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'humanizer',
    label: 'Humanizer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'ocr',
    label: 'OCR',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round"/>
        <rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'quizmaker',
    label: 'Quiz Maker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 9h.01M9 12h.01M9 15h.01M13 9h3M13 12h3M13 15h3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'convertpdf',
    label: 'Convert PDF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const PROFILE_ID = 'profile';
const QUIZ_HISTORY_ID = 'quizhistory';

// Map tool IDs to their components
const toolComponents = {
  paraphraser: <Paraphraser />,
  humanizer: <Humanizer />,
  ocr: <OCR />,
  quizmaker: <QuizMaker />,
  convertpdf: <ConvertPDF />,
  [PROFILE_ID]: <Profile />,
  [QUIZ_HISTORY_ID]: <QuizHistory />,
};

function Dashboard() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState('paraphraser');
  const [showDropdown, setShowDropdown] = useState(false);

  const isProfile = activeTool === PROFILE_ID;
  const isQuizHistory = activeTool === QUIZ_HISTORY_ID;
  const current = tools.find(t => t.id === activeTool);
  const topbarTitle = isProfile
    ? 'My Profile'
    : isQuizHistory
    ? 'Quiz History'
    : `${current?.label} Tool`;

  const handleLogout = async (e) => {
    e.preventDefault();
    
    await logout();   // Sign out from Supabase
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <div className="logo-circle">
            <img src="/logo.png" alt="U" className="logo-img" />
          </div>
          <div className="brand-wrap">
            <span className="brand">U-ConvertIT</span>
          </div>
        </div>

        <div className="topbar-title">{topbarTitle}</div>

        <div className="user-menu">
          <button
            className="user-btn"
            onClick={() => setShowDropdown(prev => !prev)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={28} height={28}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
          </button>
          {showDropdown && (
            <div className="dropdown">
              <button
                className="dropdown-item"
                onClick={() => { setActiveTool(PROFILE_ID); setShowDropdown(false); }}
              >
                Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => { setActiveTool(QUIZ_HISTORY_ID); setShowDropdown(false); }}
              >
                Quiz History
              </button>
              <button
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-main">
        {/* ── Sidebar ── */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav" style={{ flex: 1 }}>
            {tools.map(tool => (
              <button
                key={tool.id}
                className={`sidebar-item ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
              >
                <span className="sidebar-icon">{tool.icon}</span>
                <span className="sidebar-label">{tool.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="dashboard-body">
          <div className="tool-area">
            {toolComponents[activeTool]}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;