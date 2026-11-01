/**
 * Utility to completely disable zoom across all devices and browsers:
 * - Desktop: Ctrl/Cmd + Mouse wheel, Trackpad pinch, Ctrl/Cmd + (+, -, 0) keyboard shortcuts
 * - Mobile/Tablet: Pinch-to-zoom, double-tap zoom, iOS Safari gesture zoom
 */

export function initDisableZoom() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Prevent Ctrl / Cmd + Mouse Wheel & Trackpad Pinch Zoom
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 2. Prevent Ctrl / Cmd + (+, -, 0) Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      const k = e.key;
      const c = e.keyCode || e.which;
      if (
        k === '+' ||
        k === '-' ||
        k === '=' ||
        k === '_' ||
        k === '0' ||
        c === 187 ||
        c === 189 ||
        c === 107 ||
        c === 109 ||
        c === 48 ||
        c === 96
      ) {
        e.preventDefault();
      }
    }
  });

  // 3. Prevent Multi-touch Pinch Zoom on Mobile & Tablets
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 4. Prevent Double-tap to Zoom on Mobile (excluding form inputs)
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const targetTag = e.target && e.target.tagName;
      if (
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA' ||
        targetTag === 'SELECT'
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // 5. Prevent iOS Safari Gesture Zooming
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
}

