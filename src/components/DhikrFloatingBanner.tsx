import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, VolumeX, X, Heart, CheckCircle2, 
  Settings as SettingsIcon, Sparkles, BookOpen
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
  const [isHovered, setIsHovered] = useState(false);

  // Timer ref to manage countdown smoothly
  const autoDismissTimerRef = useRef<any>(null);

  // Subscribe to Dhikr Reminder triggers
  useEffect(() => {
    // Check if there is an active triggered dhikr already active/playing on mount
    const activeDhikr = DhikrReminderService.getActiveTriggeredDhikr();
    if (activeDhikr) {
      const settings = DhikrReminderService.getSettings();
      if (settings.showFloatingBanner !== false) {
        setCurrentDhikr(activeDhikr);
        setHasRecited(false);
        setIsVisible(true);
        setProgressPercent(100);
      }
    }

    const unsubscribeReminder = DhikrReminderService.subscribeToReminder((dhikr) => {
      const settings = DhikrReminderService.getSettings();
      if (settings.showFloatingBanner !== false) {
        setCurrentDhikr(dhikr);
        setHasRecited(false);
        setIsVisible(true);
        setProgressPercent(100);

        // Clear any previous timer
        if (autoDismissTimerRef.current) {
          clearInterval(autoDismissTimerRef.current);
          autoDismissTimerRef.current = null;
        }
      }
    });

    // Subscribe to Audio Playback State
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

  // Smart Banner Lifecycle
  useEffect(() => {
    if (!isVisible || !currentDhikr) {
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      return;
    }

    // While audio is actively playing, don't dismiss! Show audio progress
    if (audioState.isPlaying) {
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      if (audioState.duration && audioState.duration > 0 && audioState.currentTime !== undefined) {
        const audioProgress = Math.min(100, Math.max(0, (audioState.currentTime / audioState.duration) * 100));
        setProgressPercent(100 - audioProgress);
      } else {
        setProgressPercent(100);
      }
      return;
    }

    // If hovered by user, pause countdown to allow comfortable reading
    if (isHovered) {
      if (autoDismissTimerRef.current) {
        clearInterval(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      return;
    }

    const settings = DhikrReminderService.getSettings();
    const readingGraceSeconds = Math.max(14, settings.autoDismissSeconds || 16);
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
  }, [isVisible, currentDhikr, audioState.isPlaying, audioState.currentTime, audioState.duration, isHovered]);

  const handleRecite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentDhikr || hasRecited) return;

    setHasRecited(true);
    DhikrReminderService.recordRecitation(currentDhikr.category);

    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 60, 40]); } catch {}
    }

    setTimeout(() => {
      DhikrReminderService.stopAudio();
      setIsVisible(false);
    }, 1500);
  };

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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    DhikrReminderService.stopAudio();
    setIsVisible(false);
  };

  if (!currentDhikr) return null;

  const isSalawat = currentDhikr.category === 'prophet_salawat';
  const isIstighfar = currentDhikr.category === 'istighfar';
  const settings = DhikrReminderService.getSettings();
  const currentReciter = DHIKR_RECITERS.find(r => r.id === (settings.reciterId || 'mishary'));

  const getPraiseLabel = () => {
    if (hasRecited) return 'أُجِرت بحمد الله 🤍';
    if (isSalawat) return 'صلَّيت على النبي ﷺ';
    if (isIstighfar) return 'استغفرت الله 💧';
    return 'سبَّحت الله 📿';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="dhikr-floating-card"
          id="dhikr-floating-card"
          initial={{ opacity: 0, y: -45, scale: 0.92, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -30, scale: 0.95, filter: 'blur(6px)' }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] w-[95%] sm:w-[410px] max-w-[96vw] bg-gradient-to-b from-[#091814]/98 via-[#06120e]/98 to-[#040c0a]/98 backdrop-blur-2xl border border-amber-500/30 text-white rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.18)] overflow-hidden select-none pointer-events-auto"
          dir="rtl"
        >
          {/* Subtle top golden light beam */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Ambient radial glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 relative z-10">
            {/* Header Row: Spiritual Emblem + Title & Status + Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Spiritual Emblem */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 bg-amber-400/20 rounded-2xl blur-sm animate-pulse" />
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 relative z-10 shadow-lg border border-amber-300/40">
                    <span className="text-lg sm:text-xl select-none" role="img" aria-label="ذكر">
                      {isSalawat ? '✨' : isIstighfar ? '💧' : '📿'}
                    </span>
                  </div>
                </div>

                {/* Title and Category info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm text-amber-300 truncate leading-tight">
                      {isSalawat ? 'صلِّ على النبي ﷺ' : (currentDhikr.categoryName || 'تذكير بذكر الله')}
                    </h3>
                    {audioState.isPlaying && (
                      <div className="flex items-end gap-[2px] h-3 px-1 bg-amber-500/20 border border-amber-500/30 rounded-md shrink-0">
                        <span className="w-[2px] h-2.5 bg-amber-400 rounded-full animate-[bounce_0.75s_infinite_100ms]" />
                        <span className="w-[2px] h-1.5 bg-amber-300 rounded-full animate-[bounce_0.75s_infinite_350ms]" />
                        <span className="w-[2px] h-3 bg-amber-400 rounded-full animate-[bounce_0.75s_infinite_200ms]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-300/90 truncate mt-0.5">
                    {currentReciter?.name ? `بصوت ${currentReciter.name}` : 'تذكير روحي طيب'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Audio play/mute button */}
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    audioState.isPlaying
                      ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                  }`}
                  title={audioState.isPlaying ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                  aria-label={audioState.isPlaying ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                >
                  {audioState.isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                {/* Settings button */}
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => { DhikrReminderService.stopAudio(); setIsVisible(false); onOpenSettings(); }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                    title="تخصيص التنبيهات"
                    aria-label="تخصيص التنبيهات"
                  >
                    <SettingsIcon size={14} />
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 flex items-center justify-center border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                  title="إغلاق التنبيه"
                  aria-label="إغلاق التنبيه"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Dhikr text box */}
            <div 
              className="bg-slate-900/60 rounded-xl sm:rounded-2xl p-3 border border-amber-500/20 shadow-inner cursor-pointer"
              onClick={handleRecite}
            >
              <div className="text-sm sm:text-base font-bold text-amber-100 font-arabic leading-relaxed text-center tracking-wide hover:text-amber-200 transition-colors">
                {currentDhikr.text}
              </div>

              {currentDhikr.virtue && (
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-1 text-[11px] text-emerald-300/95 text-center leading-normal">
                  <Sparkles size={12} className="text-amber-400 shrink-0" />
                  <span>{currentDhikr.virtue}</span>
                </div>
              )}
            </div>

            {/* Recite confirmation button */}
            <div className="flex items-center justify-center pt-0.5">
              <button
                type="button"
                onClick={handleRecite}
                disabled={hasRecited}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                  hasRecited
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black shadow-md active:scale-98'
                }`}
              >
                {hasRecited ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{getPraiseLabel()}</span>
                  </>
                ) : (
                  <>
                    <Heart size={15} className="fill-slate-950 text-slate-950" />
                    <span>اضغط هنا لتسجيل الأجر: {getPraiseLabel()}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Smooth progress bar at the very bottom */}
          <div className="w-full bg-white/5 h-[3px]">
            <div 
              className={`h-full transition-all ease-linear ${
                audioState.isPlaying
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

