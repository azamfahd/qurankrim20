import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, VolumeX, X, Heart, CheckCircle2, 
  Settings as SettingsIcon, Sparkles, Clock, Music
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

  // Timer ref to manage countdown smoothly
  const autoDismissTimerRef = useRef<any>(null);

  // Subscribe to Dhikr Reminder triggers
  useEffect(() => {
    // Check if there is an active triggered dhikr already active/playing on mount
    const activeDhikr = DhikrReminderService.getActiveTriggeredDhikr();
    if (activeDhikr) {
      const settings = DhikrReminderService.getSettings();
      if (settings.showFloatingBanner) {
        setCurrentDhikr(activeDhikr);
        setHasRecited(false);
        setIsVisible(true);
        setProgressPercent(100);
      }
    }

    const unsubscribeReminder = DhikrReminderService.subscribeToReminder((dhikr) => {
      const settings = DhikrReminderService.getSettings();
      if (settings.showFloatingBanner) {
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
    }, 1400);
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
    if (hasRecited) return 'أُجِرت بحمد الله';
    if (isSalawat) return 'صلَّيت على النبي';
    if (isIstighfar) return 'استغفرت الله';
    return 'سبَّحت الله';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="dhikr-floating-card"
          id="dhikr-floating-card"
          initial={{ y: -50, opacity: 0, scale: 0.93, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, scale: 0.93, filter: 'blur(10px)' }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto w-[92%] sm:w-[320px] bg-slate-950/95 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_12px_rgba(245,158,11,0.05)] text-white overflow-hidden relative transition-all duration-300 group"
          dir="rtl"
        >
          {/* Subtle top light accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
          
          <div className="p-2.5 flex flex-col gap-1.5 relative z-10">
            {/* Header row: Status tag and control buttons */}
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-amber-400/95 tracking-wide truncate">
                  {isSalawat ? '✨ الصلاة على النبي ﷺ' : currentDhikr.categoryName}
                </span>
                {audioState.isPlaying && (
                  <span className="flex h-1.5 w-1.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                )}
              </div>

              {/* Ultra-compact action group */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Done/Praise (سبحت) as a small elegant pill */}
                <button
                  onClick={handleRecite}
                  disabled={hasRecited}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all duration-300 flex items-center gap-1 border cursor-pointer ${
                    hasRecited
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300 hover:scale-105 active:scale-95'
                  }`}
                >
                  {hasRecited ? (
                    <CheckCircle2 size={11} className="text-emerald-400" />
                  ) : (
                    <Heart size={11} className="fill-amber-300 text-amber-300" />
                  )}
                  <span>{getPraiseLabel()}</span>
                </button>

                {/* Audio play/mute button */}
                <button
                  onClick={handleToggleAudio}
                  className={`p-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center border cursor-pointer ${
                    audioState.isPlaying
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                  }`}
                  title={audioState.isPlaying ? 'إيقاف الصوت' : 'سماع'}
                >
                  {audioState.isPlaying ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>

                {/* Settings (if available) */}
                {onOpenSettings && (
                  <button
                    onClick={() => { DhikrReminderService.stopAudio(); setIsVisible(false); onOpenSettings(); }}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors border border-white/10 cursor-pointer"
                    title="تخصيص"
                  >
                    <SettingsIcon size={11} />
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all duration-300 border border-red-500/20 cursor-pointer"
                  title="إغلاق"
                >
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* Dhikr text: centered, medium-small size, elegant line spacing */}
            <div 
              className="py-1 cursor-pointer select-none" 
              onClick={handleRecite}
            >
              <div className="text-[13px] sm:text-[13.5px] font-bold text-slate-100 font-arabic leading-relaxed text-center tracking-wide hover:text-amber-200 transition-colors duration-200">
                {currentDhikr.text}
              </div>
              
              {currentDhikr.virtue && (
                <div className="mt-1.5 text-[9.5px] text-emerald-300/80 leading-normal text-center border-t border-white/5 pt-1 truncate max-w-full">
                  💡 {currentDhikr.virtue}
                </div>
              )}
            </div>
          </div>

          {/* Smooth progress bar at the very bottom */}
          <div className="w-full bg-white/5 h-[2px]">
            <div 
              className={`h-full transition-all ease-linear ${
                audioState.isPlaying
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  : 'bg-gradient-to-r from-amber-400 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
