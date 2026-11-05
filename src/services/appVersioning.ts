import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Reads Android's installed versionCode from the native package metadata.
 * Local-storage markers are intentionally not used: they can be written before
 * the user actually installs a downloaded APK.
 */
export async function getInstalledBuildNumber(): Promise<number | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const appInfo = await App.getInfo();
    const buildNumber = Number.parseInt(appInfo.build, 10);
    return Number.isSafeInteger(buildNumber) && buildNumber > 0 ? buildNumber : null;
  } catch (error) {
    console.warn('[AppVersioning] Could not read installed Android build number:', error);
    return null;
  }
}
