/**
 * Owner Admin & System Control Service
 * Directly connected to Supabase Database (Primary & Exclusive Backend)
 * Handles: Announcements, Remote Version Control, Maintenance Mode, Feature Toggles, and Realtime Stats.
 */

import { getSupabase } from './supabaseService';

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
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemFeatureToggles {
  enableAiChat?: boolean;
  enableAudioRecitation?: boolean;
  enableAyahCards?: boolean;
  enableCommunityKhatma?: boolean;
  updatedAt?: string;
  updatedBy?: string;
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
    actionUrl: 'https://github.com/azamfahd/qurankrim20/releases/download/latest/app-release.apk'
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
  private static TABLE_CONFIG = 'system_config';
  private static ANNOUNCEMENT_STORAGE_KEY = 'anis_system_announcement_cache';
  private static VERSION_STORAGE_KEY = 'anis_system_version_cache';
  private static MAINTENANCE_STORAGE_KEY = 'anis_system_maintenance_cache';
  private static FEATURES_STORAGE_KEY = 'anis_system_features_cache';

  /**
   * Check if a given email is the designated app owner
   */
  static isOwnerEmail(email?: string | null): boolean {
    if (!email) {
      const localEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('anis_auth_email') : null;
      if (localEmail && localEmail.trim().toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        return true;
      }
      return false;
    }
    return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
  }

  /**
   * Publish App Version Configuration to Supabase (Primary) + Local Cache + Broadcast
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

    // 2. Publish to Supabase as PRIMARY Database
    const client = getSupabase();
    if (client) {
      try {
        await client
          .from(this.TABLE_CONFIG)
          .upsert({
            id: 'app_version',
            data: payload,
            updated_at: new Date().toISOString(),
            updated_by: OWNER_EMAIL
          });
        console.log('👑 [Admin] App version config updated successfully in Supabase (Primary)');
      } catch (error) {
        console.warn('👑 [Admin] Supabase version write notice (saved locally):', error);
      }
    }
  }

  /**
   * Get App Version Config (Supabase as Primary, with Local Cache Fallback)
   */
  static async getVersionConfig(): Promise<AppVersionConfig | null> {
    // 1. Fetch from Supabase (Primary Database)
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from(this.TABLE_CONFIG)
          .select('data')
          .eq('id', 'app_version')
          .maybeSingle();

        if (!error && data?.data) {
          const versionData = data.data as AppVersionConfig;
          localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(versionData));
          return versionData;
        }
      } catch (error) {
        console.warn('👑 [Admin] Notice fetching version config from Supabase:', error);
      }
    }

    // 2. Fallback to local cache
    try {
      const cached = localStorage.getItem(this.VERSION_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached) as AppVersionConfig;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Subscribe to real-time App Version Config changes (Supabase Realtime + Local Broadcast)
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

    // Cross-tab broadcast listener
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('anis_admin_channel');
        bc.onmessage = (event) => {
          if (event?.data?.type === 'VERSION_UPDATE' && event?.data?.data) {
            callback(event.data.data);
          }
        };
      } catch {}
    }

    // Supabase Realtime channel subscription
    const client = getSupabase();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel('system-version-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.TABLE_CONFIG, filter: 'id=eq.app_version' },
            (payload) => {
              if (payload.new && (payload.new as any).data) {
                const updated = (payload.new as any).data as AppVersionConfig;
                try {
                  localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(updated));
                } catch {}
                callback(updated);
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Supabase version realtime subscription note:', e);
      }
    }

    return () => {
      window.removeEventListener('admin-version-updated', handleLocal);
      if (bc) bc.close();
      if (channel && client) {
        client.removeChannel(channel).catch(() => {});
      }
    };
  }

  /**
   * Publish Broadcast System Announcement to Supabase (Primary) + Local Cache + Broadcast
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

    // 2. Publish to Supabase as PRIMARY Database
    const client = getSupabase();
    if (client) {
      try {
        await client
          .from(this.TABLE_CONFIG)
          .upsert({
            id: 'announcement_latest',
            data: payload,
            updated_at: new Date().toISOString(),
            updated_by: OWNER_EMAIL
          });
        console.log('👑 [Admin] System announcement published successfully to Supabase (Primary)');
      } catch (error) {
        console.warn('👑 [Admin] Supabase announcement write notice (saved locally):', error);
      }
    }
  }

  /**
   * Get Current System Announcement (Supabase Primary, with Local Cache Fallback)
   */
  static async getAnnouncement(): Promise<SystemAnnouncement | null> {
    // 1. Fetch from Supabase (Primary)
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from(this.TABLE_CONFIG)
          .select('data')
          .eq('id', 'announcement_latest')
          .maybeSingle();

        if (!error && data?.data) {
          const ann = data.data as SystemAnnouncement;
          localStorage.setItem(this.ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(ann));
          return ann;
        }
      } catch (e) {
        console.warn('👑 [Admin] Notice fetching announcement from Supabase:', e);
      }
    }

    // 2. Fallback to local cache
    try {
      const cached = localStorage.getItem(this.ANNOUNCEMENT_STORAGE_KEY);
      if (cached) return JSON.parse(cached) as SystemAnnouncement;
    } catch {}

    return null;
  }

  /**
   * Subscribe to real-time System Announcement (Supabase Realtime + Local Broadcast)
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

    // Supabase Realtime channel
    const client = getSupabase();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel('system-announcements-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.TABLE_CONFIG, filter: 'id=eq.announcement_latest' },
            (payload) => {
              if (payload.new && (payload.new as any).data) {
                const updated = (payload.new as any).data as SystemAnnouncement;
                try {
                  localStorage.setItem(this.ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(updated));
                } catch {}
                callback(updated);
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Supabase announcement subscription warning:', e);
      }
    }

    return () => {
      window.removeEventListener('admin-announcement-updated', handleLocal);
      if (bc) bc.close();
      if (channel && client) {
        client.removeChannel(channel).catch(() => {});
      }
    };
  }

  /**
   * Publish Maintenance Mode Config to Supabase (Primary) + Local Cache
   */
  static async publishMaintenanceConfig(config: MaintenanceConfig): Promise<void> {
    const payload: MaintenanceConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: OWNER_EMAIL
    };

    try {
      localStorage.setItem(this.MAINTENANCE_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('admin-maintenance-updated', { detail: payload }));
    } catch {}

    // 1. Supabase as PRIMARY Database
    const client = getSupabase();
    if (client) {
      try {
        await client
          .from(this.TABLE_CONFIG)
          .upsert({
            id: 'maintenance',
            data: payload,
            updated_at: new Date().toISOString(),
            updated_by: OWNER_EMAIL
          });
        console.log('👑 [Admin] Maintenance config updated in Supabase (Primary)');
      } catch (error) {
        console.warn('👑 [Admin] Supabase maintenance write notice:', error);
      }
    }
  }

  /**
   * Get Maintenance Mode Config (Supabase Primary, with Local Cache Fallback)
   */
  static async getMaintenanceConfig(): Promise<MaintenanceConfig | null> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from(this.TABLE_CONFIG)
          .select('data')
          .eq('id', 'maintenance')
          .maybeSingle();

        if (!error && data?.data) {
          const config = data.data as MaintenanceConfig;
          localStorage.setItem(this.MAINTENANCE_STORAGE_KEY, JSON.stringify(config));
          return config;
        }
      } catch (e) {
        console.warn('👑 [Admin] Notice fetching maintenance from Supabase:', e);
      }
    }

    try {
      const cached = localStorage.getItem(this.MAINTENANCE_STORAGE_KEY);
      if (cached) return JSON.parse(cached) as MaintenanceConfig;
    } catch {}

    return null;
  }

  /**
   * Subscribe to Maintenance Config (Supabase Realtime + Local Broadcast)
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

    const client = getSupabase();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel('system-maintenance-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.TABLE_CONFIG, filter: 'id=eq.maintenance' },
            (payload) => {
              if (payload.new && (payload.new as any).data) {
                const data = (payload.new as any).data as MaintenanceConfig;
                try {
                  localStorage.setItem(this.MAINTENANCE_STORAGE_KEY, JSON.stringify(data));
                } catch {}
                callback(data);
              }
            }
          )
          .subscribe();
      } catch {}
    }

    return () => {
      window.removeEventListener('admin-maintenance-updated', handleLocal);
      if (channel && client) {
        client.removeChannel(channel).catch(() => {});
      }
    };
  }

  /**
   * Publish System Feature Toggles to Supabase
   */
  static async publishFeatureToggles(toggles: SystemFeatureToggles): Promise<void> {
    const payload: SystemFeatureToggles = {
      ...toggles,
      updatedAt: new Date().toISOString(),
      updatedBy: OWNER_EMAIL
    };

    try {
      localStorage.setItem(this.FEATURES_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('admin-features-updated', { detail: payload }));
    } catch {}

    // 1. Supabase as PRIMARY Database
    const client = getSupabase();
    if (client) {
      try {
        await client
          .from(this.TABLE_CONFIG)
          .upsert({
            id: 'feature_toggles',
            data: payload,
            updated_at: new Date().toISOString(),
            updated_by: OWNER_EMAIL
          });
        console.log('👑 [Admin] Feature toggles updated in Supabase (Primary)');
      } catch (error) {
        console.warn('👑 [Admin] Supabase feature toggles write notice:', error);
      }
    }
  }

  /**
   * Get Feature Toggles from Supabase (Primary) / Local Cache
   */
  static async getFeatureToggles(): Promise<SystemFeatureToggles | null> {
    // 1. Fetch from Supabase (Primary)
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from(this.TABLE_CONFIG)
          .select('data')
          .eq('id', 'feature_toggles')
          .maybeSingle();

        if (!error && data?.data) {
          const featureData = data.data as SystemFeatureToggles;
          localStorage.setItem(this.FEATURES_STORAGE_KEY, JSON.stringify(featureData));
          return featureData;
        }
      } catch (error) {
        console.warn('👑 [Admin] Notice fetching feature toggles from Supabase:', error);
      }
    }

    // 2. Fallback to local cache
    try {
      const cached = localStorage.getItem(this.FEATURES_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}

    return null;
  }

  /**
   * Subscribe to Feature Toggles (Supabase Realtime + Local Broadcast)
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

    const client = getSupabase();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel('system-features-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.TABLE_CONFIG, filter: 'id=eq.feature_toggles' },
            (payload) => {
              if (payload.new && (payload.new as any).data) {
                const data = (payload.new as any).data as SystemFeatureToggles;
                try {
                  localStorage.setItem(this.FEATURES_STORAGE_KEY, JSON.stringify(data));
                } catch {}
                callback(data);
              }
            }
          )
          .subscribe();
      } catch {}
    }

    return () => {
      window.removeEventListener('admin-features-updated', handleLocal);
      if (channel && client) {
        client.removeChannel(channel).catch(() => {});
      }
    };
  }
}
