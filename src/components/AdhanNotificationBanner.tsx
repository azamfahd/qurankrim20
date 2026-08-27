import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VolumeX, Play, X, BellRing, Sparkles } from 'lucide-react';
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

  const handleStop = () => {
    AdhanAudioEngine.stop();
  };

  const handleForcePlay = () => {
    AdhanAudioEngine.unlockAudioContext();
    AdhanAudioEngine.play(muezzinId, volume, undefined, undefined, prayerName);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -30, scale: 0.95, filter: 'blur(5px)' }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] sm:w-[320px] bg-slate-950/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_12px_rgba(245,158,11,0.05)] overflow-hidden group"
        dir="rtl"
      >
        {/* Subtle top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>

        <div className="p-2.5 flex flex-col gap-1.5 relative z-10">
          {/* Main Info Row */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative shrink-0">
                {isPlaying && <div className="absolute -inset-0.5 bg-amber-400/30 rounded-full animate-ping opacity-75"></div>}
                <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white relative z-10 shadow-md border border-amber-300/25">
                  <BellRing size={12} className="animate-[wiggle_1s_ease-in-out_infinite]" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[11.5px] text-amber-300/95 leading-none block">أذان {prayerName}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-none">بصوت {muezzinName}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {isPlaying ? (
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center w-6 h-6 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="إيقاف"
                >
                  <VolumeX size={11} />
                </button>
              ) : (
                <button
                  onClick={handleForcePlay}
                  className="flex items-center justify-center w-6 h-6 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all active:scale-95 cursor-pointer animate-pulse"
                  title="تشغيل"
                >
                  <Play size={11} className="fill-current ml-0.5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Compact Post-Adhan Du'a */}
          <div className="bg-black/30 rounded-xl px-2.5 py-1.5 flex items-start gap-1 border border-white/5 shadow-inner">
            <Sparkles size={10} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <p className="font-arabic text-[10px] sm:text-[10.5px] text-slate-200 leading-relaxed text-right font-medium">
              «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا»
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

