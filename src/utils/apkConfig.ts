// Centralized configuration and helpers for external APK downloading
export const APP_VERSION = "1.1.0";

export const GITHUB_RELEASE_APK_URL = 'https://github.com/azamfahd/qurankrim20/releases/download/latest/app-release.apk';
export const NETLIFY_MIRROR_APK_URL = 'https://qurankrim20.netlify.app/app-release.apk';

const DEFAULT_FALLBACK_APK_URL = GITHUB_RELEASE_APK_URL;

/**
 * Gets the configured APK download URL.
 * Priority order:
 * 1. Saved custom URL in localStorage ('anis_custom_apk_url')
 * 2. Environment variable VITE_APK_DOWNLOAD_URL (e.g., set in Netlify dashboard)
 * 3. Official GitHub Releases Latest APK download URL
 */
export function getApkDownloadUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('anis_custom_apk_url');
    if (customUrl && customUrl.trim().length > 0) {
      return customUrl.trim();
    }
  }

  const envUrl = import.meta.env.VITE_APK_DOWNLOAD_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  return DEFAULT_FALLBACK_APK_URL;
}

/**
 * Sets a custom external APK download URL (e.g. from GitHub Releases, Netlify CDN, etc.)
 */
export function setCustomApkUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim().length > 0) {
      localStorage.setItem('anis_custom_apk_url', url.trim());
    } else {
      localStorage.removeItem('anis_custom_apk_url');
    }
  }
}

/**
 * Triggers the download or opens the external link for the APK file.
 */
export function triggerApkDownload(
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void,
  version: string = '1.1.0',
  overrideUrl?: string
): void {
  const apkUrl = (overrideUrl && overrideUrl.trim().length > 0) ? overrideUrl.trim() : getApkDownloadUrl();
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('anis_apk_installed_version', version);
    localStorage.setItem('anis_pwa_installed', 'true');

    if (apkUrl.startsWith('http://') || apkUrl.startsWith('https://')) {
      // External link (GitHub Releases, Netlify CDN, Mirror)
      window.open(apkUrl, '_blank', 'noopener,noreferrer');
      if (onShowToast) {
        onShowToast(`جاري فتح رابط تحميل حزمة الـ APK المعتمدة (v${version})...`, 'success');
      }
    } else {
      // Local path download
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = `أنيس القلوب - القرآن الذكي ${version}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onShowToast) {
        onShowToast(`جاري بدء تحميل ملف الـ APK المباشر (v${version})...`, 'success');
      }
    }
  }
}
