import React, { useEffect } from 'react';
import Hero from './Hero';
import FeaturedTools from './FeaturedTools';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

const ANIMATION_STYLES = `
  /* ── Entry animations (one-shot) ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-36px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(36px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Looping ambient animations ── */

  @keyframes floatCard {
    0%   { transform: translateY(0px) rotate(0deg);   box-shadow: 0 8px 24px rgba(139,21,21,0.07); }
    50%  { transform: translateY(-10px) rotate(0.4deg); box-shadow: 0 22px 44px rgba(139,21,21,0.13); }
    100% { transform: translateY(0px) rotate(0deg);   box-shadow: 0 8px 24px rgba(139,21,21,0.07); }
  }

  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 4px 15px rgba(139,21,21,0.28); }
    50%       { box-shadow: 0 8px 38px rgba(139,21,21,0.58), 0 0 70px rgba(139,21,21,0.18); }
  }

  @keyframes textShimmer {
    0%   { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  @keyframes iconFloat {
    0%   { transform: translateY(0px)  scale(1); }
    50%  { transform: translateY(-6px) scale(1.05); }
    100% { transform: translateY(0px)  scale(1); }
  }

  @keyframes stepGlow {
    0%, 100% { text-shadow: none; color: #8B1515; }
    50%       { text-shadow: 0 0 18px rgba(139,21,21,0.5), 0 0 36px rgba(139,21,21,0.2); color: #c41a1a; }
  }

  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0   rgba(139,21,21,0.35); }
    70%  { box-shadow: 0 0 0 16px rgba(139,21,21,0); }
    100% { box-shadow: 0 0 0 0   rgba(139,21,21,0); }
  }

  @keyframes orbDrift1 {
    0%   { transform: translate(0,0)      scale(1); }
    33%  { transform: translate(70px,-50px) scale(1.1); }
    66%  { transform: translate(-40px,60px) scale(0.95); }
    100% { transform: translate(0,0)      scale(1); }
  }
  @keyframes orbDrift2 {
    0%   { transform: translate(0,0)        scale(1); }
    33%  { transform: translate(-55px,35px)  scale(1.06); }
    66%  { transform: translate(45px,-65px)  scale(1.12); }
    100% { transform: translate(0,0)        scale(1); }
  }
  @keyframes orbDrift3 {
    0%   { transform: translate(0,0)      scale(1); }
    50%  { transform: translate(35px,45px) scale(1.08); }
    100% { transform: translate(0,0)      scale(1); }
  }

  @keyframes particleDrift {
    0%   { transform: translateY(0)   translateX(0);  opacity: 0.15; }
    25%  { transform: translateY(-22px) translateX(9px);  opacity: 0.35; }
    50%  { transform: translateY(-38px) translateX(-6px); opacity: 0.18; }
    75%  { transform: translateY(-22px) translateX(11px); opacity: 0.28; }
    100% { transform: translateY(0)   translateX(0);  opacity: 0.15; }
  }

  /* ── Applied styles ── */

  .upload-widget {
    animation: floatCard 4.2s ease-in-out infinite !important;
  }
  .upload-icon-ring {
    animation: pulseRing 2.2s ease-out infinite !important;
  }
  .upload-btn {
    transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease !important;
  }
  .upload-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(139,21,21,0.28) !important;
  }

  .hero-cta {
    animation: glowPulse 2.6s ease-in-out infinite !important;
    transition: transform 0.2s ease, background-color 0.2s ease !important;
  }
  .hero-cta:hover {
    transform: translateY(-2px) scale(1.02) !important;
  }

  .hero-heading-shimmer {
    background: linear-gradient(
      90deg,
      #8B1515 0%, #8B1515 28%,
      #d94040 42%, #ff9999 50%,
      #d94040 58%, #8B1515 72%,
      #8B1515 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: textShimmer 4s linear infinite !important;
  }

  .tool-card:nth-child(1) .tool-icon { animation: iconFloat 3.0s ease-in-out infinite 0.0s; }
  .tool-card:nth-child(2) .tool-icon { animation: iconFloat 3.2s ease-in-out infinite 0.35s; }
  .tool-card:nth-child(3) .tool-icon { animation: iconFloat 3.4s ease-in-out infinite 0.7s; }
  .tool-card:nth-child(4) .tool-icon { animation: iconFloat 3.6s ease-in-out infinite 1.05s; }
  .tool-card:nth-child(5) .tool-icon { animation: iconFloat 3.8s ease-in-out infinite 1.4s; }

  .step-number { animation: stepGlow 2.8s ease-in-out infinite !important; }
  .step-item:nth-child(2) .step-number { animation-delay: 0.7s !important; }
  .step-item:nth-child(3) .step-number { animation-delay: 1.4s !important; }
  .step-item:nth-child(4) .step-number { animation-delay: 2.1s !important; }

  .bg-orb-1 { animation: orbDrift1 20s ease-in-out infinite; }
  .bg-orb-2 { animation: orbDrift2 25s ease-in-out infinite; }
  .bg-orb-3 { animation: orbDrift3 17s ease-in-out infinite; }

  .particle-1 { animation: particleDrift 5.0s ease-in-out infinite 0.0s; }
  .particle-2 { animation: particleDrift 6.5s ease-in-out infinite 1.0s; }
  .particle-3 { animation: particleDrift 7.2s ease-in-out infinite 2.0s; }
  .particle-4 { animation: particleDrift 5.8s ease-in-out infinite 0.5s; }
  .particle-5 { animation: particleDrift 8.0s ease-in-out infinite 1.5s; }
  .particle-6 { animation: particleDrift 6.3s ease-in-out infinite 3.0s; }

  .nav-signup {
    transition: transform 0.2s ease, background-color 0.2s ease !important;
  }
  .nav-signup:hover { transform: translateY(-1px) !important; }
`;

const PARTICLES = [
  { top: '11%',  left: '7%',   size: 6 },
  { top: '27%',  left: '91%',  size: 4 },
  { top: '53%',  left: '4%',   size: 5 },
  { top: '68%',  left: '76%',  size: 7 },
  { top: '83%',  left: '21%',  size: 4 },
  { top: '42%',  left: '51%',  size: 5 },
];

function MainDashboard() {
  useEffect(() => {
    const id = 'dashboard-animations';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = ANIMATION_STYLES;
      document.head.appendChild(tag);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden relative">

      {/* ── Ambient background layer ── */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
      >
        <div className="bg-orb-1" style={{
          position: 'absolute', top: '-10%', left: '-8%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,21,21,0.07) 0%, transparent 70%)',
        }} />
        <div className="bg-orb-2" style={{
          position: 'absolute', top: '4%', right: '-10%',
          width: 640, height: 640, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(185,28,28,0.05) 0%, transparent 70%)',
        }} />
        <div className="bg-orb-3" style={{
          position: 'absolute', bottom: '8%', left: '28%',
          width: 720, height: 720, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,21,21,0.04) 0%, transparent 70%)',
        }} />
        {PARTICLES.map((p, i) => (
          <div key={i} className={`particle-${i + 1}`} style={{
            position: 'absolute', top: p.top, left: p.left,
            width: p.size, height: p.size, borderRadius: '50%',
            background: '#8B1515', opacity: 0.15,
          }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <FeaturedTools />
        <HowItWorks />
        <Footer />
      </div>
    </div>
  );
}

export default MainDashboard;