/**
 * AppSync Service (خدمة المزامنة الشاملة وتوحيد القنوات)
 * Unifies update signals, announcements, and alert dispatch channels between Web and APK.
 * Consumes 'version.json' through a unified route from primary domain: https://qurankrim20.netlify.app
 * Ensures APK and Web instances receive owner broadcasts and update notifications simultaneously.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AdminService, SystemAnnouncement, AppVersionConfig } from './adminService';
import { AppUpdateService } from './appUpdateService';

export const PRIMARY_DOMAIN_URL = 'https://qurankrim20.netlify.app';
export const MIRROR_DOMAIN_URL = 'https://quramkrim20.netlify.app';

export const STORAGE_KEYS = {
  VERSION_CACHE: 'anis_appsync_version_cache',
  ALERT_CACHE: 'anis_appsync_alert_cache',
  DISMISSED_ALERT_ID: 'anis_dismissed_alert_id',
  LAST_CHECK_TS: 'anis_appsync_last_check_ts',
  SYNCED_HOT_VERSION: 'anis_hot_updated_version',
  SYNCED_APK_VERSION: 'anis_apk_installed_version'
};

export const BROADCAST_CHANNEL_NAME = 'anis_appsync_channel';

export interface AppSyncVersionData {
  version: string;
  versionCode?: number;
  title?: string;
  releaseNotes?: string;
  sizeFormatted?: string;
  apkSize?: string;
  downloadUrl?: string;
  updateUrl?: string;
  mirrorUrl?: string;
  timestamp?: number;
  apkUpdated?: string;
  updateType?: 'hot' | 'apk' | 'both' | 'smart';
  features?: string[];
}

export interface AppSyncCheckResult {
  hasUpdate: boolean;
  isHotUpdate: boolean;
  isApkUpdate: boolean;
  currentVersion: string;
  remoteVersion: string;
  sourceDomain: string;
  data: AppSyncVersionData | null;
  checkedAt: number;
}

export interface AppSyncAlertPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'update' | 'blessing' | 'maintenance';
  active: boolean;
  allowDismiss: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  updatedBy?: string;
}

export type AppSyncUpdateListener = (result: AppSyncCheckResult) => void;
export type AppSyncAlertListener = (alert: AppSyncAlertPayload | null) => void;

export class AppSyncService {
  private static instance: AppSyncService | null = null;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;

  private static updateListeners = new Set<AppSyncUpdateListener>();
  private static alertListeners = new Set<AppSyncAlertListener>();

  /**
   * Unified endpoints to fetch version.json with primary domain prioritized
   */
  public static readonly VERSION_ENDPOINTS = [
    `${PRIMARY_DOMAIN_URL}/version.json`,
    `${MIRROR_DOMAIN_URL}/version.json`,
    '/version.json',
    'https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app/version.json'
  ];

  /**
   * Initialize AppSync listeners and unified channels
   */
  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Setup BroadcastChannel for cross-tab and cross-window coordination
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (err) {
        console.warn('[AppSync] BroadcastChannel not supported:', err);
      }
    }

    // 2. Setup window event listener for manual triggers
    if (typeof window !== 'undefined') {
      window.addEventListener('check-for-app-updates', () => {
        this.checkForUpdates(true).catch(console.error);
      });
    }

    // 3. Connect real-time listeners for Supabase announcements and version pushes
    this.bindAdminSyncListeners();

    // 4. Initial silent check on startup after short delay
    setTimeout(() => {
      this.checkForUpdates(false).catch(() => {});
    }, 4000);
  }

  /**
   * Determine platform characteristics
   */
  public static getPlatformInfo() {
    const isApk = Capacitor.isNativePlatform();
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      document.referrer.includes('android-app://')
    );
    return {
      isApk,
      isPwa: isStandalone && !isApk,
      isWeb: !isApk && !isStandalone,
      platform: isApk ? 'android_apk' : isStandalone ? 'pwa' : 'web_browser',
      currentVersion: this.getCurrentVersion()
    };
  }

  /**
   * Retrieve current active version
   */
  public static getCurrentVersion(): string {
    return AppUpdateService.getCurrentVersion();
  }

  /**
   * Compare version strings (SemVer)
   */
  public static isNewer(local: string, remote: string): boolean {
    return AppUpdateService.isNewer(local, remote);
  }

  /**
   * Unified route to consume version.json from the primary domain (qurankrim20.netlify.app)
   * with fallbacks to mirror and local cache
   */
  public static async fetchVersionJson(forceFresh = false): Promise<{ data: AppSyncVersionData | null; source: string }> {
    const cacheBuster = `t=${Date.now()}`;

    for (const endpoint of this.VERSION_ENDPOINTS) {
      try {
        const url = endpoint.includes('?') ? `${endpoint}&${cacheBuster}` : `${endpoint}?${cacheBuster}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          cache: forceFresh ? 'no-store' : 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const raw = await res.json();
          if (raw && raw.version) {
            const normalized: AppSyncVersionData = {
              version: String(raw.version).trim(),
              versionCode: raw.versionCode || 1,
              title: raw.title || `تحديث جديد متوفر للتطبيق (v${raw.version})`,
              releaseNotes: raw.releaseNotes || 'تحديث تراكمي يتضمن تحسينات في الأداء والتنبيهات وإصلاحات مستمرة.',
              sizeFormatted: raw.sizeFormatted || raw.apkSize || '20 MB • تحميل وتثبيت مباشر',
              apkSize: raw.apkSize || raw.sizeFormatted || '20 MB',
              downloadUrl: raw.downloadUrl || raw.updateUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
              updateUrl: raw.updateUrl || raw.downloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
              mirrorUrl: raw.mirrorUrl || `${MIRROR_DOMAIN_URL}/app-release.apk`,
              timestamp: raw.timestamp || Date.now(),
              apkUpdated: raw.apkUpdated || new Date().toISOString(),
              updateType: raw.updateType || 'smart',
              features: raw.features || [
                'مزامنة فورية ودائمة بين تطبيق الهاتف والموقع الرسمي (qurankrim20.netlify.app)',
                'تحسين دقة مستشعرات البوصلة ومحاذاة القبلة بالكامل بدون اهتزاز',
                'تفعيل الذكاء الاصطناعي التلقائي وسرعة استجابة فائقة',
                'تكامل تام وحفظ دائم للمصاحف والبيانات'
              ]
            };

            // Cache successfully verified data locally
            try {
              localStorage.setItem(STORAGE_KEYS.VERSION_CACHE, JSON.stringify(normalized));
            } catch {}

            return { data: normalized, source: endpoint };
          }
        }
      } catch (err) {
        // Continue to fallback endpoint
      }
    }

    // Secondary fallback: Retrieve from AdminService (Supabase)
    try {
      const remoteConfig = await AdminService.getVersionConfig();
      if (remoteConfig?.latestVersion) {
        const fromSupabase: AppSyncVersionData = {
          version: remoteConfig.latestVersion,
          versionCode: 2,
          title: `تحديث من إدارة التطبيق (v${remoteConfig.latestVersion})`,
          releaseNotes: remoteConfig.releaseNotes || 'تحديث جديد يتضمن تحسينات فورية للأداء والتنبيهات.',
          sizeFormatted: '20 MB • تحميل وتثبيت مباشر',
          apkSize: '20 MB',
          downloadUrl: remoteConfig.apkDownloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
          updateUrl: remoteConfig.apkDownloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
          mirrorUrl: `${MIRROR_DOMAIN_URL}/app-release.apk`,
          timestamp: remoteConfig.updatedAt ? new Date(remoteConfig.updatedAt).getTime() : Date.now(),
          updateType: remoteConfig.forceUpdate ? 'both' : 'smart',
          features: [
            'مزامنة فورية كاملة بين تطبيق الهاتف والموقع الرسمي',
            'إصلاح اهتزاز البوصلة واستقرار الحسابات الفلكية',
            'اتصال ذكي بالذكاء الاصطناعي في الـ APK بدون متطلبات معقدة'
          ]
        };
        return { data: fromSupabase, source: 'supabase_system_config' };
      }
    } catch {}

    // Final fallback: Use cached version if available
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.VERSION_CACHE);
      if (cached) {
        return { data: JSON.parse(cached), source: 'local_cache' };
      }
    } catch {}

    return { data: null, source: 'none' };
  }

  /**
   * Check for application updates uniformly for both Web and APK
   */
  public static async checkForUpdates(forceFresh = false): Promise<AppSyncCheckResult> {
    const currentVersion = this.getCurrentVersion();
    const { data: remoteData, source } = await this.fetchVersionJson(forceFresh);

    const checkTimestamp = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CHECK_TS, checkTimestamp.toString());
    } catch {}

    if (!remoteData || !remoteData.version) {
      const emptyResult: AppSyncCheckResult = {
        hasUpdate: false,
        isHotUpdate: false,
        isApkUpdate: false,
        currentVersion,
        remoteVersion: currentVersion,
        sourceDomain: source,
        data: null,
        checkedAt: checkTimestamp
      };
      this.notifyUpdateListeners(emptyResult);
      return emptyResult;
    }

    const hasNewerVersion = this.isNewer(currentVersion, remoteData.version);
    const lastInstalledTs = parseInt(localStorage.getItem('anis_last_update_ts') || '0', 10);
    const hasNewerTimestamp = remoteData.timestamp && remoteData.timestamp > lastInstalledTs && lastInstalledTs > 0;
    const hasUpdate = hasNewerVersion || Boolean(hasNewerTimestamp);

    const isNative = Capacitor.isNativePlatform();
    const updateResult: AppSyncCheckResult = {
      hasUpdate,
      isHotUpdate: remoteData.updateType !== 'apk',
      isApkUpdate: isNative || Boolean(remoteData.downloadUrl || remoteData.updateUrl),
      currentVersion,
      remoteVersion: remoteData.version,
      sourceDomain: source,
      data: remoteData,
      checkedAt: checkTimestamp
    };

    if (hasUpdate) {
      this.dispatchUpdateSignal(updateResult);
    }

    this.notifyUpdateListeners(updateResult);
    return updateResult;
  }

  /**
   * Dispatch update signals across local window, BroadcastChannel, and native notification if on APK
   */
  public static dispatchUpdateSignal(update: AppSyncCheckResult): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-update-available', {
        detail: {
          version: update.remoteVersion,
          source: update.sourceDomain,
          details: update.data
        }
      }));
    }

    // Broadcast cross-tab
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'UPDATE_AVAILABLE',
        payload: update
      });
    }

    // If native APK, trigger a system tray alert so user sees it even outside browser
    if (Capacitor.isNativePlatform() && update.hasUpdate) {
      this.triggerNativeNotification(
        `تحديث جديد متوفر (v${update.remoteVersion}) 🚀`,
        update.data?.releaseNotes || 'يتوفر إصدار جديد مع تحسينات شاملة في أنيس القلوب، اضغط لتثبيت التحديث.'
      );
    }
  }

  /**
   * Dispatch announcement signals across Web and APK uniformly
   */
  public static async broadcastAnnouncement(announcement: AppSyncAlertPayload): Promise<void> {
    // 1. Publish to Supabase via AdminService
    await AdminService.publishAnnouncement(announcement as unknown as SystemAnnouncement);

    // 2. Broadcast via BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'ANNOUNCEMENT_DISPATCHED',
        payload: announcement
      });
    }

    // 3. Dispatch locally
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-sync-alert', { detail: announcement }));
      window.dispatchEvent(new CustomEvent('admin-announcement-updated', { detail: announcement }));
    }

    // 4. Send native notification if user is on APK
    if (announcement.active && Capacitor.isNativePlatform()) {
      await this.triggerNativeNotification(
        announcement.title || 'تنبيه من إدارة التطبيق 👑',
        announcement.message
      );
    }
  }

  /**
   * Broadcast version configuration update across Web and APK uniformly
   */
  public static async broadcastVersionUpdate(config: AppVersionConfig): Promise<void> {
    await AdminService.publishVersionConfig(config);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'VERSION_CONFIG_PUBLISHED',
        payload: config
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-update-available', {
        detail: { version: config.latestVersion, details: config }
      }));
    }

    if (Capacitor.isNativePlatform()) {
      await this.triggerNativeNotification(
        `تحديث جديد معتمد من الإدارة (v${config.latestVersion}) 🚀`,
        config.releaseNotes || 'تم نشر تحديث جديد لتطبيق أنيس القلوب.'
      );
    }
  }

  /**
   * Trigger native Android status-bar notification for APK users
   */
  public static async triggerNativeNotification(title: string, body: string): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // On Web, try HTML5 Notifications if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icons/icon-192.png' });
          return true;
        }
        return false;
      }

      // On Android APK, use Capacitor LocalNotifications
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return false;
      }

      const notifId = Math.floor(Date.now() % 1000000);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_name',
            channelId: 'appsync_general_channel'
          }
        ]
      });
      return true;
    } catch (e) {
      console.warn('[AppSync] Error triggering native notification:', e);
      return false;
    }
  }

  /**
   * Listen for updates
   */
  public static subscribeToUpdates(listener: AppSyncUpdateListener): () => void {
    this.init();
    this.updateListeners.add(listener);
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  /**
   * Listen for announcements / alerts
   */
  public static subscribeToAlerts(listener: AppSyncAlertListener): () => void {
    this.init();
    this.alertListeners.add(listener);

    // Initial value from AdminService
    const unsubscribeAdmin = AdminService.subscribeToAnnouncement((ann) => {
      listener(ann as unknown as AppSyncAlertPayload);
    });

    return () => {
      this.alertListeners.delete(listener);
      unsubscribeAdmin();
    };
  }

  /**
   * Apply hot in-app update
   */
  public static async applyInAppHotUpdate(onProgress?: (progress: number, text: string) => void): Promise<boolean> {
    return AppUpdateService.applyInAppHotUpdate(onProgress);
  }

  /**
   * Download APK directly
   */
  public static downloadApk(customUrl?: string): void {
    const url = customUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`;
    AppUpdateService.downloadApk(url);
  }

  /**
   * Reload app cleanly
   */
  public static reloadApp(): void {
    AppUpdateService.reloadApp();
  }

  // --- Internal Handlers ---

  private static bindAdminSyncListeners(): void {
    // 1. Subscribe to version changes in Supabase
    AdminService.subscribeToVersionConfig((versionConfig) => {
      if (!versionConfig?.latestVersion) return;
      const currentVer = this.getCurrentVersion();
      const isNewer = this.isNewer(currentVer, versionConfig.latestVersion);

      if (isNewer || versionConfig.forceUpdate) {
        const updateResult: AppSyncCheckResult = {
          hasUpdate: true,
          isHotUpdate: true,
          isApkUpdate: true,
          currentVersion: currentVer,
          remoteVersion: versionConfig.latestVersion,
          sourceDomain: 'admin_realtime',
          data: {
            version: versionConfig.latestVersion,
            title: `تحديث جديد متوفر للتطبيق (v${versionConfig.latestVersion})`,
            releaseNotes: versionConfig.releaseNotes,
            downloadUrl: versionConfig.apkDownloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
            updateUrl: versionConfig.apkDownloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
            timestamp: versionConfig.updatedAt ? new Date(versionConfig.updatedAt).getTime() : Date.now()
          },
          checkedAt: Date.now()
        };

        this.dispatchUpdateSignal(updateResult);
        this.notifyUpdateListeners(updateResult);
      }
    });

    // 2. Subscribe to announcements in Supabase
    AdminService.subscribeToAnnouncement((ann) => {
      if (ann && ann.active) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app-sync-alert', { detail: ann }));
        }
        this.alertListeners.forEach((l) => {
          try {
            l(ann as unknown as AppSyncAlertPayload);
          } catch {}
        });
      }
    });
  }

  private static handleBroadcastMessage(message: any): void {
    if (!message || !message.type) return;

    if (message.type === 'UPDATE_AVAILABLE' && message.payload) {
      this.notifyUpdateListeners(message.payload);
    } else if (message.type === 'ANNOUNCEMENT_DISPATCHED' && message.payload) {
      this.alertListeners.forEach((l) => {
        try {
          l(message.payload);
        } catch {}
      });
    }
  }

  private static notifyUpdateListeners(result: AppSyncCheckResult): void {
    this.updateListeners.forEach((listener) => {
      try {
        listener(result);
      } catch (err) {
        console.error('[AppSync] Listener execution error:', err);
      }
    });
  }
}

// Auto-initialize AppSync on module load
if (typeof window !== 'undefined') {
  AppSyncService.init();
}

// Unified export aliases
export const AppSync = AppSyncService;
export default AppSyncService;
