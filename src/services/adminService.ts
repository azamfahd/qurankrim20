import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseService';

export const OWNER_EMAIL = 'azamfahd25@gmail.com';

export interface AppVersionConfig {
  currentVersion: string;
  latestVersion: string;
  minSupportedVersion: string;
  apkDownloadUrl: string;
  forceUpdate: boolean;
  releaseNotes: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'update' | 'blessing' | 'maintenance';
  active: boolean;
  allowDismiss: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  updatedBy: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  estimatedEndTime?: string;
}

export interface SystemFeatureToggles {
  enableAiChat?: boolean;
  enableAudioRecitation?: boolean;
  enableAyahCards?: boolean;
  enableCommunityKhatma?: boolean;
  updatedAt?: string;
}

export const ANNOUNCEMENT_PRESETS = [
  {
    title: '✨ نفحة جمعة مباركة',
    message: '﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ﴾ — لا تنسوا قراءة سورة الكهف والصلاة على النبي ﷺ.',
    type: 'blessing' as const,
    actionText: 'قراءة سورة الكهف',
    actionUrl: '#quran'
  },
  {
    title: '📖 آية وطمأنينة اليوم',
    message: '﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾ — اجعل لسانك رطباً بذكر الله في كل وقت.',
    type: 'blessing' as const,
    actionText: 'فتح الأذكار',
    actionUrl: '#dhikr'
  },
  {
    title: '🚀 تحديث جديد ومتطور للتطبيق!',
    message: 'تم إضافة مميزات وتحسينات جديدة لسلاسة القراءة واستماع القرآن. حمّل الإصدار الأخير الآن.',
    type: 'update' as const,
    actionText: 'تحميل الـ APK الآن',
    actionUrl: 'https://raw.githubusercontent.com/azamfahd25/qurankrim20/main/qurankrim20.apk'
  },
  {
    title: '🌙 تهنئة بحلول الشهر المبارك',
    message: 'مبارك عليكم الشهر الفضيل! نسأل الله أن يتقبل منا ومنكم صالح الأعمال والطاعات.',
    type: 'blessing' as const,
    actionText: 'متابعة جدول الختمة',
    actionUrl: '#quran'
  }
];

export class AdminService {
  private static ANNOUNCEMENT_STORAGE_KEY = 'anis_system_announcement_cache';
  private static VERSION_STORAGE_KEY = 'anis_system_version_cache';
  private static MAINTENANCE_STORAGE_KEY = 'anis_system_maintenance_cache';
  private static FEATURES_STORAGE_KEY = 'anis_system_features_cache';

  /**
   * Check if a given email is the designated app owner
   */
  static isOwnerEmail(email?: string | null): boolean {
    if (!email) {
      // Check localStorage for authenticated owner email
      const localEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('anis_auth_email') : null;
      if (localEmail && localEmail.trim().toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        return true;
      }
      return false;
    }
    return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
  }

  /**
   * Publish App Version Configuration to Firestore + Local Cache + Broadcast
   */
  static async publishVersionConfig(config: AppVersionConfig): Promise<void> {
    const payload: AppVersionConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: OWNER_EMAIL
    };

    // 1. Save to local storage cache immediately
    try {
      localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('admin-version-updated', { detail: payload }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('anis_admin_channel');
        bc.postMessage({ type: 'VERSION_UPDATE', data: payload });
        bc.close();
      }
    } catch (e) {
      console.warn('Local version caching note:', e);
    }

    // 2. Publish to Firestore
    try {
      await setDoc(doc(db, 'system_config', 'app_version'), payload, { merge: true });
      console.log('👑 [Admin] App version config updated successfully in Firestore');
    } catch (error) {
      console.warn('👑 [Admin] Firestore version write notice (saved locally):', error);
      // We do not rethrow if local cache succeeded, ensuring the owner is never completely blocked
    }
  }

  /**
   * Get App Version Config (Cache first, then Firestore)
   */
  static async getVersionConfig(): Promise<AppVersionConfig | null> {
    // 1. Try local cache
    try {
      const cached = localStorage.getItem(this.VERSION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Start background firestore fetch
        getDoc(doc(db, 'system_config', 'app_version')).then((snap) => {
          if (snap.exists()) {
            localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(snap.data()));
          }
        }).catch(() => {});
        return parsed as AppVersionConfig;
      }
    } catch (e) {}

    // 2. Fetch from Firestore
    try {
      const snap = await getDoc(doc(db, 'system_config', 'app_version'));
      if (snap.exists()) {
        const data = snap.data() as AppVersionConfig;
        localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
      return null;
    } catch (error) {
      console.warn('👑 [Admin] Error fetching version config from Firestore:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time App Version Config changes
   */
  static subscribeToVersionConfig(callback: (config: AppVersionConfig | null) => void) {
    // Immediate callback from cache
    try {
      const cached = localStorage.getItem(this.VERSION_STORAGE_KEY);
      if (cached) {
        callback(JSON.parse(cached));
      }
    } catch {}

    // Local custom event listener
    const handleLocal = (e: any) => {
      if (e?.detail) callback(e.detail);
    };
    window.addEventListener('admin-version-updated', handleLocal);

    // Firestore Snapshot Listener
    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'system_config', 'app_version'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as AppVersionConfig;
            try {
              localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(data));
            } catch {}
            callback(data);
          } else {
            callback(null);
          }
        },
        (err) => console.warn('👑 [Admin] Version config snapshot listener note:', err)
      );
    } catch (e) {
      console.warn('Firestore snapshot setup warning:', e);
    }

    return () => {
      window.removeEventListener('admin-version-updated', handleLocal);
      unsubscribeFirestore();
    };
  }

  /**
   * Publish Broadcast System Announcement
   */
  static async publishAnnouncement(announcement: SystemAnnouncement): Promise<void> {
    const payload: SystemAnnouncement = {
      ...announcement,
      createdAt: new Date().toISOString(),
      updatedBy: OWNER_EMAIL
    };

    // 1. Save to local storage cache immediately & dispatch local events
    try {
      localStorage.setItem(this.ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('admin-announcement-updated', { detail: payload }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('anis_admin_channel');
        bc.postMessage({ type: 'ANNOUNCEMENT_UPDATE', data: payload });
        bc.close();
      }
    } catch (e) {
      console.warn('Local announcement cache note:', e);
    }

    // 2. Publish to Firestore
    try {
      await setDoc(doc(db, 'system_announcements', 'latest'), payload, { merge: true });
      console.log('👑 [Admin] System announcement published successfully to Firestore');
    } catch (error) {
      console.warn('👑 [Admin] Firestore announcement write notice (saved locally):', error);
    }
  }

  /**
   * Subscribe to real-time System Announcement
   */
  static subscribeToAnnouncement(callback: (announcement: SystemAnnouncement | null) => void) {
    // Immediate callback from cache
    try {
      const cached = localStorage.getItem(this.ANNOUNCEMENT_STORAGE_KEY);
      if (cached) {
        callback(JSON.parse(cached));
      }
    } catch {}

    // Local custom event listener
    const handleLocal = (e: any) => {
      if (e?.detail) callback(e.detail);
    };
    window.addEventListener('admin-announcement-updated', handleLocal);

    // Cross-tab broadcast listener
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('anis_admin_channel');
        bc.onmessage = (event) => {
          if (event?.data?.type === 'ANNOUNCEMENT_UPDATE' && event?.data?.data) {
            callback(event.data.data);
          }
        };
      } catch {}
    }

    // Firestore Snapshot Listener
    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'system_announcements', 'latest'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SystemAnnouncement;
            try {
              localStorage.setItem(this.ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(data));
            } catch {}
            callback(data);
          } else {
            callback(null);
          }
        },
        (err) => console.warn('👑 [Admin] Announcement snapshot listener note:', err)
      );
    } catch (e) {
      console.warn('Firestore announcement snapshot setup warning:', e);
    }

    return () => {
      window.removeEventListener('admin-announcement-updated', handleLocal);
      if (bc) bc.close();
      unsubscribeFirestore();
    };
  }

  /**
   * Publish Maintenance Mode Config
   */
  static async publishMaintenanceConfig(config: MaintenanceConfig): Promise<void> {
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: OWNER_EMAIL
    };

    try {
      localStorage.setItem(this.MAINTENANCE_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('admin-maintenance-updated', { detail: payload }));
    } catch {}

    try {
      await setDoc(doc(db, 'system_config', 'maintenance'), payload, { merge: true });
      console.log('👑 [Admin] Maintenance config updated');
    } catch (error) {
      console.warn('👑 [Admin] Firestore maintenance write notice:', error);
    }
  }

  /**
   * Subscribe to Maintenance Config
   */
  static subscribeToMaintenance(callback: (config: MaintenanceConfig | null) => void) {
    try {
      const cached = localStorage.getItem(this.MAINTENANCE_STORAGE_KEY);
      if (cached) callback(JSON.parse(cached));
    } catch {}

    const handleLocal = (e: any) => {
      if (e?.detail) callback(e.detail);
    };
    window.addEventListener('admin-maintenance-updated', handleLocal);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'system_config', 'maintenance'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as MaintenanceConfig;
            try {
              localStorage.setItem(this.MAINTENANCE_STORAGE_KEY, JSON.stringify(data));
            } catch {}
            callback(data);
          } else {
            callback(null);
          }
        },
        (err) => console.warn('👑 [Admin] Maintenance snapshot note:', err)
      );
    } catch {}

    return () => {
      window.removeEventListener('admin-maintenance-updated', handleLocal);
      unsubscribeFirestore();
    };
  }

  /**
   * Publish System Feature Toggles
   */
  static async publishFeatureToggles(toggles: SystemFeatureToggles): Promise<void> {
    const payload = {
      ...toggles,
      updatedAt: new Date().toISOString(),
      updatedBy: OWNER_EMAIL
    };

    try {
      localStorage.setItem(this.FEATURES_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('admin-features-updated', { detail: payload }));
    } catch {}

    try {
      await setDoc(doc(db, 'system_config', 'feature_toggles'), payload, { merge: true });
      console.log('👑 [Admin] Feature toggles updated in Firestore');
    } catch (error) {
      console.warn('👑 [Admin] Firestore feature toggles write notice:', error);
    }
  }

  /**
   * Get Feature Toggles
   */
  static async getFeatureToggles(): Promise<SystemFeatureToggles | null> {
    try {
      const cached = localStorage.getItem(this.FEATURES_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}

    try {
      const snap = await getDoc(doc(db, 'system_config', 'feature_toggles'));
      if (snap.exists()) {
        const data = snap.data() as SystemFeatureToggles;
        localStorage.setItem(this.FEATURES_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
      return null;
    } catch (error) {
      console.warn('👑 [Admin] Error fetching feature toggles:', error);
      return null;
    }
  }

  /**
   * Subscribe to Feature Toggles
   */
  static subscribeToFeatureToggles(callback: (toggles: SystemFeatureToggles | null) => void) {
    try {
      const cached = localStorage.getItem(this.FEATURES_STORAGE_KEY);
      if (cached) callback(JSON.parse(cached));
    } catch {}

    const handleLocal = (e: any) => {
      if (e?.detail) callback(e.detail);
    };
    window.addEventListener('admin-features-updated', handleLocal);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'system_config', 'feature_toggles'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SystemFeatureToggles;
            try {
              localStorage.setItem(this.FEATURES_STORAGE_KEY, JSON.stringify(data));
            } catch {}
            callback(data);
          } else {
            callback(null);
          }
        },
        (err) => console.warn('👑 [Admin] Feature toggles snapshot note:', err)
      );
    } catch {}

    return () => {
      window.removeEventListener('admin-features-updated', handleLocal);
      unsubscribeFirestore();
    };
  }
}
