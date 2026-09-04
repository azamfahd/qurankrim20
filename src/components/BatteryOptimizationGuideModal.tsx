import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, BatteryCharging, BellRing, Smartphone, CheckCircle2, AlertTriangle, Play, RefreshCw, ChevronLeft, Volume2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AdhanAudioEngine } from '../services/adhanService';
import { NativeNotificationService } from '../services/nativeNotificationService';
import { DhikrReminderService } from '../services/dhikrReminderService';
import { PlatformEnvironmentService } from '../services/platformEnvironmentService';

interface BatteryOptimizationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BatteryOptimizationGuideModal: React.FC<BatteryOptimizationGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [selectedBrand, setSelectedBrand] = useState<'samsung' | 'xiaomi' | 'huawei' | 'oppo' | 'general'>('general');
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [isTestingDhikr, setIsTestingDhikr] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  useEffect(() => {
    if (isOpen && Capacitor.isNativePlatform()) {
      LocalNotifications.checkPermissions().then(status => {
        setPermissionStatus(status.display === 'granted' ? 'granted' : 'denied');
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleTestAdhanSound = async () => {
    setIsTestingNotification(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') {
          onShowToast('يرجى تفعيل صلاحية الإشعارات أولاً', 'error');
          setIsTestingNotification(false);
          return;
        }

        await NativeNotificationService.setupAndroidChannels('mishary');
        const channelId = NativeNotificationService.getAdhanChannelId('mishary');
        const soundFile = NativeNotificationService.getAdhanSound('mishary');

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 999998,
              title: '🕌 تجربة أذان الصلاة - أنيس القلوب',
              body: 'الله أكبر، الله أكبر.. حي على الصلاة، حي على الفلاح',
              schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
              sound: soundFile,
              channelId: channelId,
              smallIcon: 'ic_stat_icon_config_sample'
            }
          ]
        });
        onShowToast('تم إرسال إشعار الأذان التجريبي بنجاح! تحقق من شريط الإشعارات وشاشة القفل', 'success');
      } else {
        const audio = new Audio('/audio/adhan/mishary.mp3');
        audio.play().then(() => {
          onShowToast('جاري تشغيل صوت الأذان التجريبي...', 'info');
        }).catch(() => {
          onShowToast('اضغط على الشاشة لتأكيد إذن تشغيل الصوت', 'info');
        });
      }
    } catch (e: any) {
      onShowToast('فشل اختبار الإشعار: ' + (e?.message || 'خطأ غير معروف'), 'error');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleTestDhikrSound = async () => {
    setIsTestingDhikr(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') {
          onShowToast('يرجى تفعيل صلاحية الإشعارات أولاً', 'error');
          setIsTestingDhikr(false);
          return;
        }

        await NativeNotificationService.setupAndroidChannels('mishary');
        const channelId = NativeNotificationService.getDhikrChannelId('prophet_salawat');
        const soundFile = NativeNotificationService.getDhikrSound('prophet_salawat');

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 999999,
              title: '✨ أنيس القلوب | الصلاة على النبي ﷺ',
              body: '« اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ »',
              schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
              sound: soundFile,
              channelId: channelId,
              smallIcon: 'ic_stat_icon_config_sample'
            }
          ]
        });
        onShowToast('تم إرسال تنبيه الذكر التجريبي بنجاح بصوت الشيخ مشاري! تفقّد شاشة القفل', 'success');
      } else {
        const audio = new Audio('/audio/adhkar/mishary_salawat.mp3');
        audio.play().then(() => {
          onShowToast('جاري تشغيل صوت الذكر التجريبي بصوت الشيخ مشاري...', 'info');
        }).catch(() => {
          onShowToast('اضغط على الشاشة لتأكيد إذن تشغيل الصوت', 'info');
        });
      }
    } catch (e: any) {
      onShowToast('فشل اختبار الذكر: ' + (e?.message || 'خطأ غير معروف'), 'error');
    } finally {
      setIsTestingDhikr(false);
    }
  };

  const handleRescheduleAll = async () => {
    setIsRescheduling(true);
    try {
      const location = localStorage.getItem('anis_user_location');
      const locObj = location ? JSON.parse(location) : null;
      if (locObj && locObj.latitude && locObj.longitude) {
        await AdhanAudioEngine.sync30DaysPrayerScheduleLocally({
          latitude: locObj.latitude,
          longitude: locObj.longitude,
          name: locObj.city || locObj.name || 'موقعك الحالي'
        });
        onShowToast('تم إعادة جدول جميع أوقات الصلاة والمنبهات لـ 30 يوماً بنجاح!', 'success');
      } else {
        onShowToast('يرجى تحديد موقعك في شاشة المواقيت أولاً لإعادة المزامنة', 'info');
      }
    } catch (e) {
      onShowToast('حدث خطأ أثناء جدولة المواقيت', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleRequestNativePermissions = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        if (status.display === 'granted') {
          setPermissionStatus('granted');
          onShowToast('تم منح إذن الإشعارات بنجاح!', 'success');
        } else {
          setPermissionStatus('denied');
          onShowToast('الإذن مرفوض. يرجى تفعيله من إعدادات الهاتف.', 'error');
        }
      }
    } catch {}
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="battery-opt-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            key="battery-opt-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-[var(--color-background)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-[var(--color-border)] rounded-3xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-emerald-950 text-white p-6 border-b border-emerald-900 shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shadow-sm">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">ضمان استمرارية الأذان والدقة</h2>
                    <p className="text-xs text-emerald-300 mt-0.5">إعدادات توفير البطارية وتنبيهات أندرويد الدقيقة</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center hover:bg-emerald-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* Environment Identification Card */}
              {(() => {
                const env = PlatformEnvironmentService.getEnvironmentInfo();
                return (
                  <div className={`border rounded-2xl p-4 flex items-start gap-3 ${
                    env.isNativeAPK
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200'
                  }`}>
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      env.isNativeAPK ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                          {env.nameAr}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed mt-1.5 opacity-90">
                        {env.isNativeAPK 
                          ? 'يعمل التطبيق كحزمة أندرويد مستقلة (APK). يتم جدولة الأذان والأذكار عبر القنوات الصوتية المباشرة للنظام (Notification Channels)، وتعمل حتى في حال إغلاق الشاشة.'
                          : 'يعمل التطبيق كصفحة ويب / PWA. تفرض المتصفحات محددات على الصوت في الخلفية (Autoplay). نوصي بإلغاء قيود البطارية وتثبيت التطبيق للحصول على أفضل دقة.'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={handleTestAdhanSound}
                  disabled={isTestingNotification}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex flex-col items-center gap-1.5 justify-center text-center border border-emerald-500/30"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Volume2 size={15} />
                  </div>
                  <span>{isTestingNotification ? 'جاري الاختبار...' : 'تجربة الأذان بشاشة القفل'}</span>
                </button>

                <button
                  onClick={handleTestDhikrSound}
                  disabled={isTestingDhikr}
                  className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex flex-col items-center gap-1.5 justify-center text-center border border-teal-500/30"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <BellRing size={15} />
                  </div>
                  <span>{isTestingDhikr ? 'جاري الاختبار...' : 'تجربة الذكر (صوت مشاري)'}</span>
                </button>

                <button
                  onClick={handleRescheduleAll}
                  disabled={isRescheduling}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex flex-col items-center gap-1.5 justify-center text-center border border-blue-500/30"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <RefreshCw size={15} className={isRescheduling ? 'animate-spin' : ''} />
                  </div>
                  <span>{isRescheduling ? 'جاري الجدول...' : 'إعادة جدولة 30 يوماً'}</span>
                </button>
              </div>

              {/* Clarification about Android Permissions: Sound vs Microphone & Location */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>دليل أذونات أندرويد (الصوت والموقع والخلفية):</span>
                </div>
                <ul className="text-[11px] text-emerald-800 dark:text-emerald-300/90 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><b>إذن الموقع:</b> يدعم التطبيق الآن خيار <b>«السماح طوال الوقت» (Allow all the time)</b> لضمان حساب مواقيت الصلاة واتجاه القبلة بدقة حتى عند التنقل وإغلاق البرنامج.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><b>إذن الصوت والميكروفون في معلومات التطبيق:</b> في نظام أندرويد، الإذن المعروض باسم "الصوت" أو "الميكروفون" مخصص فقط للتسجيل (وهو مقيّد أمنياً من Google للاستخدام الفعلي). أما <b>تشغيل أصوات الأذكار والأذان في الخلفية وشاشة القفل</b>، فيعمل عبر <b>قنوات الإشعارات المدمجة (Notification Channels)</b> بصوت الشيخ مشاري العفاسي والمؤذنين، ولا يحتاج إذن الميكروفون إطلاقاً.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><b>فئات الإشعارات:</b> يمكنك التوجه إلى «معلومات التطبيق» &gt; «الإشعارات» &gt; «فئات الإشعارات» للتأكد من ربط كل ذكر وأذان بصوته الشريف الخاص بدلاً من النغمة الافتراضية.</span>
                  </li>
                </ul>
              </div>

              {/* Native Permission Prompt if denied */}
              {Capacitor.isNativePlatform() && permissionStatus !== 'granted' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">إذن الإشعارات غير مفعل</p>
                      <p className="text-[10px] text-amber-700">مطلوب لتشغيل الأذان في وقته</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestNativePermissions}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl"
                  >
                    تفعيل الآن
                  </button>
                </div>
              )}

              {/* Device Specific Battery Optimization Guide */}
              <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <BatteryCharging size={16} className="text-emerald-600" />
                    تعليمات تحسين البطارية حسب نوع هاتفك:
                  </h3>
                </div>

                {/* Tabs for Brands */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'general', label: 'عام (جميع الهواتف)' },
                    { id: 'samsung', label: 'سامسونج (Samsung)' },
                    { id: 'xiaomi', label: 'شاومي (MIUI / POCO)' },
                    { id: 'huawei', label: 'هواوي (Huawei)' },
                    { id: 'oppo', label: 'أوبو / ريلمي (Oppo)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedBrand(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-colors ${
                        selectedBrand === tab.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Brand Guide Steps */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-[var(--color-border)] space-y-2 text-xs text-gray-700 leading-relaxed">
                  {selectedBrand === 'general' && (
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>افتح <b>إعدادات الهاتف (Settings)</b> &gt; <b>التطبيقات (Apps)</b>.</li>
                      <li>ابحث عن تطبيق <b>أنيس القلوب</b>.</li>
                      <li>اختر <b>البطارية (Battery)</b> &gt; حدد <b>غير مقيد (Unrestricted)</b>.</li>
                      <li>تأكد من تفعيل صلاحية <b>التنبيهات والمنبهات الدقيقة (Exact Alarms)</b>.</li>
                    </ol>
                  )}

                  {selectedBrand === 'samsung' && (
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>افتح إعدادات الهاتف &gt; العناية بالجهاز &gt; البطارية.</li>
                      <li>اختر <b>حدود استخدام الخلفية</b> &gt; انقل "أنيس القلوب" إلى قائمة <b>التطبيقات التي لا تنام أبداً</b>.</li>
                      <li>في تفاصيل التطبيق: اختر البطارية &gt; <b>غير مقيد</b>.</li>
                    </ol>
                  )}

                  {selectedBrand === 'xiaomi' && (
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>افتح إعدادات الهاتف &gt; التطبيقات &gt; إدارة التطبيقات &gt; أنيس القلوب.</li>
                      <li>مهم جداً: قم بتفعيل خيار <b>التشغيل التلقائي (Autostart)</b>.</li>
                      <li>اختر موفر البطارية &gt; حدد <b>بلا قيود (No Restrictions)</b>.</li>
                      <li>في أذونات أخرى: فعّل "عرض النوافذ المنبثقة أثناء التشغيل في الخلفية".</li>
                    </ol>
                  )}

                  {selectedBrand === 'huawei' && (
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>افتح مدير الهاتف (Optimizer) &gt; تشغيل التطبيقات (App Launch).</li>
                      <li>ابحث عن "أنيس القلوب" &gt; أوقف التشغيل التلقائي واجعل الإدارة <b>يدوية</b>.</li>
                      <li>فعّل الثلاث خيارات: (التشغيل التلقائي، التشغيل الثانوي، التشغيل في الخلفية).</li>
                    </ol>
                  )}

                  {selectedBrand === 'oppo' && (
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>افتح الإعدادات &gt; إدارة التطبيقات &gt; أنيس القلوب.</li>
                      <li>السماح بالتشغيل التلقائي (Allow Auto Launch).</li>
                      <li>استهلاك الطاقة في الخلفية &gt; السماح بالتشغيل في الخلفية بلا قيود.</li>
                    </ol>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-[var(--color-border)] flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                فهمت ذلك، تم الحفظ
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
