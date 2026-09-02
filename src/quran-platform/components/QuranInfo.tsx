import React, { useState, useEffect } from 'react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { ChevronRight, Info, MapPin, Hash, Clock, Compass, ShieldCheck, HeartHandshake, Award, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSurahMetaData, SurahMetaDetails } from '../data/surahMetaData';

const QuranInfo = () => {
  const { currentSurah, setCurrentView } = useQuranContext();
  const [surahData, setSurahData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      const data = await QuranDataService.getSurah(currentSurah);
      setSurahData(data);
      setLoading(false);
    };
    fetchInfo();
  }, [currentSurah]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!surahData) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500 py-20">
        عذراً، تعذر تحميل معلومات السورة.
      </div>
    );
  }

  const meta: SurahMetaDetails = getSurahMetaData(
    surahData.number,
    surahData.name,
    surahData.revelationType,
    surahData.numberOfAyahs,
    surahData.englishName
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('index')}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            title="الرجوع إلى الفهرس"
          >
            <ChevronRight size={20} />
          </button>
          <div>
            <h2 className="font-bold text-[var(--color-primary-dark)] text-lg">معلومات السورة الشاملة</h2>
            <p className="text-xs text-gray-500">سُورَةُ {surahData.name.replace(/سُورَةُ\s*/, '')}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full pb-32 space-y-6">
        {/* Main Surah Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#155e41_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[var(--color-primary-dark)] mb-3 font-quran relative z-10 leading-normal">
            سُورَةُ {surahData.name.replace(/سُورَةُ\s*/, '')}
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-5 relative z-10 font-medium">
            {surahData.englishName} — {surahData.englishNameTranslation}
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center relative z-10 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] px-4 py-2 rounded-2xl">
              <MapPin size={16} />
              {surahData.revelationType === 'Meccan' || surahData.revelationType === 'مكية' ? '🕋 مكية' : '🕌 مدنية'}
            </div>
            <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] px-4 py-2 rounded-2xl">
              <Hash size={16} />
              {surahData.numberOfAyahs} آية
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-800 px-4 py-2 rounded-2xl">
              <Clock size={16} />
              قراءة ~ {Math.ceil(surahData.numberOfAyahs * 0.2)} دقيقة
            </div>
          </div>
        </motion.div>

        {/* Titles / Nicknames */}
        {meta.titles && meta.titles.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              ألقاب السورة وأسماؤها الشريفة
            </h3>
            <div className="flex flex-wrap gap-2">
              {meta.titles.map((title, idx) => (
                <span
                  key={`qi-title-${title}-${idx}`}
                  className="bg-amber-50 text-amber-900 border border-amber-200/80 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Focus / Purpose */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-primary-dark)] font-bold text-base">
            <Compass className="w-5 h-5 text-[var(--color-primary)]" />
            <span>على ماذا تركز السورة؟ (المقصد الرئيسي)</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-gray-800 font-medium">
            {meta.focus}
          </p>
        </div>

        {/* Main Themes */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
            المحاور والموضوعات الرئيسية
          </h3>
          <ul className="space-y-2.5">
            {meta.themes.map((theme, idx) => (
              <li
                key={`qi-theme-${idx}-${theme.substring(0, 10)}`}
                className="flex items-start gap-3 bg-gray-50/80 border border-gray-100 p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed"
              >
                <span className="w-6 h-6 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{theme}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Virtues */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            فضائل السورة وبركاتها
          </h3>
          <div className="space-y-2.5">
            {meta.virtues.map((virtue, idx) => (
              <div
                key={`qi-virtue-${idx}-${virtue.substring(0, 10)}`}
                className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-amber-900"
              >
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                <span>{virtue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Practical Quranic Actions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-blue-600" />
            العمل بالقرآن والتطبيق العملي
          </h3>
          <div className="space-y-2.5">
            {meta.practicalActions.map((action, idx) => (
              <div
                key={`qi-action-${idx}-${action.substring(0, 10)}`}
                className="flex items-start gap-3 bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-blue-900"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical / Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 mb-3 text-[var(--color-primary-dark)] border-b border-gray-100 pb-2.5">
              <Info className="w-4 h-4" />
              <h3 className="font-bold text-sm">بيانات المصحف</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">الترتيب في المصحف</span>
                <span className="font-bold text-gray-800">{surahData.number}</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">الجزء</span>
                <span className="font-bold text-gray-800">{surahData.ayahs?.[0]?.juz || '—'}</span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span className="text-gray-500">الاسم الإنجليزي</span>
                <span className="font-bold text-gray-800" dir="ltr">{surahData.englishName}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 mb-3 text-[var(--color-primary-dark)] border-b border-gray-100 pb-2.5">
              <Clock className="w-4 h-4" />
              <h3 className="font-bold text-sm">تقدير مدة التلاوة والاستماع</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">مدّة القراءة الهادئة</span>
                <span className="font-bold text-gray-800">~ {Math.ceil(surahData.numberOfAyahs * 0.2)} دقيقة</span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span className="text-gray-500">مدة الاستماع للترتيل</span>
                <span className="font-bold text-gray-800">~ {Math.ceil(surahData.numberOfAyahs * 0.4)} دقيقة</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuranInfo;
