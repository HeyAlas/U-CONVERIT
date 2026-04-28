import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const TRANSITION_STYLES = `
  @keyframes overlayIn {
    from { clip-path: circle(0% at 50% 50%); }
    to   { clip-path: circle(150% at 50% 50%); }
  }

  @keyframes overlayOut {
    from { clip-path: circle(150% at 50% 50%); }
    to   { clip-path: circle(0% at 50% 50%); }
  }

  @keyframes logoPopIn {
    0%   { opacity: 0; transform: scale(0.6) translateY(12px); }
    60%  { opacity: 1; transform: scale(1.08) translateY(-3px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes logoPopOut {
    0%   { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.3); }
  }

  @keyframes wordmarkIn {
    from { opacity: 0; letter-spacing: 0.35em; }
    to   { opacity: 1; letter-spacing: 0.05em; }
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes ringExpand {
    0%   { transform: scale(0.7); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  .transition-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #8B1515;
    gap: 20px;
    pointer-events: none;
  }

  .transition-overlay.entering {
    animation: overlayIn 0.45s cubic-bezier(0.76, 0, 0.24, 1) both;
  }

  .transition-overlay.leaving {
    animation: overlayOut 0.45s cubic-bezier(0.76, 0, 0.24, 1) both;
  }

  .transition-logo-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .transition-ring {
    position: absolute;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.4);
    animation: ringExpand 1s ease-out infinite;
  }

  .transition-ring:nth-child(2) {
    animation-delay: 0.3s;
  }

  .transition-logo {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border-radius: 50%;
    background: white;
    padding: 6px;
    position: relative;
    z-index: 1;
  }

  .transition-logo.pop-in {
    animation: logoPopIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: 0.15s;
  }

  .transition-logo.pop-out {
    animation: logoPopOut 0.25s ease both;
  }

  .transition-wordmark {
    font-weight: 800;
    font-size: 1.4rem;
    color: white;
    letter-spacing: 0.05em;
    animation: wordmarkIn 0.5s ease both;
    animation-delay: 0.35s;
    opacity: 0;
    background: linear-gradient(90deg, #fff 0%, #ffcccc 40%, #fff 60%, #ffcccc 80%, #fff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .transition-wordmark.shimmer-active {
    animation: wordmarkIn 0.5s ease both, shimmer 1.8s linear 0.5s infinite;
    animation-fill-mode: forwards, none;
    opacity: 1;
  }

  .page-content {
    animation: pageFadeIn 0.35s ease both;
  }

  @keyframes pageFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

/**
 * PageTransition
 * Wraps your <Routes> to play a logo splash overlay on every navigation.
 *
 * Usage in App.jsx / your router file:
 *
 *   import PageTransition from './PageTransition';
 *
 *   function App() {
 *     return (
 *       <BrowserRouter>
 *         <Navigation />
 *         <PageTransition>
 *           <Routes>
 *             <Route path="/" element={<MainDashboard />} />
 *             <Route path="/login" element={<Login />} />
 *             <Route path="/signup" element={<Signup />} />
 *             ...
 *           </Routes>
 *         </PageTransition>
 *       </BrowserRouter>
 *     );
 *   }
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'entering' | 'visible' | 'leaving'
  const [displayChildren, setDisplayChildren] = useState(children);
  const [pendingChildren, setPendingChildren] = useState(null);

  // Inject styles once
  useEffect(() => {
    const id = 'page-transition-styles';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = TRANSITION_STYLES;
      document.head.appendChild(tag);
    }
    return () => {
      // Keep styles alive across navigations; only clean up on full unmount
    };
  }, []);

  useEffect(() => {
    // Don't animate on the very first render
    if (phase === 'idle' && displayChildren === children) return;

    // A new location was pushed — start the sequence
    setPendingChildren(children);
    setPhase('entering');

    const visibleTimer = setTimeout(() => {
      setPhase('visible');
    }, 450); // overlayIn duration

    const swapTimer = setTimeout(() => {
      setDisplayChildren(children);
      setPendingChildren(null);
      setPhase('leaving');
    }, 950); // hold overlay for ~500ms after in

    const idleTimer = setTimeout(() => {
      setPhase('idle');
    }, 1400); // overlayOut duration after leaving starts

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(swapTimer);
      clearTimeout(idleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const showOverlay = phase === 'entering' || phase === 'visible' || phase === 'leaving';
  const overlayClass =
    phase === 'entering' || phase === 'visible' ? 'entering' : 'leaving';

  return (
    <>
      {/* Page content */}
      <div key={location.key} className={phase === 'idle' ? 'page-content' : ''}>
        {displayChildren}
      </div>

      {/* Logo splash overlay */}
      {showOverlay && (
        <div className={`transition-overlay ${overlayClass}`}>
          <div className="transition-logo-wrap">
            <div className="transition-ring" />
            <div className="transition-ring" />
            <img
              src="logo.png"
              alt="U-ConvertIT"
              className={`transition-logo ${phase === 'leaving' ? 'pop-out' : 'pop-in'}`}
            />
          </div>
          <span className={`transition-wordmark ${phase === 'visible' ? 'shimmer-active' : ''}`}>
            U-ConvertIT
          </span>
        </div>
      )}
    </>
  );
};

export default PageTransition;