
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import { EmotionForm } from './components/EmotionForm';
import { ResultCard } from './components/ResultCard';
import { Toast, ToastType } from './components/Toast';
import { GlobalDownloadOverlay } from './components/GlobalDownloadOverlay';
import { Sidebar } from './components/Sidebar';
import { DailyVerse } from './components/DailyVerse';
import { PrayerTimesWidget } from './components/PrayerTimesWidget';
import { AdhanNotificationBanner } from './components/AdhanNotificationBanner';
import { calculateAccuratePrayerTimes, AdhanAudioEngine, MUEZZINS_LIST } from './services/adhanService';
import { LocationService } from './services/locationService';
import { LocationPromptBanner } from './components/LocationPromptBanner';
import { getCurrentHijriDate, getHijriReminders } from './utils/hijri';
import { InstallPrompt } from './components/InstallPrompt';
import { InstallModal } from './components/InstallModal';
import { ApkUpdateBanner } from './components/ApkUpdateBanner';
import { PullToRefresh } from './components/PullToRefresh';
import { QuranChatSession } from './services/geminiService';
import { SupabaseService } from './services/supabaseService';
import { SyncService } from './services/syncService';
import { LocalDatabaseService } from './db/localDb';
import { ChatMessage, AppState, UserSettings, UserLocation, ChatSession, Bookmark, Verse } from './types';
import { AlertCircle, Plus, Menu, ArrowRight, ArrowLeft, WifiOff, BookOpen, Key, X, Compass, Calculator, Bookmark as BookmarkIcon, RefreshCw, Calendar, Leaf, Sparkles, User, Scroll, Smartphone, Download, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Suspense } from 'react';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { DhikrReminderService } from './services/dhikrReminderService';
import { DhikrFloatingBanner } from './components/DhikrFloatingBanner';

// Lazy loaded modals for performance optimization with auto-retry on app updates
const SettingsModal = lazyWithRetry(() => import('./components/SettingsModal'), 'SettingsModal');
const DhikrSettingsModal = lazyWithRetry(() => import('./components/DhikrSettingsModal'), 'DhikrSettingsModal');
const HistoryModal = lazyWithRetry(() => import('./components/HistoryModal'), 'HistoryModal');
const TasbihModal = lazyWithRetry(() => import('./components/TasbihModal'), 'TasbihModal');
const BookmarksModal = lazyWithRetry(() => import('./components/BookmarksModal'), 'BookmarksModal');
const AdhkarModal = lazyWithRetry(() => import('./components/AdhkarModal'), 'AdhkarModal');
const NamesOfAllahModal = lazyWithRetry(() => import('./components/NamesOfAllahModal'), 'NamesOfAllahModal');
const AboutModal = lazyWithRetry(() => import('./components/AboutModal'), 'AboutModal');
const FeedbackModal = lazyWithRetry(() => import('./components/FeedbackModal'), 'FeedbackModal');
const AdhanSettingsModal = lazyWithRetry(() => import('./components/AdhanSettingsModal'), 'AdhanSettingsModal');
const ManualLocationModal = lazyWithRetry(() => import('./components/ManualLocationModal'), 'ManualLocationModal');
const HijriCalendarModal = lazyWithRetry(() => import('./components/HijriCalendarModal'), 'HijriCalendarModal');
const QiblaModal = lazyWithRetry(() => import('./components/QiblaModal'), 'QiblaModal');
const ZakatCalculatorModal = lazyWithRetry(() => import('./components/ZakatCalculatorModal'), 'ZakatCalculatorModal');
const ProphetsModal = lazyWithRetry(() => import('./components/ProphetsModal'), 'ProphetsModal');
const QuranPlatformModal = lazyWithRetry(() => import('./quran-platform/QuranPlatformModal'));
const AgriculturalCalendarModal = lazyWithRetry(() => import('./components/AgriculturalCalendarModal'));
const MiraclesModal = lazyWithRetry(() => import('./components/MiraclesModal'));

const DynamicPermissionModal = lazyWithRetry(() => import('./components/DynamicPermissionModal').then(module => ({ default: module.DynamicPermissionModal })));

const ModalSuspenseFallback = () => null;

const LOADING_MESSAGES = [
  "نغوص في أعماق آيات الذكر الحكيم...",
  "نستحضر السكينة من فيض الوحي لقلبك...",
  "نتدبر في لطائف الآيات ومقاصدها...",
  "نلتمس لك من نور القرآن هداية وشفاء...",
  "جاري صياغة رسالة النور لروحك..."
];

const DEFAULT_SETTINGS: UserSettings = {
  username: '',
  email: '',
  isLoggedIn: false,
  model: 'gemini-3.5-flash', // الافتراضي للزائر: نموذج فائق السرعة والاستقرار
  creativityLevel: 0.5,
  apiKey: '',
  bookmarks: [],
  reciter: 'ar.faresabbad',
  analysisStyle: 'smart_adaptive',
  adhanSettings: {
    enabled: false,
    muezzin: 'mishary',
    fajrEnabled: true,
    dhuhrEnabled: true,
    asrEnabled: true,
    maghribEnabled: true,
    ishaEnabled: true,
    volume: 85,
    calculationMethod: 'MuslimWorldLeague',
    autoPlayLiveAdhan: true,
  }
};

// Helper to generate standard v4 UUID for database compatibility
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate a unique user ID for anonymous users (valid UUID)
const generateUserId = (): string => {
  let userId = localStorage.getItem('anis_user_id');
  if (!userId || userId.startsWith('guest_')) {
    userId = generateUUID();
    localStorage.setItem('anis_user_id', userId);
    localStorage.setItem('anis_is_guest', 'true');
  }
  return userId;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const App: React.FC = () => {
  const userIdRef = useRef<string>(generateUserId());
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // تحميل الرسائل النشطة من الذاكرة (الحفظ التلقائي)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('anis_active_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('anis_active_session_id');
  });

  const [state, setState] = useState<AppState>(() => {
    return (messages && messages.length > 0) ? AppState.SUCCESS : AppState.IDLE;
  });

  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineBannerDismissed, setIsOfflineBannerDismissed] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdhanSettingsOpen, setIsAdhanSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isDhikrReminderOpen, setIsDhikrReminderOpen] = useState(false);
  const [isQuranPlatformOpen, setIsQuranPlatformOpen] = useState(false);
  const [quranInitialState, setQuranInitialState] = useState<{ surah?: number, ayah?: number, view?: any }>({});

  const openQuran = (surah?: number, ayah?: number, view: any = 'index') => {
    setQuranInitialState({ surah, ayah, view });
    setIsQuranPlatformOpen(true);
  };
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isAdhkarOpen, setIsAdhkarOpen] = useState(false);
  const [isNamesOfAllahOpen, setIsNamesOfAllahOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(false);
  const [locationBannerData, setLocationBannerData] = useState<{ location?: UserLocation; isHighAccuracy?: boolean }>({});
  const [isZakatOpen, setIsZakatOpen] = useState(false);
  const [isHijriOpen, setIsHijriOpen] = useState(false);
  const [isAgriCalendarOpen, setIsAgriCalendarOpen] = useState(false);
  const [isMiraclesOpen, setIsMiraclesOpen] = useState(false);
  const [isProphetsOpen, setIsProphetsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [apkUpdateInfo, setApkUpdateInfo] = useState<{ version: string; releaseNotes?: string; sizeFormatted?: string } | null>(null);
  const [isApkUpdateBannerOpen, setIsApkUpdateBannerOpen] = useState(false);
  const [hijriOffset, setHijriOffset] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_hijri_offset');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const todayHijri = getCurrentHijriDate(hijriOffset);
  const todayReminders = getHijriReminders(todayHijri);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('anis_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Live Adhan monitoring state
  const [liveAdhanPrayer, setLiveAdhanPrayer] = useState<string | null>(null);
  const [isLiveAdhanBannerOpen, setIsLiveAdhanBannerOpen] = useState(false);
  const lastTriggeredPrayerKeyRef = useRef<string>('');

  useEffect(() => {
    const unsub = AdhanAudioEngine.subscribe((state) => {
      if (state.activePrayerName) {
        setLiveAdhanPrayer(state.activePrayerName);
        setIsLiveAdhanBannerOpen(true);
      } else if (!state.isPlaying) {
        // Only close if it stopped playing (though we might want to let the user close it manually, 
        // but if activePrayerName is null, it means it was stopped)
        setIsLiveAdhanBannerOpen(false);
      }
    });
    return () => unsub();
  }, []);

  // Live Accurate Adhan & Dhikr Checker
  useEffect(() => {
    DhikrReminderService.init(settings.dhikrReminderSettings);
  }, []);

  useEffect(() => {
    // Service worker message handler (e.g. Stop Adhan, APK Update Notification)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'STOP_ADHAN') {
        AdhanAudioEngine.stop();
        setIsLiveAdhanBannerOpen(false);
      } else if (event.data.type === 'APK_UPDATE_AVAILABLE') {
        const hasInstalledApk = localStorage.getItem('anis_apk_installed_version');
        if (hasInstalledApk && event.data.versionInfo) {
          setApkUpdateInfo(event.data.versionInfo);
          setIsApkUpdateBannerOpen(true);
        }
      } else if (event.data.type === 'PWA_UPDATE_AVAILABLE') {
        showToast('تم إصدار تحديث جديد للتطبيق! قم بتحديث الصفحة للحصول على الميزات الجديدة.', 'success');
        setTimeout(() => {
           // Provide an update notification banner if you want, but for now we can just show a toast
           if (window.confirm('تم العثور على تحديث جديد للبرنامج. هل ترغب بإعادة التحميل لتحديث الملفات الآن؟')) {
             window.location.reload();
           }
        }, 1500);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    const checkAdhan = () => {
      const adhanConfig = settings.adhanSettings;
      if (!adhanConfig || !adhanConfig.enabled) return;

      const now = new Date();
      const schedule = calculateAccuratePrayerTimes(settings.location, now, adhanConfig.calculationMethod);
      const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      
      schedule.prayersList.forEach(prayer => {
        const isPrayerEnabled = adhanConfig[prayer.key] as boolean;
        if (!isPrayerEnabled) return;

        // Positive value means 'now' is after prayer time
        const rawDiffMinutes = (now.getTime() - prayer.time.getTime()) / 60000; 
        const triggerKey = `${dateKey}_${prayer.name}`;
        
        // Active prayer window (from 0 to 15 minutes after prayer start)
        if (rawDiffMinutes >= -0.5 && rawDiffMinutes <= 15 && lastTriggeredPrayerKeyRef.current !== triggerKey) {
          lastTriggeredPrayerKeyRef.current = triggerKey;
          setLiveAdhanPrayer(prayer.name);
          setIsLiveAdhanBannerOpen(true);

          const muezzinId = adhanConfig.muezzin || 'mishary';
          const muezzinObj = MUEZZINS_LIST.find(m => m.id === muezzinId);
          const muezzinName = muezzinObj?.name || 'الشيخ مشاري راشد العفاسي';

          if (adhanConfig.autoPlayLiveAdhan !== false) {
            AdhanAudioEngine.play(muezzinId, adhanConfig.volume || 85, undefined, undefined, prayer.name);
          }

          // High-priority Android TWA / PWA / Web notification with Action buttons
          AdhanAudioEngine.dispatchPrayerNotification(prayer.name, muezzinName);
        } 
        // If prayer is already well past (more than 15 mins), mark it quietly without any annoying alert
        else if (rawDiffMinutes > 15 && lastTriggeredPrayerKeyRef.current !== triggerKey) {
          lastTriggeredPrayerKeyRef.current = triggerKey;
        }
      });
    };

    checkAdhan();
    const interval = setInterval(checkAdhan, 5000);

    // Re-check instantly when app comes back to foreground or window receives focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        AdhanAudioEngine.unlockAudioContext();
        checkAdhan();
      }
    };
    const handleFocus = () => {
      AdhanAudioEngine.unlockAudioContext();
      checkAdhan();
    };

    const handlePointerDown = () => {
      AdhanAudioEngine.unlockAudioContext();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      window.removeEventListener('pointerdown', handlePointerDown);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [settings.adhanSettings, settings.location]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const [showPromoBanner, setShowPromoBanner] = useState(false);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('anis_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Initialize Dexie IndexedDB Local Storage & load cached offline data
  useEffect(() => {
    LocalDatabaseService.init().then(async () => {
      const localSessions = await LocalDatabaseService.getAllSessions();
      if (localSessions && localSessions.length > 0) {
        setSessions(localSessions);
      }
    }).catch(err => {
      console.warn('Local database initialization notice:', err);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close all modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsDhikrReminderOpen(false);
        setIsAdhanSettingsOpen(false);
        setIsHistoryOpen(false);
        setIsTasbihOpen(false);
        setIsBookmarksOpen(false);
        setIsAdhkarOpen(false);
        setIsNamesOfAllahOpen(false);
        setIsQiblaOpen(false);
        setIsLocationModalOpen(false);
        setShowLocationBanner(false);
        setIsZakatOpen(false);
        setIsAgriCalendarOpen(false);
        setIsMiraclesOpen(false);
        setIsProphetsOpen(false);
        setIsAboutOpen(false);
        setIsInstallModalOpen(false);
        setIsFeedbackOpen(false);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const chatSessionRef = useRef<QuranChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);

  const lastSavedSettingsRef = useRef<string>('');

  // Supabase Auth and Sync
  useEffect(() => {
    const initLoad = async (uid: string, isLogged: boolean, user?: any) => {
      const loadedSettings = await SyncService.loadSettings(uid, settings);
      
      // Get saved local location fallback if present
      let savedLocObj = undefined;
      try {
        const savedLocStr = localStorage.getItem('anis_saved_location');
        if (savedLocStr) savedLocObj = JSON.parse(savedLocStr);
      } catch (e) {}

      let finalSettings = { 
        ...settings, 
        isLoggedIn: isLogged, 
        uid: isLogged ? uid : undefined,
        location: settings.location || savedLocObj
      };
      
      if (loadedSettings) {
        const effectiveLocation = loadedSettings.location || finalSettings.location || savedLocObj;
        const effectiveApiKey = (loadedSettings.apiKey && loadedSettings.apiKey.trim().length > 0)
          ? loadedSettings.apiKey
          : (finalSettings.apiKey || settings.apiKey || '');

        finalSettings = { 
          ...finalSettings, 
          ...loadedSettings, 
          isLoggedIn: isLogged,
          uid: isLogged ? uid : undefined,
          apiKey: effectiveApiKey, 
          location: effectiveLocation 
        };
        // If logged in via Google/Account, default to 'gemini-3.6-flash' if no model was set
        if (isLogged && !finalSettings.model) {
          finalSettings.model = 'gemini-3.6-flash';
        } else if (!isLogged && !finalSettings.model) {
          // Default for guest visitors is 'gemini-3.5-flash' (speed & high stability)
          finalSettings.model = 'gemini-3.5-flash';
        }
        setSettings(finalSettings);
        lastSavedSettingsRef.current = JSON.stringify({ ...finalSettings, lastUpdated: undefined });
      } else if (isLogged) {
        // Initialize user doc if it doesn't exist (only for logged in users)
        finalSettings = {
          ...finalSettings,
          username: user?.user_metadata?.full_name || settings.username || 'مستخدم',
          email: user?.email || '',
          photoURL: user?.user_metadata?.avatar_url || '',
          model: 'gemini-3.6-flash', // Default for Google account (the latest 3.6 generation)
          lastUpdated: new Date().toISOString()
        };
        await SyncService.saveSettings(uid, finalSettings);
        setSettings(finalSettings);
        lastSavedSettingsRef.current = JSON.stringify({ ...finalSettings, lastUpdated: undefined });
      } else {
        // Option 1: Store guest user in Supabase immediately so administrators can track temporary visitors
        finalSettings = {
          ...finalSettings,
          username: settings.username || 'زائر مؤقت',
          email: 'guest@anis.local',
          model: 'gemini-3.5-flash', // Default for visitors (fast, stable, seamless)
          lastUpdated: new Date().toISOString()
        };
        await SyncService.saveSettings(uid, finalSettings);
        setSettings(finalSettings);
        lastSavedSettingsRef.current = JSON.stringify({ ...finalSettings, lastUpdated: undefined });
      }

      const loadedSessions = await SyncService.loadSessions(uid, finalSettings);
      if (loadedSessions !== null) {
        setSessions(loadedSessions);
      }
    };

    const { data: { subscription } } = SupabaseService.onAuthStateChange(async (user) => {
      setSupabaseUser(user); 
      
      if (user) {
        const prevUserId = userIdRef.current;
        const isGuest = prevUserId && (prevUserId.startsWith('guest_') || localStorage.getItem('anis_is_guest') === 'true');
        if (isGuest && prevUserId !== user.id) {
          // Perform migration from guest to real user using the most up-to-date localStorage values
          try {
            let localSessions: ChatSession[] = [];
            try {
              const savedSessions = localStorage.getItem('anis_history');
              if (savedSessions) localSessions = JSON.parse(savedSessions);
            } catch (e) {
              console.error('Error loading guest sessions for migration:', e);
            }

            let localSettings: UserSettings = settings;
            try {
              const savedSettings = localStorage.getItem('anis_settings');
              if (savedSettings) localSettings = JSON.parse(savedSettings);
            } catch (e) {
              console.error('Error loading guest settings for migration:', e);
            }

            await SupabaseService.migrateLocalGuestData(user.id, localSessions, localSettings);
            localStorage.removeItem('anis_is_guest');
          } catch (e) {
            console.error('Error during guest migration:', e);
          }
        }
        userIdRef.current = user.id;
        initLoad(user.id, true, user);
      } else {
        const guestId = generateUserId();
        userIdRef.current = guestId;
        initLoad(guestId, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Automatic Intelligent Location Detection for any visitor/user on startup
  useEffect(() => {
    let isMounted = true;
    
    // Auto-detect immediately without requiring user to press any button
    LocationService.detectLocationWithDetails(false).then((details) => {
      if (!isMounted || !details.location) return;
      
      const detectedLocation = details.location;
      setSettings(prev => {
        if (
          prev.location?.latitude === detectedLocation.latitude &&
          prev.location?.longitude === detectedLocation.longitude &&
          prev.location?.name === detectedLocation.name
        ) {
          return prev;
        }
        return {
          ...prev,
          location: detectedLocation
        };
      });

      // Show gentle non-intrusive banner ONLY on very first launch if user hasn't seen/dismissed it
      const hasDismissedLocationBanner = localStorage.getItem('anis_location_banner_dismissed') === 'true';
      if (details.isFirstLaunch && !hasDismissedLocationBanner) {
        setLocationBannerData({
          location: detectedLocation,
          isHighAccuracy: details.source === 'gps'
        });
        setShowLocationBanner(true);
        localStorage.setItem('anis_location_banner_dismissed', 'true');

        // Auto-dismiss banner after 5 seconds cleanly
        setTimeout(() => {
          if (isMounted) {
            setShowLocationBanner(false);
          }
        }, 5000);
      }
    }).catch(err => {
      console.warn("Auto location detection caught error:", err);
    });

    // Listen for any location updates triggered in background
    const unsubscribeLocation = LocationService.onLocationUpdated((newLoc) => {
      if (!isMounted || !newLoc) return;
      setSettings(prev => ({
        ...prev,
        location: newLoc
      }));
    });

    return () => {
      isMounted = false;
      unsubscribeLocation();
    };
  }, []);

  // Track visits/interactions for guest promo banner
  useEffect(() => {
    // Only track if the user is not logged in
    if (!settings.isLoggedIn && !supabaseUser) {
      try {
        const countStr = localStorage.getItem('anis_visit_count') || '0';
        // Check if we've already incremented in this session
        const currentSessionVisits = sessionStorage.getItem('anis_session_visited');
        let currentCount = parseInt(countStr, 10);
        
        if (!currentSessionVisits) {
          currentCount += 1;
          localStorage.setItem('anis_visit_count', currentCount.toString());
          sessionStorage.setItem('anis_session_visited', 'true');
        }
        
        const isDismissed = localStorage.getItem('anis_promo_banner_dismissed') === 'true';
        if (currentCount >= 3 && !isDismissed) {
          setShowPromoBanner(true);
        }
      } catch (e) {
        console.error('Error tracking guest visits:', e);
      }
    } else {
      setShowPromoBanner(false);
    }
  }, [settings.isLoggedIn, supabaseUser]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineBannerDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineBannerDismissed(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (state === AppState.LOADING) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingText(LOADING_MESSAGES[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Save history to localStorage and Firestore
  useEffect(() => {
    localStorage.setItem('anis_history', JSON.stringify(sessions));
    
    // Also save to Firestore if logged in
    if (supabaseUser && isOnline) {
      // We handle individual session saves in saveCurrentSessionToHistory
    }
  }, [sessions, supabaseUser, isOnline]);

  // Save settings to localStorage and Backend
  useEffect(() => {
    chatSessionRef.current = null;
    localStorage.setItem('anis_settings', JSON.stringify(settings));
    if (settings.location) {
      try {
        localStorage.setItem('anis_saved_location', JSON.stringify(settings.location));
      } catch (e) {}
    }
    
    // Also save to Backend
    if (isOnline && userIdRef.current) {
      const currentSettingsStr = JSON.stringify({ ...settings, lastUpdated: undefined });
      
      // Only save if settings actually changed from what we last saved or received
      if (currentSettingsStr !== lastSavedSettingsRef.current) {
        setIsSyncing(true);
        SyncService.saveSettings(userIdRef.current, settings)
          .then(() => {
            lastSavedSettingsRef.current = currentSettingsStr;
            setLastSynced(Date.now());
            setTimeout(() => setIsSyncing(false), 1000);
          })
          .catch(err => {
            console.error('Error saving settings to Backend:', err);
            setIsSyncing(false);
          });
      }
    }
  }, [settings, supabaseUser, isOnline]);

  // Track PWA Installation and User Registration
  useEffect(() => {
    const trackUser = async () => {
      if (!userIdRef.current) return;

      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone || 
                    document.referrer.includes('android-app://');

      const userMetadata = {
        uid: userIdRef.current,
        lastActive: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        isInstalled: isPWA,
        platform: (navigator as any).platform || 'unknown'
      };

      // Register/Update user in backend
      try {
        await SyncService.registerUser(userIdRef.current, userMetadata, settings);
      } catch (e) {
        console.error('Error registering user:', e);
      }
    };

    if (isOnline) {
      trackUser();
    }

    // Listen for the actual install event
    const handleAppInstalled = () => {
      if (userIdRef.current) {
        SyncService.updateUserInstallStatus(userIdRef.current, true).catch(console.error);
        showToast('شكراً لتثبيت التطبيق! يمكنك الآن الوصول إليه من شاشتك الرئيسية.', 'success');
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem('anis_active_chat', JSON.stringify(messages));
    if (currentSessionId) {
      localStorage.setItem('anis_active_session_id', currentSessionId);
    } else {
      localStorage.removeItem('anis_active_session_id');
    }
    
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.type === 'ai') {
        // AI result just finished - smoothly scroll to the TOP of the new AI response card
        setTimeout(() => {
          const lastAiEl = document.getElementById(`msg-${lastMsg.id}`);
          if (lastAiEl) {
            const yOffset = -80; // Account for top sticky navigation header
            const y = lastAiEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 150);
      } else {
        // User just sent a message - scroll down to show the input & loading state
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, state, currentSessionId]);

  const saveCurrentSessionToHistory = (msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    const firstUserMsg = msgs.find(m => m.type === 'user');
    if (!firstUserMsg) return;
    
    let sessionToSave: ChatSession;
    if (currentSessionId) {
      const existingSession = sessions.find(s => s.id === currentSessionId);
      if (existingSession) {
        sessionToSave = { ...existingSession, messages: msgs };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? sessionToSave : s));
      } else {
        // Fallback if session not found in state
        const newId = currentSessionId;
        sessionToSave = {
          id: newId,
          date: Date.now(),
          preview: firstUserMsg.content.substring(0, 100) || "محادثة صوتية",
          messages: msgs
        };
        setSessions(prev => [sessionToSave, ...prev]);
      }
    } else {
      const newId = generateId();
      setCurrentSessionId(newId);
      
      sessionToSave = {
        id: newId,
        date: Date.now(),
        preview: firstUserMsg.content.substring(0, 100) || "محادثة صوتية",
        messages: msgs
      };
      
      setSessions(prev => [sessionToSave, ...prev]);
    }

    // Save to Backend
    if (isOnline && userIdRef.current && sessionToSave!) {
      setIsSyncing(true);
      SyncService.saveSession(userIdRef.current, sessionToSave, settings)
        .then(() => {
          setLastSynced(Date.now());
          setTimeout(() => setIsSyncing(false), 1000);
        })
        .catch(err => {
          console.error('Error saving session to Backend:', err);
          setIsSyncing(false);
        });
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setState(AppState.IDLE);
    setCurrentSessionId(null);
    chatSessionRef.current = null;
    localStorage.removeItem('anis_active_chat');
    localStorage.removeItem('anis_active_session_id');
  };

  const handleImportHistory = (newHistory: ChatSession[]) => {
    setSessions(newHistory);
  };

  const handleToggleBookmark = (verse: Verse) => {
    if (!verse.surahNumber || !verse.ayahNumber) {
      showToast('عذراً، لا يمكن حفظ هذه الآية لعدم توفر بيانات السورة والآية.', 'error');
      return;
    }

    setSettings(prev => {
      const isBookmarked = (prev.bookmarks || []).some(
        b => b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber
      );

      if (isBookmarked) {
        const bookmarkToRemove = (prev.bookmarks || []).find(
          b => b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber
        );
        
        const newBookmarks = (prev.bookmarks || []).filter(
          b => !(b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber)
        );

        const newSettings = { ...prev, bookmarks: newBookmarks };
        
        if (userIdRef.current && bookmarkToRemove) {
          SyncService.deleteBookmark(userIdRef.current, bookmarkToRemove.id, newSettings).catch(console.error);
        }

        showToast('تمت إزالة الآية من المحفوظات', 'info');
        return newSettings;
      } else {
        const newBookmark: Bookmark = {
          id: `${verse.surahNumber}-${verse.ayahNumber}-${generateId()}`,
          verse,
          dateAdded: Date.now()
        };
        
        const newBookmarks = [newBookmark, ...(prev.bookmarks || [])];
        const newSettings = { ...prev, bookmarks: newBookmarks };
        
        if (userIdRef.current) {
          SyncService.saveBookmark(userIdRef.current, newBookmark, newSettings).catch(console.error);
        }

        showToast('تم حفظ الآية في المحفوظات', 'success');
        return newSettings;
      }
    });
  };

  const handleEmotionSubmit = async (text: string) => {
    if (!isOnline) {
      setError("لا يمكن إرسال الرسائل في وضع عدم الاتصال.");
      return;
    }
    setState(AppState.LOADING);
    setLoadingText(LOADING_MESSAGES[0]);
    setError(null);

    // Always instantiate session with current settings (ensuring user's custom API key is immediately active)
    try {
      chatSessionRef.current = new QuranChatSession(settings);
    } catch (e: any) {
      setError(e.message || "حدث خطأ في الإعدادات.");
      setState(AppState.ERROR);
      return;
    }

    const userMsg: ChatMessage = { id: generateId(), type: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const displayName = settings.username || (settings.email ? settings.email.split('@')[0] : undefined);
      
      const onProgressUpdate = (stage: string) => {
        const messagesMap: Record<string, string> = {
          'thinking': "نستلهم الحكمة من فيض الوحي لقلبك...",
          'mapping': "نغوص في أعماق آيات الذكر الحكيم...",
          'verifying': "نتثبّت من مرجعيات الآيات وسياقها...",
          'formatting': "نجلو لك المعاني في أبهى صورها..."
        };
        setLoadingText(messagesMap[stage] || LOADING_MESSAGES[0]);
      };

      const data = await chatSessionRef.current.sendMessage(text, displayName, messages, onProgressUpdate);
      const aiMsg: ChatMessage = { id: generateId(), type: 'ai', data: data };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      setState(AppState.SUCCESS);
      saveCurrentSessionToHistory(finalMessages);
    } catch (err: any) {
      console.error("FULL ERROR DETAILS:", err);
      let errorMessage = "عذراً، حدث خطأ غير متوقع أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
      if (err.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes("quota") || msg.includes("429")) {
          errorMessage = "يبدو أن هناك ضغطاً كبيراً على الخادم حالياً. يرجى المحاولة بعد قليل، أو إضافة مفتاح API الخاص بك في الإعدادات لتجربة أسرع.";
        } else if (msg.includes("api key not valid") || msg.includes("invalid api key") || msg.includes("403") || msg.includes("api_key")) {
          errorMessage = "مفتاح API الذي قمت بإدخاله غير صالح. يرجى التأكد من صحته في الإعدادات، أو مسحه لاستخدام الوضع التلقائي.";
        } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
          errorMessage = "يبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.";
        } else if (msg.includes("استجابة فارغة") || msg.includes("لم يتم العثور على استجابة")) {
          errorMessage = "لم نتمكن من صياغة إجابة مناسبة في الوقت الحالي. يرجى إعادة صياغة سؤالك والمحاولة مرة أخرى.";
        } else if (msg.includes("timeout") || msg.includes("فشل الاتصال")) {
          errorMessage = "استغرق الخادم وقتاً طويلاً للاستجابة. يرجى المحاولة مرة أخرى لاحقاً.";
        } else if (msg.includes("json") || err.name === "SyntaxError") {
          errorMessage = "حدث خطأ في تنسيق البيانات الواردة من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
        } else {
          // Show the actual error message to help identify the root cause
          errorMessage = `عذراً، حدث خطأ: ${err.message}`;
        }
      }
      setError(errorMessage);
      setState(AppState.ERROR);
    }
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setState(AppState.SUCCESS);
    setIsHistoryOpen(false);
  };

  const isChatStarted = messages.length > 0;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "طاب صباحك بكل خير";
    if (hour < 17) return "طاب مساؤك بالمسرات";
    return "ليلة هادئة ومطمئنة";
  };

  const handleSilentRefresh = async () => {
    setIsSyncing(true);
    try {
      if (userIdRef.current && isOnline) {
        const loadedSettings = await SyncService.loadSettings(userIdRef.current, settings);
        if (loadedSettings) {
          setSettings(prev => ({ ...prev, ...loadedSettings }));
        }
        const loadedSessions = await SyncService.loadSessions(userIdRef.current, settings);
        if (loadedSessions) {
          setSessions(loadedSessions);
        }
      }
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
        }
      }
      setLastSynced(Date.now());
    } catch (e) {
      console.warn('Silent refresh error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="app-wrapper royal-gradient selection:bg-[var(--color-gold)] selection:text-white">
      <PullToRefresh onRefresh={handleSilentRefresh} />
      
      <AnimatePresence>
        {!isOnline && !isOfflineBannerDismissed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="offline-banner relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 py-2 px-8">
              <WifiOff size={16} className="animate-pulse" />
              <span className="text-sm">أنت في وضع عدم الاتصال. قد تكون بعض الميزات محدودة.</span>
              <button 
                onClick={() => setIsOfflineBannerDismissed(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {showPromoBanner && !settings.isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-[var(--color-gold)]/40 p-5 rounded-[2rem] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-3xl w-full pointer-events-auto text-right" dir="rtl">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[var(--color-gold)]/20 animate-bounce">
                  <Sparkles size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    حفظ سحابي لمحادثاتك ومحفوظاتك 🌸
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    أهلاً بك مجدداً في أنيس القلوب! هذه زيارتك الثالثة للبرنامج. لتجنب فقدان جميع محادثاتك القيمة واستشاراتك ومحفوظاتك من الآيات، ننصحك بربط حسابك بـ Google بضغطة زر واحدة لمزامنتها سحابياً والوصول إليها بأمان من أي جهاز.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
                <button
                  onClick={async () => {
                    try {
                      await SupabaseService.signInWithGoogle();
                    } catch (err: any) {
                      console.error(err);
                      showToast('حدث خطأ في الاتصال بـ Google', 'error');
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-dark)] hover:from-[var(--color-gold-dark)] hover:to-[var(--color-gold)] text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                  المتابعة بـ Google
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('anis_promo_banner_dismissed', 'true');
                    setShowPromoBanner(false);
                    showToast('تم إخفاء التنبيه. يمكنك دائماً تسجيل الدخول من قائمة الإعدادات.', 'info');
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        
        {isChatStarted ? (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg"
          >
             <div className="flex items-center gap-4">
               <button 
                 onClick={startNewChat} 
                 className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm border border-white/10 flex items-center justify-center" 
                 title="الرئيسية"
               >
                 <ArrowRight size={22} />
               </button>
               <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                   <BookOpen size={16} className="text-[var(--color-gold)] animate-pulse" />
                   <h1 className="text-xl font-black royal-text-gradient leading-tight tracking-tight">أنيس القلوب</h1>
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-gold-light)] font-semibold mt-0.5 opacity-80">
                   <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse"></span>
                   <span>محادثة نشطة</span>
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                <AnimatePresence>
                  {isSyncing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full border border-white/10"
                      title="جاري المزامنة..."
                    >
                      <RefreshCw size={12} className="text-[var(--color-gold)] animate-spin" />
                      <span className="text-[9px] text-white/70 font-bold">مزامنة</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="group flex items-center gap-3 pl-2 pr-1 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-sm font-bold text-white group-hover:text-[var(--color-gold-light)] transition-colors hidden sm:block pr-2">{settings.username || 'ضيف'}</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                    <User size={18} />
                  </div>
                </button>

                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm border border-white/10 flex items-center justify-center"
                  aria-label="القائمة"
                >
                  <Menu size={22} />
                </button>
             </div>
          </motion.div>
        ) : (
           <Header 
             onOpenSidebar={() => setIsSidebarOpen(true)} 
             onOpenSettings={() => setIsSettingsOpen(true)}
             username={settings.username}
             isSyncing={isSyncing}
             lastSynced={lastSynced}
           />
        )}
        
        <main className={isChatStarted ? "w-full max-w-[1600px] mx-auto px-0 sm:px-4 flex flex-col" : "container flex flex-col"} style={{ 
            flexGrow: 1, 
            paddingBottom: isChatStarted ? '140px' : '2rem', 
            paddingTop: isChatStarted ? '0' : '1rem' 
        }}>
          
          <div className="flex flex-col gap-6 flex-1">
            {messages.map((msg, index) => (
              <div key={msg.id} id={`msg-${msg.id}`} className={`message-row ${msg.type} ${index === messages.length - 1 && msg.type === 'ai' ? 'flex-1 flex-col' : ''}`}>
                {msg.type === 'user' ? (
                  <div className="flex justify-end w-full animate-fade-in px-4 sm:px-0 mt-4">
                    <div className="chat-bubble">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  msg.data && (
                    <div className="w-full h-full flex flex-col flex-1">
                       <ResultCard 
                         data={msg.data} 
                         isOnline={isOnline} 
                         bookmarks={settings.bookmarks || []}
                         onToggleBookmark={handleToggleBookmark}
                         reciter={settings.reciter}
                         onShowToast={showToast}
                         onOpenQuran={openQuran}
                       />
                    </div>
                  )
                )}
              </div>
            ))}
            
            {state === AppState.LOADING && (
              <div className="flex justify-center py-8">
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm flex items-center gap-4 border border-[var(--color-primary)]/10">
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <div className="absolute inset-0 border-2 border-[var(--color-primary)]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-[var(--color-primary)] border-t-transparent rounded-full spin"></div>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary-dark)] animate-pulse">{loadingText}</span>
                </div>
              </div>
            )}
            
            {state === AppState.ERROR && (
              <div className="flex justify-center mt-4 mb-4">
                <div className="bg-red-50/80 backdrop-blur-sm text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 border border-red-200/50 shadow-sm max-w-2xl w-full mx-4">
                  <AlertCircle size={22} className="shrink-0 mt-0.5 text-red-500" />
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-sm">عذراً، حدث خطأ</h4>
                    <p className="text-sm opacity-90 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {state === AppState.SUCCESS && (
               <div className="flex justify-center mt-4 mb-4">
                 <button onClick={startNewChat} className="btn-primary rounded-full px-6">
                   <Plus size={18} />
                   <span>موضوع جديد</span>
                 </button>
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {!isChatStarted && state !== AppState.LOADING && (
             <div className="mt-4 w-full animate-slide-up">
               {/* Prayer Times Widget */}
               <div className="mb-5 mx-auto max-w-xl">
                 <PrayerTimesWidget 
                   settings={settings} 
                   onUpdateSettings={setSettings} 
                   onOpenAdhanSettings={() => setIsAdhanSettingsOpen(true)}
                   onOpenLocationSettings={() => setIsLocationModalOpen(true)}
                 />
               </div>

               <div className="mb-5 text-center relative">
                 {/* 3D Decorative Element */}
                 <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 opacity-30 pointer-events-none z-0 animate-float-3d perspective-1000">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] blur-2xl" style={{ transform: 'rotateX(12deg) rotateY(12deg)' }}></div>
                 </div>
                 
                 <div className="relative z-10 flex flex-col items-center">
                    {/* Noble Quran Direct Access 3D Jewel Button */}
                    <div className="flex justify-center mb-5 w-full max-w-sm px-2">
                      <button
                        onClick={() => openQuran(undefined, undefined, "index")}
                        className="group relative overflow-hidden inline-flex items-center justify-between gap-3.5 px-6 py-3.5 rounded-2xl text-white font-bold transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0.5 cursor-pointer select-none w-full"
                        style={{
                          background: "linear-gradient(135deg, #022c22 0%, #065f46 45%, #023829 80%, #996515 100%)",
                          boxShadow: "0 12px 28px -6px rgba(0, 0, 0, 0.55), 0 0 25px rgba(212, 175, 55, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.45)",
                          border: "1px solid rgba(212, 175, 55, 0.65)"
                        }}
                        title="فتح فهرس المصحف الشريف لاختيار وتلاوة القرآن الكريم"
                      >
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-t-2xl"></div>
                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none"></div>

                        <div className="flex items-center gap-3.5 relative z-10">
                          <div 
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                            style={{
                              background: "linear-gradient(135deg, #f1e5ac 0%, #d4af37 50%, #996515 100%)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1.5px 2px rgba(255,255,255,0.8), inset 0 -2px 0 rgba(0,0,0,0.3)",
                              border: "1px solid rgba(255, 245, 200, 0.8)"
                            }}
                          >
                            <BookOpen size={22} className="text-[#022c22] drop-shadow-sm" />
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                المصحف الشريف
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950/90 border border-amber-400/50 text-amber-200">قراءة</span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950/90 border border-emerald-400/50 text-emerald-200">تلاوة</span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950/90 border border-teal-400/50 text-teal-200">تفسير</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 mr-1 w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 group-hover:-translate-x-1 transition-all duration-300 shadow-inner shrink-0">
                          <ArrowLeft size={18} />
                        </div>
                      </button>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-white tracking-normal leading-relaxed drop-shadow-md">كيف يمكنني أن أؤنس قلبك اليوم بآيات الله؟</h2>
                 </div>
               </div>

               {/* Primary Core Entry Control - Form & Prompt suggestions */}
               <div className="mb-6 max-w-3xl mx-auto w-full">
                 <EmotionForm onSubmit={handleEmotionSubmit} isLoading={false} isOnline={isOnline} variant="centered" />
                 
                 <div className="mt-3 flex flex-row flex-nowrap overflow-x-auto gap-2 max-w-2xl mx-auto px-4 w-full justify-start md:justify-center no-scrollbar pb-1 snap-x select-none">
                   {[
                      "أشعر بضيق في صدري",
                      "أريد آيات عن الصبر",
                      "كيف أتوكل على الله؟",
                      "أشعر بالقلق من المستقبل",
                      "آيات تجلب السكينة"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmotionSubmit(prompt)}
                        className="text-[10px] sm:text-[11px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 text-white/90 hover:border-[var(--color-gold)]/60 hover:text-[var(--color-gold)] transition-all duration-300 hover:shadow-[0_0_10px_rgba(197,160,89,0.25)] hover:bg-white/10 active:scale-95 shadow-sm shrink-0 snap-center select-none"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>


               {/* Professional Status Grid Panels */}
               <div className="max-w-xl mx-auto my-5">
                 <DailyVerse onOpenQuran={openQuran} />
               </div>

               <div className="mt-16 mb-10">
                 <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-border)] to-transparent"></div>
                    <h3 className="text-sm font-bold text-[var(--color-gold)] uppercase drop-shadow-sm">الوصول السريع</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent"></div>
                 </div>
                 
                 <div className="quick-actions-grid">
                   <div 
                     className="action-card group cursor-pointer relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0.5" 
                     onClick={() => openQuran(undefined, undefined, "index")} 
                     style={{ 
                       gridColumn: "1 / -1", 
                       background: "linear-gradient(135deg, #022c22 0%, #065f46 50%, #996515 100%)", 
                       color: "white",
                       boxShadow: "0 10px 24px -4px rgba(0,0,0,0.45), inset 0 1px 1.5px rgba(255,255,255,0.35)",
                       border: "1px solid rgba(212, 175, 55, 0.55)",
                       borderRadius: "1rem",
                       padding: "1rem 1.25rem"
                     }}
                   >
                     <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none"></div>
                     <div className="flex items-center justify-between w-full relative z-10">
                       <div className="flex items-center gap-3">
                         <div 
                           className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0 transition-transform group-hover:scale-110" 
                           style={{ background: "linear-gradient(135deg, #f1e5ac, #d4af37)", color: "#022c22", border: "1px solid rgba(255,255,255,0.6)" }}
                         >
                           <BookOpen size={22} />
                         </div>
                         <div className="flex flex-col text-right">
                           <span className="action-card-title text-amber-100 font-extrabold text-base">المصحف الشريف الذكي</span>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/80 text-amber-200 border border-amber-400/40 font-bold">قراءة</span>
                             <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-400/40 font-bold">تلاوة</span>
                             <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/80 text-teal-200 border border-teal-400/40 font-bold">تفسير</span>
                           </div>
                         </div>
                       </div>
                       <ArrowLeft size={18} className="text-amber-300 group-hover:-translate-x-1 transition-transform" />
                     </div>
                   </div>
                                                           <div className="action-card dhikr-alert group" onClick={() => setIsDhikrReminderOpen(true)}>
                      <div className="action-card-icon bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950">
                        <Bell size={22} className="animate-pulse" />
                      </div>
                      <span className="action-card-title font-black text-amber-300">تنبيه الأذكار</span>
                    </div>
                    <div className="action-card prophets group" onClick={() => setIsProphetsOpen(true)}>
                      <div className="action-card-icon">
                        <Scroll size={22} />
                      </div>
                      <span className="action-card-title">قصص الأنبياء</span>
                    </div>
                    <div className="action-card miracles group" onClick={() => setIsMiraclesOpen(true)}>
                      <div className="action-card-icon">
                        <Sparkles size={22} />
                      </div>
                      <span className="action-card-title">الإعجاز العلمي</span>
                    </div>
                    <div className="action-card adhkar group" onClick={() => setIsAdhkarOpen(true)}>
                      <div className="action-card-icon">
                        <BookOpen size={22} />
                      </div>
                      <span className="action-card-title">الأذكار</span>
                    </div>
                    <div className="action-card hijri group" onClick={() => setIsHijriOpen(true)}>
                      <div className="action-card-icon">
                        <Calendar size={22} />
                      </div>
                      <span className="action-card-title">التقويم الهجري</span>
                    </div>
                    <div className="action-card agri group" onClick={() => setIsAgriCalendarOpen(true)}>
                      <div className="action-card-icon">
                        <Leaf size={22} />
                      </div>
                      <span className="action-card-title">التقويم الزراعي</span>
                    </div>
                    <div className="action-card tasbih group" onClick={() => setIsTasbihOpen(true)}>
                      <div className="action-card-icon">
                        <Plus size={22} />
                      </div>
                      <span className="action-card-title">المسبحة</span>
                    </div>
                    <div className="action-card qibla group" onClick={() => setIsQiblaOpen(true)}>
                      <div className="action-card-icon">
                        <Compass size={22} />
                      </div>
                      <span className="action-card-title">القبلة</span>
                    </div>
                    <div className="action-card zakat group" onClick={() => setIsZakatOpen(true)}>
                      <div className="action-card-icon">
                        <Calculator size={22} />
                      </div>
                      <span className="action-card-title">الزكاة</span>
                    </div>
                    <div className="action-card names group" onClick={() => setIsNamesOfAllahOpen(true)}>
                      <div className="action-card-icon">
                        <Key size={22} />
                      </div>
                      <span className="action-card-title">أسماء الله</span>
                    </div>
                    <div className="action-card bookmarks group" onClick={() => setIsBookmarksOpen(true)}>
                      <div className="action-card-icon">
                        <BookmarkIcon size={22} />
                      </div>
                      <span className="action-card-title">المحفوظات</span>
                    </div>
                    <div className="action-card about group" onClick={() => setIsAboutOpen(true)}>
                      <div className="action-card-icon">
                        <Sparkles size={22} />
                      </div>
                      <span className="action-card-title">لمحة عن البرنامج</span>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </main>

        {isChatStarted && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
             <div style={{ height: '40px', background: 'linear-gradient(to bottom, transparent, var(--color-bg))', pointerEvents: 'none' }}></div>
             <div style={{ background: 'var(--color-bg)', padding: '0 1rem', paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}>
               <div className="max-w-3xl mx-auto w-full">
                 <EmotionForm onSubmit={handleEmotionSubmit} isLoading={state === AppState.LOADING} isOnline={isOnline} variant="bottom" />
               </div>
             </div>
          </div>
        )}
      </div>





      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewChat={startNewChat}
        onOpenTasbih={() => setIsTasbihOpen(true)}
        onOpenDhikrReminder={() => setIsDhikrReminderOpen(true)}
        onOpenQuranPlatform={() => openQuran(undefined, undefined, 'index')}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenAdhkar={() => setIsAdhkarOpen(true)}
        onOpenNamesOfAllah={() => setIsNamesOfAllahOpen(true)}
        onOpenQibla={() => setIsQiblaOpen(true)}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenZakat={() => setIsZakatOpen(true)}
        onOpenHijri={() => setIsHijriOpen(true)}
        onOpenAgriCalendar={() => setIsAgriCalendarOpen(true)}
        onOpenMiracles={() => setIsMiraclesOpen(true)}
        onOpenProphets={() => setIsProphetsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        userInfo={settings}
        onShowToast={showToast}
      />

      <Suspense fallback={<ModalSuspenseFallback />}>
      <TasbihModal 
        isOpen={isTasbihOpen} 
        onClose={() => setIsTasbihOpen(false)} 
      />

      <HijriCalendarModal
        isOpen={isHijriOpen}
        onClose={() => setIsHijriOpen(false)}
        hijriOffset={hijriOffset}
        setHijriOffset={setHijriOffset}
      />

      <QiblaModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <ZakatCalculatorModal
        isOpen={isZakatOpen}
        onClose={() => setIsZakatOpen(false)}
      />

      <AgriculturalCalendarModal
        isOpen={isAgriCalendarOpen}
        onClose={() => setIsAgriCalendarOpen(false)}
        location={settings.location}
      />

      <MiraclesModal
        isOpen={isMiraclesOpen}
        onClose={() => setIsMiraclesOpen(false)}
        isOnline={isOnline}
        onShowToast={showToast}
      />

      <ProphetsModal
        isOpen={isProphetsOpen}
        onClose={() => setIsProphetsOpen(false)}
        onShowToast={showToast}
      />

      <AdhkarModal 
        isOpen={isAdhkarOpen} 
        onClose={() => setIsAdhkarOpen(false)} 
      />

      <NamesOfAllahModal
        isOpen={isNamesOfAllahOpen}
        onClose={() => setIsNamesOfAllahOpen(false)}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={settings.bookmarks || []}
        onRemoveBookmark={(id) => {
          setSettings(prev => {
            const newBookmarks = (prev.bookmarks || []).filter(b => b.id !== id);
            const newSettings = { ...prev, bookmarks: newBookmarks };
            
            showToast('تمت إزالة الآية من المحفوظات', 'info');
            
            // Explicitly sync deletion to backend
            if (userIdRef.current) {
              SyncService.deleteBookmark(userIdRef.current, id, newSettings).catch(console.error);
            }
            
            return newSettings;
          });
        }}
        isOnline={isOnline}
        reciter={settings.reciter}
        onShowToast={showToast}
        onOpenQuran={openQuran}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
        onShowToast={showToast}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />

      <ManualLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={settings.location}
        onSelectLocation={(newLocation, calculationMethod) => {
          setSettings(prev => ({
            ...prev,
            location: newLocation,
            adhanSettings: calculationMethod ? {
              ...(prev.adhanSettings || {
                enabled: true,
                muezzin: 'mishary',
                fajrEnabled: true,
                dhuhrEnabled: true,
                asrEnabled: true,
                maghribEnabled: true,
                ishaEnabled: true,
                volume: 0.8
              }),
              calculationMethod
            } : prev.adhanSettings
          }));
          showToast(`تم تعيين الموقع بنجاح: ${newLocation.name}`, 'success');
        }}
      />

      <LocationPromptBanner
        isVisible={showLocationBanner}
        onClose={() => setShowLocationBanner(false)}
        location={locationBannerData.location || settings.location}
        isHighAccuracy={locationBannerData.isHighAccuracy}
        onOpenLocationSettings={() => setIsLocationModalOpen(true)}
      />

      <AdhanSettingsModal 
        isOpen={isAdhanSettingsOpen} 
        onClose={() => setIsAdhanSettingsOpen(false)} 
        settings={settings} 
        onSave={setSettings} 
      />

      <AdhanNotificationBanner 
        isOpen={isLiveAdhanBannerOpen}
        prayerName={liveAdhanPrayer}
        muezzinName={MUEZZINS_LIST.find(m => m.id === (settings.adhanSettings?.muezzin || 'mishary'))?.name}
        muezzinId={settings.adhanSettings?.muezzin || 'mishary'}
        volume={settings.adhanSettings?.volume ?? 85}
        onClose={() => setIsLiveAdhanBannerOpen(false)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        onSelectSession={loadSession}
        onDeleteSession={(id, e) => {
          e.stopPropagation();
          setSessions(prev => prev.filter(s => s.id !== id));
          
          // Also delete from Backend
          if (isOnline && userIdRef.current) {
            SyncService.deleteSession(userIdRef.current, id, settings).catch(err => {
              console.error('Error deleting session from Backend:', err);
            });
          }
        }}
        onClearAll={() => {
          const sessionsToClear = [...sessions];
          setSessions([]);
          localStorage.removeItem('anis_history');
          
          // Also clear from Backend
          if (isOnline && userIdRef.current) {
            SyncService.clearAllSessions(userIdRef.current, sessionsToClear, settings).catch(err => {
              console.error('Error clearing sessions from Backend:', err);
            });
          }
        }}
      />

      <QuranPlatformModal 
        isOpen={isQuranPlatformOpen} 
        onClose={() => setIsQuranPlatformOpen(false)} 
        initialSurah={quranInitialState.surah}
        initialAyah={quranInitialState.ayah}
        initialView={quranInitialState.view}
      />
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        onShowToast={showToast}
        userInfo={settings}
      />

      <InstallPrompt />

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onShowToast={showToast}
      />

      <ApkUpdateBanner
        isOpen={isApkUpdateBannerOpen}
        versionInfo={apkUpdateInfo || undefined}
        onUpdate={() => {
          setIsApkUpdateBannerOpen(false);
          const link = document.createElement('a');
          link.href = '/app-release.apk';
          link.download = 'أنيس القلوب - القرآن الذكي.apk';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          if (apkUpdateInfo?.version) {
            localStorage.setItem('anis_apk_installed_version', apkUpdateInfo.version);
          }
          showToast('جاري تحميل التحديث الجديد لملف الـ APK...', 'success');
        }}
        onDismiss={() => {
          setIsApkUpdateBannerOpen(false);
        }}
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <GlobalDownloadOverlay />
      <DynamicPermissionModal />

      <DhikrSettingsModal
        isOpen={isDhikrReminderOpen}
        onClose={() => setIsDhikrReminderOpen(false)}
        onShowToast={showToast}
      />

      <DhikrFloatingBanner
        onOpenSettings={() => setIsDhikrReminderOpen(true)}
      />
    </Suspense>
  </div>
  );
};

export default App;

