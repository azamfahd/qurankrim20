import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, BookOpen, Sparkles, MapPin, Hash, ShieldCheck, Compass, HeartHandshake, 
  Award, FileText, ArrowLeft, Layers, Sliders, Target, Volume2, Gamepad2, 
  Eye, EyeOff, CheckCircle2, Play, Pause, Bookmark, ListFilter, HelpCircle
} from 'lucide-react';
import { useQuranContext } from '../store/QuranContext';
import { getSurahMetaData, SurahMetaDetails } from '../data/surahMetaData';
import { QuranDataService } from '../services/QuranDataService';
import { RECITERS } from './QuranSettingsModal';
import { getCleanSurahName } from './AyahMarker';

export type SurahTab = 'info' | 'memorize' | 'tafsir' | 'ayahs';

export const SurahSettingsModal: React.FC = () => {
  const { 
    showSurahSettingsModal, 
    setShowSurahSettingsModal, 
    surahSettingsNumber, 
    setCurrentSurah,
    setCurrentAyah,
    setSurahAndAyah,
    setCurrentView,
    reciter,
    setReciter,
    isAudioPlaying,
    setIsAudioPlaying,
    setPlayingAyahNumber
  } = useQuranContext();

  const [activeTab, setActiveTab] = useState<SurahTab>('info');
  const [surahData, setSurahData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (showSurahSettingsModal && surahSettingsNumber) {
      setLoading(true);
      QuranDataService.getSurah(surahSettingsNumber).then((data) => {
        setSurahData(data);
        setLoading(false);
      });
    }
  }, [showSurahSettingsModal, surahSettingsNumber]);

  if (!showSurahSettingsModal || !surahSettingsNumber) return null;

  const surahNum = surahSettingsNumber;
  const rawName = surahData?.name || `السورة رقم ${surahNum}`;
  const cleanName = getCleanSurahName(rawName);
  const numberOfAyahs = surahData?.numberOfAyahs || surahData?.ayahs?.length || 7;
  const revelationType = surahData?.revelationType || 'Meccan';

  const meta: SurahMetaDetails = getSurahMetaData(
    surahNum,
    rawName,
    revelationType,
    numberOfAyahs,
    surahData?.englishName || ''
  );

  const handleJumpToAyah = (ayahNum: number) => {
    setPlayingAyahNumber(null);
    setSurahAndAyah(surahNum, ayahNum);
    setCurrentView('reader');
    setShowSurahSettingsModal(false);
  };

  const handleOpenMemorize = () => {
    setCurrentSurah(surahNum);
    setPlayingAyahNumber(null);
    setCurrentView('memorize');
    setShowSurahSettingsModal(false);
  };

  const handleOpenTafsir = () => {
    setCurrentSurah(surahNum);
    setPlayingAyahNumber(null);
    setCurrentView('tafsir');
    setShowSurahSettingsModal(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm text-right" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[var(--color-primary-dark)] via-[#155e41] to-[var(--color-primary)] text-white overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/20 shadow-inner">
                  {surahNum}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-300" />
                    <h2 className="text-xl sm:text-2xl font-bold font-serif">إعدادات وخيارات <span className="font-quran text-2xl sm:text-3xl text-amber-300 font-bold leading-none select-none">سورة {cleanName}</span></h2>
                  </div>
                  <p className="text-xs text-emerald-100 opacity-90 mt-0.5">
                    خصائص السورة، معلوماتها، اختبارات الحفظ، التفسير والقراء
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSurahSettingsModal(false)}
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
                {revelationType === 'Meccan' || revelationType === 'مكية' ? '🕋 مكية' : '🕌 مدنية'}
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <Hash size={14} className="text-amber-300" />
                {numberOfAyahs} آية
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <Layers size={14} className="text-amber-300" />
                الترتيب {surahNum} في المصحف
              </span>
            </div>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 p-1.5 gap-1 overflow-x-auto shrink-0 no-scrollbar">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'info' 
                  ? 'bg-white dark:bg-gray-900 text-[var(--color-primary-dark)] dark:text-emerald-300 shadow-sm border border-gray-200/80 dark:border-gray-700' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <FileText size={15} />
              <span>معلومات وفضائل السورة</span>
            </button>

            <button
              onClick={() => setActiveTab('memorize')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'memorize' 
                  ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200/80 dark:border-gray-700' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Target size={15} className="text-amber-500" />
              <span>الحفظ والتسميع والاختبار</span>
            </button>

            <button
              onClick={() => setActiveTab('tafsir')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tafsir' 
                  ? 'bg-white dark:bg-gray-900 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200/80 dark:border-gray-700' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Volume2 size={15} className="text-rose-500" />
              <span>التفسير والتلاوة والقارئ</span>
            </button>

            <button
              onClick={() => setActiveTab('ayahs')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ayahs' 
                  ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/80 dark:border-gray-700' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <ListFilter size={15} className="text-blue-500" />
              <span>فهرس آيات السورة</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-gray-800 dark:text-gray-100">

            {/* TAB 1: SURAH INFO & VIRTUES */}
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Titles */}
                {meta.titles && meta.titles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      ألقاب السورة وأسماؤها الشريفة
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {meta.titles.map((title, idx) => (
                        <span
                          key={idx}
                          className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-xl text-xs font-bold shadow-xs"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Focus */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 text-[var(--color-primary-dark)] dark:text-emerald-400 font-bold text-sm">
                    <Compass className="w-5 h-5 text-[var(--color-primary)]" />
                    <span>مقصد وموضوع السورة الرئيسي</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                    {meta.focus}
                  </p>
                </div>

                {/* Key Themes */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                    المحاور والموضوعات الرئيسية
                  </h3>
                  <ul className="space-y-2">
                    {meta.themes.map((theme, idx) => (
                      <li
                        key={idx}
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

                {/* Virtues */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    فوائدها وفضائلها المثبتة
                  </h3>
                  <div className="space-y-2">
                    {meta.virtues.map((virtue, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-200"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                        <span>{virtue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Actions */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-blue-600" />
                    العمل بالقرآن والتطبيق العملي
                  </h3>
                  <div className="space-y-2">
                    {meta.practicalActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-blue-900 dark:text-blue-200"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Context */}
                {meta.historicalContext && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                    <span className="font-bold block text-gray-700 dark:text-gray-300 mb-0.5">📜 السياق النزولي والمعلوماتي:</span>
                    {meta.historicalContext}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: MEMORIZATION & QUIZ */}
            {activeTab === 'memorize' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl text-amber-900 dark:text-amber-200">
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
                    <Target className="text-amber-600" size={18} />
                    أدوات ومساعدات الحفظ والتسميع لسورة {cleanName}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    يمكنك التفاعل واختبار ترتيب الآيات والكلمات أو تشغيل ألعاب الأطفال التفاعلية لهذه السورة.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Memorization Room */}
                  <button
                    onClick={handleOpenMemorize}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 text-right hover:shadow-md transition-all flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Target size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">غرفة التسميع والاختبار</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        اختبار ترتيب الكلمات، خلط الآيات، وإحصائيات الحفظ لسورة {cleanName}
                      </p>
                    </div>
                  </button>

                  {/* Card 2: Kids Game */}
                  <button
                    onClick={handleOpenMemorize}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 text-right hover:shadow-md transition-all flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Gamepad2 size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">مغامرة أبطال القرآن (أطفال)</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        تحدي ممتع للأطفال بجمع النجوم واستكمال الكلمات المفقودة
                      </p>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setCurrentSurah(surahNum);
    setPlayingAyahNumber(null);
                      setCurrentView('reader');
                      setShowSurahSettingsModal(false);
                    }}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} className="text-amber-500" />
                    <span>متابعة القراءة المباشرة في المصحف</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 3: TAFSIR & RECITERS */}
            {activeTab === 'tafsir' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl text-rose-900 dark:text-rose-200">
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
                    <Volume2 className="text-rose-600" size={18} />
                    التلاوة الصوتية والتفسير الميسر لسورة {cleanName}
                  </h4>
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    يمكنك اختيار القارئ المفضل لتلاوة هذه السورة أو فتح قسم التفسير الكامل للآيات.
                  </p>
                </div>

                {/* Reciter Picker */}
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <h5 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Volume2 size={16} className="text-[var(--color-primary)]" />
                    اختر القارئ المفضل لسورة {cleanName}:
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {RECITERS.map((r) => {
                      const isSelected = reciter === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setReciter(r.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <div>
                            <span className="block text-xs">{r.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{r.desc}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-[var(--color-primary)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tafsir Link */}
                <button
                  onClick={handleOpenTafsir}
                  className="w-full p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/20 border border-rose-200 dark:border-rose-800 text-right hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">فتح التفسير والتدبر لسورة {cleanName}</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        عرض تفسير ابن كثير، الميسر، والجلالين لكل آية مع أسباب النزول
                      </p>
                    </div>
                  </div>
                  <ArrowLeft size={18} className="text-rose-600 shrink-0" />
                </button>
              </motion.div>
            )}

            {/* TAB 4: AYAHS INDEX */}
            {activeTab === 'ayahs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <ListFilter size={16} className="text-blue-500" />
                    انتقال سريع لآية محددة في سورة {cleanName} ({numberOfAyahs} آية):
                  </h4>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {Array.from({ length: numberOfAyahs }).map((_, idx) => {
                    const ayahNum = idx + 1;
                    return (
                      <button
                        key={ayahNum}
                        onClick={() => handleJumpToAyah(ayahNum)}
                        className="py-2 px-1 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-[var(--color-primary)] hover:text-white border border-gray-200/80 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all shadow-2xs text-center"
                        title={`انتقال للآية ${ayahNum}`}
                      >
                        {ayahNum}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200/80 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => {
                setShowSurahSettingsModal(false);
                setCurrentSurah(surahNum);
    setPlayingAyahNumber(null);
                setCurrentView('reader');
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
