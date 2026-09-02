import { Capacitor } from '@capacitor/core';

export type EnvironmentType = 'native_apk' | 'pwa' | 'web_browser';

export interface PlatformEnvironmentInfo {
  type: EnvironmentType;
  isNativeAPK: boolean;
  isPWA: boolean;
  isBrowser: boolean;
  nameAr: string;
  descriptionAr: string;
  backgroundCapabilities: {
    nativeNotifications: boolean;
    nativeSoundChannel: boolean;
    backgroundAudioAllowed: boolean;
    requiresKeepAlive: boolean;
    requiresBatteryExemption: boolean;
  };
}

export class PlatformEnvironmentService {
  /**
   * Identifies the current environment (Native APK, Standalone PWA, or standard Web Browser)
   */
  public static getEnvironmentInfo(): PlatformEnvironmentInfo {
    if (typeof window === 'undefined') {
      return {
        type: 'web_browser',
        isNativeAPK: false,
        isPWA: false,
        isBrowser: true,
        nameAr: 'متصفح الويب',
        descriptionAr: 'يعمل داخل المتصفح القياسي',
        backgroundCapabilities: {
          nativeNotifications: false,
          nativeSoundChannel: false,
          backgroundAudioAllowed: false,
          requiresKeepAlive: true,
          requiresBatteryExemption: false,
        }
      };
    }

    const isNativeAPK = Capacitor.isNativePlatform();

    const isPWA = !isNativeAPK && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );

    const isBrowser = !isNativeAPK && !isPWA;

    if (isNativeAPK) {
      return {
        type: 'native_apk',
        isNativeAPK: true,
        isPWA: false,
        isBrowser: false,
        nameAr: 'تطبيق أندرويد مستقل (APK)',
        descriptionAr: 'تطبيق أندرويد محلي يعمل بنظام الإشعارات المباشرة والقنوات الصوتية للنظام',
        backgroundCapabilities: {
          nativeNotifications: true,
          nativeSoundChannel: true,
          backgroundAudioAllowed: true,
          requiresKeepAlive: false,
          requiresBatteryExemption: true
        }
      };
    }

    if (isPWA) {
      return {
        type: 'pwa',
        isNativeAPK: false,
        isPWA: true,
        isBrowser: false,
        nameAr: 'تطبيق الويب المثبت (PWA)',
        descriptionAr: 'تطبيق ويب مثبت على الهاتف يعمل عبر Service Worker مع التنبيهات المباشرة',
        backgroundCapabilities: {
          nativeNotifications: false,
          nativeSoundChannel: false,
          backgroundAudioAllowed: false,
          requiresKeepAlive: true,
          requiresBatteryExemption: true
        }
      };
    }

    return {
      type: 'web_browser',
      isNativeAPK: false,
      isPWA: false,
      isBrowser: true,
      nameAr: 'متصفح الويب (Browser)',
      descriptionAr: 'صفحة ويب داخل متصفح الإنترنت تجري معالجتها وفق قيود التشغيل التلقائي للمتصفحات',
      backgroundCapabilities: {
        nativeNotifications: false,
        nativeSoundChannel: false,
        backgroundAudioAllowed: false,
        requiresKeepAlive: true,
        requiresBatteryExemption: false
      }
    };
  }
}
