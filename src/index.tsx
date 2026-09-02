import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './main-styles.css';
import { SplashScreen } from '@capacitor/splash-screen';

// Instantly dismiss native Capacitor splash screen to prevent duplicate or stretched icon
try {
  SplashScreen.hide().catch(() => {});
} catch {}

// Global safety net: prevent aborted requests, audio play rejections, or minor DOM errors from freezing the app
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      reason?.name === 'AbortError' ||
      msg.includes('aborted') ||
      msg.includes('play() failed') ||
      msg.includes('The play() request was interrupted') ||
      msg.includes('user did not interact') ||
      msg.includes('ResizeObserver loop')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('ResizeObserver loop') ||
      event.message?.includes('Script error.')
    ) {
      event.preventDefault();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Manage Service Worker for production & offline capability
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Trigger APK update check ONLY if user has previously installed an APK version
          const activeWorker = reg.active || navigator.serviceWorker.controller;
          if (activeWorker) {
            // Check for PWA/Web version updates
            activeWorker.postMessage({ type: 'CHECK_PWA_UPDATE' });
            
            // Check for APK version updates if applicable
            const installedVersion = localStorage.getItem('anis_apk_installed_version');
            if (installedVersion) {
              activeWorker.postMessage({
                type: 'CHECK_APK_UPDATE',
                installedVersion: installedVersion
              });
            }
          }

          // Check for SW updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New app update available and installed in background');
                }
              });
            }
          });
        })
        .catch((err) => console.warn('SW registration warning:', err));
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  } else {
    // In development, unregister any existing service worker to prevent caching issues with Vite
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
  }
}