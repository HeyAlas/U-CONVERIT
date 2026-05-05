import React from 'react';
import Hero from './Hero';
import FeaturedTools from './FeaturedTools';
import HowItWorks from './HowItWorks';

const PARTICLES = [
  { top: '11%', left: '7%',  size: 6 },
  { top: '27%', left: '91%', size: 4 },
  { top: '53%', left: '4%',  size: 5 },
  { top: '68%', left: '76%', size: 7 },
  { top: '83%', left: '21%', size: 4 },
  { top: '42%', left: '51%', size: 5 },
];

function MainDashboard() {
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden relative">

      {/* ── Ambient Background Layer ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Background Orbs (drifting maroon glows) */}
        <div
          className="bg-orb-1"
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-8%',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,21,21,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="bg-orb-2"
          style={{
            position: 'absolute',
            top: '4%',
            right: '-10%',
            width: 640,
            height: 640,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(185,28,28,0.05) 0%, transparent 70%)',
          }}
        />
        <div
          className="bg-orb-3"
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '28%',
            width: 720,
            height: 720,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,21,21,0.04) 0%, transparent 70%)',
          }}
        />

        {/* Floating Particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className={`particle-${i + 1}`}
            style={{
              position: 'absolute',
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: '#8B1515',
              opacity: 0.15,
            }}
          />
        ))}
      </div>

      {/* ── Page Content ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <FeaturedTools />
        <HowItWorks />
      </div>
    </div>
  );
}

export default MainDashboard;