/**
 * In-App Smart Update Service for Anis Al-Qulub
 * Supports both Live OTA Hot Updates (Features & UI without re-downloading APK)
 * and Full APK Direct Downloads.
 */

import { Capacitor } from '@capacitor/core';

export interface AppVersionInfo {
  version: string;
  versionCode?: number;
  releaseDate?: string;
  updateType?: 'hot' | 'apk' | 'both' | 'smart';
  title?: string;
  releaseNotes?: string;
  features?: string[];
  updateUrl?: string;
  apkSize?: string;
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
   * Fetch the latest version info from available endpoints
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
          const data: AppVersionInfo = await res.json();
          if (data && data.version) {
            return data;
          }
        }
      } catch (err) {
        // Continue to fallback endpoint
      }
    }
    return null;
  }

  /**
   * Complete check comparing current installed version with remote version.json
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
      isApkUpdate: isNative || Boolean(remoteInfo.updateUrl),
      currentVersion: currentVer,
      remoteVersion: remoteInfo.version,
      details: remoteInfo
    };
  }

  /**
   * Performs Live In-App Hot Update (Over The Air):
   * Synchronizes assets, clears outdated caches, fetches the latest app bundle
   * without re-downloading or reinstalling the APK!
   */
  public static async applyInAppHotUpdate(
    onProgress?: (progress: number, statusText: string) => void
  ): Promise<boolean> {
    try {
      onProgress?.(15, 'الاتصال بالخادم وجلب قائمة الميزات والتحسينات...');

      // 1. Fetch latest build-assets.json if available
      try {
        const manifestRes = await fetch(`/build-assets.json?t=${Date.now()}`, { cache: 'no-store' });
        if (manifestRes.ok) {
          const assets = await manifestRes.json();
          if (Array.isArray(assets) && assets.length > 0) {
            onProgress?.(40, 'تحديث الموارد البرمجية وحزم الميزات...');
            // Preload critical JS/CSS assets safely in the background
            const criticalAssets = assets.filter(a => typeof a === 'string' && (a.endsWith('.js') || a.endsWith('.css'))).slice(0, 15);
            let loaded = 0;
            await Promise.allSettled(
              criticalAssets.map(async (assetUrl) => {
                try {
                  await fetch(assetUrl, { cache: 'no-cache' });
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
   * Direct APK Download & Install
   * Initiates browser download or system package installer for full APK
   */
  public static downloadApk(customUrl?: string): void {
    const targetUrl = customUrl || 'https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app/app-release.apk';
    try {
      // In native Capacitor or external browsers, trigger external download
      window.open(targetUrl, '_system');
    } catch {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = 'anis-al-qulub.apk';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
