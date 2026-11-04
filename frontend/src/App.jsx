import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { markSplashAsShown } from './components/common/SplashScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    const adminRoutes = [
      '/dashboard',
      '/appointments',
      '/prescriptions',
      '/patient-history',
      '/settings',
    ];
    const isAdmin = adminRoutes.some((route) => location.pathname.startsWith(route));

    // When on public or patient pages (Home, About, Services, Stories, Contact, Profile, etc.),
    // ensure any lingering scroll locks, inline overflow styles, and modal classes are cleared.
    if (!isAdmin) {
      document.documentElement.classList.remove('admin-mode', 'modal-open');
      document.body.classList.remove('admin-mode', 'modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
    }

    // Scroll to anchor hash or reset to top on navigation
    if (location.hash) {
      const targetElement = document.querySelector(location.hash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  return null;
}

function App() {
  useEffect(() => {
    // If user opens a sub-page directly (/book-appointment, /profile, etc.),
    // mark splash as already seen so navigating to Home never flashes.
    if (window.location.pathname !== '/') {
      markSplashAsShown();
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollManager />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
