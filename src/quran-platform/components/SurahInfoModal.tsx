import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Sparkles, MapPin, Hash, ShieldCheck, Compass, HeartHandshake, Award, FileText, ArrowLeft, Layers } from 'lucide-react';
import { getSurahMetaData, SurahMetaDetails } from '../data/surahMetaData';

interface SurahInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  surah: any; // Raw Surah object from Quran API
  onOpenReader: (surahNumber: number) => void;
}

export const SurahInfoModal: React.FC<SurahInfoModalProps> = ({
  isOpen,
  onClose,
  surah,
  onOpenReader,
}) => {
  if (!isOpen || !surah) return null;

  const surahNum = surah.number;
  const meta: SurahMetaDetails = getSurahMetaData(
    surahNum,
    surah.name,
    surah.revelationType,
    surah.numberOfAyahs,
    surah.englishName
  );

  const cleanName = surah.name.replace(/سُورَةُ\s*/, '').trim();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm text-right" dir="rtl">
        <motion.div key="SurahInfoModal-anim-1"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[var(--color-primary-dark)] via-[#155e41] to-[var(--color-primary)] text-white overflow-hidden shrink-0">
            {/* Islamic subtle background texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/20 shadow-inner">
                  {surahNum}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-serif">سُورَةُ {cleanName}</h2>
                  <p className="text-xs text-emerald-100 opacity-90 mt-0.5">
                    {surah.englishName} ({surah.englishNameTranslation || 'The Holy Quran'})
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="إغلاق النافذة"
              >
                <X size={20} />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-bold relative z-10">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <MapPin size={14} className="text-amber-300" />
                {surah.revelationType === 'Meccan' || surah.revelationType === 'مكية' ? '🕋 مكية' : '🕌 مدنية'}
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <Hash size={14} className="text-amber-300" />
                {surah.numberOfAyahs} آيات
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <Layers size={14} className="text-amber-300" />
                الترتيب {surahNum} في المصحف
              </span>
            </div>
          </div>

          {/* Scrollable Modal Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-gray-800 dark:text-gray-100">
            
            {/* Nicknames & Alternative Names */}
            {meta.titles && meta.titles.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  ألقاب السورة وأسماؤها الشريفة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {meta.titles.map((title, idx) => (
                    <span
                      key={`title-${title}-${idx}`}
                      className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-xl text-xs font-bold shadow-xs"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Core Focus / Main Purpose Card */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-[var(--color-primary-dark)] dark:text-emerald-400 font-bold text-sm">
                <Compass className="w-5 h-5 text-[var(--color-primary)]" />
                <span>على ماذا تركز السورة؟ (المقصد الرئيسي)</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                {meta.focus}
              </p>
            </div>

            {/* Key Themes / Subject Dividers */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                المحاور والموضوعات الرئيسية
              </h3>
              <ul className="space-y-2">
                {meta.themes.map((theme, idx) => (
                  <li
                    key={`theme-${idx}-${theme.substring(0, 10)}`}
                    className="flex items-start gap-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed"
                  >
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{theme}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Virtues and Benefits */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                فوائدها وفضائلها المثبتة
              </h3>
              <div className="space-y-2">
                {meta.virtues.map((virtue, idx) => (
                  <div
                    key={`virtue-${idx}-${virtue.substring(0, 10)}`}
                    className="flex items-start gap-2.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-200"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                    <span>{virtue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Actions / Quranic Application */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                العمل بالقرآن والتطبيق العملي
              </h3>
              <div className="space-y-2">
                {meta.practicalActions.map((action, idx) => (
                  <div
                    key={`action-${idx}-${action.substring(0, 10)}`}
                    className="flex items-start gap-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-blue-900 dark:text-blue-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Context */}
            {meta.historicalContext && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                <span className="font-bold block text-gray-700 dark:text-gray-300 mb-0.5">📜 السياق النزولي والمعلوماتي:</span>
                {meta.historicalContext}
              </div>
            )}

          </div>

          {/* Bottom Actions Footer */}
          <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200/80 dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={() => {
                onClose();
                onOpenReader(surahNum);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[var(--color-primary-dark)] text-white hover:bg-opacity-90 transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <BookOpen size={16} />
              <span>اقرأ سورة {cleanName} في المصحف</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
