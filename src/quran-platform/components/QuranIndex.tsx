import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuranDataService } from '../services/QuranDataService';
import { useQuranContext } from '../store/QuranContext';
import { Book, Search, Bookmark, ChevronLeft, Filter, Sparkles, Hash, Layers, Info, Cloud, Check, Compass, Star, Moon, Sun, ArrowUpRight, Sliders, MoreHorizontal } from 'lucide-react';
import { SurahInfoModal } from './SurahInfoModal';
import { JuzSurahsModal } from './JuzSurahsModal';
import { getCleanSurahName } from './AyahMarker';
import { QuranSearchWidget } from '../search/components/QuranSearchWidget';
import { SURAHS_STATIC_LIST, JUZS_META_STATIC } from '../data/surahsData';

type TypeFilter = 'all' | 'meccan' | 'medinan';

const SURAH_START_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 600,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604
];

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

const QuranIndex = () => {
  const { setCurrentView, setCurrentSurah, setCurrentAyah, setCurrentPage, setShowSettingsModal, setPlayingAyahNumber, openSurahSettings } = useQuranContext();
  const [surahs, setSurahs] = useState<any[]>(SURAHS_STATIC_LIST);
  const [meta, setMeta] = useState<any>({ juzs: JUZS_META_STATIC });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'surahs' | 'juzs' | 'bookmarks'>('surahs');
  const [bookmarks, setBookmarks] = useState<{surah: number, ayah: number}[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedSurahForInfo, setSelectedSurahForInfo] = useState<any | null>(null);
  const [selectedJuzForSurahs, setSelectedJuzForSurahs] = useState<number | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{ isCached: boolean; count: number; total: number }>({ isCached: false, count: 0, total: 834 });
  const [lastRead, setLastRead] = useState<{ surah: number; ayah: number; page: number } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Silent background sync for dynamic updates/cache checking without blocking UI
    const fetchBackgroundData = async () => {
      try {
        const [surahsData, metaData] = await Promise.all([
          QuranDataService.getSurahsList(),
          QuranDataService.getMeta()
        ]);
        if (surahsData && surahsData.length > 0) setSurahs(surahsData);
        if (metaData) setMeta(metaData);

        const status = await QuranDataService.checkFullCacheStatus();
        setCacheStatus(status);
      } catch (e) {
        console.warn('Background Quran index check:', e);
      }
    };
    fetchBackgroundData();

    // Load bookmarks
    const savedBookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
    setBookmarks(savedBookmarks);

    // Load last read position
    const lastSurah = localStorage.getItem('quran_last_surah');
    const lastAyah = localStorage.getItem('quran_last_ayah');
    const lastPage = localStorage.getItem('quran_last_page');
    if (lastSurah && lastPage) {
      setLastRead({
        surah: parseInt(lastSurah, 10),
        ayah: parseInt(lastAyah || '1', 10),
        page: parseInt(lastPage, 10)
      });
    }
  }, []);

  const handleOpenSyncSettings = () => {
    localStorage.setItem('quran_settings_preferred_tab', 'sync');
    setShowSettingsModal(true);
  };

  const handleResumeReading = () => {
    if (lastRead) {
      setCurrentSurah(lastRead.surah);
      setCurrentAyah(lastRead.ayah);
      setCurrentPage(lastRead.page);
      setCurrentView('reader');
    }
  };

  const handleSurahClick = (surah: any) => {
    setCurrentSurah(surah.number);
    setCurrentAyah(1);
    setPlayingAyahNumber(null);
    setCurrentPage(SURAH_START_PAGES[surah.number - 1]);
    setCurrentView('reader');
  };

  const handleJuzClick = (juz: any) => {
    setSelectedJuzForSurahs(juz);
  };

  const handleJuzSelectStart = (juz: number) => {
    if (meta && meta.juzs) {
      const targetJuz = meta.juzs.references.find((j: any) => j.juz === juz);
      if (targetJuz) {
        setCurrentSurah(targetJuz.surah);
        setCurrentAyah(targetJuz.ayah);
        setCurrentPage(JUZ_START_PAGES[juz - 1]);
        setCurrentView('reader');
        setSelectedJuzForSurahs(null);
      }
    } else {
      const defaultStartSurahs = [
        1, 2, 2, 3, 4, 4, 5, 6, 7, 8,
        9, 11, 12, 15, 17, 18, 21, 23, 25, 27,
        29, 33, 36, 39, 41, 46, 51, 58, 67, 78
      ];
      setCurrentSurah(defaultStartSurahs[juz - 1]);
      setCurrentAyah(1);
    setPlayingAyahNumber(null);
      setCurrentPage(JUZ_START_PAGES[juz - 1]);
      setCurrentView('reader');
      setSelectedJuzForSurahs(null);
    }
  };

  const handleJuzSelectSurah = (surah: any) => {
    setCurrentSurah(surah.number);
    setCurrentAyah(1);
    setPlayingAyahNumber(null);
    setCurrentPage(SURAH_START_PAGES[surah.number - 1]);
    setCurrentView('reader');
    setSelectedJuzForSurahs(null);
  };

  const handleBookmarkClick = async (surahNum: number, ayahNum: number) => {
    setCurrentSurah(surahNum);
    setCurrentAyah(ayahNum);
    setCurrentView('reader');
    
    const surah = await QuranDataService.getSurah(surahNum);
    if (surah && surah.ayahs) {
      const ayahObj = surah.ayahs.find((a: any) => a.numberInSurah === ayahNum);
      if (ayahObj && ayahObj.page) {
        setCurrentPage(ayahObj.page);
      }
    }
  };

  // Process category filtering (Meccan / Medinan)
  const processedSurahs = surahs
    .filter(s => {
      const matchesType = typeFilter === 'all' 
        ? true 
        : typeFilter === 'meccan' 
        ? s.revelationType === 'Meccan' 
        : s.revelationType === 'Medinan';
      return matchesType;
    })
    .sort((a, b) => a.number - b.number);

  const meccanCount = surahs.filter(s => s.revelationType === 'Meccan').length;
  const medinanCount = surahs.filter(s => s.revelationType === 'Medinan').length;

  const getSurahName = (num: number) => {
    const s = surahs.find(s => s.number === num);
    return s ? s.name : `سورة ${num}`;
  };

  const juzsList = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="p-2 sm:p-3 lg:p-4 xl:p-5 max-w-7xl xl:max-w-[1440px] mx-auto w-full h-full flex flex-col text-right font-sans" dir="rtl">
      {/* Ultra-Compact Spiritual Header Bar (Collapsible on Scroll) */}
      <AnimatePresence>
        {!isScrolled && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -15, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-2.5 shrink-0 space-y-2 origin-top"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white px-3.5 py-2.5 shadow-md border border-emerald-800/50 flex items-center justify-between gap-2">
              {/* Subtle Glow Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

              <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                <span className="text-amber-400 text-lg sm:text-xl font-bold shrink-0">۞</span>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-sm sm:text-base font-extrabold text-amber-50 whitespace-nowrap">
                    فهرس المصحف الشريف
                  </h1>
                  <span className="text-[10px] sm:text-xs text-emerald-200/90 font-bold bg-emerald-900/80 border border-emerald-700/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                    ١١٤ سورة • ٣٠ جزءاً
                  </span>
                  <span className="text-[11px] text-amber-300/80 font-serif hidden md:inline truncate">
                    ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾
                  </span>
                </div>
              </div>

              <button
                onClick={handleOpenSyncSettings}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-xs border ${
                  cacheStatus.isCached 
                    ? 'bg-emerald-900/60 hover:bg-emerald-800/80 border-emerald-500/40 text-emerald-200' 
                    : 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/40 text-amber-200'
                }`}
                title="تحميل المصحف للقراءة بدون إنترنت والمزامنة السحابية"
              >
                {cacheStatus.isCached ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Cloud size={13} className="text-amber-400 animate-pulse" />
                )}
                <span className="hidden sm:inline">تحميل المصحف</span>
                <span className={`w-1.5 h-1.5 rounded-full ${cacheStatus.isCached ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
              </button>
            </div>
     
            {/* Compact Search Engine */}
            <div className="relative">
              <QuranSearchWidget />
            </div>

            {/* Resume Reading Card */}
            {lastRead && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleResumeReading}
                className="group relative overflow-hidden rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 py-2 px-3 flex flex-row items-center gap-3 shadow-3xs cursor-pointer active:scale-99 transition-all hover:bg-amber-500/10"
              >
                {/* Right: Book Icon in golden rounded box */}
                <div className="p-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Book size={16} className="animate-pulse" />
                </div>

                {/* Left: Text Details */}
                <div className="min-w-0 flex-1 text-right leading-tight">
                  <h4 className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span>آخر قراءة لك</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-900 dark:text-amber-50 mt-1 flex flex-wrap items-center gap-1.5 select-none font-bold">
                    <span className="font-quran text-sm text-emerald-800 dark:text-emerald-400">
                      {getSurahName(lastRead.surah)}
                    </span>
                    <span className="opacity-40 font-normal">|</span>
                    <span className="text-gray-600 dark:text-gray-300">الآية {lastRead.ayah}</span>
                    <span className="opacity-40 font-normal">|</span>
                    <span className="text-gray-600 dark:text-gray-300">الصفحة {lastRead.page}</span>
                  </p>
                </div>
                
                {/* Subtle Chevron indicator on left */}
                <div className="text-amber-600/60 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all">
                  <ChevronLeft size={14} className="rtl:rotate-180" />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Professional Toolbar: View Tabs + Revelation Filters */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md py-2 px-2 sm:px-3 rounded-2xl border border-amber-500/15 shadow-sm transition-all space-y-1.5 mb-3">
        {/* Main Index Tabs Row */}
        <div className="w-full bg-emerald-950/5 dark:bg-gray-800/85 p-1 rounded-xl border border-emerald-900/10 dark:border-gray-700/60 shadow-3xs">
          <div className="grid grid-cols-3 sm:flex items-center gap-1 w-full justify-between sm:justify-start">
            <button
              onClick={() => setActiveTab('surahs')}
              className={`flex-1 sm:flex-none py-1.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'surahs'
                  ? 'bg-emerald-800 dark:bg-emerald-900 text-white shadow-xs rounded-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-800/10 dark:hover:bg-gray-700/50 rounded-lg'
              }`}
            >
              <Book size={14} className={activeTab === 'surahs' ? 'text-amber-300' : 'text-gray-400'} />
              <span>السُّوَر</span>
            </button>

            <button
              onClick={() => setActiveTab('juzs')}
              className={`flex-1 sm:flex-none py-1.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'juzs'
                  ? 'bg-emerald-800 dark:bg-emerald-900 text-white shadow-xs rounded-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-800/10 dark:hover:bg-gray-700/50 rounded-lg'
              }`}
            >
              <Layers size={14} className={activeTab === 'juzs' ? 'text-amber-300' : 'text-gray-400'} />
              <span>الأجزاء (٣٠)</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 sm:flex-none py-1.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'bookmarks'
                  ? 'bg-emerald-800 dark:bg-emerald-900 text-white shadow-xs rounded-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-800/10 dark:hover:bg-gray-700/50 rounded-lg'
              }`}
            >
              <Bookmark size={14} className={activeTab === 'bookmarks' ? 'text-amber-400 fill-amber-400' : 'text-gray-400'} />
              <span>المحفوظات</span>
              {bookmarks.length > 0 && (
                <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {bookmarks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-Filters Row (Collapses smoothly when scrolled down for maximum space) */}
        {activeTab === 'surahs' && (
          <AnimatePresence>
            {!isScrolled && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center gap-2 text-xs font-bold py-1"
              >
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'all'
                      ? 'bg-amber-500 text-emerald-950 font-black border-amber-600 shadow-xs scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-500/10'
                  }`}
                >
                  <span>الكل</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${typeFilter === 'all' ? 'bg-emerald-950/20 text-emerald-950' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>١١٤</span>
                </button>
                <button
                  onClick={() => setTypeFilter('meccan')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'meccan'
                      ? 'bg-amber-500 text-emerald-950 font-black border-amber-600 shadow-xs scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-500/10'
                  }`}
                >
                  <span>🕋 مكية</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${typeFilter === 'meccan' ? 'bg-emerald-950/20 text-emerald-950' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{meccanCount}</span>
                </button>
                <button
                  onClick={() => setTypeFilter('medinan')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'medinan'
                      ? 'bg-amber-500 text-emerald-950 font-black border-amber-600 shadow-xs scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-500/10'
                  }`}
                >
                  <span>🕌 مدنية</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${typeFilter === 'medinan' ? 'bg-emerald-950/20 text-emerald-950' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{medinanCount}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Main Content Area */}
      <div 
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 15)}
        className="flex-1 overflow-y-auto pb-24 custom-scrollbar pr-1"
      >
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-500">جاري تحميل فهرس المصحف الشريف...</p>
          </div>
        ) : activeTab === 'surahs' ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {processedSurahs.map((surah, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2) }}
                  key={surah.number}
                  onClick={() => handleSurahClick(surah)}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-xl p-3.5 cursor-pointer hover:shadow-sm transition-all hover:border-amber-500/20 group flex items-center justify-between relative overflow-hidden shadow-3xs"
                >
                  <div className="flex items-center gap-3 pr-1 min-w-0">
                    {/* Rub el Hizb 8-pointed star in dark emerald/teal green */}
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none">
                      <div className="absolute w-8 h-8 bg-emerald-800 dark:bg-emerald-900 rounded-xs rotate-0 group-hover:rotate-45 transition-transform duration-300"></div>
                      <div className="absolute w-8 h-8 bg-emerald-800 dark:bg-emerald-900 rounded-xs rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
                      <span className="relative z-10 font-bold text-xs text-white dark:text-amber-50">
                        {surah.number}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-quran font-bold text-lg text-gray-900 dark:text-amber-50 transition-colors truncate leading-none">
                        سورة {getCleanSurahName(surah.name)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                          {surah.revelationType === 'Meccan' ? 'مكة' : 'مدنية'}
                        </span>
                        <span className="opacity-50">•</span>
                        <span>{surah.numberOfAyahs} آية</span>
                        <span className="opacity-50">•</span>
                        <span>ص {SURAH_START_PAGES[surah.number - 1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Options Settings Trigger */}
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSurahSettings(surah.number);
                      }}
                      className="p-1.5 rounded-full hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 transition-all cursor-pointer flex items-center justify-center"
                      title={`إعدادات وخيارات سورة ${surah.name}`}
                    >
                      <MoreHorizontal size={20} className="text-amber-600 dark:text-amber-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'juzs' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {juzsList.map((juz, i) => {
              let juzInfo = '';
              if (meta && meta.juzs && meta.juzs.references) {
                const target = meta.juzs.references.find((j: any) => j.juz === juz);
                if (target) {
                   juzInfo = `بداية الجزء: ${getSurahName(target.surah)} (الآية ${target.ayah})`;
                }
              }
              
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.015 }}
                  key={juz}
                  onClick={() => handleJuzClick(juz)}
                  className="bg-white dark:bg-gray-900 border border-emerald-900/10 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all hover:border-emerald-500/50 group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-center text-emerald-900 dark:text-emerald-300 font-extrabold group-hover:bg-emerald-700 group-hover:text-white transition-all shrink-0">
                      {juz}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        الجزء {juz}
                      </h3>
                      {juzInfo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{juzInfo}</p>}
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                        صفحة رقم {JUZ_START_PAGES[juz - 1]}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-emerald-600 transition-colors">
                    <ArrowUpRight size={18} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div>
            {bookmarks.length === 0 ? (
              <div className="text-center text-gray-500 py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 p-8">
                <Bookmark className="w-14 h-14 mx-auto text-amber-400/60 mb-4" />
                <h3 className="font-extrabold text-lg text-gray-800 dark:text-gray-200">لا توجد آيات محفوظة بعد</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  أثناء قراءة القرآن الكريم، يمكنك النقر على زر الفاصلة أو حفظ أي آية للرجوع إليها فوراً من هنا.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {bookmarks.map((b, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  onClick={() => handleBookmarkClick(b.surah, b.ayah)}
                  className="bg-white dark:bg-gray-900 border border-emerald-900/10 dark:border-gray-800 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Bookmark size={22} className="fill-current" />
                    </div>
                    <div>
                      <h4 className="font-quran font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-none">
                        {getSurahName(b.surah)}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        الآية الكريمة رقم <strong className="text-amber-600 dark:text-amber-400">{b.ayah}</strong>
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Surah Info Modal */}
      <SurahInfoModal
        isOpen={!!selectedSurahForInfo}
        onClose={() => setSelectedSurahForInfo(null)}
        surah={selectedSurahForInfo}
        onOpenReader={(surahNum) => {
          setCurrentSurah(surahNum);
          setCurrentAyah(1);
    setPlayingAyahNumber(null);
          setCurrentPage(SURAH_START_PAGES[surahNum - 1]);
          setCurrentView('reader');
        }}
      />

      {/* Juz Surahs Selection Modal */}
      <JuzSurahsModal
        isOpen={!!selectedJuzForSurahs}
        onClose={() => setSelectedJuzForSurahs(null)}
        juz={selectedJuzForSurahs}
        surahs={surahs}
        onSelectSurah={handleJuzSelectSurah}
        onSelectJuzStart={handleJuzSelectStart}
      />
    </div>
  );
};

export default QuranIndex;

