import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

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
  muezzinName = 'الشيخ مشاري راشد العفاسي'
}) => {
  if (!isOpen || !prayerName) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="AdhanNotificationBanner-spiritual"
        initial={{ opacity: 0, y: -45, scale: 0.92, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -30, scale: 0.95, filter: 'blur(6px)' }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] w-[95%] sm:w-[410px] max-w-[96vw] bg-gradient-to-b from-[#091814]/98 via-[#06120e]/98 to-[#040c0a]/98 backdrop-blur-2xl border border-amber-500/30 text-white rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.18)] overflow-hidden select-none pointer-events-auto"
        dir="rtl"
      >
        {/* Subtle decorative golden beam */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        
        {/* Ambient radial glow in corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="p-3.5 sm:p-4 flex flex-col gap-3 relative z-10">
          {/* Header Row: Mosque Icon + Prayer Info + Dismiss Button */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              {/* Spiritual Mosque / Crescent Emblem with Golden Aura */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-amber-400/25 rounded-2xl blur-sm animate-pulse" />
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 relative z-10 shadow-lg border border-amber-300/40">
                  <span className="text-xl sm:text-2xl select-none" role="img" aria-label="أذان">
                    🕌
                  </span>
                </div>
              </div>

              {/* Prayer Name & Muezzin Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-[15px] text-amber-300 leading-tight tracking-wide drop-shadow-sm">
                    حان الآن موعد أذان {prayerName}
                  </h3>
                  {/* Live Equalizer Animation Indicator */}
                  <div className="flex items-end gap-[2.5px] h-3.5 px-1 bg-amber-500/15 border border-amber-500/20 rounded-md">
                    <span className="w-[2px] h-3 bg-amber-400 rounded-full animate-[bounce_0.75s_infinite_100ms]" />
                    <span className="w-[2px] h-2 bg-amber-300 rounded-full animate-[bounce_0.75s_infinite_350ms]" />
                    <span className="w-[2px] h-3.5 bg-amber-400 rounded-full animate-[bounce_0.75s_infinite_200ms]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                    بصوت {muezzinName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    يرفع الآن
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle dismiss button (closes card visually without touching audio) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="إخفاء هذا الإشعار"
              aria-label="إخفاء الإشعار"
            >
              <X size={15} />
            </button>
          </div>

          {/* Prophetic Sunnah Du'a upon hearing Adhan */}
          <div className="bg-slate-900/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-amber-500/15 shadow-inner">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-amber-400/90 font-medium">
              <Sparkles size={12} className="text-amber-400 shrink-0" />
              <span>دُعَاءُ مَا بَعْدَ الأَذَانِ الشَّرِيفِ:</span>
            </div>
            <p className="font-arabic text-[11px] sm:text-[12px] text-slate-200 leading-relaxed text-right font-medium">
              «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


