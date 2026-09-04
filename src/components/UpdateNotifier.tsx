import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ApkUpdateBanner } from './ApkUpdateBanner';

export const UpdateNotifier: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean;
    version?: string;
    updateUrl?: string;
    releaseNotes?: string;
  }>({ available: false });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      // Check updates ONLY on Native Android APK to avoid interfering with PWA updates
      // Allow testing on web if needed by removing the capacitor check temporarily, but let's keep it safe.
      if (!Capacitor.isNativePlatform()) return;

      try {
        const timestamp = Date.now();
        // Fetch the remote version.json to see if there's a newer APK published
        const response = await fetch(`https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app/version.json?t=${timestamp}`);
        if (response.ok) {
          const data = await response.json();
          const remoteVersion = data.version;
          
          if (remoteVersion && isNewerVersion(__APP_VERSION__, remoteVersion)) {
            setUpdateInfo({
              available: true,
              version: remoteVersion,
              updateUrl: data.updateUrl,
              releaseNotes: data.releaseNotes
            });
          }
        }
      } catch (err) {
        console.warn('Update check failed:', err);
      }
    };

    // Delay check slightly to not block initial app render
    setTimeout(checkForUpdates, 3000);
  }, []);

  const isNewerVersion = (local: string, remote: string) => {
    const lParts = local.split('.').map(Number);
    const rParts = remote.split('.').map(Number);
    for (let i = 0; i < Math.max(lParts.length, rParts.length); i++) {
      const l = lParts[i] || 0;
      const r = rParts[i] || 0;
      if (r > l) return true;
      if (l > r) return false;
    }
    return false;
  };

  return (
    <ApkUpdateBanner
      isOpen={updateInfo.available && !isDismissed}
      versionInfo={{
        version: updateInfo.version || '',
        releaseNotes: updateInfo.releaseNotes
      }}
      onUpdate={() => {
        setIsDismissed(true);
        if (updateInfo.updateUrl) {
          window.open(updateInfo.updateUrl, '_blank');
        } else {
          const link = document.createElement('a');
          link.href = '/app-release.apk';
          link.download = 'أنيس القلوب - القرآن الذكي.apk';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }}
      onDismiss={() => setIsDismissed(true)}
    />
  );
};
