import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'entering' | 'visible' | 'leaving'
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Don't animate on the very first render
    if (phase === 'idle' && displayChildren === children) return;

    // A new location was pushed — start the sequence
    setPhase('entering');

    const visibleTimer = setTimeout(() => {
      setPhase('visible');
    }, 450); // overlayIn duration

    const swapTimer = setTimeout(() => {
      setDisplayChildren(children);
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
              src="/logo.png"
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