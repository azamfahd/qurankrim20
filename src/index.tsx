import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './main-styles.css';
import { initSafeAreaManager } from './utils/safeArea';

// Initialize Safe Area & System Insets Management for Android APK, iOS, and Web
initSafeAreaManager();

// Safely dismiss native Capacitor splash screen ONLY on native mobile devices
if (typeof window !== 'undefined') {
  try {
    const isNative = (window as any).Capacitor?.isNativePlatform?.() ?? false;
    if (isNative) {
      import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide().catch(() => {});
      }).catch(() => {});
    }
  } catch {}
}

// Global safety net: prevent aborted requests, audio autoplay rejections, quota limits, or minor DOM warnings from freezing the app
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      reason?.name === 'AbortError' ||
      reason?.name === 'NotAllowedError' ||
      msg.includes('aborted') ||
      msg.includes('play() failed') ||
      msg.includes('The play() request was interrupted') ||
      msg.includes('user did not interact') ||
      msg.includes('ResizeObserver') ||
      msg.includes('AudioContext') ||
      msg.includes('quota') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Failed to fetch')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('ResizeObserver') ||
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

if (typeof window !== 'undefined') {
  (window as any).__ANIS_APP_MOUNTED__ = true;
}

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
                  console.log('New app update available and installed in background, skipping waiting');
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((err) => console.warn('SW registration warning:', err));

      let refreshing = false;
      const hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Only reload if the client already had an existing active controller (i.e. this is an update, not first install)
        if (hadController && !refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
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