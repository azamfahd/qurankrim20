import React, { useState, useEffect, useCallback } from 'react';
import { AppUpdateService, AppVersionInfo, UpdateCheckResult } from '../services/appUpdateService';
import { ApkUpdateBanner } from './ApkUpdateBanner';
import { InAppUpdateModal } from './InAppUpdateModal';

interface UpdateNotifierProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const UpdateNotifier: React.FC<UpdateNotifierProps> = ({ onShowToast }) => {
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const performCheck = useCallback(async () => {
    try {
      const result = await AppUpdateService.checkForUpdates();
      if (result.hasUpdate) {
        setUpdateResult(result);
      }
    } catch (err) {
      console.warn('Update check note:', err);
    }
  }, []);

  useEffect(() => {
    // Perform check slightly after initial launch
    const timer = setTimeout(() => {
      performCheck();
    }, 3500);

    // Listen to manual update check trigger from any component (e.g., Sidebar or About)
    const handleManualCheck = async () => {
      onShowToast?.('جاري التحقق من وجود تحديثات...', 'info');
      try {
        const result = await AppUpdateService.checkForUpdates();
        if (result.hasUpdate && result.details) {
          setUpdateResult(result);
          setIsModalOpen(true);
        } else {
          onShowToast?.(`تطبيقك محدث إلى أحدث إصدار (v${result.currentVersion}) ✨`, 'success');
        }
      } catch (err) {
        onShowToast?.('تعذر الاتصال بخادم التحديثات حالياً، يرجى المحاولة لاحقاً.', 'error');
      }
    };

    window.addEventListener('check-for-app-updates', handleManualCheck);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('check-for-app-updates', handleManualCheck);
    };
  }, [performCheck, onShowToast]);

  if (!updateResult || !updateResult.hasUpdate || !updateResult.details) {
    return null;
  }

  return (
    <>
      {/* Quick top banner if modal is not open yet */}
      <ApkUpdateBanner
        isOpen={!isBannerDismissed && !isModalOpen}
        versionInfo={{
          version: updateResult.remoteVersion,
          releaseNotes: updateResult.details.releaseNotes,
          sizeFormatted: updateResult.details.apkSize
        }}
        onUpdate={() => {
          setIsBannerDismissed(true);
          setIsModalOpen(true);
        }}
        onDismiss={() => setIsBannerDismissed(true)}
      />

      {/* Comprehensive In-App Update Modal with Hot Update & APK Download */}
      <InAppUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        updateInfo={updateResult.details}
        currentVersion={updateResult.currentVersion}
        onShowToast={onShowToast}
      />
    </>
  );
};
