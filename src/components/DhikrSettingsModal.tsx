import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bell, Volume2, VolumeX, Sparkles, Clock, 
  Check, Play, Pause, CheckCircle2, 
  Settings2, ListFilter, Users, Download,
  Trash2, RefreshCw, HardDrive, CheckCircle
} from 'lucide-react';
import { DhikrReminderSettings, DhikrReciterInfo } from '../types';
import { 
  DhikrReminderService, 
  DhikrOfflineManager, 
  DHIKR_DATABASE, 
  DHIKR_RECITERS, 
  DhikrDailyStats 
} from '../services/dhikrReminderService';
import { PermissionService } from '../services/permissionService';

interface DhikrSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const INTERVAL_PRESETS = [
  { value: 5, label: 'كل 5 دقائق' },
  { value: 10, label: 'كل 10 دقائق' },
  { value: 15, label: 'كل 15 دقيقة', recommended: true },
  { value: 30, label: 'كل 30 دقيقة' },
  { value: 45, label: 'كل 45 دقيقة' },
  { value: 60, label: 'كل ساعة' },
  { value: 120, label: 'كل ساعتين' },
  { value: 180, label: 'كل 3 ساعات' },
];

const CATEGORY_OPTIONS = [
  { id: 'all' as const, name: 'جميع الأذكار منوعة بالتناوب', desc: 'صلاة على النبي، استغفار، تسبيح، حوقلة وتحصين', icon: '✨' },
  { id: 'prophet_salawat' as const, name: 'الصلاة على النبي ﷺ فقط', desc: 'تذكير مستمر بالصلاة والسلام على رسول الله', icon: '💚' },
  { id: 'istighfar' as const, name: 'الاستغفار والتوبة فقط', desc: 'سيد الاستغفار وصيغ الاستغفار الجامعة', icon: '🌿' },
  { id: 'baqiyat' as const, name: 'الباقيات الصالحات فقط', desc: 'سبحان الله، الحمد لله، لا إله إلا الله، الله أكبر', icon: '💎' },
  { id: 'hawqala' as const, name: 'الحوقلة وتفريج الهموم', desc: 'لا حول ولا قوة إلا بالله ودعاء ذي النون', icon: '🛡️' },
  { id: 'morning_evening' as const, name: 'أذكار الحفظ والتحصين', desc: 'بسم الله الذي لا يضر مع اسمه شيء وأدعية العافية', icon: '☀️' },
  { id: 'custom' as const, name: 'تخصيص أذكار محددة', desc: 'اختيار أذكار معينة يدوياً من القائمة', icon: '🎯' },
];

export const DhikrSettingsModal: React.FC<DhikrSettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [settings, setSettings] = useState<DhikrReminderSettings>(() => DhikrReminderService.getSettings());
  const [dailyStats, setDailyStats] = useState<DhikrDailyStats>(() => DhikrReminderService.getDailyStats());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'reciters' | 'categories'>('general');
  const [downloadedReciters, setDownloadedReciters] = useState<{ [id: string]: boolean }>({});
  const [downloadProgress, setDownloadProgress] = useState<{ [id: string]: number }>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [allDownloadStatusText, setAllDownloadStatusText] = useState('');
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    PermissionService.checkPermission('notifications').then((permStatus) => {
      const status = (permStatus === 'prompt' ? 'default' : permStatus) as NotificationPermission;
      setNotificationPermission(status);
      if (status === 'default') {
        DhikrReminderService.requestNotificationPermission().then((perm) => {
          setNotificationPermission(perm as NotificationPermission);
        });
      }
    }).catch(() => {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
        if (Notification.permission === 'default') {
          DhikrReminderService.requestNotificationPermission().then((perm) => {
            setNotificationPermission(perm as NotificationPermission);
          });
        }
      }
    });

    const unsubSettings = DhikrReminderService.subscribeToSettings((s) => {
      setSettings(s);
    });

    const unsubStats = DhikrReminderService.subscribeToStats((st) => {
      setDailyStats(st);
    });

    const unsubAudio = DhikrReminderService.subscribeToAudioState((state) => {
      if (state.isPlaying && state.reciterId) {
        setIsPlayingPreview(state.reciterId);
      } else if (!state.isPlaying) {
        setIsPlayingPreview(null);
      }
    });

    checkDownloadedStatuses();

    return () => {
      unsubSettings();
      unsubStats();
      unsubAudio();
      DhikrReminderService.stopAudio();
    };
  }, []);

  const checkDownloadedStatuses = async () => {
    const statusMap: { [id: string]: boolean } = {};
    for (const reciter of DHIKR_RECITERS) {
      if (reciter.id === 'random') {
        statusMap[reciter.id] = true;
        continue;
      }
      statusMap[reciter.id] = await DhikrOfflineManager.isReciterDownloaded(reciter.id);
    }
    setDownloadedReciters(statusMap);
  };

  const handleDownloadSingleReciter = async (reciterId: string, reciterName: string) => {
    if (downloadProgress[reciterId] !== undefined && downloadProgress[reciterId] < 100) return;
    
    setDownloadProgress(prev => ({ ...prev, [reciterId]: 5 }));
    if (onShowToast) onShowToast(`جاري تنزيل وتخزين تسجيلات ${reciterName}...`, 'info');

    try {
      const success = await DhikrOfflineManager.downloadReciterAudio(reciterId, (pct) => {
        setDownloadProgress(prev => ({ ...prev, [reciterId]: pct }));
      });

      if (success) {
        setDownloadedReciters(prev => ({ ...prev, [reciterId]: true }));
        if (onShowToast) onShowToast(`تم تحميل صوتيات ${reciterName} بنجاح وجاهزة للعمل أوفلاين!`, 'success');
      } else {
        if (onShowToast) onShowToast(`تعذر تنزيل بعض ملفات ${reciterName}، يرجى المحاولة لاحقاً.`, 'error');
      }
    } catch (e) {
      if (onShowToast) onShowToast(`حدث خطأ أثناء تنزيل الملفات، تأكد من الاتصال بالإنترنت.`, 'error');
    } finally {
      setTimeout(() => {
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[reciterId];
          return next;
        });
      }, 1000);
      checkDownloadedStatuses();
    }
  };

  const handleDeleteSingleReciter = async (reciterId: string, reciterName: string) => {
    const ok = await DhikrOfflineManager.deleteReciterAudio(reciterId);
    if (ok) {
      setDownloadedReciters(prev => ({ ...prev, [reciterId]: false }));
      if (onShowToast) onShowToast(`تم حذف ملفات ${reciterName} من الذاكرة المحلية لتوفير المساحة.`, 'info');
    }
  };

  const handleDownloadAllReciters = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    setAllDownloadStatusText('بدء تنزيل كافة حزم القراء...');
    if (onShowToast) onShowToast('بدء تنزيل وتسجيل كافة أصوات المشايخ للعمل بدون إنترنت...', 'info');

    try {
      const ok = await DhikrOfflineManager.downloadAllReciters((percent, name) => {
        setAllDownloadStatusText(`جاري التحميل (${percent}%): ${name}`);
      });
      if (ok) {
        await checkDownloadedStatuses();
        if (onShowToast) onShowToast('اكتمل تحميل أصوات جميع المشايخ الكرام بنجاح!', 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast('تعذر إكمال تحميل بعض الملفات، يرجى المحاولة ثانية.', 'error');
    } finally {
      setIsDownloadingAll(false);
      setAllDownloadStatusText('');
      checkDownloadedStatuses();
    }
  };

  const handleToggleEnable = () => {
    const nextState = !settings.enabled;
    const updated = DhikrReminderService.updateSettings({ enabled: nextState });
    setSettings(updated);

    if (nextState && notificationPermission !== 'granted') {
      handleRequestNotification();
    }

    if (onShowToast) {
      onShowToast(
        nextState 
          ? 'تم تفعيل التنبيه الذكي بذكر الله والصلاة على النبي ﷺ' 
          : 'تم إيقاف التنبيه التلقائي بذكر الله',
        nextState ? 'success' : 'info'
      );
    }
  };

  const handleUpdate = (partial: Partial<DhikrReminderSettings>) => {
    const updated = DhikrReminderService.updateSettings(partial);
    setSettings(updated);
  };

  const handleRequestNotification = async () => {
    const perm = await DhikrReminderService.requestNotificationPermission();
    setNotificationPermission(perm as NotificationPermission);
    if (perm === 'granted' && onShowToast) {
      onShowToast('تم تفعيل إشعارات النظام بالخلفية وشاشة القفل بنجاح!', 'success');
    }
  };

  const handleTestCardInApp = () => {
    DhikrReminderService.showDirectBanner(undefined, true);
    if (onShowToast) {
      onShowToast('تم إظهار بطاقة الذكر في أعلى الشاشة الآن بنجاح!', 'success');
    }
  };

  const handlePreviewReciter = async (reciter: DhikrReciterInfo) => {
    if (isPlayingPreview === reciter.id) {
      DhikrReminderService.stopAudio();
      setIsPlayingPreview(null);
      return;
    }

    // Stop any ongoing audio before starting new preview
    DhikrReminderService.stopAudio();
    setIsPlayingPreview(reciter.id);

    const testDhikr = DHIKR_DATABASE[0]; // الصلاة على النبي
    const vol = (settings.volume ?? 85) / 100;

    // Trigger the floating card for this preview so the user sees it in action
    DhikrReminderService.showDirectBanner(testDhikr, false);

    try {
      await DhikrReminderService.playRealReciterVoice(testDhikr, reciter.id, vol);
    } catch {
      setIsPlayingPreview(null);
    }
  };

  const toggleCustomDhikrSelection = (id: string) => {
    const currentList = settings.selectedDhikrIds || [];
    let nextList: string[];
    if (currentList.includes(id)) {
      nextList = currentList.filter(x => x !== id);
    } else {
      nextList = [...currentList, id];
    }
    handleUpdate({ selectedDhikrIds: nextList, category: 'custom' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="dhikr-settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto bg-black/70 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              DhikrReminderService.stopAudio();
              onClose();
            }
          }}
        >
          <motion.div
            key="dhikr-settings-container"
            onClick={(e) => {
              e.stopPropagation();
            }}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#fdfbf7] via-[#fefdfa] to-[#f7f3e8] dark:from-[#052e24] dark:via-[#02221b] dark:to-[#011712] rounded-3xl sm:rounded-[2.5rem] shadow-3xl border-2 border-[var(--color-gold)]/40 overflow-hidden flex flex-col max-h-[92vh] z-10"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#043d2f] text-white relative overflow-hidden border-b border-[var(--color-gold)]/30 shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 shadow-lg shadow-amber-500/20 shrink-0">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-arabic flex items-center gap-2">
                    <span>التنبيه الذكي بذكر الله والصلاة على النبي ﷺ</span>
                  </h3>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    أصوات حقيقية لكبار القراء مع تذكير تلقائي خفيف بالخلفية وشاشة القفل
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  DhikrReminderService.stopAudio();
                  onClose();
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Switch Toggle Header */}
            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/90">حالة التنبيه الآلي:</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${settings.enabled ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-red-500/20 text-red-300 border border-red-400/30'}`}>
                  {settings.enabled ? 'مُفعّل ونشط' : 'مُتوقف مؤقتاً'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestCardInApp}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 rounded-xl transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                  title="معاينة بطاقة الذكر العائمة أعلى الشاشة فوراً داخل التطبيق"
                >
                  <Sparkles size={12} className="text-emerald-300" />
                  <span>معاينة البطاقة 📿</span>
                </button>

                <button
                  onClick={handleToggleEnable}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer relative ${settings.enabled ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${settings.enabled ? 'translate-x-[-1.4rem]' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20 p-1.5 gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-[#064e3b] text-emerald-900 dark:text-amber-300 shadow-sm border border-black/5 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings2 size={15} />
              <span>التوقيت والإعدادات</span>
            </button>

            <button
              onClick={() => setActiveTab('reciters')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative shrink-0 ${
                activeTab === 'reciters'
                  ? 'bg-white dark:bg-[#064e3b] text-emerald-900 dark:text-amber-300 shadow-sm border border-black/5 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users size={15} />
              <span>أصوات القراء</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-[#064e3b] text-emerald-900 dark:text-amber-300 shadow-sm border border-black/5 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter size={15} />
              <span>نوع الأذكار ({DHIKR_DATABASE.length})</span>
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-800 dark:text-slate-100">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Master Switch Card in General Settings */}
                <div className="bg-white/90 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      settings.enabled
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-500/20 text-slate-500'
                    }`}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>تفعيل التنبيه الدوري بالأذكار</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          settings.enabled
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-500 border border-slate-500/30'
                        }`}>
                          {settings.enabled ? 'مفعّل حالياً' : 'مغلق (افتراضياً)'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {settings.enabled
                          ? 'يتم تنبيهك دورياً بأجمل الأذكار بأصوات كبار المشايخ'
                          : 'مغلق — يمكنك تفعيله متى شئت لتبدأ التنبيهات الدورية'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleEnable}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer relative shrink-0 ${
                      settings.enabled ? 'bg-emerald-600 shadow-md shadow-emerald-600/30' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.enabled ? 'translate-x-[-1.5rem]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Custom Toggle: Alert upon opening app (التنبيه عند فتح البرنامج) */}
                <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>تنبيه بذكر فور فتح التطبيق</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          settings.triggerOnAppOpen
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-500 border border-slate-500/20'
                        }`}>
                          {settings.triggerOnAppOpen ? 'مفعّل' : 'مغلق'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        تشغيل ذكر أو صلاة على النبي ﷺ فور دخولك للبرنامج (مستقل عن التنبيهات الموقّتة)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpdate({ triggerOnAppOpen: !settings.triggerOnAppOpen })}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                      settings.triggerOnAppOpen ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.triggerOnAppOpen ? 'translate-x-[-1.35rem]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Interval Frequency Presets */}
                <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <Clock size={16} className="text-amber-500" />
                      <span>تكرار التنبيه (كل كم دقيقة):</span>
                    </label>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                      كل {settings.intervalMinutes} دقيقة
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INTERVAL_PRESETS.map((preset) => {
                      const isSelected = settings.intervalMinutes === preset.value;
                      return (
                        <button
                          key={preset.value}
                          onClick={() => handleUpdate({ intervalMinutes: preset.value })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-transparent'
                          }`}
                        >
                          {preset.label}
                          {preset.recommended && (
                            <span className="block text-[9px] text-amber-300 mt-0.5">مُستحسن</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sound Type & Volume */}
                <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <Volume2 size={16} className="text-amber-500" />
                      <span>طريقة التنبيه والصوت:</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdate({ soundType: 'voice_and_chime' })}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-right cursor-pointer ${
                        settings.soundType === 'voice_and_chime'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      <div className="font-bold">🎙️ صوت القارئ الحقيقي + نغمة</div>
                      <div className={`text-[10px] mt-0.5 ${settings.soundType === 'voice_and_chime' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        تلاوة صوتية خاشعة للذكر
                      </div>
                    </button>

                    <button
                      onClick={() => handleUpdate({ soundType: 'chime_only' })}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-right cursor-pointer ${
                        settings.soundType === 'chime_only'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      <div className="font-bold">🔔 نغمة روحانية فقط</div>
                      <div className={`text-[10px] mt-0.5 ${settings.soundType === 'chime_only' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        رنين إسلامي خفيف هادئ
                      </div>
                    </button>

                    <button
                      onClick={() => handleUpdate({ soundType: 'silent' })}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-right cursor-pointer ${
                        settings.soundType === 'silent'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      <div className="font-bold">🔕 صامت (شعار فقط)</div>
                      <div className={`text-[10px] mt-0.5 ${settings.soundType === 'silent' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        ظهور الشعار بدون إصدار صوت
                      </div>
                    </button>
                  </div>

                  {/* Volume Slider */}
                  {settings.soundType !== 'silent' && (
                    <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">مستوى الصوت:</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={settings.volume ?? 85}
                        onChange={(e) => handleUpdate({ volume: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-emerald-600 h-2 bg-black/10 dark:bg-white/10 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-10 text-left">
                        {settings.volume ?? 85}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Floating Banner Toggle on Screen */}
                <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>إظهار بطاقة الذكر العائمة على الشاشة</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            settings.showFloatingBanner !== false
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-500/15 text-slate-500 border border-slate-500/20'
                          }`}>
                            {settings.showFloatingBanner !== false ? 'مفعّلة' : 'مغلقة'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          ظهور بطاقة إسلامية أنيقة في أعلى الشاشة بنص الذكر وفضله مع أزرار التسبيح والاستماع
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdate({ showFloatingBanner: settings.showFloatingBanner === false ? true : false })}
                      className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                        settings.showFloatingBanner !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.showFloatingBanner !== false ? 'translate-x-[-1.35rem]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      يمكنك معاينة واختبار ظهور البطاقة الآن:
                    </span>
                    <button
                      onClick={handleTestCardInApp}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Sparkles size={13} />
                      <span>معاينة وتجربة البطاقة 📿</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECITERS TAB */}
            {activeTab === 'reciters' && (
              <div className="space-y-3">
                {/* Header Information and Batch Download Panel */}
                <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <HardDrive size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5 text-sm text-slate-900 dark:text-amber-200">
                        مكتبة أصوات كبار المشايخ (بدون إنترنت)
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        يمكنك تحميل وتخزين أصوات أي قارئ مباشرة على جهازك لتعمل الأذكار أوفلاين بدون أي انقطاع.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadAllReciters}
                    disabled={isDownloadingAll}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer ${
                      isDownloadingAll
                        ? 'bg-amber-400/50 text-slate-800 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                    }`}
                    title="تحميل أصوات كافة المشايخ للعمل بدون إنترنت"
                  >
                    {isDownloadingAll ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    <span>{isDownloadingAll ? 'جاري التحميل...' : 'تحميل جميع القراء'}</span>
                  </button>
                </div>

                {isDownloadingAll && allDownloadStatusText && (
                  <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2.5 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 animate-pulse">
                    <RefreshCw size={13} className="animate-spin text-emerald-500" />
                    <span>{allDownloadStatusText}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2.5">
                  {DHIKR_RECITERS.map((reciter) => {
                    const isSelected = (settings.reciterId || 'mishary') === reciter.id;
                    const isDownloaded = downloadedReciters[reciter.id] || reciter.id === 'random';
                    const currentProg = downloadProgress[reciter.id];
                    const isCurrentlyDownloading = currentProg !== undefined;

                    return (
                      <div
                        key={reciter.id}
                        onClick={() => handleUpdate({ reciterId: reciter.id })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                            : 'bg-white/80 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-black/5 dark:bg-white/10'}`}>
                            {reciter.avatar}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-arabic truncate">
                                {reciter.name}
                              </h4>
                              
                              {reciter.id !== 'random' && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                  isDownloaded
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                }`}>
                                  {isDownloaded ? (
                                    <>
                                      <CheckCircle2 size={10} />
                                      <span>جاهز أوفلاين</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download size={10} />
                                      <span>متاح للتحميل</span>
                                    </>
                                  )}
                                </span>
                              )}

                              {reciter.sizeFormatted && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                                  ({reciter.sizeFormatted})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {reciter.title}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Download / Delete / Preview */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                          {reciter.id !== 'random' && (
                            <>
                              {isCurrentlyDownloading ? (
                                <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                                  <RefreshCw size={12} className="animate-spin text-amber-600" />
                                  <span>{currentProg}%</span>
                                </div>
                              ) : isDownloaded ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDownloadSingleReciter(reciter.id, reciter.name)}
                                    className="p-1.5 rounded-xl text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10"
                                    title="إعادة تحديث وتحميل الملفات الصوتية"
                                  >
                                    <RefreshCw size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSingleReciter(reciter.id, reciter.name)}
                                    className="p-1.5 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                                    title="حذف الملفات الصوتية من الذاكرة لتوفير المساحة"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleDownloadSingleReciter(reciter.id, reciter.name)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                                  title="تحميل صوتيات هذا القارئ للعمل أوفلاين"
                                >
                                  <Download size={13} />
                                  <span>تحميل الصوت</span>
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => handlePreviewReciter(reciter)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                              isPlayingPreview === reciter.id
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/40'
                                : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/10 border-transparent'
                            }`}
                            title={isPlayingPreview === reciter.id ? 'إيقاف تشغيل الصوت' : 'استماع لعينة من الصوت الحقيقي'}
                          >
                            {isPlayingPreview === reciter.id ? (
                              <>
                                <VolumeX size={14} className="text-amber-950 animate-pulse" />
                                <span>إيقاف المعاينة</span>
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                <span>معاينة الصوت</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CATEGORIES & DHIKR SELECTION */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    اختر تصنيف الأذكار التي تود التذكير بها:
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const isSelected = settings.category === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleUpdate({ category: opt.id })}
                          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-white/80 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-emerald-500/40 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="text-xl mt-0.5">{opt.icon}</span>
                          <div>
                            <div className="text-xs sm:text-sm font-bold">{opt.name}</div>
                            <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                              {opt.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Dhikr Checkboxes */}
                {settings.category === 'custom' && (
                  <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                      حدد الأذكار المحددة التي ترغب في جدولتها:
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {DHIKR_DATABASE.map((item) => {
                        const isChecked = settings.selectedDhikrIds?.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleCustomDhikrSelection(item.id)}
                            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                : 'bg-black/5 dark:bg-white/5 border-transparent text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'}`}>
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className="font-arabic truncate font-bold">{item.text}</span>
                            </div>
                            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                              {item.categoryName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
               </div>
            )}
          </div>

          {/* Footer Stats & Close Button */}
          <div className="p-3.5 sm:p-4 bg-black/5 dark:bg-black/30 border-t border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>إجمالي حسناتك اليوم: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-black">{dailyStats.totalRecitedCount} ذكر وصلاة</strong>
            </div>

            <button
              onClick={() => {
                DhikrReminderService.stopAudio();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              حفظ وإغلاق
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
