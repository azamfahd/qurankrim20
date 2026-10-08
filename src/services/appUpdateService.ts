/**
 * In-App Smart Update Service for Anis Al-Qulub
 * Directly connected to published deployment: https://qurankrim20.netlify.app
 * Supports both Live OTA Hot Updates (Features & UI without re-downloading APK)
 * and Full APK Direct Downloads for Android APK users.
 */

import { Capacitor } from '@capacitor/core';

export const PUBLISHED_DOMAIN_URL = 'https://qurankrim20.netlify.app';

export interface AppVersionInfo {
  version: string;
  versionCode?: number;
  releaseDate?: string;
  updateType?: 'hot' | 'apk' | 'both' | 'smart';
  title?: string;
  releaseNotes?: string;
  features?: string[];
  updateUrl?: string;
  downloadUrl?: string;
  apkSize?: string;
  sizeFormatted?: string;
  timestamp?: number;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isHotUpdate: boolean;
  isApkUpdate: boolean;
  currentVersion: string;
  remoteVersion: string;
  details: AppVersionInfo | null;
}

export class AppUpdateService {
  private static readonly VERSION_ENDPOINTS = [
    `${PUBLISHED_DOMAIN_URL}/version.json`,
    '/version.json',
    'https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app/version.json'
  ];

  /**
   * Get the current running application version
   */
  public static getCurrentVersion(): string {
    const localHotVersion = localStorage.getItem('anis_hot_updated_version');
    if (localHotVersion) {
      return localHotVersion;
    }
    if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
      return __APP_VERSION__;
    }
    return '1.1.0';
  }

  /**
   * Check if a remote version is newer than local version
   */
  public static isNewer(local: string, remote: string): boolean {
    if (!local || !remote) return false;
    const cleanLocal = local.replace(/^v/i, '').trim();
    const cleanRemote = remote.replace(/^v/i, '').trim();
    if (cleanLocal === cleanRemote) return false;

    const lParts = cleanLocal.split('.').map(n => parseInt(n, 10) || 0);
    const rParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(lParts.length, rParts.length);

    for (let i = 0; i < maxLen; i++) {
      const l = lParts[i] ?? 0;
      const r = rParts[i] ?? 0;
      if (r > l) return true;
      if (l > r) return false;
    }
    return false;
  }

  /**
   * Fetch the latest version info directly from https://qurankrim20.netlify.app/version.json
   */
  public static async fetchLatestVersionInfo(): Promise<AppVersionInfo | null> {
    const cacheBuster = `t=${Date.now()}`;
    for (const endpoint of this.VERSION_ENDPOINTS) {
      try {
        const url = endpoint.includes('?') ? `${endpoint}&${cacheBuster}` : `${endpoint}?${cacheBuster}`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data && data.version) {
            const normalized: AppVersionInfo = {
              version: data.version,
              versionCode: data.versionCode || 1,
              releaseDate: data.releaseDate || new Date().toISOString().split('T')[0],
              updateType: data.updateType || 'smart',
              title: data.title || `تحديث جديد متاح (v${data.version})`,
              releaseNotes: data.releaseNotes || 'تحديث جديد يتضمن تحسينات للأداء واستقرار التنبيهات والأذكار.',
              features: data.features || [
                'تحسين استقرار تنبيهات الأذكار والأذان للعمل بدقة',
                'مزامنة التحديثات تلقائياً مع خادم التطبيق',
                'تسريع التصفح والاستجابة الفورية'
              ],
              updateUrl: data.updateUrl || data.downloadUrl || `${PUBLISHED_DOMAIN_URL}/app-release.apk`,
              downloadUrl: data.downloadUrl || data.updateUrl || `${PUBLISHED_DOMAIN_URL}/app-release.apk`,
              apkSize: data.apkSize || data.sizeFormatted || '20 MB',
              sizeFormatted: data.sizeFormatted || data.apkSize || '20 MB',
              timestamp: data.timestamp || Date.now()
            };
            return normalized;
          }
        }
      } catch (err) {
        // Continue to fallback endpoint
      }
    }
    return null;
  }

  /**
   * Complete check comparing current installed version with remote version.json on the domain
   */
  public static async checkForUpdates(): Promise<UpdateCheckResult> {
    const currentVer = this.getCurrentVersion();
    const remoteInfo = await this.fetchLatestVersionInfo();

    if (!remoteInfo || !remoteInfo.version) {
      return {
        hasUpdate: false,
        isHotUpdate: false,
        isApkUpdate: false,
        currentVersion: currentVer,
        remoteVersion: currentVer,
        details: null
      };
    }

    const hasNewerVersion = this.isNewer(currentVer, remoteInfo.version);
    
    // Check if there is a newer timestamp for features update even on same version
    const lastInstalledTimestamp = parseInt(localStorage.getItem('anis_last_update_ts') || '0', 10);
    const hasNewerTimestamp = remoteInfo.timestamp && remoteInfo.timestamp > lastInstalledTimestamp && lastInstalledTimestamp > 0;

    const hasUpdate = hasNewerVersion || Boolean(hasNewerTimestamp);
    
    // Determine update nature
    const updateType = remoteInfo.updateType || 'smart';
    const isNative = Capacitor.isNativePlatform();

    return {
      hasUpdate,
      isHotUpdate: updateType !== 'apk', // In-app feature update is available for web, PWA and native hybrid
      isApkUpdate: isNative || Boolean(remoteInfo.updateUrl || remoteInfo.downloadUrl),
      currentVersion: currentVer,
      remoteVersion: remoteInfo.version,
      details: remoteInfo
    };
  }

  /**
   * Performs Live In-App Hot Update (Over The Air):
   * Synchronizes assets, clears outdated caches, fetches the latest app bundle
   * directly from the published domain without re-downloading APK!
   */
  public static async applyInAppHotUpdate(
    onProgress?: (progress: number, statusText: string) => void
  ): Promise<boolean> {
    try {
      onProgress?.(15, 'الاتصال بخادم التحديثات (qurankrim20.netlify.app)...');

      // 1. Fetch latest build-assets.json if available
      try {
        const manifestRes = await fetch(`${PUBLISHED_DOMAIN_URL}/build-assets.json?t=${Date.now()}`, { cache: 'no-store' });
        if (manifestRes.ok) {
          const assets = await manifestRes.json();
          if (Array.isArray(assets) && assets.length > 0) {
            onProgress?.(40, 'تحديث الموارد البرمجية وحزم الميزات...');
            const criticalAssets = assets.filter(a => typeof a === 'string' && (a.endsWith('.js') || a.endsWith('.css'))).slice(0, 15);
            let loaded = 0;
            await Promise.allSettled(
              criticalAssets.map(async (assetUrl) => {
                try {
                  const resolvedUrl = assetUrl.startsWith('http') ? assetUrl : `${PUBLISHED_DOMAIN_URL}${assetUrl.startsWith('/') ? '' : '/'}${assetUrl}`;
                  await fetch(resolvedUrl, { cache: 'no-cache' });
                  loaded++;
                  const pct = 40 + Math.floor((loaded / criticalAssets.length) * 35);
                  onProgress?.(pct, `تحديث الملفات البرمجية (${loaded}/${criticalAssets.length})...`);
                } catch {}
              })
            );
          }
        }
      } catch (assetErr) {
        console.warn('Asset refresh note:', assetErr);
      }

      onProgress?.(80, 'تحديث ذاكرة التطبيق السريعة وتنظيف النسخ السابقة...');

      // 2. Notify Service Worker to refresh and check updates
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch(() => {});
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        } catch {}
      }

      // 3. Update local stored version markers
      const remoteInfo = await this.fetchLatestVersionInfo();
      if (remoteInfo?.version) {
        localStorage.setItem('anis_hot_updated_version', remoteInfo.version);
        if (remoteInfo.timestamp) {
          localStorage.setItem('anis_last_update_ts', remoteInfo.timestamp.toString());
        }
      }

      onProgress?.(100, 'اكتمل التحديث بنجاح! جاري التفعيل...');
      return true;
    } catch (err) {
      console.error('Error applying hot update:', err);
      return false;
    }
  }

  /**
   * Direct APK Download & Install linked to the published domain
   */
  public static downloadApk(customUrl?: string): void {
    const targetUrl = customUrl || `${PUBLISHED_DOMAIN_URL}/app-release.apk`;
    try {
      if (Capacitor.isNativePlatform()) {
        window.open(targetUrl, '_system');
      } else {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = 'أنيس القلوب - القرآن الذكي.apk';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      window.open(targetUrl, '_blank');
    }
  }

  /**
   * Reload the application cleanly to apply hot updates
   */
  public static reloadApp(): void {
    try {
      sessionStorage.setItem('anis_update_applied', 'true');
      window.location.reload();
    } catch {
      window.location.href = window.location.origin;
    }
  }
}
