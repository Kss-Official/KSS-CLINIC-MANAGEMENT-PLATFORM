import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initDisableZoom } from './utils/disableZoom';
import { getEffectiveImageUrl } from './utils/imageUrl';

// Immediately purge any stale insecure test or localhost profile images from browser localStorage
try {
  const saved = localStorage.getItem('clinic_profile_image');
  if (saved) {
    const effective = getEffectiveImageUrl(saved);
    if (!effective) {
      localStorage.removeItem('clinic_profile_image');
    }
  }
} catch {}

// Disable all zoom interactions across browsers & devices
initDisableZoom();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

