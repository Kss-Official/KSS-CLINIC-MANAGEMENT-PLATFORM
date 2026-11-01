import React, { useState, useEffect } from 'react';
import splashLogo from '../../assets/splash-logo-clean.png';

// Clean up any legacy sessionStorage key so current tab is never blocked
try {
  sessionStorage.removeItem('clinic_splash_shown');
} catch {}

// In-memory flag:
// - Resets automatically on full page reload (F5 / Refresh) -> Splash screen PLAYS on reload!
// - Persists during client-side navigation between pages (/book-appointment <-> /) -> NO repeated flash!
let splashAlreadyShown = false;

export const markSplashAsShown = () => {
  splashAlreadyShown = true;
};

export const hasSplashBeenShown = () => {
  return splashAlreadyShown;
};

const SplashScreen = ({ onFinish }) => {
  // Animation phases:
  // 1. 'initial': First clean mint background appears
  // 2. 'center': Logo rises smoothly from bottom to middle / center
  // 3. 'glide': Logo glides smoothly from center to top-left Navbar position
  // 4. 'fadeout': Mint overlay smoothly dissolves to reveal the frontpage
  // 5. 'done': Unmounted
  const [phase, setPhase] = useState('initial');
  const [targetRect, setTargetRect] = useState(null);

  // Measure exact position of navbar brand logo so the glide lands with 100% pixel perfection
  useEffect(() => {
    const updateTargetRect = () => {
      const el = document.getElementById('navbar-brand-logo');
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({
          top: r.top,
          left: r.left,
          width: 38,
          height: 38,
        });
      }
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, []);

  // Prevent background scrolling while splash screen is active WITHOUT hiding scrollbar or causing layout shifts
  useEffect(() => {
    window.scrollTo(0, 0);

    const preventScroll = (e) => {
      e.preventDefault();
    };

    const preventKeyScroll = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeyScroll);

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventKeyScroll);
    };
  }, []);

  useEffect(() => {
    markSplashAsShown();

    // 1. First, the clean mint page appears (Image 1), then after a brief moment (280ms)
    // the logo rises up from the bottom into the middle / center (Image 2)
    const riseTimer = setTimeout(() => {
      setPhase('center');
    }, 280);

    // 2. Logo holds prominently in the middle for ~1.5s, then glides to top-left (Image 3)
    const glideTimer = setTimeout(() => {
      setPhase('glide');
    }, 1850);

    // 3. Once at top-left, the mint overlay fades out to seamlessly reveal the frontpage
    const fadeTimer = setTimeout(() => {
      setPhase('fadeout');
    }, 2550);

    // 4. Animation complete, unmount splash screen
    const finishTimer = setTimeout(() => {
      setPhase('done');
      if (onFinish) onFinish();
    }, 3100);

    return () => {
      clearTimeout(riseTimer);
      clearTimeout(glideTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // Click anywhere to immediately skip to the front page
  const handleSkip = () => {
    markSplashAsShown();
    setPhase('fadeout');
    setTimeout(() => {
      setPhase('done');
      if (onFinish) onFinish();
    }, 350);
  };

  if (phase === 'done') return null;

  const isGliding = phase === 'glide' || phase === 'fadeout';
  const isFading = phase === 'fadeout';

  // Dynamic positioning for smooth transitions:
  // 'initial': positioned below the viewport (bottom) with opacity 0
  // 'center': centered at (50%, 50%) with full opacity (rising from bottom to middle)
  // 'glide' / 'fadeout': glides to top-left (16px, navbar left) and scales down to 38px
  const getContainerStyle = () => {
    if (phase === 'initial') {
      return {
        top: '115%',
        left: '50%',
        transform: 'translate(-50%, 0) scale(0.92)',
        opacity: 0,
        width: '296px',
        height: '278px',
        transition: 'none',
      };
    }
    if (phase === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        width: '296px',
        height: '278px',
        transition:
          'top 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.65s ease',
      };
    }
    // 'glide' or 'fadeout'
    const glideTop = targetRect?.top != null ? `${targetRect.top}px` : '16px';
    const glideLeft = targetRect?.left != null
      ? `${targetRect.left}px`
      : 'max(40px, calc((100% - 1440px) / 2 + 40px))';

    return {
      top: glideTop,
      left: glideLeft,
      transform: 'translate(0, 0)',
      opacity: 1,
      width: '38px',
      height: '38px',
      transition:
        'top 0.75s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.75s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.75s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.75s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.75s cubic-bezier(0.2, 0.8, 0.2, 1)',
    };
  };

  return (
    <div
      onClick={handleSkip}
      className="splash-screen-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#f0fdf4',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      {/* Animated Clinic Logo Element: Rises from bottom to middle, then glides to top-left */}
      <div
        className="splash-logo-container"
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          ...getContainerStyle(),
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
            filter:
              phase === 'center'
                ? 'drop-shadow(0 10px 24px rgba(22, 163, 74, 0.12))'
                : 'none',
            transition: 'filter 0.5s ease',
          }}
        />
      </div>

      <style>{`
        ${!targetRect ? `
        @media (max-width: 1024px) {
          .splash-logo-container {
            left: ${isGliding ? '24px' : '50%'} !important;
          }
        }
        @media (max-width: 640px) {
          .splash-logo-container {
            width: ${isGliding ? '34px' : '230px'} !important;
            height: ${isGliding ? '34px' : '216px'} !important;
            left: ${isGliding ? '20px' : '50%'} !important;
            top: ${
              isGliding
                ? '18px'
                : phase === 'initial'
                ? '115%'
                : '50%'
            } !important;
          }
        }
        ` : ''}
      `}</style>
    </div>
  );
};

export default SplashScreen;
