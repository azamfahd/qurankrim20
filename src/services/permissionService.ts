/**
 * Permission Service for Android WebView, TWA/APK, and Progressive Web Applications.
 * Manages dynamic on-demand permissions for Notifications and Location
 * with an informative UI trigger flow.
 */

export type PermissionType = 'notifications' | 'location' | 'audio' | 'background';
export type PermissionStateResult = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface PermissionCheckResult {
  state: PermissionStateResult;
  isWebView: boolean;
  canRequest: boolean;
  message?: string;
}

export interface PermissionRequestOptions {
  type: PermissionType;
  title?: string;
  description?: string;
  onGrant?: () => void;
  onDeny?: () => void;
}

type PermissionListener = (options: PermissionRequestOptions) => void;

export class PermissionService {
  private static listener: PermissionListener | null = null;

  public static setModalListener(listener: PermissionListener) {
    this.listener = listener;
  }

  /**
   * Detects if running inside Android WebView / TWA / APK container
   */
  public static isAndroidWebView(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    
    // Check for Android WebView indicators (wv, Version/X.X Chrome, TWA standalone, etc.)
    const isAndroid = /Android/i.test(ua);
    const isWv = /wv|Version\/[\d.]+/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    return isAndroid && (isWv || isStandalone);
  }

  /**
   * Checks current permission status without prompting
   */
  public static async checkPermission(type: PermissionType): Promise<PermissionStateResult> {
    if (typeof window === 'undefined') return 'unsupported';

    try {
      if (type === 'notifications') {
        if (!('Notification' in window)) return 'unsupported';
        try {
          const perm = Notification.permission;
          if (perm === 'granted') return 'granted';
          if (perm === 'denied') return 'denied';
          return 'prompt';
        } catch {
          return 'prompt';
        }
      }

      if (type === 'location') {
        if (!('geolocation' in navigator)) return 'unsupported';
        if ('permissions' in navigator && navigator.permissions?.query) {
          try {
            const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            return status.state as PermissionStateResult;
          } catch {
            return 'prompt';
          }
        }
        return 'prompt';
      }

      if (type === 'audio' || type === 'background') {
        return 'granted';
      }
    } catch (err) {
      console.warn(`Permission check notice for ${type}:`, err);
      return 'prompt';
    }

    return 'unsupported';
  }

  /**
   * Directly triggers the system permission dialog for notifications or location
   * with support for modern Promise APIs & legacy Callback-based Android WebViews
   */
  public static async requestSystemPermission(type: PermissionType): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (type === 'notifications') {
      if (!('Notification' in window)) return true; // Audio still works
      
      // If already granted, return true immediately
      try {
        if (Notification.permission === 'granted') return true;
      } catch {}

      try {
        const status = await new Promise<string>((resolve) => {
          let isResolved = false;
          try {
            const returnedPromise = Notification.requestPermission((permissionResult) => {
              if (!isResolved) {
                isResolved = true;
                resolve(permissionResult || Notification.permission);
              }
            });

            if (returnedPromise && typeof returnedPromise.then === 'function') {
              returnedPromise.then((p) => {
                if (!isResolved) {
                  isResolved = true;
                  resolve(p || Notification.permission);
                }
              }).catch(() => {
                if (!isResolved) {
                  isResolved = true;
                  resolve(Notification.permission);
                }
              });
            }
          } catch {
            if (!isResolved) {
              isResolved = true;
              resolve(Notification.permission);
            }
          }

          // Safety timeout in case browser does not call callback
          setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              resolve(Notification.permission);
            }
          }, 3000);
        });

        return status === 'granted' || Notification.permission === 'granted';
      } catch (err) {
        console.warn('Notification permission request notice:', err);
        return Notification.permission === 'granted';
      }
    }

    if (type === 'location') {
      if (!('geolocation' in navigator)) return false;
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (err) => {
            console.warn('Geolocation permission request notice:', err);
            resolve(false);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    return true;
  }

  /**
   * Helper to determine whether the app needs to show a custom rationale modal
   * before triggering native Android WebView / browser prompt
   */
  public static async requestDynamicPermission(type: PermissionType): Promise<boolean> {
    const current = await this.checkPermission(type);

    if (current === 'granted') {
      return true;
    }

    // Attempt direct native system request first for seamless automatic experience
    try {
      const granted = await this.requestSystemPermission(type);
      
      // Force bypass the custom UI modal for notifications, audio, and background 
      // but return the REAL granted state so the app knows if native notifications work.
      if (type === 'notifications' || type === 'audio' || type === 'background') {
        return granted;
      }
      
      if (granted) return true;
    } catch {}

    // Only show informative modal if not yet granted and listener is available
    if (this.listener) {
      return new Promise<boolean>((resolve) => {
        const titles: Record<PermissionType, string> = {
          notifications: 'تفعيل إشعارات وتنبيهات الأذان والأذكار',
          location: 'تحديد الموقع لمواقيت الصلاة',
          audio: 'تشغيل الصوت والتلاوات',
          background: 'السماح بالعمل في الخلفية'
        };

        const descriptions: Record<PermissionType, string> = {
          notifications: 'لتشغيل إشعارات الأذان والأذكار تلقائياً في الخلفية وعلى شاشة القفل دون الحاجة لفتح التطبيق.',
          location: 'نستخدم الموقع الجغرافي لحساب مواقيت الصلاة الدقيقة لمدينتك وتحديد اتجاه القبلة الشريفة.',
          audio: 'للسماح بتشغيل التلاوات القرآنية وصوت المؤذن.',
          background: 'نحتاج صلاحية العمل في الخلفية لضمان رفع الأذان حتى عندما تكون الشاشة مقفلة.'
        };

        this.listener!({
          type,
          title: titles[type],
          description: descriptions[type],
          onGrant: async () => {
            const granted = await this.requestSystemPermission(type);
            resolve(granted);
          },
          onDeny: () => {
            resolve(false);
          }
        });
      });
    }

    // Fallback: direct system request if no UI listener is registered
    const granted = await this.requestSystemPermission(type);
    return granted;
  }
}

/**
 * Convenience standalone function
 */
export const requestDynamicPermission = PermissionService.requestDynamicPermission.bind(PermissionService);
