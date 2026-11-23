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

    // Set consistent document title across all pages
    const routeTitles = {
      '/': 'Dr. Kalpana Tripathi Ampeh (Pat.) | Homeopathy Clinic',
      '/about': 'About Us | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/services': 'Services | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/stories': 'Patient Stories | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/contact': 'Contact Us | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/book-appointment': 'Book Appointment | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/profile': 'Patient Profile | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/login': 'Patient Login | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/register': 'Register | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/admin-login': 'Doctor Login | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/dashboard': 'Dashboard | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/appointments': 'Appointments | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/prescriptions': 'Prescriptions | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/patient-history': 'Patient History | Dr. Kalpana Tripathi Ampeh (Pat.)',
      '/settings': 'Settings | Dr. Kalpana Tripathi Ampeh (Pat.)',
    };
    const title = routeTitles[location.pathname] || 'Dr. Kalpana Tripathi Ampeh (Pat.) | Homeopathy Clinic';
    if (document.title !== title) {
      document.title = title;
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
