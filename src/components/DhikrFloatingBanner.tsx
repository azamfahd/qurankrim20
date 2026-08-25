import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, VolumeX, X, Heart, CheckCircle2, 
  Settings as SettingsIcon, Sparkles, BookOpen, Clock, Music
} from 'lucide-react';
import { DhikrItem } from '../types';
import { DhikrReminderService, DHIKR_RECITERS, DhikrAudioState } from '../services/dhikrReminderService';

interface DhikrFloatingBannerProps {
  onOpenSettings?: () => void;
}

export const DhikrFloatingBanner: React.FC<DhikrFloatingBannerProps> = ({ onOpenSettings }) => {
  const [currentDhikr, setCurrentDhikr] = useState<DhikrItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecited, setHasRecited] = useState(false);
  const [audioState, setAudioState] = useState<DhikrAudioState>({ isPlaying: false });
  const [progressPercent, setProgressPercent] = useState(100);
  const [showVirtue, setShowVirtue] = useState(false);

  // Timer ref to manage countdown smoothly
  const autoDismissTimerRef = useRef<any>(null);

  // Subscribe to Dhikr Reminder triggers
  useEffect(() => {
    const unsubscribeReminder = DhikrReminderService.subscribeToReminder((dhikr) => {
      const settings = DhikrReminderService.getSettings();
      if (settings.showFloatingBanner) {
        setCurrentDhikr(dhikr);
        setHasRecited(false);
        setShowVirtue(false);
        setIsVisible(true);
        setProgressPercent(100);

        // Clear any previous timer
        if (autoDismissTimerRef.current) {
          clearInterval(autoDismissTimerRef.current);
          autoDismissTimerRef.current = null;
        }
      }
    });

    // Subscribe to Audio Playback State (to keep banner open while voice is playing)
    const unsubscribeAudio = DhikrReminderService.subscribeToAudioState((state) => {
      setAudioState(state);
    });

    return () => {
      unsubscribeReminder();
      unsubscribeAudio();
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
      }
    };
  }, []);

  // Smart Banner Lifecycle: Keep open during audio playback, then start grace reading timer
  useEffect(() => {
    if (!isVisible || !currentDhikr) {
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      return;
    }

    // 1. If audio is still playing, keep banner open and do NOT dismiss!
    if (audioState.isPlaying) {
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      // Calculate audio progress if available
      if (audioState.duration && audioState.duration > 0 && audioState.currentTime !== undefined) {
        const audioProgress = Math.min(100, Math.max(0, (audioState.currentTime / audioState.duration) * 100));
        setProgressPercent(100 - audioProgress);
      } else {
        setProgressPercent(100);
      }
      return;
    }

    // 2. Audio is not playing (or just completed). Start reading grace countdown
    const settings = DhikrReminderService.getSettings();
    const readingGraceSeconds = Math.max(8, settings.autoDismissSeconds || 12);
    const stepMs = 100;
    const totalSteps = (readingGraceSeconds * 1000) / stepMs;
    let currentStep = 0;

    if (autoDismissTimerRef.current) {
      clearInterval(autoDismissTimerRef.current);
    }

    autoDismissTimerRef.current = setInterval(() => {
      currentStep++;
      const remaining = Math.max(0, 100 - (currentStep / totalSteps) * 100);
      setProgressPercent(remaining);

      if (currentStep >= totalSteps) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
        setIsVisible(false);
      }
    }, stepMs);

    return () => {
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
    };
  }, [isVisible, currentDhikr, audioState.isPlaying, audioState.currentTime, audioState.duration]);

  /**
   * تسجيل أداء الذكر والتسبيح وإيقاف الصوت تلقائياً
   */
  const handleRecite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentDhikr || hasRecited) return;

    setHasRecited(true);
    DhikrReminderService.recordRecitation(currentDhikr.category);

    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 60, 40]); } catch {}
    }

    // Give user visual acknowledgment of reward then dismiss
    setTimeout(() => {
      DhikrReminderService.stopAudio();
      setIsVisible(false);
    }, 1400);
  };

  /**
   * إعادة تشغيل الصوت الحقيقي للذكر
   */
  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentDhikr) return;

    if (audioState.isPlaying) {
      DhikrReminderService.stopAudio();
    } else {
      const settings = DhikrReminderService.getSettings();
      DhikrReminderService.playDhikrAlert(currentDhikr, settings);
    }
  };

  /**
   * إغلاق الشعار وإيقاف الصوت فوراً وتلقائياً
   */
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Stop audio immediately as requested
    DhikrReminderService.stopAudio();
    setIsVisible(false);
  };

  if (!isVisible || !currentDhikr) return null;

  const isSalawat = currentDhikr.category === 'prophet_salawat';
  const isIstighfar = currentDhikr.category === 'istighfar';
  const settings = DhikrReminderService.getSettings();
  const currentReciter = DHIKR_RECITERS.find(r => r.id === (settings.reciterId || 'mishary'));

  const getPraiseLabel = () => {
    if (hasRecited) return 'أُجِرت بحمد الله';
    if (isSalawat) return 'صلَّيت على النبي';
    if (isIstighfar) return 'استغفرت الله';
    return 'سبَّحت الله';
  };

  return (
    <AnimatePresence>
      <div 
        id="dhikr-floating-banner-container"
        className="fixed top-3 sm:top-5 left-0 right-0 z-[70] flex justify-center px-3 sm:px-4 pointer-events-none"
      >
        <motion.div
          id="dhikr-floating-card"
          initial={{ y: -50, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.94 }}
          transition={{ type: 'spring', damping: 24, stiffness: 340 }}
          className="pointer-events-auto w-full max-w-xl bg-slate-900/95 dark:bg-[#031d17]/95 backdrop-blur-2xl border border-amber-400/40 hover:border-amber-400/80 rounded-3xl shadow-[0_16px_45px_rgba(0,0,0,0.6)] text-white overflow-hidden relative transition-all"
          dir="rtl"
        >
          {/* Top Emerald-Gold Gradient Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 opacity-95"></div>

          {/* Main Content Area */}
          <div className="p-3.5 sm:p-4.5 space-y-2.5">
            {/* Top Bar: Reciter & Category Badge + Audio Status + Controls */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              {/* Right: Badge & Reciter */}
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-inner shrink-0 border ${
                    audioState.isPlaying 
                      ? 'bg-amber-400/25 border-amber-300 animate-pulse text-amber-300' 
                      : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  }`}
                  title={currentReciter ? `بصوت: ${currentReciter.name}` : 'تنبيه الأذكار'}
                >
                  {audioState.isPlaying ? (
                    <span className="text-base">🎙️</span>
                  ) : (
                    <span>{currentReciter?.avatar || (isSalawat ? '✨' : '🌿')}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-300/95 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-md">
                      {isSalawat ? '✨ الصلاة على النبي ﷺ' : currentDhikr.categoryName}
                    </span>

                    {currentReciter && (
                      <span className="text-[10px] text-emerald-200/80 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md truncate">
                        {currentReciter.name}
                      </span>
                    )}

                    {audioState.isPlaying && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>جاري تلاوة الذكر</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Left: Top Actions (Settings & Close) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Audio Play/Stop Button */}
                <button
                  id="dhikr-banner-audio-btn"
                  onClick={handleToggleAudio}
                  className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                    audioState.isPlaying
                      ? 'bg-amber-400/25 border-amber-300 text-amber-300 hover:bg-amber-400/35'
                      : 'bg-white/5 hover:bg-white/15 text-white/75 hover:text-white border-white/10'
                  }`}
                  title={audioState.isPlaying ? 'إيقاف الصوت' : 'إعادة سماع صوت القارئ'}
                >
                  {audioState.isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                {/* Settings */}
                {onOpenSettings && (
                  <button
                    id="dhikr-banner-settings-btn"
                    onClick={() => { 
                      DhikrReminderService.stopAudio();
                      setIsVisible(false); 
                      onOpenSettings(); 
                    }}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors border border-white/10"
                    title="تخصيص القارئ والأذكار"
                  >
                    <SettingsIcon size={15} />
                  </button>
                )}

                {/* Close Button - Automatically stops audio & dismisses banner */}
                <button
                  id="dhikr-banner-close-btn"
                  onClick={handleClose}
                  className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors border border-red-500/20"
                  title="إغلاق الشعار وإيقاف الصوت"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Middle: Full Dhikr Text Display (No Line Clamping!) */}
            <div 
              className="py-1 cursor-pointer select-none"
              onClick={handleRecite}
            >
              <div className="text-sm sm:text-base md:text-lg font-bold text-slate-50 dark:text-amber-50/95 font-arabic leading-relaxed text-right tracking-wide">
                {currentDhikr.text}
              </div>

              {/* Virtue & Source (Expandable / Visible) */}
              {currentDhikr.virtue && (
                <div className="mt-2 bg-black/25 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2 sm:p-2.5 text-[11px] sm:text-xs text-emerald-200/90 flex items-start gap-2">
                  <Sparkles size={14} className="text-amber-300 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-amber-300 block mb-0.5">فضل الذكر:</span>
                    <span>{currentDhikr.virtue}</span>
                    {currentDhikr.source && (
                      <span className="text-white/45 block text-[10px] mt-1 font-sans">
                        [ {currentDhikr.source} ]
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Recite/Ajer Button + Audio wave status */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                {audioState.isPlaying ? (
                  <span className="text-amber-300/90 font-bold flex items-center gap-1">
                    <Music size={12} className="animate-bounce" />
                    <span>يستمر العرض حتى نهاية تلاوة الصوت</span>
                  </span>
                ) : (
                  <span className="text-slate-300/70 flex items-center gap-1">
                    <Clock size={12} />
                    <span>اضغط للتسبيح وتسجيل الذكر</span>
                  </span>
                )}
              </div>

              {/* Recite Pill Button */}
              <button
                id="dhikr-banner-recite-btn"
                onClick={handleRecite}
                disabled={hasRecited}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer border shadow-md ${
                  hasRecited
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : isSalawat
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border-amber-300 font-black scale-100 hover:scale-[1.02] active:scale-95'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 scale-100 hover:scale-[1.02] active:scale-95'
                }`}
                title="تسجيل الذكر في ميزان حسناتك"
              >
                {hasRecited ? (
                  <>
                    <CheckCircle2 size={16} className="text-white animate-pulse" />
                    <span>{getPraiseLabel()}</span>
                  </>
                ) : (
                  <>
                    <Heart size={15} className={isSalawat ? 'fill-slate-950 text-slate-950' : 'fill-amber-300 text-amber-300'} />
                    <span>{getPraiseLabel()}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Countdown & Audio Progress Bar */}
          <div className="w-full bg-white/5 h-[3px] overflow-hidden">
            <div 
              className={`h-full transition-all ease-linear ${
                audioState.isPlaying
                  ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 duration-200'
                  : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 duration-100'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
