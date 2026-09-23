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
  /**
   * Check if a given email is the designated app owner
   */
  static isOwnerEmail(email?: string | null): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
  }

  /**
   * Publish App Version Configuration to Firestore
   */
  static async publishVersionConfig(config: AppVersionConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'system_config', 'app_version'), {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: OWNER_EMAIL
      }, { merge: true });
      console.log('👑 [Admin] App version config updated successfully');
    } catch (error) {
      console.error('👑 [Admin] Error publishing app version config:', error);
      throw error;
    }
  }

  /**
   * Get App Version Config
   */
  static async getVersionConfig(): Promise<AppVersionConfig | null> {
    try {
      const snap = await getDoc(doc(db, 'system_config', 'app_version'));
      if (snap.exists()) {
        return snap.data() as AppVersionConfig;
      }
      return null;
    } catch (error) {
      console.error('👑 [Admin] Error fetching version config:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time App Version Config changes
   */
  static subscribeToVersionConfig(callback: (config: AppVersionConfig | null) => void) {
    return onSnapshot(
      doc(db, 'system_config', 'app_version'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as AppVersionConfig);
        } else {
          callback(null);
        }
      },
      (err) => console.warn('👑 [Admin] Version config snapshot listener note:', err)
    );
  }

  /**
   * Publish Broadcast System Announcement
   */
  static async publishAnnouncement(announcement: SystemAnnouncement): Promise<void> {
    try {
      await setDoc(doc(db, 'system_announcements', 'latest'), {
        ...announcement,
        createdAt: new Date().toISOString(),
        updatedBy: OWNER_EMAIL
      });
      console.log('👑 [Admin] System announcement published successfully');
    } catch (error) {
      console.error('👑 [Admin] Error publishing announcement:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time System Announcement
   */
  static subscribeToAnnouncement(callback: (announcement: SystemAnnouncement | null) => void) {
    return onSnapshot(
      doc(db, 'system_announcements', 'latest'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as SystemAnnouncement);
        } else {
          callback(null);
        }
      },
      (err) => console.warn('👑 [Admin] Announcement snapshot listener note:', err)
    );
  }

  /**
   * Publish Maintenance Mode Config
   */
  static async publishMaintenanceConfig(config: MaintenanceConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'system_config', 'maintenance'), {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: OWNER_EMAIL
      }, { merge: true });
      console.log('👑 [Admin] Maintenance config updated');
    } catch (error) {
      console.error('👑 [Admin] Error publishing maintenance config:', error);
      throw error;
    }
  }

  /**
   * Subscribe to Maintenance Config
   */
  static subscribeToMaintenance(callback: (config: MaintenanceConfig | null) => void) {
    return onSnapshot(
      doc(db, 'system_config', 'maintenance'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as MaintenanceConfig);
        } else {
          callback(null);
        }
      },
      (err) => console.warn('👑 [Admin] Maintenance snapshot note:', err)
    );
  }

  /**
   * Publish System Feature Toggles
   */
  static async publishFeatureToggles(toggles: SystemFeatureToggles): Promise<void> {
    try {
      await setDoc(doc(db, 'system_config', 'feature_toggles'), {
        ...toggles,
        updatedAt: new Date().toISOString(),
        updatedBy: OWNER_EMAIL
      }, { merge: true });
      console.log('👑 [Admin] Feature toggles updated');
    } catch (error) {
      console.error('👑 [Admin] Error publishing feature toggles:', error);
      throw error;
    }
  }

  /**
   * Get Feature Toggles
   */
  static async getFeatureToggles(): Promise<SystemFeatureToggles | null> {
    try {
      const snap = await getDoc(doc(db, 'system_config', 'feature_toggles'));
      if (snap.exists()) {
        return snap.data() as SystemFeatureToggles;
      }
      return null;
    } catch (error) {
      console.error('👑 [Admin] Error fetching feature toggles:', error);
      return null;
    }
  }

  /**
   * Subscribe to Feature Toggles
   */
  static subscribeToFeatureToggles(callback: (toggles: SystemFeatureToggles | null) => void) {
    return onSnapshot(
      doc(db, 'system_config', 'feature_toggles'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as SystemFeatureToggles);
        } else {
          callback(null);
        }
      },
      (err) => console.warn('👑 [Admin] Feature toggles snapshot note:', err)
    );
  }
}
