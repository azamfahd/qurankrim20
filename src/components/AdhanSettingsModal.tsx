import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Volume2, VolumeX, Save, Bell, BellRing, Info, 
  Check, Play, Square, Sparkles, Moon, Sun, Sunrise, Sunset, Clock, Compass, ShieldCheck,
  Download, Trash2, WifiOff, HardDrive, Loader2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings, AdhanSettings } from '../types';
import { MUEZZINS_LIST, AdhanAudioEngine, AdhanOfflineManager } from '../services/adhanService';

interface AdhanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const defaultAdhanSettings: AdhanSettings = {
  enabled: true,
  muezzin: 'mishary',
  fajrEnabled: true,
  dhuhrEnabled: true,
  asrEnabled: true,
  maghribEnabled: true,
  ishaEnabled: true,
  volume: 85,
  calculationMethod: 'MuslimWorldLeague',
  autoPlayLiveAdhan: true,
};

const CALCULATION_METHODS = [
  { id: 'MuslimWorldLeague', name: 'رابطة العالم الإسلامي', desc: 'معتمد في معظم أنحاء العالم واليمن' },
  { id: 'UmmAlQura', name: 'أم القرى (مكة المكرمة)', desc: 'السعودية والخليج العربي' },
  { id: 'Egyptian', name: 'الهيئة المصرية العامة للمساحة', desc: 'مصر وبلاد الشام وشمال أفريقيا' },
  { id: 'Karachi', name: 'جامعة العلوم الإسلامية بكراتشي', desc: 'باكستان والهند وبنغلاديش' },
  { id: 'Dubai', name: 'دائرة الشؤون الإسلامية (دبي)', desc: 'الإمارات ودول الخليج' },
];

const PRAYERS_CONFIG = [
  { key: 'fajrEnabled' as const, name: 'الفجر', icon: Sunrise, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { key: 'dhuhrEnabled' as const, name: 'الظهر', icon: Sun, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { key: 'asrEnabled' as const, name: 'العصر', icon: Sun, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { key: 'maghribEnabled' as const, name: 'المغرب', icon: Sunset, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { key: 'ishaEnabled' as const, name: 'العشاء', icon: Moon, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
];

export const AdhanSettingsModal: React.FC<AdhanSettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [adhan, setAdhan] = useState<AdhanSettings>(settings.adhanSettings || defaultAdhanSettings);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [playingMuezzinId, setPlayingMuezzinId] = useState<string | null>(null);

  // Offline caching states
  const [downloadedMuezzinIds, setDownloadedMuezzinIds] = useState<string[]>([]);
  const [totalCachedBytes, setTotalCachedBytes] = useState<number>(0);
  const [downloadingMap, setDownloadingMap] = useState<Record<string, number>>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  const refreshOfflineStatus = async () => {
    try {
      const status = await AdhanOfflineManager.getAllDownloadedStatus();
      setDownloadedMuezzinIds(status.downloadedIds);
      setTotalCachedBytes(status.totalSizeBytes);
    } catch (e) {
      console.warn("Failed to check offline adhan status:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAdhan(settings.adhanSettings || defaultAdhanSettings);
      setPlayingMuezzinId(null);
      refreshOfflineStatus();
    } else {
      AdhanAudioEngine.stop();
      setPlayingMuezzinId(null);
    }
  }, [isOpen, settings]);

  const togglePreview = async (muezzinId: string) => {
    if (playingMuezzinId === muezzinId) {
      AdhanAudioEngine.stop();
      setPlayingMuezzinId(null);
      return;
    }

    setPlayingMuezzinId(muezzinId);
    const result = await AdhanAudioEngine.play(
      muezzinId,
      adhan.volume,
      () => setPlayingMuezzinId(null),
      () => setPlayingMuezzinId(muezzinId)
    );

    if (!result.success) {
      setPlayingMuezzinId(null);
      setToastMessage('تعذر تشغيل الصوت. يرجى التأكد من تحميل الملف أو الاتصال بالإنترنت.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDownloadMuezzin = async (muezzinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingMap[muezzinId] !== undefined) return;

    setDownloadingMap(prev => ({ ...prev, [muezzinId]: 10 }));
    const result = await AdhanOfflineManager.downloadMuezzinAudio(muezzinId, (percent) => {
      setDownloadingMap(prev => ({ ...prev, [muezzinId]: percent }));
    });

    setDownloadingMap(prev => {
      const next = { ...prev };
      delete next[muezzinId];
      return next;
    });

    if (result.success) {
      await refreshOfflineStatus();
      const mName = MUEZZINS_LIST.find(m => m.id === muezzinId)?.name || 'المؤذن';
      setToastMessage(`تم تحميل وتخزين أذان (${mName}) محلياً! يعمل الآن دون إنترنت.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setToastMessage(`تعذر تحميل الملف: ${result.error || 'يرجى التحقق من الاتصال بالإنترنت'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const handleDeleteOfflineMuezzin = async (muezzinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await AdhanOfflineManager.deleteMuezzin(muezzinId);
    await refreshOfflineStatus();
    const mName = MUEZZINS_LIST.find(m => m.id === muezzinId)?.name || 'المؤذن';
    setToastMessage(`تم حذف الملف الصوتي لـ (${mName}) من الذاكرة المحلية.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);

    let successCount = 0;
    for (const m of MUEZZINS_LIST) {
      if (!downloadedMuezzinIds.includes(m.id)) {
        setDownloadingMap(prev => ({ ...prev, [m.id]: 20 }));
        const res = await AdhanOfflineManager.downloadMuezzinAudio(m.id, (p) => {
          setDownloadingMap(prev => ({ ...prev, [m.id]: p }));
        });
        if (res.success) successCount++;
        setDownloadingMap(prev => {
          const next = { ...prev };
          delete next[m.id];
          return next;
        });
      }
    }

    await refreshOfflineStatus();
    setIsDownloadingAll(false);
    setToastMessage('تم تحميل وحفظ أصوات جميع المؤذنين محلياً بنجاح! التطبيق جاهز تماماً للعمل أوفلاين.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSave = async () => {
    AdhanAudioEngine.stop();
    setPlayingMuezzinId(null);

    // If selected muezzin is not downloaded yet, trigger background download
    if (adhan.muezzin && !downloadedMuezzinIds.includes(adhan.muezzin)) {
      AdhanOfflineManager.downloadMuezzinAudio(adhan.muezzin).then(() => {
        refreshOfflineStatus();
      }).catch(() => {});
    }

    try {
      localStorage.setItem('anis_adhan_settings', JSON.stringify(adhan));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (adhan.enabled) {
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          try {
            await Notification.requestPermission();
          } catch {
            // Ignore permission request error
          }
        }
      }
    }

    onSave({
      ...settings,
      adhanSettings: adhan
    });

    setToastMessage('تم حفظ إعدادات الأذان والمواقيت بنجاح! الأصوات والتوقيتات مفعلة بدقة.');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1800);
  };

  const togglePrayer = (prayer: keyof AdhanSettings) => {
    setAdhan(prev => ({ ...prev, [prayer]: !prev[prayer] }));
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 ميغابايت';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} ميغابايت`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md overflow-hidden"
        >
          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-[#fdfbf7] dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border-2 border-[var(--color-gold)]/50 overflow-hidden flex flex-col z-10 text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-gold)] to-[var(--color-primary-light)] shrink-0"></div>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[var(--color-border)] dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-[var(--color-gold-light)] shadow-sm border border-[var(--color-gold)]/30 shrink-0">
                  <BellRing size={19} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-[var(--color-primary-dark)] dark:text-emerald-400 flex items-center gap-1.5">
                    <span>إعدادات الأذان والمواقيت</span>
                    <Sparkles size={14} className="text-[var(--color-gold)]" />
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">أصوات المؤذنين، التخزين بدون إنترنت، والمواقيت الفلكية</p>
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

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              
              {/* Main Master Switch */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-white dark:via-slate-800/80 to-amber-500/10 dark:from-slate-800/90 dark:to-slate-800/40 p-4 rounded-2xl border-2 border-emerald-500/25 dark:border-emerald-500/30 shadow-2xs flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[var(--color-primary-dark)] dark:text-emerald-300">تفعيل صوت الأذان والتنبيهات</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${adhan.enabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {adhan.enabled ? 'مفعل' : 'معطل'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">تشغيل صوت الأذان تلقائياً عند دخول وقت كل صلاة مع إشعار بالدعاء</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={adhan.enabled} 
                    onChange={(e) => setAdhan({...adhan, enabled: e.target.checked})} 
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[var(--color-primary)]"></div>
                </label>
              </div>

              {/* Offline Storage Status Banner */}
              <div className="bg-gradient-to-br from-indigo-500/10 via-white dark:via-slate-800/90 to-blue-500/10 p-3.5 sm:p-4 rounded-2xl border border-indigo-500/30 dark:border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl">
                      <HardDrive size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>العمل بدون إنترنت (التخزين المحلي)</span>
                        <WifiOff size={12} className="text-indigo-500" />
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {downloadedMuezzinIds.length > 0 
                          ? `${downloadedMuezzinIds.length} من ${MUEZZINS_LIST.length} أصوات محفوظة محلياً (${formatSize(totalCachedBytes)})`
                          : 'لم يتم تحميل أي أذان محلياً بعد'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll || downloadedMuezzinIds.length === MUEZZINS_LIST.length}
                    className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  >
                    {isDownloadingAll ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>جاري التحميل...</span>
                      </>
                    ) : downloadedMuezzinIds.length === MUEZZINS_LIST.length ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>الكل محمّل</span>
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        <span>تحميل الكل أوفلاين</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Muezzin Voice Picker with Download per item */}
              <div className={`space-y-2.5 transition-all duration-200 ${!adhan.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Volume2 size={16} className="text-[var(--color-gold)]" />
                    <span>صوت المؤذن المعتمد وتحميله محلياً</span>
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">اختر، استمع، وحمّل للعمل بدون نت</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {MUEZZINS_LIST.map(m => {
                    const isSelected = adhan.muezzin === m.id;
                    const isPlaying = playingMuezzinId === m.id;
                    const isDownloaded = downloadedMuezzinIds.includes(m.id);
                    const isDownloading = downloadingMap[m.id] !== undefined;
                    const progressPercent = downloadingMap[m.id] || 0;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setAdhan({...adhan, muezzin: m.id})}
                        className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected 
                            ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-2xs' 
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                      >
                        {/* Radio Checkbox & Info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                          }`}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                          
                          <div className="truncate flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs sm:text-sm truncate">{m.name}</p>
                              {isDownloaded ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700/50">
                                  <CheckCircle2 size={10} />
                                  <span>محمّل أوفلاين</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500">
                                  (عبر الإنترنت)
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{m.description} • {m.country}</p>
                          </div>
                        </div>

                        {/* Action Controls: Preview & Offline Download */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Download / Delete Cache Button */}
                          {isDownloading ? (
                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                              <Loader2 size={12} className="animate-spin" />
                              <span>%{progressPercent}</span>
                            </div>
                          ) : isDownloaded ? (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteOfflineMuezzin(m.id, e)}
                              className="p-2 rounded-xl text-xs font-semibold flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="حذف من الذاكرة المحلية لتحرير المساحة"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleDownloadMuezzin(m.id, e)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-slate-100 dark:bg-slate-700/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-600 transition-all cursor-pointer active:scale-95"
                              title="تحميل الأذان للعمل بدون إنترنت"
                            >
                              <Download size={12} />
                              <span>تحميل محلي</span>
                            </button>
                          )}

                          {/* Audio Preview Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePreview(m.id);
                            }}
                            className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isPlaying 
                                ? 'bg-rose-500 text-white animate-pulse shadow-xs' 
                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-[var(--color-gold)]/20 text-slate-600 dark:text-slate-300 hover:text-[var(--color-primary)]'
                            }`}
                            title={isPlaying ? "إيقاف المعاينة" : "استماع لصوت الأذان"}
                          >
                            {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculation Method Selection */}
              <div className={`space-y-2.5 transition-all duration-200 ${!adhan.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Compass size={16} className="text-[var(--color-gold)]" />
                    <span>طريقة حساب المواقيت الفلكية</span>
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">حسب منطقتك</span>
                </div>

                <div className="space-y-1.5">
                  {CALCULATION_METHODS.map(method => {
                    const isSelected = (adhan.calculationMethod || 'MuslimWorldLeague') === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setAdhan({...adhan, calculationMethod: method.id})}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm">{method.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{method.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                          isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Prayers Toggles */}
              <div className={`space-y-2.5 transition-all duration-200 ${!adhan.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock size={16} className="text-[var(--color-gold)]" />
                    <span>تخصيص أذان الصلوات</span>
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">تفعيل/تعطيل لكل صلاة</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRAYERS_CONFIG.map(prayer => {
                    const isChecked = adhan[prayer.key as keyof AdhanSettings] as boolean;
                    const Icon = prayer.icon;

                    return (
                      <div 
                        key={prayer.key} 
                        onClick={() => togglePrayer(prayer.key)}
                        className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center gap-1.5 ${
                          isChecked 
                            ? `${prayer.bg} ${prayer.border} shadow-2xs` 
                            : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs ${prayer.color}`}>
                            <Icon size={14} />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{prayer.name}</span>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isChecked} 
                            readOnly
                          />
                          <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:right-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-[var(--color-primary)]"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              <div className={`bg-white dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all duration-200 ${!adhan.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    {adhan.volume === 0 ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-[var(--color-primary-light)]" />}
                    <span>مستوى صوت الأذان والتنبيه</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-xs text-[var(--color-primary-dark)] dark:text-emerald-300">
                    %{adhan.volume}
                  </span>
                </div>

                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={adhan.volume} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAdhan({...adhan, volume: val});
                    AdhanAudioEngine.setVolume(val);
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
              </div>

              {/* Backend & Accuracy status card */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-emerald-900 dark:text-emerald-200 text-xs">
                <div className="p-1.5 bg-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-xs">حساب فلكي دقيق وموثق بدون اتصال:</p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    يتم احتساب المواقيت بدقة فلكية تامة محلياً داخل جهازك دون الحاجة لسيرفر خارجي، والأصوات المحمّلة تنطلق فوراً دون اتصال بالإنترنت.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-3.5 sm:p-4 border-t border-[var(--color-border)] dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md flex gap-3 shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button 
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] hover:opacity-95 text-white py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer border border-[var(--color-gold)]/40 active:scale-98"
              >
                <Save size={17} />
                <span>حفظ وتطبيق الإعدادات</span>
              </button>
            </div>

          </motion.div>

          {/* Toast Notification Alert */}
          <AnimatePresence>
            {showToast && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-5 left-1/2 -translate-x-1/2 bg-[var(--color-primary-dark)] border-2 border-[var(--color-gold)] text-white px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-xs sm:text-sm flex items-center gap-3 z-[120] w-[90%] max-w-md"
              >
                <div className="p-1.5 bg-[var(--color-gold)]/20 rounded-xl text-[var(--color-gold-light)] shrink-0">
                  <Bell size={18} />
                </div>
                <p className="flex-1 leading-relaxed text-right">{toastMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

