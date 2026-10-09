import React, { useState, useEffect, useCallback } from 'react';
import { AppUpdateService, UpdateCheckResult, AppVersionInfo, PUBLISHED_DOMAIN_URL } from '../services/appUpdateService';
import { AdminService, AppVersionConfig } from '../services/adminService';
import { AppSync, PRIMARY_DOMAIN_URL } from '../services/appSyncService';
import { InAppUpdateModal } from './InAppUpdateModal';

interface UpdateNotifierProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const UpdateNotifier: React.FC<UpdateNotifierProps> = ({ onShowToast }) => {
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualCheck = useCallback(async () => {
    onShowToast?.('جاري فحص التحديثات من الخادم الرسمي (qurankrim20.netlify.app)... 🔍', 'info');
    try {
      const syncResult = await AppSync.checkForUpdates(true);
      if (syncResult.hasUpdate && syncResult.data) {
        const details: AppVersionInfo = {
          version: syncResult.remoteVersion,
          versionCode: syncResult.data.versionCode || 1,
          releaseDate: syncResult.data.apkUpdated ? syncResult.data.apkUpdated.split('T')[0] : new Date().toISOString().split('T')[0],
          updateType: syncResult.data.updateType || 'smart',
          title: syncResult.data.title || `تحديث جديد متوفر للتطبيق (v${syncResult.remoteVersion})`,
          releaseNotes: syncResult.data.releaseNotes || 'تحديث تراكمي يتضمن تحسينات في الأداء والتنبيهات وإصلاحات مستمرة.',
          features: syncResult.data.features || [
            'مزامنة فورية ودائمة بين تطبيق الهاتف والموقع الرسمي (qurankrim20.netlify.app)',
            'استقرار عالي في الأداء ودقة متناهية للبوصلة والتنبيهات'
          ],
          updateUrl: syncResult.data.updateUrl || syncResult.data.downloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
          downloadUrl: syncResult.data.downloadUrl || syncResult.data.updateUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
          apkSize: syncResult.data.apkSize || '20 MB',
          sizeFormatted: syncResult.data.sizeFormatted || '20 MB • تحميل وتثبيت مباشر',
          timestamp: syncResult.data.timestamp || Date.now()
        };

        const result: UpdateCheckResult = {
          hasUpdate: true,
          isHotUpdate: syncResult.isHotUpdate,
          isApkUpdate: syncResult.isApkUpdate,
          currentVersion: syncResult.currentVersion,
          remoteVersion: syncResult.remoteVersion,
          details
        };

        setUpdateResult(result);
        setIsModalOpen(true);
        onShowToast?.(`تم العثور على تحديث جديد (v${result.remoteVersion})! 🎉`, 'success');
      } else {
        onShowToast?.(`أنت تستخدم أحدث إصدار متاح (v${syncResult.currentVersion}) ✨`, 'success');
      }
    } catch (err) {
      onShowToast?.('تعذر الاتصال بخادم التحديثات حالياً، يرجى التحقق من اتصال الإنترنت.', 'error');
    }
  }, [onShowToast]);

  // 1. Initial background check and real-time subscription via AppSync
  useEffect(() => {
    const unsubscribeSync = AppSync.subscribeToUpdates((syncResult) => {
      if (syncResult.hasUpdate && syncResult.data) {
        const details: AppVersionInfo = {
          version: syncResult.remoteVersion,
          versionCode: syncResult.data.versionCode || 1,
          releaseDate: syncResult.data.apkUpdated ? syncResult.data.apkUpdated.split('T')[0] : new Date().toISOString().split('T')[0],
          updateType: syncResult.data.updateType || 'smart',
          title: syncResult.data.title || `تحديث جديد متوفر للتطبيق (v${syncResult.remoteVersion})`,
          releaseNotes: syncResult.data.releaseNotes || 'تحديث تراكمي يتضمن تحسينات في الأداء والتنبيهات وإصلاحات مستمرة.',
          features: syncResult.data.features || [
            'مزامنة فورية كاملة بين تطبيق الهاتف والموقع الرسمي',
            'استقرار عالي بدون أي فقدان للبيانات والمصاحف المحملة'
          ],
          updateUrl: syncResult.data.updateUrl || syncResult.data.downloadUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
          downloadUrl: syncResult.data.downloadUrl || syncResult.data.updateUrl || `${PRIMARY_DOMAIN_URL}/app-release.apk`,
          apkSize: syncResult.data.apkSize || '20 MB',
          sizeFormatted: syncResult.data.sizeFormatted || '20 MB • تحميل وتثبيت مباشر',
          timestamp: syncResult.data.timestamp || Date.now()
        };

        setUpdateResult({
          hasUpdate: true,
          isHotUpdate: syncResult.isHotUpdate,
          isApkUpdate: syncResult.isApkUpdate,
          currentVersion: syncResult.currentVersion,
          remoteVersion: syncResult.remoteVersion,
          details
        });
        setIsModalOpen(true);
      }
    });

    return () => unsubscribeSync();
  }, []);

  // 2. Real-time listener for owner updates from Supabase (instantly reaches APK & Web)
  useEffect(() => {
    const unsubscribe = AdminService.subscribeToVersionConfig((versionConfig: AppVersionConfig | null) => {
      if (!versionConfig || !versionConfig.latestVersion) return;

      const currentVer = AppUpdateService.getCurrentVersion();
      const isNewer = AppUpdateService.isNewer(currentVer, versionConfig.latestVersion);

      if (isNewer || versionConfig.forceUpdate) {
        const details: AppVersionInfo = {
          version: versionConfig.latestVersion,
          versionCode: 2,
          releaseDate: versionConfig.updatedAt ? versionConfig.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          updateType: versionConfig.forceUpdate ? 'both' : 'smart',
          title: `تحديث جديد متوفر للتطبيق (v${versionConfig.latestVersion})`,
          releaseNotes: versionConfig.releaseNotes || 'تم إصدار تحديث جديد يتضمن تحسينات فورية للأداء والتنبيهات.',
          features: [
            'مزامنة فورية كاملة بين تطبيق الهاتف والموقع الرسمي',
            'تحسين دقة البوصلة وأوقات الصلاة والتنبيهات',
            'استقرار عالي بدون أي فقدان للبيانات والمصاحف المحملة'
          ],
          updateUrl: versionConfig.apkDownloadUrl || `${PUBLISHED_DOMAIN_URL}/app-release.apk`,
          downloadUrl: versionConfig.apkDownloadUrl || `${PUBLISHED_DOMAIN_URL}/app-release.apk`,
          apkSize: '20 MB',
          sizeFormatted: '20 MB • تحميل وتثبيت مباشر',
          timestamp: versionConfig.updatedAt ? new Date(versionConfig.updatedAt).getTime() : Date.now()
        };

        setUpdateResult({
          hasUpdate: true,
          isHotUpdate: true,
          isApkUpdate: true,
          currentVersion: currentVer,
          remoteVersion: versionConfig.latestVersion,
          details
        });
        setIsModalOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Listen to manual update check trigger from any component (e.g., Sidebar or About)
  useEffect(() => {
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
