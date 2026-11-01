import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initDisableZoom } from './utils/disableZoom';

// Disable all zoom interactions across browsers & devices
initDisableZoom();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

