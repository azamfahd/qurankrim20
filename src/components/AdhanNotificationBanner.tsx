import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, BellRing, X, Sparkles } from 'lucide-react';
import { AdhanAudioEngine } from '../services/adhanService';

interface AdhanNotificationBannerProps {
  prayerName: string | null;
  isOpen: boolean;
  onClose: () => void;
  muezzinName?: string;
}

export const AdhanNotificationBanner: React.FC<AdhanNotificationBannerProps> = ({
  prayerName,
  isOpen,
  onClose,
  muezzinName = 'مشاري راشد العفاسي'
}) => {
  if (!isOpen || !prayerName) return null;

  const handleStop = () => {
    AdhanAudioEngine.stop();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-lg bg-gradient-to-r from-[var(--color-primary-dark)] via-slate-900 to-[var(--color-primary-dark)] border-2 border-[var(--color-gold)] text-white p-4 rounded-3xl shadow-2xl backdrop-blur-xl text-right"
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/50 flex items-center justify-center text-[var(--color-gold-light)] shrink-0 animate-pulse">
              <BellRing size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[var(--color-gold-light)]">حان الآن موعد أذان {prayerName}</span>
                <Sparkles size={13} className="text-[var(--color-gold)]" />
              </div>
              <p className="text-xs text-slate-300">بصوت: {muezzinName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStop}
              className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              title="إيقاف صوت الأذان"
            >
              <VolumeX size={15} />
              <span>إيقاف</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="إخفاء التنبيه"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Post-Adhan Du'a */}
        <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-2xl">
          <p className="font-semibold text-[var(--color-gold-light)] mb-0.5">دعاء ما بعد الأذان:</p>
          <p className="font-arabic">«اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
