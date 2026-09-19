import React, { useState, useEffect, useCallback } from 'react';
import { AppUpdateService, UpdateCheckResult } from '../services/appUpdateService';
import { InAppUpdateModal } from './InAppUpdateModal';

interface UpdateNotifierProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const UpdateNotifier: React.FC<UpdateNotifierProps> = ({ onShowToast }) => {
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualCheck = useCallback(async () => {
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
  }, [onShowToast]);

  useEffect(() => {
    // Listen to manual update check trigger from any component (e.g., Sidebar or About)
    window.addEventListener('check-for-app-updates', handleManualCheck);

    return () => {
      window.removeEventListener('check-for-app-updates', handleManualCheck);
    };
  }, [handleManualCheck]);

  if (!updateResult || !updateResult.details) {
    return null;
  }

  return (
    <InAppUpdateModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      updateInfo={updateResult.details}
      currentVersion={updateResult.currentVersion}
      onShowToast={onShowToast}
    />
  );
};
