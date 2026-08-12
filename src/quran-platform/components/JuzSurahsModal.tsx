import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, MapPin, Hash, Layers, ChevronLeft } from 'lucide-react';

interface JuzSurahsModalProps {
  isOpen: boolean;
  onClose: () => void;
  juz: number | null;
  surahs: any[];
  onSelectSurah: (surah: any) => void;
  onSelectJuzStart: (juzNumber: number) => void;
}

// Map each Juz to its exact Surah start and end numbers
const JUZ_SURAH_RANGES: Record<number, { start: number; end: number }> = {
  1: { start: 1, end: 2 },
  2: { start: 2, end: 2 },
  3: { start: 2, end: 3 },
  4: { start: 3, end: 4 },
  5: { start: 4, end: 4 },
  6: { start: 4, end: 5 },
  7: { start: 5, end: 6 },
  8: { start: 6, end: 7 },
  9: { start: 7, end: 8 },
  10: { start: 8, end: 9 },
  11: { start: 9, end: 11 },
  12: { start: 11, end: 12 },
  13: { start: 12, end: 14 },
  14: { start: 15, end: 16 },
  15: { start: 17, end: 18 },
  16: { start: 18, end: 20 },
  17: { start: 21, end: 22 },
  18: { start: 23, end: 25 },
  19: { start: 25, end: 27 },
  20: { start: 27, end: 29 },
  21: { start: 29, end: 33 },
  22: { start: 33, end: 36 },
  23: { start: 36, end: 39 },
  24: { start: 39, end: 41 },
  25: { start: 41, end: 45 },
  26: { start: 46, end: 51 },
  27: { start: 51, end: 57 },
  28: { start: 58, end: 66 },
  29: { start: 67, end: 77 },
  30: { start: 78, end: 114 }
};

export const JuzSurahsModal: React.FC<JuzSurahsModalProps> = ({
  isOpen,
  onClose,
  juz,
  surahs,
  onSelectSurah,
  onSelectJuzStart,
}) => {
  if (!isOpen || !juz) return null;

  const range = JUZ_SURAH_RANGES[juz];
  if (!range) return null;

  // Filter surahs that overlap with this Juz
  const surahsInJuz = surahs.filter(
    (s) => s.number >= range.start && s.number <= range.end
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm text-right"
        dir="rtl"
      >
        {/* Backdrop clickable space */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="relative p-5 bg-gradient-to-r from-[var(--color-primary-dark)] via-[#155e41] to-[var(--color-primary)] text-white shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-base border border-white/20">
                  {juz}
                </div>
                <div>
                  <h2 className="text-xl font-bold">سور الجزء {juz}</h2>
                  <p className="text-[11px] text-emerald-100 opacity-90 mt-0.5">
                    يحتوي على {surahsInJuz.length} {surahsInJuz.length >= 3 && surahsInJuz.length <= 10 ? 'سور' : 'سورة'} في المصحف الشريف
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="إغلاق النافذة"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Action Button to read Juz from start */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button
              onClick={() => onSelectJuzStart(juz)}
              className="w-full flex items-center justify-between p-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-sm group text-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <BookOpen size={16} />
                </div>
                <span>ابدأ قراءة الجزء {juz} من بدايته</span>
              </div>
              <ChevronLeft size={16} className="group-hover:translate-x-[-3px] transition-transform" />
            </button>
          </div>

          {/* Scrollable list of Surahs in this Juz */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-white dark:bg-gray-900">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mr-1 mb-1">السور المتداخلة في هذا الجزء:</p>
            {surahsInJuz.map((surah) => {
              const cleanName = surah.name.replace(/سُورَةُ\s*/, '').trim();
              return (
                <div
                  key={surah.number}
                  onClick={() => onSelectSurah(surah)}
                  className="p-3 bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800/50 hover:border-emerald-500/30 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 rounded-2xl cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0 border border-gray-200/40 dark:border-gray-700/40">
                      {surah.number}
                    </div>
                    <div>
                      <h4 className="font-quran font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-none">
                        سورة {cleanName}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {surah.revelationType === 'Meccan' || surah.revelationType === 'مكية' ? '🕋 مكية' : '🕌 مدنية'} • {surah.numberOfAyahs} آية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">انتقل للسورة</span>
                    <ChevronLeft size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
