import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { markSplashAsShown } from './components/common/SplashScreen';

function App() {
  useEffect(() => {
    // If user opens a sub-page directly (/book-appointment, /profile, etc.),
    // mark splash as already seen so navigating to Home never flashes.
    if (window.location.pathname !== '/') {
      markSplashAsShown();
    }
  }, []);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

