import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bell, Volume2, Sparkles, Moon, Clock, 
  Check, Play, Pause, CheckCircle2, 
  Settings2, Smartphone, ListFilter, Users,
  Zap, BatteryCharging, ShieldCheck
} from 'lucide-react';
import { DhikrReminderSettings, DhikrReciterInfo } from '../types';
import { 
  DhikrReminderService, 
  DhikrOfflineManager, 
  DHIKR_DATABASE, 
  DHIKR_RECITERS, 
  DhikrDailyStats 
} from '../services/dhikrReminderService';

interface DhikrSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type DeviceVendor = 'samsung' | 'xiaomi' | 'huawei' | 'oppo' | 'iphone' | 'general';

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
  const [activeTab, setActiveTab] = useState<'general' | 'reciters' | 'categories' | 'background'>('general');
  const [selectedVendor, setSelectedVendor] = useState<DeviceVendor>('samsung');
  const [isTestingLockScreen, setIsTestingLockScreen] = useState(false);
  const [, setDownloadedReciters] = useState<{ [id: string]: boolean }>({});
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const unsubSettings = DhikrReminderService.subscribeToSettings((s) => {
      setSettings(s);
    });

    const unsubStats = DhikrReminderService.subscribeToStats((st) => {
      setDailyStats(st);
    });

    checkDownloadedStatuses();

    return () => {
      unsubSettings();
      unsubStats();
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, []);

  const checkDownloadedStatuses = async () => {
    const statusMap: { [id: string]: boolean } = {};
    for (const reciter of DHIKR_RECITERS) {
      statusMap[reciter.id] = await DhikrOfflineManager.isReciterDownloaded(reciter.id);
    }
    setDownloadedReciters(statusMap);
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
    setNotificationPermission(perm);
    if (perm === 'granted' && onShowToast) {
      onShowToast('تم تفعيل إشعارات النظام بالخلفية وشاشة القفل بنجاح!', 'success');
    }
  };

  const handleTestLockScreen = async () => {
    setIsTestingLockScreen(true);
    if (onShowToast) {
      onShowToast('يتم الآن إرسال إشعار فوري تجريبي لشاشة القفل وشريط الإشعارات...', 'info');
    }
    const success = await DhikrReminderService.testLockScreenNotification();
    if (success) {
      if (onShowToast) onShowToast('وصل التنبيه بنجاح! تفقّد شريط الإشعارات أو اقفل الشاشة لمعاينته.', 'success');
      setNotificationPermission('granted');
    } else {
      if (onShowToast) onShowToast('يرجى السماح بإذن الإشعارات لتفعيل التنبيه على شاشة القفل والخلفية.', 'error');
    }
    setIsTestingLockScreen(false);
  };

  const handlePreviewReciter = async (reciter: DhikrReciterInfo) => {
    if (isPlayingPreview === reciter.id) {
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }
      setIsPlayingPreview(null);
      return;
    }

    if (audioPlayer) {
      audioPlayer.pause();
    }

    setIsPlayingPreview(reciter.id);
    const testDhikr = DHIKR_DATABASE[0]; // الصلاة على النبي
    const vol = (settings.volume ?? 85) / 100;

    await DhikrReminderService.playRealReciterVoice(testDhikr, reciter.id, vol);
    setTimeout(() => {
      setIsPlayingPreview(null);
    }, 4000);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
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
                  onClick={handleTestLockScreen}
                  disabled={isTestingLockScreen}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title="تجربة وصول التنبيه لشاشة القفل والخلفية"
                >
                  <Bell size={12} className="fill-slate-950" />
                  <span>{isTestingLockScreen ? 'جاري الإرسال...' : 'تجربة شاشة القفل'}</span>
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

            <button
              onClick={() => setActiveTab('background')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'background'
                  ? 'bg-white dark:bg-[#064e3b] text-emerald-900 dark:text-amber-300 shadow-sm border border-black/5 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone size={15} />
              <span>الخلفية وشاشة القفل</span>
              {notificationPermission === 'granted' ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
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

                {/* Quiet Hours (ساعات الهدوء) */}
                <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-amber-500" />
                      <div>
                        <div className="text-sm font-bold">ساعات الهدوء أثناء النوم:</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          إيقاف التنبيه الصوتي تلقائياً في وقت النوم
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdate({ quietHoursEnabled: !settings.quietHoursEnabled })}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer relative ${settings.quietHoursEnabled ? 'bg-emerald-500' : 'bg-black/20 dark:bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${settings.quietHoursEnabled ? 'translate-x-[-1.25rem]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {settings.quietHoursEnabled && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block mb-1">من الساعة:</span>
                        <input
                          type="time"
                          value={settings.quietHoursStart || '23:00'}
                          onChange={(e) => handleUpdate({ quietHoursStart: e.target.value })}
                          className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-xl px-3 py-1.5 font-sans text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block mb-1">إلى الساعة:</span>
                        <input
                          type="time"
                          value={settings.quietHoursEnd || '06:00'}
                          onChange={(e) => handleUpdate({ quietHoursEnd: e.target.value })}
                          className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-xl px-3 py-1.5 font-sans text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. RECITERS TAB */}
            {activeTab === 'reciters' && (
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">أصوات حقيقية نقية مدمجة:</span>
                    <span>جميع أصوات المشايخ الكرام مدمجة محلياً في التطبيق وتعمل مباشرة بدون الحاجة لأي اتصال بالإنترنت.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {DHIKR_RECITERS.map((reciter) => {
                    const isSelected = (settings.reciterId || 'mishary') === reciter.id;

                    return (
                      <div
                        key={reciter.id}
                        onClick={() => handleUpdate({ reciterId: reciter.id })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
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
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-arabic truncate">
                                {reciter.name}
                              </h4>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                <span>مدمج بالكامل</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {reciter.title}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons for this reciter: Preview */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handlePreviewReciter(reciter)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                              isPlayingPreview === reciter.id
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/10 border-transparent'
                            }`}
                            title="استماع لعينة من الصوت الحقيقي"
                          >
                            {isPlayingPreview === reciter.id ? (
                              <Pause size={14} className="animate-pulse" />
                            ) : (
                              <Play size={14} />
                            )}
                            <span>معاينة الصوت</span>
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

            {/* 4. BACKGROUND & LOCK SCREEN TAB */}
            {activeTab === 'background' && (
              <div className="space-y-4">
                {/* Status Hero Card */}
                <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-4.5 rounded-3xl border border-emerald-400/40 shadow-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                        🛡️
                      </div>
                      <div>
                        <h4 className="font-bold text-base font-arabic">
                          التنبيه الاحترافي في الخلفية وشاشة القفل
                        </h4>
                        <p className="text-xs text-emerald-200/90 mt-0.5">
                          يعمل التنبيه في الموعد المحدد سواءً كان التطبيق مفتوحاً أو مغلقاً أو الشاشة مقفلة
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-2xl p-3 space-y-2 border border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">إذن إشعارات شاشة القفل:</span>
                      {notificationPermission === 'granted' ? (
                        <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={13} />
                          <span>مُفعّل ومسموح</span>
                        </span>
                      ) : (
                        <button
                          onClick={handleRequestNotification}
                          className="text-amber-300 font-bold bg-amber-400/20 hover:bg-amber-400/30 px-2 py-0.5 rounded-md border border-amber-400/40 flex items-center gap-1 cursor-pointer"
                        >
                          <Bell size={13} />
                          <span>اضغط للسماح بالإذن</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/80">محرك الخلفية (Service Worker & MediaSession):</span>
                      <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={13} />
                        <span>نشط وجاهز 100%</span>
                      </span>
                    </div>
                  </div>

                  {/* Immediate Test Button */}
                  <div className="pt-1">
                    <button
                      onClick={handleTestLockScreen}
                      disabled={isTestingLockScreen}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    >
                      <Bell size={16} className="fill-slate-950 animate-bounce" />
                      <span>{isTestingLockScreen ? 'جاري إرسال التنبيه...' : '⚡ اختبار التنبيه على شاشة القفل والخلفية الآن'}</span>
                    </button>
                  </div>
                </div>

                {/* Vendor-Specific Battery Optimization Guide */}
                <div className="bg-white/80 dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold flex items-center gap-2">
                      <Smartphone size={16} className="text-amber-500" />
                      <span>دليل ضبط تشغيل الخلفية حسب نوع هاتفك:</span>
                    </label>
                  </div>

                  {/* Vendor Selection Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'samsung' as const, name: 'سامسونج (Samsung)' },
                      { id: 'xiaomi' as const, name: 'شاومي (Xiaomi / POCO)' },
                      { id: 'huawei' as const, name: 'هواوي (Huawei / Honor)' },
                      { id: 'oppo' as const, name: 'أوبو / ريلمي / ون بلس' },
                      { id: 'iphone' as const, name: 'آيفون (iOS)' },
                      { id: 'general' as const, name: 'أجهزة أخرى / كمبيوتر' },
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVendor(v.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedVendor === v.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>

                  {/* Instructions Content */}
                  <div className="p-3.5 bg-black/5 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/10 text-xs leading-relaxed space-y-2">
                    {selectedVendor === 'samsung' && (
                      <>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <BatteryCharging size={15} />
                          <span>خطوات هواتف سامسونج (One UI):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          <li>افتح <strong>الضبط (Settings)</strong> ➔ ثم <strong>التطبيقات (Apps)</strong>.</li>
                          <li>اختر تطبيق <strong>أنيس القلوب</strong> ➔ ثم <strong>البطارية (Battery)</strong>.</li>
                          <li>اختر <strong>غير مقيّد (Unrestricted)</strong> لضمان عمل التنبيه في موعده دائماً حتى والشاشة مقفلة.</li>
                        </ol>
                      </>
                    )}

                    {selectedVendor === 'xiaomi' && (
                      <>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Zap size={15} />
                          <span>خطوات هواتف شاومي وريدمي وبوكو (MIUI / HyperOS):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          <li>اضغط مطولاً على أيقونة التطبيق ➔ <strong>معلومات التطبيق (App Info)</strong>.</li>
                          <li>فعّل خيار <strong>التشغيل التلقائي (Autostart)</strong>.</li>
                          <li>انزل إلى <strong>موفر البطارية (Battery Saver)</strong> ➔ اختر <strong>لا توجد قيود (No restrictions)</strong>.</li>
                          <li>في شاشة التطبيقات المفتوحة، اسحب التطبيق للأسفل واضغط على <strong>رمز القفل 🔒</strong>.</li>
                        </ol>
                      </>
                    )}

                    {selectedVendor === 'huawei' && (
                      <>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck size={15} />
                          <span>خطوات هواتف هواوي وهونر (EMUI / HarmonyOS):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          <li>افتح <strong>الإعدادات</strong> ➔ <strong>البطارية</strong> ➔ <strong>تشغيل التطبيقات (App Launch)</strong>.</li>
                          <li>ابحث عن <strong>أنيس القلوب</strong> وغيّر الإعداد من تلقائي إلى <strong>يدوي</strong>.</li>
                          <li>فعّل: <strong>التشغيل التلقائي</strong> + <strong>التشغيل في الخلفية</strong>.</li>
                        </ol>
                      </>
                    )}

                    {selectedVendor === 'oppo' && (
                      <>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <BatteryCharging size={15} />
                          <span>خطوات هواتف أوبو وريلمي وون بلس (ColorOS / RealmeUI):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          <li>افتح <strong>إدارة التطبيقات</strong> ➔ اختر <strong>أنيس القلوب</strong>.</li>
                          <li>اختر <strong>استخدام البطارية</strong> ➔ فعّل <strong>السماح بالنشاط في الخلفية</strong>.</li>
                          <li>فعّل <strong>بدء التشغيل التلقائي</strong>.</li>
                        </ol>
                      </>
                    )}

                    {selectedVendor === 'iphone' && (
                      <>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Sparkles size={15} />
                          <span>خطوات أجهزة آبل (iOS / iPadOS):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          <li>تأكد من إضافة التطبيق للشاشة الرئيسية عبر متصفح سفاري (<strong>مشاركة ➔ إضافة للشاشة الرئيسية</strong>).</li>
                          <li>اسمح بإذن الإشعارات عند فتح التطبيق.</li>
                          <li>تأكد من عدم تفعيل وضع "عدم الإزعاج" أو تضمين أنيس القلوب في استثناءات التركيز.</li>
                        </ol>
                      </>
                    )}

                    {selectedVendor === 'general' && (
                      <>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={15} />
                          <span>لأجهزة الكمبيوتر والمتصفحات (Chrome / Edge / Firefox):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                          <li>اضغط على رمز القفل بجانب شريط العنوان واسمح بـ <strong>الإشعارات (Notifications)</strong>.</li>
                          <li>في إعدادات المتصفح، تأكد من تفعيل "متابعة تشغيل تطبيقات الخلفية عند إغلاق المتصفح".</li>
                        </ol>
                      </>
                    )}
                  </div>
                </div>
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
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              حفظ وإغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
