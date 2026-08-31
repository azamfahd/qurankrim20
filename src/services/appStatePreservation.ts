import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type ActiveViewType =
  | 'home'
  | 'quran'
  | 'tasbih'
  | 'adhkar'
  | 'prophets'
  | 'miracles'
  | 'names_of_allah'
  | 'qibla'
  | 'zakat'
  | 'hijri'
  | 'agri_calendar'
  | 'settings'
  | 'adhan_settings'
  | 'dhikr_settings'
  | 'history'
  | 'bookmarks'
  | 'about'
  | 'feedback';

export interface PreservedState {
  activeView: ActiveViewType;
  timestamp: number;
  details?: {
    quranSurah?: number;
    quranAyah?: number;
    quranView?: string;
    prophetId?: string | null;
    prophetTab?: string;
    miracleCategory?: string | null;
    adhkarTab?: string;
    tasbihIndex?: number;
    chatDraft?: string;
  };
}

const STORAGE_KEY = 'anis_active_view_state';

const safeRemoveListener = (listener: any) => {
  if (!listener) return;
  try {
    if (typeof listener === 'function') {
      try {
        const res = listener();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch (e) {}
    } else if (listener && typeof listener.remove === 'function') {
      try {
        const res = listener.remove();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch (e) {}
    } else if (listener && typeof listener.unsubscribe === 'function') {
      try {
        const res = listener.unsubscribe();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch (e) {}
    } else if (listener && typeof listener.then === 'function') {
      Promise.resolve(listener)
        .then((handle: any) => {
          if (!handle) return;
          try {
            if (handle && typeof handle.remove === 'function') {
              try {
                const res = handle.remove();
                if (res && typeof res.catch === 'function') {
                  res.catch(() => {});
                }
              } catch (e) {}
            } else if (handle && typeof handle.unsubscribe === 'function') {
              try {
                const res = handle.unsubscribe();
                if (res && typeof res.catch === 'function') {
                  res.catch(() => {});
                }
              } catch (e) {}
            } else if (typeof handle === 'function') {
              try {
                const res = handle();
                if (res && typeof res.catch === 'function') {
                  res.catch(() => {});
                }
              } catch (e) {}
            }
          } catch (e) {}
        })
        .catch(() => {});
    }
  } catch (e) {}
};

export const AppStatePreservation = {
  /**
   * Save active screen and sub-state instantly to localStorage
   */
  saveState: (view: ActiveViewType, details?: PreservedState['details']) => {
    try {
      const state: PreservedState = {
        activeView: view,
        timestamp: Date.now(),
        details: {
          ...details,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save active view state:', e);
    }
  },

  /**
   * Get current saved active screen and sub-state
   */
  getSavedState: (): PreservedState | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: PreservedState = JSON.parse(raw);
      // Exclude stale states older than 7 days
      if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear active view state (reset to home)
   */
  clearState: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  },

  /**
   * Setup Capacitor & Browser App State listeners (Pause, Resume, VisibilityChange, Floating Windows)
   */
  initListeners: (onPause: () => void, onResume: () => void) => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onPause();
      } else if (document.visibilityState === 'visible') {
        onResume();
      }
    };

    const handleFreeze = () => onPause();
    const handlePageHide = () => onPause();
    const handleFocus = () => onResume();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('freeze', handleFreeze);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    let appStateListener: any = null;
    let pauseListener: any = null;
    let resumeListener: any = null;

    if (Capacitor.isNativePlatform() || (window as any).Capacitor) {
      try {
        appStateListener = CapacitorApp.addListener('appStateChange', (state) => {
          if (state.isActive) {
            onResume();
          } else {
            onPause();
          }
        });

        pauseListener = CapacitorApp.addListener('pause', () => {
          onPause();
        });

        resumeListener = CapacitorApp.addListener('resume', () => {
          onResume();
        });
      } catch (err) {
        console.warn('Capacitor App listeners notice:', err);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('freeze', handleFreeze);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);

      safeRemoveListener(appStateListener);
      safeRemoveListener(pauseListener);
      safeRemoveListener(resumeListener);
    };
  },

  /**
   * Smart Hardware Back Button Handler for Android / Mobile Devices
   * @param handleBackCallback Function returning true if a modal/sub-view was handled and popped, false if on Home
   */
  initHardwareBackButton: (handleBackCallback: () => boolean) => {
    let backButtonListener: any = null;

    const handlePopState = (e: PopStateEvent) => {
      const wasHandled = handleBackCallback();
      if (wasHandled) {
        // Prevent default navigation exit if modal was closed
        window.history.pushState({ anisModalOpen: true }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (Capacitor.isNativePlatform() || (window as any).Capacitor) {
      try {
        backButtonListener = CapacitorApp.addListener('backButton', () => {
          const wasHandled = handleBackCallback();
          if (!wasHandled) {
            // User is on main Home screen with no modals open -> Minimize App smoothly to background!
            CapacitorApp.minimizeApp().catch(err => {
              console.warn('Failed to minimize app:', err);
            });
          }
        });
      } catch (err) {
        console.warn('Capacitor backButton listener notice:', err);
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      safeRemoveListener(backButtonListener);
    };
  },

  /**
   * Minimize the app to background
   */
  minimizeApp: async () => {
    try {
      if (Capacitor.isNativePlatform() || (window as any).Capacitor) {
        await CapacitorApp.minimizeApp();
      }
    } catch (e) {
      console.warn('Minimize app not supported in browser environment');
    }
  }
};
