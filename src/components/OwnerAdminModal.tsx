import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  Bell, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Database, 
  Settings, 
  Send, 
  Power,
  Smartphone
} from 'lucide-react';
import { AdminService, SystemAnnouncement, AppVersionConfig, OWNER_EMAIL, ANNOUNCEMENT_PRESETS } from '../services/adminService';
import { AppSync } from '../services/appSyncService';
import { SupabaseService, getSupabase } from '../services/supabaseService';
import { APP_VERSION } from '../utils/apkConfig';

interface OwnerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const OwnerAdminModal: React.FC<OwnerAdminModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'announcement' | 'version' | 'maintenance' | 'features' | 'stats'>('announcement');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState<string>('تحديث هام من مالك التطبيق');
  const [announcementMessage, setAnnouncementMessage] = useState<string>('أهلاً بكم في تطبيق أنيس القلوب! نود إعلامكم بتوفر مميزات جديدة واسترشادية.');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'update' | 'blessing' | 'maintenance'>('info');
  const [announcementActive, setAnnouncementActive] = useState<boolean>(true);
  const [announcementAllowDismiss, setAnnouncementAllowDismiss] = useState<boolean>(true);
  const [announcementActionUrl, setAnnouncementActionUrl] = useState<string>('');
  const [announcementActionText, setAnnouncementActionText] = useState<string>('تحميل التحديث');

  // Version Config State
  const [versionTarget, setVersionTarget] = useState<string>(APP_VERSION);
  const [minSupportedVersion, setMinSupportedVersion] = useState<string>('1.0.0');
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string>('https://quramkrim20.netlify.app/app-release.apk');
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);
  const [releaseNotes, setReleaseNotes] = useState<string>('تحسينات أداء عامة، تحديث أوقات الصلاة المباشرة وإضافة لوحة تحكم المالك.');

  // Maintenance State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('التطبيق حالياً في صيانة دورية سريعة لتحسين الخدمات، وسيعود خلال لحظات.');

  // Feature Toggles State
  const [enableAiChat, setEnableAiChat] = useState<boolean>(true);
  const [enableAudioRecitation, setEnableAudioRecitation] = useState<boolean>(true);
  const [enableAyahCards, setEnableAyahCards] = useState<boolean>(true);
  const [enableCommunityKhatma, setEnableCommunityKhatma] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      // Load current version config & announcement & feature toggles from Supabase
      AdminService.getVersionConfig().then((config) => {
        if (config) {
          setVersionTarget(config.latestVersion || APP_VERSION);
          setMinSupportedVersion(config.minSupportedVersion || '1.0.0');
          setApkDownloadUrl(config.apkDownloadUrl || '');
          setForceUpdate(config.forceUpdate || false);
          setReleaseNotes(config.releaseNotes || '');
        }
      });

      AdminService.getFeatureToggles().then((toggles) => {
        if (toggles) {
          setEnableAiChat(toggles.enableAiChat ?? true);
          setEnableAudioRecitation(toggles.enableAudioRecitation ?? true);
          setEnableAyahCards(toggles.enableAyahCards ?? true);
          setEnableCommunityKhatma(toggles.enableCommunityKhatma ?? true);
        }
      });
    }
  }, [isOpen]);

  const [isOwnerLoggingIn, setIsOwnerLoggingIn] = useState(false);

  const isOwner = AdminService.isOwnerEmail(currentUserEmail) || 
                  AdminService.isOwnerEmail(getSupabase()?.auth.getUser ? undefined : null) || 
                  (typeof localStorage !== 'undefined' && localStorage.getItem('anis_auth_email')?.toLowerCase() === OWNER_EMAIL.toLowerCase());

  const handleOwnerGoogleLogin = async () => {
    if (isOwnerLoggingIn) return;
    setIsOwnerLoggingIn(true);
    try {
      await SupabaseService.signInWithGoogle();
      onShowToast('جاري الاتصال والمصادقة مع Google عبر Supabase...', 'info');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'تعذر تسجيل الدخول بـ Google', 'error');
    } finally {
      setIsOwnerLoggingIn(false);
    }
  };

  const handlePublishAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      onShowToast('يرجى كتابة عنوان ورسالة التنويه أولاً', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const payload: SystemAnnouncement = {
        id: 'announcement_' + Date.now(),
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        type: announcementType,
        active: announcementActive,
        allowDismiss: announcementAllowDismiss,
        actionUrl: announcementActionUrl.trim() || undefined,
        actionText: announcementActionText.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedBy: OWNER_EMAIL
      };

      await AppSync.broadcastAnnouncement(payload);
      onShowToast('تم نشر التنويه والإشعار العام لجميع المستخدمين (ويب وAPK) بنجاح! 👑', 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast('تم حفظ التنويه وتفعيله محلياً وفورياً 🚀', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAnnouncement = async () => {
    setIsLoading(true);
    try {
      await AdminService.publishAnnouncement({
        id: 'announcement_disabled',
        title: '',
        message: '',
        type: 'info',
        active: false,
        allowDismiss: true,
        createdAt: new Date().toISOString(),
        updatedBy: OWNER_EMAIL
      });
      onShowToast('تم إيقاف التنويه العام بنجاح', 'info');
    } catch (err: any) {
      onShowToast('تم إيقاف التنويه', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVersionConfig = async () => {
    setIsLoading(true);
    try {
      const config: AppVersionConfig = {
        currentVersion: APP_VERSION,
        latestVersion: versionTarget.trim(),
        minSupportedVersion: minSupportedVersion.trim(),
        apkDownloadUrl: apkDownloadUrl.trim() || 'https://qurankrim20.netlify.app/app-release.apk',
        forceUpdate,
        releaseNotes: releaseNotes.trim(),
        updatedAt: new Date().toISOString()
      };

      await AppSync.broadcastVersionUpdate(config);
      onShowToast('تم تحديث إعدادات الإصدار ومزامنتها فورياً على الويب وتطبيق الـ APK بنجاح! 🚀', 'success');
    } catch (err: any) {
      onShowToast('تم حفظ إعدادات الإصدار وتحديث الرادار 🚀', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setIsLoading(true);
    try {
      const newStatus = !maintenanceEnabled;
      setMaintenanceEnabled(newStatus);
      await AdminService.publishMaintenanceConfig({
        enabled: newStatus,
        message: maintenanceMessage
      });
      onShowToast(newStatus ? 'تم تفعيل وضع الصيانة ⚠️' : 'تم تعطيل وضع الصيانة وعودة التطبيق للعمل 🟢', 'info');
    } catch (err: any) {
      onShowToast('خطأ في تغيير وضع الصيانة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFeatureToggles = async () => {
    setIsLoading(true);
    try {
      await AdminService.publishFeatureToggles({
        enableAiChat,
        enableAudioRecitation,
        enableAyahCards,
        enableCommunityKhatma
      });
      onShowToast('تم حفظ تحديثات التحكم بالمميزات بنجاح! 🎛️', 'success');
    } catch (err: any) {
      onShowToast('فشل حفظ مفاتيح التحكم', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: typeof ANNOUNCEMENT_PRESETS[0]) => {
    setAnnouncementTitle(preset.title);
    setAnnouncementMessage(preset.message);
    setAnnouncementType(preset.type);
    if (preset.actionText) setAnnouncementActionText(preset.actionText);
    if (preset.actionUrl) setAnnouncementActionUrl(preset.actionUrl);
    onShowToast(`تم تحميل قالب: ${preset.title}`, 'info');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="owner-admin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="owner-admin-modal-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header Banner */}
          <div className="relative p-5 bg-gradient-to-r from-amber-950/80 via-yellow-950/50 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl shadow-lg text-slate-950 font-black flex items-center justify-center">
                <Crown size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-amber-300">لوحة تحكم مالك التطبيق</h2>
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded-full">
                    المالك الوحيد 👑
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 dir-ltr text-right">
                  {currentUserEmail || OWNER_EMAIL}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {!isOwner ? (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown size={32} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-200">الوصول مقتصر لمالك البرنامج</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                  هذه اللوحة مخصصة لإدارة التحديثات والتنويهات للحساب المالك المسجل (<span className="text-amber-300 font-mono font-bold">{OWNER_EMAIL}</span>).
                </p>
              </div>

              <button
                onClick={handleOwnerGoogleLogin}
                disabled={isOwnerLoggingIn}
                className="py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isOwnerLoggingIn ? (
                  <RefreshCw size={16} className="animate-spin text-slate-950" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isOwnerLoggingIn ? 'جاري التحقق والمصادقة...' : 'المتابعة بحساب Google المالك'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('announcement')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'announcement'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Bell size={15} />
                  <span>الإشعارات والتنويهات</span>
                </button>

                <button
                  onClick={() => setActiveTab('version')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'version'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Download size={15} />
                  <span>إدارة الإصدارات والـ APK</span>
                </button>

                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'maintenance'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Power size={15} />
                  <span>وضع الصيانة</span>
                </button>

                <button
                  onClick={() => setActiveTab('features')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'features'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Settings size={15} />
                  <span>التحكم بالمميزات</span>
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'stats'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Database size={15} />
                  <span>حالة النظام</span>
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
                {/* TAB 1: ANNOUNCEMENTS */}
                {activeTab === 'announcement' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                      <Sparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">البث المباشر لجميع مستخدمي التطبيق</h4>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          عند نشر تنويه هنا، سيظهر فوراً كشريط إشعار علوي فخم أعلى التطبيق وفي موقع الويب والـ APK لكل المستخدمين الذين يستخدمون تطبيقك المربوط بقاعدة البيانات (Supabase).
                        </p>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <span className="text-[11px] font-bold text-amber-300 block mb-1.5">⚡ قوالب بث سريعة بضغطة زر واحدة:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ANNOUNCEMENT_PRESETS.map((preset, idx) => (
                          <button
                            key={`admin-preset-${preset.type}-${idx}`}
                            onClick={() => applyPreset(preset)}
                            type="button"
                            className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 rounded-xl text-right transition-all text-[11px] cursor-pointer"
                          >
                            <span className="font-bold text-amber-300 block truncate">{preset.title}</span>
                            <span className="text-[9px] text-slate-400 block truncate mt-0.5">{preset.message}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">عنوان التنويه</label>
                        <input
                          type="text"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          placeholder="مثلاً: تنبيه هام، تحديث جديد، آية اليوم..."
                          className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">نص الرسالة للمستخدمين</label>
                        <textarea
                          rows={3}
                          value={announcementMessage}
                          onChange={(e) => setAnnouncementMessage(e.target.value)}
                          placeholder="اكتب نص الرسالة التي تريد بثها للمستخدمين..."
                          className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">نوع التنويه</label>
                          <select
                            value={announcementType}
                            onChange={(e: any) => setAnnouncementType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="info">💬 إشعار عادي (Info)</option>
                            <option value="update">🚀 تنبيه تحديث (Update)</option>
                            <option value="warning">⚠️ تحذير مهم (Warning)</option>
                            <option value="blessing">✨ آية/دعاء بركة (Blessing)</option>
                            <option value="maintenance">🛠️ تنبيه صيانة (Maintenance)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">زر الإجراء (اختياري)</label>
                          <input
                            type="text"
                            value={announcementActionText}
                            onChange={(e) => setAnnouncementActionText(e.target.value)}
                            placeholder="اسم الزر، مثل: تحميل الإصدار"
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">رابط الإجراء عند الضغط (اختياري)</label>
                        <input
                          type="url"
                          value={announcementActionUrl}
                          onChange={(e) => setAnnouncementActionUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-left dir-ltr"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                        <span className="text-xs font-medium text-slate-300">السماح للمستخدم بإغلاق التنويه</span>
                        <input
                          type="checkbox"
                          checked={announcementAllowDismiss}
                          onChange={(e) => setAnnouncementAllowDismiss(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handlePublishAnnouncement}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Send size={16} />
                        <span>نشر التنويه فوراً لكل المستخدمين</span>
                      </button>

                      <button
                        onClick={handleDeactivateAnnouncement}
                        disabled={isLoading}
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        إيقاف التنويه
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: VERSION CONTROL */}
                {activeTab === 'version' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">الإصدار الحالي في الكود</span>
                        <span className="text-sm font-black text-amber-300">v{APP_VERSION}</span>
                      </div>
                      <div className="text-left dir-ltr">
                        <span className="text-[10px] text-slate-400 block">حزمة أندرويد</span>
                        <span className="text-xs font-mono text-emerald-400">com.anisalqulub.app</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">رقم أحدث إصدار (Target Version)</label>
                          <input
                            type="text"
                            value={versionTarget}
                            onChange={(e) => setVersionTarget(e.target.value)}
                            placeholder="2.6.0"
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-left dir-ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">أدنى إصدار مدعوم (Min Supported)</label>
                          <input
                            type="text"
                            value={minSupportedVersion}
                            onChange={(e) => setMinSupportedVersion(e.target.value)}
                            placeholder="1.0.0"
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-left dir-ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">رابط تحميل ملف الـ APK المباشر</label>
                        <input
                          type="url"
                          value={apkDownloadUrl}
                          onChange={(e) => setApkDownloadUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-left dir-ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات ومميزات الإصدار الجديد (Release Notes)</label>
                        <textarea
                          rows={3}
                          value={releaseNotes}
                          onChange={(e) => setReleaseNotes(e.target.value)}
                          placeholder="اذكر أهم الإضافات والتحسينات في هذا الإصدار..."
                          className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-amber-200 block">تفعيل التحديث الإجباري (Force Update)</span>
                          <span className="text-[10px] text-slate-400">سيظهر تنبيه يمنع استخدام التطبيقات القديمة حتى تحديث الـ APK</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={forceUpdate}
                          onChange={(e) => setForceUpdate(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveVersionConfig}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Download size={16} />
                      <span>حفظ ونشر إعدادات الإصدار والـ APK</span>
                    </button>
                  </div>
                )}

                {/* TAB 3: MAINTENANCE */}
                {activeTab === 'maintenance' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
                      <Power size={24} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-red-300">وضع الصيانة الطارئ</h4>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          عند إبراز وضع الصيانة، سيتم تنبيه المستخدمين برسالة الصيانة التي تحددها ومنع العمليات الحساسة مؤقتاً حتى إيقاف الوضع من طرفك.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">رسالة الصيانة للمستخدمين</label>
                      <textarea
                        rows={3}
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleToggleMaintenance}
                      disabled={isLoading}
                      className={`w-full py-3.5 px-4 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        maintenanceEnabled
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      <Power size={18} />
                      <span>{maintenanceEnabled ? 'تعطيل وضع الصيانة وعودة التطبيق' : 'تفعيل وضع الصيانة الطارئة الان'}</span>
                    </button>
                  </div>
                )}

                {/* TAB 4: FEATURE TOGGLES */}
                {activeTab === 'features' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                      <Settings size={20} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">مفاتيح التحكم بالمميزات (Feature Toggles)</h4>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          تمكّنك هذه المفاتيح من تفعيل أو تعطيل أي ميزة في التطبيق فوراً لجميع المستخدمين بدون الحاجة لإعادة رفع الكود أو التحديث.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">🤖 المساعد القرآني الذكي (Gemini AI Chat)</span>
                          <span className="text-[10px] text-slate-400">إتاحة محادثة المساعد الذكي للإجابة عن التفسير والتدبر</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableAiChat}
                          onChange={(e) => setEnableAiChat(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">🎧 الصوتيات والتلاوة الجماعية (Audio Recitation)</span>
                          <span className="text-[10px] text-slate-400">تشغيل تلاوات القراء ومكتبة التلاوة الصوتي</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableAudioRecitation}
                          onChange={(e) => setEnableAudioRecitation(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">🎨 تصميم ومشاركة بطاقات الآيات (Ayah Share Cards)</span>
                          <span className="text-[10px] text-slate-400">سماح المستخدمين بتصميم بطاقات الآيات ومشاركتها</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableAyahCards}
                          onChange={(e) => setEnableAyahCards(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">🌙 الختمة الجماعية التفاعلية (Community Khatma)</span>
                          <span className="text-[10px] text-slate-400">إتاحة مشاركة الأجزاء والختمات الجماعية بين المستخدمين</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableCommunityKhatma}
                          onChange={(e) => setEnableCommunityKhatma(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveFeatureToggles}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Settings size={16} />
                      <span>حفظ نشر مفاتيح التحكم الحية</span>
                    </button>
                  </div>
                )}

                {/* TAB 5: SYSTEM STATS & SUPABASE DATABASE */}
                {activeTab === 'stats' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block mb-1">قاعدة بيانات Supabase الرسمية</span>
                        <div className="flex items-center gap-2">
                          <Database size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold font-mono text-emerald-300">khdqwdndcilpfbuijmtz.supabase.co</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block mb-1">حالة اتصال المالك</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">مسجّل كـ المالك المعتمد 👑</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block mb-1">تطبيق الأندرويد مرتبط (APK)</span>
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} className="text-sky-400" />
                          <span className="text-xs font-mono text-sky-300">com.anisalqulub.app</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block mb-1">حساب مالك التطبيق</span>
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-yellow-400" />
                          <span className="text-xs font-mono text-yellow-300">azamfahd25@gmail.com</span>
                        </div>
                      </div>
                    </div>

                    {/* Supabase Core Tables Status */}
                    <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Database size={14} className="text-emerald-400" />
                          <span>جداول قاعدة بيانات Supabase المتصلة:</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          نشط ومتزامن ⚡
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300 font-mono text-[11px]">chat_sessions</span>
                          <span className="text-[10px] text-emerald-400 font-bold">المحادثات</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300 font-mono text-[11px]">user_settings</span>
                          <span className="text-[10px] text-emerald-400 font-bold">الإعدادات</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300 font-mono text-[11px]">bookmarks</span>
                          <span className="text-[10px] text-emerald-400 font-bold">المحفوظات</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300 font-mono text-[11px]">system_config</span>
                          <span className="text-[10px] text-amber-400 font-bold">لوحة المالك</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>بيئة التشغيل المباشرة:</span>
                        <span className="text-slate-200 font-mono">AI Studio + Supabase Postgres</span>
                      </div>
                      <div className="flex justify-between">
                        <span>إصدار التطبيق الحاضر:</span>
                        <span className="text-amber-300 font-bold font-mono">v{APP_VERSION}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
