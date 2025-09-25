import React, { useState, useRef, useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';

const AnimatedBackground = memo(function AnimatedBackground() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [farmerPosition, setFarmerPosition] = useState(10);
  const [seeds, setSeeds] = useState([]);
  const seedId = useRef(0);
  const { pathname } = useLocation();
  const frameId = useRef(null);

  // Handle scroll and update progress
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(currentScrollY / scrollHeight, 0), 1);
      setScrollProgress(progress);

      // Update farmer position
      setFarmerPosition(10 + progress * 80);

      // Add seeds randomly
      if (Math.random() > 0.8) {
        setSeeds(prev => [
          ...prev.slice(-15),
          {
            id: seedId.current++,
            x: farmerPosition + (Math.random() * 20 - 10),
            y: 0,
            progress: 0,
          },
        ]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [farmerPosition]);

  // Animate seeds
  useEffect(() => {
    const animate = () => {
      setSeeds(prevSeeds =>
        prevSeeds
          .map(seed => ({
            ...seed,
            progress: seed.progress + 0.02,
            y: Math.sin(seed.progress * 2) * 20,
          }))
          .filter(seed => seed.progress < 5)
      );
      frameId.current = requestAnimationFrame(animate);
    };

    frameId.current = requestAnimationFrame(animate);
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, []);

  if (pathname !== '/') return null;

  // 🌞 Sun style - much higher arc (up to ~80% of screen height)
  const sunStyle = {
    position: 'fixed',
    bottom: `${5 + Math.sin(scrollProgress * Math.PI) * 75}%`, // raise near top
    left: `${5 + scrollProgress * 90}%`, // left → right across screen
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #FFD700, #FF8C00)',
    boxShadow: '0 0 60px 25px rgba(255, 215, 0, 0.6)',
    transform: 'translate(-50%, 50%)',
    zIndex: 10,
    transition: 'all 0.1s ease-out',
  };

  // ☁️ Cloud style
  const cloudStyle = offset => ({
    position: 'fixed',
    top: '20%',
    left: `calc(${offset}% + ${Date.now() * 0.01}px)`,
    width: '120px',
    height: '60px',
    background: 'white',
    borderRadius: '50px',
    filter: 'blur(8px)',
    opacity: 0.8,
    transform: 'translateX(-50%)',
    zIndex: 5,
  });

  // 🚜 Farmer style
  const farmerStyle = {
    position: 'fixed',
    bottom: '8%',
    left: `${farmerPosition}%`,
    transform: 'translateX(-50%)',
    zIndex: 20,
    width: '80px',
    height: '130px',
    transition: 'left 0.1s ease-out',
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Sun */}
      <div style={sunStyle}></div>

      {/* Clouds */}
      <div style={cloudStyle(20)}></div>
      <div
        style={{ ...cloudStyle(50), width: '150px', top: '15%', opacity: 0.7 }}
      ></div>
      <div
        style={{ ...cloudStyle(80), width: '100px', top: '25%' }}
      ></div>

      {/* Farmer */}
      <div style={farmerStyle}>
        <svg width="80" height="130" viewBox="0 0 80 130">
          {/* Farmer body */}
          <circle cx="40" cy="30" r="18" fill="#FFD699" />
          <rect x="30" y="50" width="20" height="40" fill="#4A90E2" />
          <rect x="20" y="50" width="40" height="8" fill="#333" />
          <rect x="20" y="90" width="8" height="30" fill="#333" />
          <rect x="52" y="90" width="8" height="30" fill="#333" />
          <rect x="10" y="60" width="25" height="8" fill="#4A90E2" />
          <rect x="45" y="60" width="25" height="8" fill="#4A90E2" />
          <circle cx="32" cy="26" r="2" fill="#333" />
          <circle cx="48" cy="26" r="2" fill="#333" />
          <path d="M32 38 Q40 42 48 38" fill="none" stroke="#333" strokeWidth="2" />

          {/* Seed bag */}
          <rect x="12" y="75" width="16" height="12" fill="#8B4513" rx="2" />
          <path d="M12 75 L20 65 L28 75 Z" fill="#A0522D" />
        </svg>
      </div>

      {/* Seeds */}
      {seeds.map(seed => (
        <div
          key={seed.id}
          style={{
            position: 'fixed',
            bottom: `${10 + seed.progress * 10}%`,
            left: `${seed.x + Math.sin(seed.progress * 2) * 5}%`,
            width: '5px',
            height: '5px',
            backgroundColor: '#8B4513',
            borderRadius: '50%',
            opacity: 1 - seed.progress / 5,
            transform: 'translate(-50%, 50%)',
            zIndex: 15,
          }}
        />
      ))}

      {/* Animations */}
      <style>{`
        @keyframes walk {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
});

export default AnimatedBackground;
