import React, { useState, useEffect } from 'react';
import splashLogo from '../../assets/splash-logo-clean.png';

const SplashScreen = ({ onFinish }) => {
  // animation phases: 'center' -> 'glide' -> 'fadeout' -> 'done'
  const [phase, setPhase] = useState('center');

  // Prevent background scrolling and hide scrollbar while splash screen is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    // 1. Center phase (Image 2) lasts 1.4s
    const glideTimer = setTimeout(() => {
      setPhase('glide');
    }, 1400);

    // 2. Glide phase (Image 3) transitions to top-left for 0.65s, then fadeout begins
    const fadeTimer = setTimeout(() => {
      setPhase('fadeout');
    }, 2050);

    // 3. Complete and unmount
    const finishTimer = setTimeout(() => {
      setPhase('done');
      if (onFinish) onFinish();
    }, 2600);

    return () => {
      clearTimeout(glideTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // Click anywhere to skip
  const handleSkip = () => {
    setPhase('fadeout');
    setTimeout(() => {
      setPhase('done');
      if (onFinish) onFinish();
    }, 350);
  };

  if (phase === 'done') return null;

  const isGliding = phase === 'glide' || phase === 'fadeout';
  const isFading = phase === 'fadeout';

  return (
    <div
      onClick={handleSkip}
      className="splash-screen-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f0fdf4',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      {/* Main Animated Logo Element matching Image 2 & 3 */}
      <div
        className="splash-logo-container"
        style={{
          position: 'absolute',
          top: isGliding ? '16px' : '50%',
          left: isGliding
            ? 'max(24px, calc((100vw - 1440px) / 2 + 40px))'
            : '50%',
          transform: isGliding
            ? 'translate(0, 0)'
            : 'translate(-50%, -50%)',
          width: isGliding ? '38px' : '296px',
          height: isGliding ? '38px' : '278px',
          transition:
            'top 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={splashLogo}
          alt="Dr. Kalpana Tripathi Ampeh Homeopathy Clinic Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .splash-logo-container {
            width: ${isGliding ? '34px' : '230px'} !important;
            height: ${isGliding ? '34px' : '216px'} !important;
            left: ${isGliding ? '20px' : '50%'} !important;
            top: ${isGliding ? '18px' : '50%'} !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
