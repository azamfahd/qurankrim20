import { requestDynamicPermission, PermissionService } from "../services/permissionService";
import { PlatformEnvironmentService } from "../services/platformEnvironmentService";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bell, BellRing, ShieldCheck, Zap, BatteryCharging, AlertTriangle, 
  CheckCircle2, Play, Square, Download, Smartphone, Laptop, Sparkles, 
  ExternalLink, ChevronLeft, ChevronDown, Check, Volume2, ShieldAlert
} from 'lucide-react';
import { AdhanAudioEngine, AdhanOfflineManager, MUEZZINS_LIST } from '../services/adhanService';
import { UserSettings } from '../types';

interface AdhanBackgroundGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onPermissionGranted?: () => void;
}

type DeviceVendor = 'samsung' | 'xiaomi' | 'huawei' | 'oppo' | 'iphone' | 'general';

export const AdhanBackgroundGuideModal: React.FC<AdhanBackgroundGuideModalProps> = ({
  isOpen,
  onClose,
  settings,
  onPermissionGranted
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [selectedVendor, setSelectedVendor] = useState<DeviceVendor>('samsung');
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLiveAdhanPlaying, setIsLiveAdhanPlaying] = useState(false);

  const currentMuezzinId = settings.adhanSettings?.muezzin || 'mishary';
  const currentMuezzin = MUEZZINS_LIST.find(m => m.id === currentMuezzinId) || MUEZZINS_LIST[0];

  useEffect(() => {
    const unsub = AdhanAudioEngine.subscribe(state => {
      setIsLiveAdhanPlaying(state.isLiveAdhan);
    });
    return () => unsub();
  }, []);

  // Check live permissions & audio cache status
  const checkStatus = async () => {
    try {
      const permStatus = await PermissionService.checkPermission('notifications');
      setNotificationPermission((permStatus === 'prompt' ? 'default' : permStatus) as NotificationPermission);
    } catch {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      } else {
        setNotificationPermission('unsupported' as NotificationPermission);
      }
    }

    try {
      const status = await AdhanOfflineManager.isMuezzinDownloaded(currentMuezzinId);
      setIsCached(status.downloaded);
    } catch {
      setIsCached(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setTestResult({ status: 'idle' });
      setIsTestingAlert(false);
    } else {
      if (isTestingAlert) {
        AdhanAudioEngine.stop();
        setIsTestingAlert(false);
      }
    }
  }, [isOpen, currentMuezzinId]);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      setTestResult({ status: 'error', message: 'المتصفح أو الجهاز الحالي لا يدعم ميزة الإشعارات الفورية.' });
      return;
    }

    try {
      const perm = await requestDynamicPermission('notifications');
      const grantedStr = perm ? 'granted' : 'denied';
      setNotificationPermission(grantedStr as NotificationPermission);
      if (perm) {
        setTestResult({ status: 'success', message: 'تم منح إذن الإشعارات بنجاح! ستصلك تنبيهات الأذان ومواقيت الصلاة.' });
        if (onPermissionGranted) onPermissionGranted();
      } else if (perm === 'denied') {
        setTestResult({ status: 'error', message: 'تم حظر الإذن. يرجى تفعيله من إعدادات الموقع أو التطبيق في جهازك كما هو موضح بالأسفل.' });
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      setTestResult({ status: 'error', message: 'حدث تعثر أثناء طلب الإذن. يمكنك منحه يدوياً من إعدادات المتصفح.' });
    }
  };

  const handleCacheCurrentMuezzin = async () => {
    setIsDownloading(true);
    try {
      const res = await AdhanOfflineManager.downloadMuezzinAudio(currentMuezzinId);
      if (res.success) {
        setIsCached(true);
        setTestResult({ status: 'success', message: `تم تحميل وتخزين صوت (${currentMuezzin.name}) بنجاح للعمل بدون إنترنت!` });
      } else {
        setTestResult({ status: 'error', message: res.error || 'تعذر تحميل الصوت. يرجى التأكد من اتصال الإنترنت.' });
      }
    } catch {
      setTestResult({ status: 'error', message: 'فشل تحميل الملف الصوتي.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTestInstantAlert = async () => {
    if (isLiveAdhanPlaying) {
      setTestResult({ status: 'error', message: 'جاري رفع الأذان التلقائي للصلاة الحالية. تم إيقاف التجربة الفورية لتجنب التضارب.' });
      return;
    }

    if (isTestingAlert) {
      AdhanAudioEngine.stop();
      setIsTestingAlert(false);
      return;
    }

    setIsTestingAlert(true);
    setTestResult({ status: 'idle' });

    // 1. Dispatch Notification
    let notificationDispatched = false;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        await AdhanAudioEngine.dispatchPrayerNotification('صلاة تجريبية', currentMuezzin.name);
        notificationDispatched = true;
      } catch (e) {
        console.warn("Test notification error:", e);
      }
    }

    // 2. Play Adhan snippet
    const playRes = await AdhanAudioEngine.play(
      currentMuezzinId,
      settings.adhanSettings?.volume || 85,
      () => {
        setIsTestingAlert(false);
      },
      undefined,
      'صلاة تجريبية'
    );

    if (playRes.success) {
      setTestResult({
        status: 'success',
        message: notificationDispatched
          ? 'تم إرسال إشعار التنبيه وتشغيل صوت الأذان بنجاح! التطبيق جاهز للعمل والتنبيه.'
          : 'تم تشغيل صوت الأذان بنجاح! (للحصول على إشعار منبثق على شاشة القفل، تأكد من تفعيل إذن الإشعارات أعلاه).'
      });

      // Stop after 7 seconds for test preview
      setTimeout(() => {
        if (AdhanAudioEngine.isPlaying()) {
          AdhanAudioEngine.stop();
          setIsTestingAlert(false);
        }
      }, 7000);
    } else {
      setIsTestingAlert(false);
      setTestResult({
        status: 'error',
        message: playRes.error || 'تعذر تشغيل الصوت. يرجى التفاعل مع الشاشة والتحقق من مستوى الصوت.'
      });
    }
  };

  const vendorGuides: Record<DeviceVendor, { title: string; subtitle: string; steps: string[]; badge: string }> = {
    samsung: {
      title: 'سامسونج (Samsung One UI)',
      subtitle: 'استثناء التطبيق من الإيقاف في الخلفية',
      badge: 'Samsung Galaxy',
      steps: [
        'افتح «إعدادات الهاتف» (Settings) ⬅️ ادخل على «التطبيقات» (Apps).',
        'اختر تطبيق «أنيس القلوب» ⬅️ ثم اضغط على «البطارية» (Battery).',
        'اختر خيار «غير مقيّد» (Unrestricted) لضمان عدم إيقاف الأذان عند إغلاق الشاشة.',
        'من قائمة «الإشعارات»، تأكد من تفعيل «السماح بالإشعارات» و«إظهارها على شاشة القفل».'
      ]
    },
    xiaomi: {
      title: 'شاومي / ريدمي / بوكو (Xiaomi MIUI & HyperOS)',
      subtitle: 'تفعيل التشغيل التلقائي ومنع قيود البطارية',
      badge: 'Xiaomi / Redmi / POCO',
      steps: [
        'افتح «الإعدادات» ⬅️ «التطبيقات» ⬅️ «إدارة التطبيقات» ⬅️ اختر «أنيس القلوب».',
        'قم بتفعيل خيار «التشغيل التلقائي» (Autostart).',
        'ادخل على «موفر البطارية» واختر «لا توجد قيود» (No restrictions).',
        'من قائمة «الأذونات الأخرى»، فعّل خيار «العرض على شاشة القفل» و«الظهور في النوافذ المنبثقة».'
      ]
    },
    huawei: {
      title: 'هواوي وهونر (Huawei / Honor HarmonyOS)',
      subtitle: 'الاستثناء من إدارة توفير الطاقة التلقائية',
      badge: 'Huawei / Honor',
      steps: [
        'افتح «الإعدادات» ⬅️ «البطارية» ⬅️ «تشغيل التطبيقات» (App Launch).',
        'ابحث عن «أنيس القلوب» وقم بإيقاف «الإدارة التلقائية».',
        'قم بتفعيل الخيارات الثلاثة يدوياً: «التشغيل التلقائي»، «التشغيل الثانوي»، و«العمل في الخلفية».',
        'تأكد من السماح بالإشعارات وتنبيهات الصوت العالية.'
      ]
    },
    oppo: {
      title: 'أوبو / ريلمي / ون بلس (ColorOS / Realme UI)',
      subtitle: 'السماح بالنشاط في الخلفية والإشعارات العائمة',
      badge: 'Oppo / Realme / OnePlus',
      steps: [
        'افتح «الإعدادات» ⬅️ «إدارة التطبيقات» ⬅️ اختر «أنيس القلوب».',
        'ادخل على «استخدام البطارية» ⬅️ فعّل «السماح بالنشاط في الخلفية» و«السماح بالتشغيل التلقائي».',
        'من «إدارة الإشعارات»، تأكد من تفعيل «السماح بالإشعارات التنبيهية» على شاشة القفل.'
      ]
    },
    iphone: {
      title: 'آبل آيفون (Apple iOS / Safari)',
      subtitle: 'تثبيت التطبيق على الشاشة الرئيسية لتفعيل التنبيهات',
      badge: 'iPhone iOS',
      steps: [
        'في متصفح Safari، اضغط على زر «المشاركة» (أيقونة المربع بسهم لأعلى ⬆️).',
        'اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen) ثم اضغط إضافة.',
        'افتح التطبيق من أيقونة الشاشة الرئيسية، واضغط «تفعيل إذن الإشعارات» بالأعلى.',
        'من إعدادات الآيفون ⬅️ الإشعارات ⬅️ أنيس القلوب، تأكد من تفعيل الأصوات والشارات وشاشة القفل.'
      ]
    },
    general: {
      title: 'أجهزة أخرى ومتصفح الكمبيوتر (Android / Chrome / Edge)',
      subtitle: 'تفعيل إذن الإشعارات وتشغيل الوسائط',
      badge: 'Android & PC',
      steps: [
        'اضغط على أيقونة الإعدادات أو القفل 🔒 الموجودة بجانب رابط الموقع في شريط العناوين.',
        'اختر «إعدادات الموقع» وتأكد من تغيير «الإشعارات» و«الصوت» إلى (سماح / Allow).',
        'قم بتثبيت التطبيق عبر الضغط على أيقونة التثبيت في شريط المتصفح ليعمل كمنبه مستقل وسريع.'
      ]
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="AdhanBackgroundGuideModal-anim-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
          onClick={onClose}
        >
          <motion.div key="AdhanBackgroundGuideModal-anim-2"
            initial={{ opacity: 0, scale: 0.94, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 25 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-[#fdfbf7] dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border-2 border-[var(--color-gold)]/60 overflow-hidden flex flex-col z-10 text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-[var(--color-gold)] to-teal-500 shrink-0"></div>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--color-border)] dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-[var(--color-primary-dark)] flex items-center justify-center text-[var(--color-gold-light)] shadow-md border border-[var(--color-gold)]/40 shrink-0">
                  <Zap size={20} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-[var(--color-primary-dark)] dark:text-emerald-300 flex items-center gap-1.5">
                    <span>دليل تفعيل الأذان والتنبيه الفوري في الخلفية</span>
                    <Sparkles size={14} className="text-[var(--color-gold)]" />
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    لضمان انطلاق صوت الأذان في موعده بدقة حتى لو كان التطبيق مغلقاً أو الجهاز مقفلاً
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">

              {/* Environment Smart Card */}
              {(() => {
                const env = PlatformEnvironmentService.getEnvironmentInfo();
                return (
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
                    env.isNativeAPK
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                  }`}>
                    <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                      env.isNativeAPK ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">بيئة التشغيل الحالية:</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md text-white ${
                          env.isNativeAPK ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}>
                          {env.nameAr}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed mt-1 opacity-90">
                        {env.isNativeAPK
                          ? 'أنت تستخدم تطبيق أندرويد المستقل (APK). تعمل التنبيهات والأصوات بنظام Notification Channels المباشر للنظام. يرجى التأكد من اختيار (غير مقتصر) في إعدادات البطارية بالأسفل لضمان استمرار عمل الصوت عند إغلاق الشاشة.'
                          : 'أنت تستخدم التطبيق عبر متصفح الويب أو PWA. تشغيل الصوت التلقائي عند إغلاق التبويب مقيد بسياسات أمان المتصفح (Autoplay). يُنصح بإبقاء التبويب متاحاً أو تثبيت نسخة APK للحصول على أداء منبه كامل 100%.'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* 1. Notifications Permission Card */}
              <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      notificationPermission === 'granted' ? 'bg-emerald-600' : notificationPermission === 'denied' ? 'bg-rose-600' : 'bg-amber-500'
                    }`}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>إذن إشعارات الأذان والمنبه الفوري</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          notificationPermission === 'granted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                            : notificationPermission === 'denied'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                        }`}>
                          {notificationPermission === 'granted' ? 'ممنوح ومفعّل ✅' : notificationPermission === 'denied' ? 'محظور من المتصفح ❌' : 'مطلوب تفعيله ⚠️'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        يسمح للنظام بإرسال تنبيه الأذان ودعاء ما بعد الصلاة مباشرة إلى شاشة القفل ومركز الإشعارات.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permission Actions */}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  {notificationPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <BellRing size={16} />
                      <span>تفعيل إذن الإشعارات الفورية الآن</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 w-full">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>إذن الإشعارات نشط ومفعل بنجاح، يمكنك الآن استقبال التنبيهات الفورية.</span>
                    </div>
                  )}

                  {notificationPermission === 'denied' && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-1.5 w-full">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>كيفية إلغاء الحظر وتفعيل الإذن:</span>
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        اضغط على أيقونة القفل أو الإعدادات 🔒 بجانب عنوان الموقع في شريط المتصفح، ثم ادخل على «أذونات الموقع» وغير إذن (الإشعارات) إلى «سماح».
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Offline Audio Cache Status */}
              <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${isCached ? 'bg-indigo-600' : 'bg-slate-500'}`}>
                      <Volume2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>جاهزية صوت المؤذن بدون إنترنت ({currentMuezzin.name})</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isCached ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                          {isCached ? 'محفوظ محلياً 100% ⚡' : 'غير محفوظ محلياً بعد'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        يتم تخزين ملف الصوت داخل ذاكرة جهازك ليعمل الأذان حتى في حال انقطاع الشبكة أو وضع الطيران.
                      </p>
                    </div>
                  </div>
                </div>

                {!isCached && (
                  <button
                    type="button"
                    onClick={handleCacheCurrentMuezzin}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>{isDownloading ? 'جاري تحميل وحفظ الصوت...' : `تحميل صوت (${currentMuezzin.name}) أوفلاين الآن`}</span>
                  </button>
                )}
              </div>

              {/* 3. Instant Test Button */}
              <div className="bg-gradient-to-br from-amber-500/10 via-white dark:via-slate-800 to-[var(--color-gold)]/15 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/30 dark:border-amber-500/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>اختبار التنبيه والصوت الفوري</span>
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      جرّب إرسال إشعار فوري وتشغيل مقطع من الأذان للتأكد من وصول الصوت والإشعار لجهازك الآن.
                    </p>
                  </div>

                  {isLiveAdhanPlaying ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold shrink-0 animate-pulse">
                      <Volume2 size={15} className="text-amber-500 shrink-0 animate-bounce" />
                      <span>أذان حي يعمل الآن</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTestInstantAlert}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
                        isTestingAlert 
                          ? 'bg-rose-600 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white'
                      }`}
                    >
                      {isTestingAlert ? (
                        <>
                          <Square size={14} fill="currentColor" />
                          <span>إيقاف التجربة</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} fill="currentColor" />
                          <span>تجربة التنبيه الآن</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Feedback Message */}
                {testResult.status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      testResult.status === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300'
                    }`}
                  >
                    {testResult.status === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </motion.div>
                )}
              </div>

              {/* 4. Manufacturer-specific Background Guides */}
              <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-xl">
                      <BatteryCharging size={17} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        إعدادات استثناء البطارية وتشغيل الخلفية حسب جهازك
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        تقوم أنظمة الهواتف بإيقاف التطبيقات لتوفير الطاقة ما لم تمنحها استثناءً:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vendor Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                  {(['samsung', 'xiaomi', 'huawei', 'oppo', 'iphone', 'general'] as DeviceVendor[]).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVendor(v)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                        selectedVendor === v
                          ? 'bg-[var(--color-primary-dark)] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {vendorGuides[v].badge}
                    </button>
                  ))}
                </div>

                {/* Selected Guide Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                      {vendorGuides[selectedVendor].title}
                    </h4>
                    <span className="text-[10px] text-slate-400">{vendorGuides[selectedVendor].subtitle}</span>
                  </div>

                  <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside pr-1 leading-relaxed">
                    {vendorGuides[selectedVendor].steps.map((step, idx) => (
                      <li key={`vstep-${selectedVendor}-${idx}`} className="marker:font-bold marker:text-emerald-600">
                        <span className="mr-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>التطبيق يراعي خصوصيتك بالكامل ولا يشارك أي بيانات.</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md hover:opacity-95 active:scale-95 cursor-pointer"
              >
                فهمت ذلك، تم الضبط
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
