// Centralized configuration and helpers for external APK downloading
const DEFAULT_FALLBACK_APK_URL = '/app-release.apk';

/**
 * Gets the configured APK download URL.
 * Priority order:
 * 1. Saved custom URL in localStorage ('anis_custom_apk_url')
 * 2. Environment variable VITE_APK_DOWNLOAD_URL (e.g., set in Netlify dashboard)
 * 3. Default fallback local path
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
 * Sets a custom external APK download URL (e.g. from GitHub Releases, Firebase Storage, etc.)
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
  version: string = '1.1.0'
): void {
  const apkUrl = getApkDownloadUrl();
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('anis_apk_installed_version', version);
    localStorage.setItem('anis_pwa_installed', 'true');

    if (apkUrl.startsWith('http://') || apkUrl.startsWith('https://')) {
      // External link (GitHub Releases, Firebase Storage, Google Drive, Direct CDN)
      window.open(apkUrl, '_blank', 'noopener,noreferrer');
      if (onShowToast) {
        onShowToast(`جاري فتح رابط التحميل الخارجي لملف الـ APK (الإصدار ${version})...`, 'success');
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
        onShowToast(`جاري بدء تحميل ملف الـ APK المباشر (الإصدار ${version})...`, 'success');
      }
    }
  }
}
