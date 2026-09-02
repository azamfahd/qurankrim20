import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VolumeX, Play, X, BellRing, Sparkles, Volume2 } from 'lucide-react';
import { AdhanAudioEngine } from '../services/adhanService';

interface AdhanNotificationBannerProps {
  prayerName: string | null;
  isOpen: boolean;
  onClose: () => void;
  muezzinName?: string;
  muezzinId?: string;
  volume?: number;
}

export const AdhanNotificationBanner: React.FC<AdhanNotificationBannerProps> = ({
  prayerName,
  isOpen,
  onClose,
  muezzinName = 'الشيخ مشاري راشد العفاسي',
  muezzinId = 'mishary',
  volume = 85
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsub = AdhanAudioEngine.subscribe(state => {
      setIsPlaying(state.isPlaying);
    });
    return () => unsub();
  }, []);

  if (!isOpen || !prayerName) return null;

  const handleStop = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    AdhanAudioEngine.stop();
    onClose();
  };

  const handleForcePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    AdhanAudioEngine.unlockAudioContext();
    AdhanAudioEngine.play(
      muezzinId, 
      volume, 
      () => onClose(), 
      undefined, 
      prayerName
    );
  };

  return (
    <AnimatePresence>
      <motion.div key="AdhanNotificationBanner-anim-1"
        initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -30, scale: 0.95, filter: 'blur(5px)' }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={() => {
          if (!isPlaying) {
            handleForcePlay();
          }
        }}
        className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] w-[94%] sm:w-[340px] bg-slate-950/95 backdrop-blur-xl border border-amber-500/20 text-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.12)] overflow-hidden group cursor-pointer select-none"
        dir="rtl"
      >
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        <div className="p-3 flex flex-col gap-2 relative z-10">
          {/* Main Info Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                {isPlaying && (
                  <div className="absolute -inset-1 bg-amber-400/30 rounded-full animate-ping opacity-75"></div>
                )}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white relative z-10 shadow-md border border-amber-300/30">
                  {isPlaying ? (
                    <Volume2 size={14} className="animate-pulse text-amber-100" />
                  ) : (
                    <BellRing size={14} className="animate-[wiggle_1s_ease-in-out_infinite]" />
                  )}
                </div>
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[12.5px] text-amber-300 leading-none">أذان {prayerName}</span>
                  {isPlaying && (
                    <div className="flex items-end gap-[2px] h-3 px-1">
                      <span className="w-[2px] h-3 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_100ms]"></span>
                      <span className="w-[2px] h-2 bg-amber-300 rounded-full animate-[bounce_0.8s_infinite_300ms]"></span>
                      <span className="w-[2px] h-3.5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_200ms]"></span>
                    </div>
                  )}
                </div>
                <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-none truncate">بصوت {muezzinName}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              {isPlaying ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center gap-1 px-2 h-7 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 rounded-lg transition-all active:scale-95 cursor-pointer text-[10px] font-medium"
                  title="إيقاف صوت الأذان"
                >
                  <VolumeX size={12} />
                  <span>إيقاف</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleForcePlay}
                  className="flex items-center gap-1 px-2.5 h-7 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-all active:scale-95 cursor-pointer text-[10.5px] font-medium animate-pulse"
                  title="تشغيل صوت الأذان"
                >
                  <Play size={11} className="fill-current ml-0.5" />
                  <span>استماع</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPlaying) {
                    AdhanAudioEngine.stop();
                  }
                  onClose();
                }}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
                title="إغلاق وإيقاف الأذان"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Compact Post-Adhan Du'a */}
          <div className="bg-black/30 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5 border border-white/5 shadow-inner">
            <Sparkles size={11} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <p className="font-arabic text-[10px] sm:text-[11px] text-slate-200 leading-relaxed text-right font-medium">
              «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا»
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

