import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { App } from './App';
import './index.css';

// Purge old service workers and CacheStorage when running inside native Android WebView
if (typeof window !== 'undefined') {
  const isNative = window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:';
  if (isNative) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
