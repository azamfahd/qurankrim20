import React, { useState, useEffect, useRef } from 'react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { QuranSyncService } from '../services/quranSyncService';
import { ChevronRight, Settings2, Bookmark, Check, Maximize, Minimize, Play, Pause, BookOpen, EyeOff, Eye, Share2, Type, Palette, Sliders, Book, AlignJustify, Brain, Sparkles, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuranPageViewer } from './QuranPageViewer';
import { QuranSettingsModal, MUSHAF_THEMES } from './QuranSettingsModal';
import { AyahMarker, getCleanSurahName, DecoratedBismillah, toArabicNumerals } from './AyahMarker';
const HIGHLIGHT_COLORS = [
  { id: 'none', class: '' },
  { id: 'yellow', class: 'bg-yellow-200/60 dark:bg-yellow-900/40' },
  { id: 'green', class: 'bg-green-200/60 dark:bg-green-900/40' },
  { id: 'blue', class: 'bg-blue-200/60 dark:bg-blue-900/40' },
  { id: 'pink', class: 'bg-pink-200/60 dark:bg-pink-900/40' },
];

const QuranReader = () => {
  const { 
    currentSurah, 
    setCurrentView, 
    currentAyah, 
    setCurrentAyah, 
    fontSize, 
    setFontSize, 
    playingAyahNumber, 
    setPlayingAyahNumber,
    isAudioPlaying,
    setIsAudioPlaying,
    readingMode,
    setReadingMode,
    mushafTheme,
    setShowSettingsModal,
    openSurahSettings,
    isImmersive,
    setIsImmersive
  } = useQuranContext();

  const [surahData, setSurahData] = useState<any>(null);
  const [translationData, setTranslationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMemorizeMode, setIsMemorizeMode] = useState(false);
  const [memorizeType, setMemorizeType] = useState<'words' | 'verses'>('words');
  const [memorizePercent, setMemorizePercent] = useState<number>(100);
  const [revealedVerses, setRevealedVerses] = useState<Set<number>>(new Set());
  const [showTranslation, setShowTranslation] = useState(localStorage.getItem('quran_show_translation') === 'true');
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [activeAyahMenu, setActiveAyahMenu] = useState<number | null>(null);
  const [copiedAyahId, setCopiedAyahId] = useState<number | null>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState<number | null>(null);
  
  const [bookmarks, setBookmarks] = useState<{surah: number, ayah: number}[]>([]);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [markedVerses, setMarkedVerses] = useState<Record<string, boolean>>({});

  const toggleMarkVerse = (ayahNum: number) => {
    const key = `${currentSurah}_${ayahNum}`;
    const next = { ...markedVerses };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = true;
    }
    setMarkedVerses(next);
    localStorage.setItem('quran_marked_verses', JSON.stringify(next));
    setActiveAyahMenu(null);
    QuranSyncService.isUserLoggedIn().then(logged => {
      if (logged) QuranSyncService.pushToCloud();
    });
  };
  
  const readerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to currently playing verse during audio playback
  useEffect(() => {
    if (readingMode !== 'page' && playingAyahNumber && isAudioPlaying) {
      const element = document.getElementById(`ayah-${playingAyahNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingAyahNumber, isAudioPlaying, readingMode]);

  useEffect(() => {
    if (readingMode === 'page') return;
    const fetchSurah = async () => {
      setLoading(true);
      const data = await QuranDataService.getSurah(currentSurah);
      setSurahData(data);
      
      if (showTranslation) {
        const tData = await QuranDataService.getSurahTranslation(currentSurah, 'en.asad');
        setTranslationData(tData);
      }
      
      setLoading(false);
      setActiveAyahMenu(null);
      setShowHighlightMenu(null);
      setRevealedWords(new Set());
      setRevealedVerses(new Set());
    };
    fetchSurah();

    const savedBookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
    setBookmarks(savedBookmarks);
    
    const savedHighlights = JSON.parse(localStorage.getItem('quran_highlights') || '{}');
    setHighlights(savedHighlights);

    const savedMarked = JSON.parse(localStorage.getItem('quran_marked_verses') || '{}');
    setMarkedVerses(savedMarked);
  }, [currentSurah, showTranslation, readingMode]);

  useEffect(() => {
    localStorage.setItem('quran_reading_mode', readingMode);
  }, [readingMode]);

  useEffect(() => {
    localStorage.setItem('quran_show_translation', showTranslation.toString());
  }, [showTranslation]);

  // Dismiss Ayah action menu when tapping outside both the active ayah AND the floating action bar
  useEffect(() => {
    if (activeAyahMenu === null) return;

    // Click/Touch Outside listener: Hide only if tapping outside both the active ayah AND the action bar
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('#floating-ayah-reader-bar') ||
        target.closest(`#ayah-${activeAyahMenu}`)
      ) {
        return;
      }
      setActiveAyahMenu(null);
      setShowHighlightMenu(null);
    };

    const clickListenerTimeout = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('touchstart', handleOutsideClick, { passive: true });
    }, 100);

    return () => {
      clearTimeout(clickListenerTimeout);
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeAyahMenu]);

  // Scroll to active ayah if provided
  useEffect(() => {
    if (readingMode !== 'page' && !loading && surahData && currentAyah >= 1) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`ayah-${currentAyah}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, surahData, currentAyah, readingMode]);

  // Update read ayahs stat on mount of surah
  useEffect(() => {
    if (surahData && surahData.numberOfAyahs && !isMemorizeMode) {
      const timer = setTimeout(() => {
        const statsStr = localStorage.getItem('quran_stats');
        const stats = statsStr ? JSON.parse(statsStr) : {};
        
        const estimatedAyahsRead = Math.min(surahData.numberOfAyahs, 10);
        stats.readAyahs = (stats.readAyahs || 0) + estimatedAyahsRead;
        stats.readMinutes = (stats.readMinutes || 0) + 1; 
        
        const today = new Date().toDateString();
        if (stats.lastReadDate !== today) {
           const lastRead = stats.lastReadDate ? new Date(stats.lastReadDate) : null;
           const yesterday = new Date();
           yesterday.setDate(yesterday.getDate() - 1);
           
           if (lastRead && lastRead.toDateString() === yesterday.toDateString()) {
               stats.streakDays = (stats.streakDays || 0) + 1;
           } else {
               stats.streakDays = 1;
           }
           stats.lastReadDate = today;
        }

        if (stats.readAyahs >= 6236) {
           stats.khatmas = (stats.khatmas || 0) + Math.floor(stats.readAyahs / 6236);
           stats.readAyahs = stats.readAyahs % 6236;
        }
        
        localStorage.setItem('quran_stats', JSON.stringify(stats));
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [surahData, isMemorizeMode]);

  // If reading mode is 'page', render QuranPageViewer directly in full screen reading mode
  if (readingMode === 'page') {
    return (
      <div className="w-full h-full overflow-hidden relative">
        <QuranPageViewer />
      </div>
    );
  }

  const toggleBookmark = (ayahNumber: number) => {
    const isBookmarked = bookmarks.some(b => b.surah === currentSurah && b.ayah === ayahNumber);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => !(b.surah === currentSurah && b.ayah === ayahNumber));
    } else {
      newBookmarks = [...bookmarks, { surah: currentSurah, ayah: ayahNumber }];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
    setActiveAyahMenu(null);

    // Auto-sync background
    QuranSyncService.isUserLoggedIn().then(logged => {
      if (logged) QuranSyncService.pushToCloud();
    });
  };

  const isAyahBookmarked = (ayahNumber: number) => {
    return bookmarks.some(b => b.surah === currentSurah && b.ayah === ayahNumber);
  };

  const toggleWordReveal = (wordId: string, e: React.MouseEvent) => {
    if (!isMemorizeMode) return;
    e.stopPropagation();
    const newRevealed = new Set(revealedWords);
    if (newRevealed.has(wordId)) {
      newRevealed.delete(wordId);
    } else {
      newRevealed.add(wordId);
    }
    setRevealedWords(newRevealed);
  };

  const toggleHighlight = (ayahNumber: number, colorId: string) => {
    const key = `${currentSurah}_${ayahNumber}`;
    const newHighlights = { ...highlights };
    
    if (colorId === 'none') {
      delete newHighlights[key];
    } else {
      newHighlights[key] = colorId;
    }
    
    setHighlights(newHighlights);
    localStorage.setItem('quran_highlights', JSON.stringify(newHighlights));
    setShowHighlightMenu(null);
    setActiveAyahMenu(null);

    // Auto-sync background
    QuranSyncService.isUserLoggedIn().then(logged => {
      if (logged) QuranSyncService.pushToCloud();
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!surahData) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500 bg-gray-50 dark:bg-gray-900">
        عذراً، تعذر تحميل السورة.
      </div>
    );
  }
  
  const currentTheme = MUSHAF_THEMES.find(t => t.id === mushafTheme) || MUSHAF_THEMES[0];

  return (
    <div className={`flex flex-col h-full ${isImmersive ? currentTheme.previewBg : 'bg-gray-50 dark:bg-gray-900'}`} ref={readerRef} onClick={() => { if(activeAyahMenu) setActiveAyahMenu(null); if(showHighlightMenu) setShowHighlightMenu(null); }}>
      {/* Reader Toolbar */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-3 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentView('index')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
              >
                <ChevronRight size={20} />
              </button>
              <div>
                <h2 className="font-quran font-bold text-[var(--color-primary-dark)] dark:text-emerald-300 text-xl sm:text-2xl leading-none select-none">{surahData.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">الجزء {surahData.ayahs[0]?.juz}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => {
                  setIsImmersive(true);
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }}
                className="p-2 rounded-full transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="وضع القراءة بدون تشتيت"
              >
                <Maximize size={20} />
              </button>
              <button 
                onClick={() => setReadingMode('page')}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"
                title="الانتقال إلى وضع الصفحات"
              >
                <BookOpen size={16} />
                <span className="hidden sm:inline">عرض الصفحات</span>
              </button>
              <button 
                onClick={() => setShowTranslation(!showTranslation)}
                className={`p-2 rounded-full transition-colors ${showTranslation ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                title="إظهار الترجمة الإنجليزية"
              >
                <Type size={20} />
              </button>
              <button 
                onClick={() => {
                  setIsMemorizeMode(!isMemorizeMode);
                  setRevealedWords(new Set());
                  setRevealedVerses(new Set());
                }}
                className={`p-2 rounded-full transition-colors ${isMemorizeMode ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                title="وضع اختبار التسميع والحفظ المتقدم"
              >
                {isMemorizeMode ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <button 
                onClick={() => openSurahSettings(currentSurah)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="إعدادات وخيارات السورة، الفضائل والتفسير"
              >
                <Sliders size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">إعدادات السورة</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Scroll Container */}
      <div className={`flex-1 overflow-y-auto ${isImmersive ? 'p-2 sm:p-4' : 'p-4 sm:p-8 md:p-12 pb-32'} relative`} ref={scrollContainerRef}>
        {isMemorizeMode && (
          <div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-4 sm:p-5 shadow-sm text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <Brain size={20} className="animate-pulse" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm">شريط الحفظ والاختبار المتقدم</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">انقر على أي جزء مغطى لإظهاره يدوياً والاستماع إلى تلاوته للتحقق</p>
                </div>
              </div>
              
              {/* Type selector */}
              <div className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 p-1 rounded-2xl border border-amber-100 dark:border-gray-700 select-none">
                <button
                  onClick={() => {
                    setMemorizeType('words');
                    setRevealedWords(new Set());
                    setRevealedVerses(new Set());
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${memorizeType === 'words' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  إخفاء الكلمات
                </button>
                <button
                  onClick={() => {
                    setMemorizeType('verses');
                    setRevealedWords(new Set());
                    setRevealedVerses(new Set());
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${memorizeType === 'verses' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  إخفاء الآيات كاملة
                </button>
              </div>
            </div>

            {/* Sub options and action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3.5 border-t border-amber-100 dark:border-amber-900/30">
              {/* If words mode, show ratio options */}
              {memorizeType === 'words' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">مستوى الإخفاء:</span>
                  <div className="flex items-center gap-1">
                    {[25, 50, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => {
                          setMemorizePercent(percent);
                          setRevealedWords(new Set());
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${memorizePercent === percent ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        {percent === 100 ? 'كامل (100%)' : percent === 50 ? 'نصف (50%)' : 'ربع (25%)'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">حالة الآيات:</span>
                  <span className="text-xs text-amber-650 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                    مخفي ({surahData.numberOfAyahs - revealedVerses.size}) من أصل ({surahData.numberOfAyahs}) آية
                  </span>
                </div>
              )}

              {/* General Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (memorizeType === 'words') {
                      // Reveal all words
                      const allWords = new Set<string>();
                      surahData.ayahs.forEach((ayah: any) => {
                        const words = ayah.text.split(' ');
                        words.forEach((_: any, index: number) => {
                          allWords.add(`${ayah.numberInSurah}-${index}`);
                        });
                        allWords.add(`ayah-marker-${ayah.numberInSurah}`);
                      });
                      setRevealedWords(allWords);
                    } else {
                      // Reveal all verses
                      const allV = new Set<number>();
                      surahData.ayahs.forEach((ayah: any) => {
                        allV.add(ayah.numberInSurah);
                      });
                      setRevealedVerses(allV);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Eye size={12} />
                  <span>إظهار الكل</span>
                </button>
                <button
                  onClick={() => {
                    setRevealedWords(new Set());
                    setRevealedVerses(new Set());
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <EyeOff size={12} />
                  <span>إخفاء الكل</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-4xl mx-auto ${currentTheme.previewBg} ${isImmersive ? '' : `p-8 sm:p-12 rounded-2xl shadow-sm border ${currentTheme.previewBorder}`} transition-all duration-500`}>
          {/* Bismillah */}
          {currentSurah !== 1 && currentSurah !== 9 && (
            <DecoratedBismillah fontSize={fontSize} themeId={mushafTheme} />
          )}

          <div 
            className="text-justify leading-loose"
            style={{ 
              fontSize: `${fontSize}px`, 
              fontFamily: "'Amiri', 'Uthmani', serif",
              lineHeight: 2.2,
              direction: 'rtl'
            }}
          >
            {surahData.ayahs.map((ayah: any, i: number) => {
              let text = ayah.text;
              if (currentSurah !== 1 && ayah.numberInSurah === 1 && text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ')) {
                text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
              }

              const words = text.split(' ');
              const isBookmarked = isAyahBookmarked(ayah.numberInSurah);
              const isActive = activeAyahMenu === ayah.numberInSurah;
              const translation = translationData?.ayahs?.[i]?.text;
              
              const highlightId = highlights[`${currentSurah}_${ayah.numberInSurah}`];
              const highlightClass = highlightId ? HIGHLIGHT_COLORS.find(c => c.id === highlightId)?.class : '';

              const isPlayingThisAyah = playingAyahNumber === ayah.numberInSurah && isAudioPlaying && currentSurah === surahData?.number;

              const isVerseHidden = isMemorizeMode && memorizeType === 'verses' && !revealedVerses.has(ayah.numberInSurah);

              const ayahContent = isVerseHidden ? (
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 mx-1.5 my-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-2xl select-none align-middle font-sans text-xs transition-all hover:bg-amber-500/25 cursor-pointer relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newRevealed = new Set(revealedVerses);
                    newRevealed.add(ayah.numberInSurah);
                    setRevealedVerses(newRevealed);
                  }}
                  title="آية مخفية - انقر لإظهارها يدوياً"
                >
                  <span className="font-bold text-amber-850 dark:text-amber-400 flex items-center gap-1">
                    <Brain size={12} className="animate-pulse text-amber-600 dark:text-amber-400" />
                    آية {toArabicNumerals(ayah.numberInSurah)} مخفية
                  </span>
                  
                  {/* Listen Directly Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlayingAyahNumber(ayah.numberInSurah);
                      setIsAudioPlaying(true);
                    }}
                    className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-transform scale-90 hover:scale-105 cursor-pointer flex items-center justify-center shadow-xs"
                    title="استماع مباشر للآية للتحقق"
                  >
                    <Play size={10} className="fill-current" />
                  </button>

                  {/* Show eye icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newRevealed = new Set(revealedVerses);
                      newRevealed.add(ayah.numberInSurah);
                      setRevealedVerses(newRevealed);
                    }}
                    className="p-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg transition-transform scale-90 hover:scale-105 cursor-pointer flex items-center justify-center shadow-xs"
                    title="إظهار الآية"
                  >
                    <Eye size={10} />
                  </button>
                </span>
              ) : (
                <span className={`${isPlayingThisAyah ? 'text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold' : isBookmarked && !isMemorizeMode ? 'text-[var(--color-primary-dark)] font-medium' : currentTheme.textColor} ${highlightClass || ''}`}>
                  {words.map((word: string, index: number) => {
                    const wordId = `${ayah.numberInSurah}-${index}`;
                    
                    // Determine if this word should be hidden based on percentage
                    let shouldBeHiddenByPercent = false;
                    if (isMemorizeMode && memorizeType === 'words') {
                      if (memorizePercent === 100) {
                        shouldBeHiddenByPercent = true;
                      } else if (memorizePercent === 50) {
                        shouldBeHiddenByPercent = index % 2 === 0;
                      } else if (memorizePercent === 25) {
                        shouldBeHiddenByPercent = index % 4 === 0;
                      }
                    }

                    const isWordHidden = isMemorizeMode && memorizeType === 'words' && shouldBeHiddenByPercent && !revealedWords.has(wordId);
                    
                    return (
                      <React.Fragment key={wordId}>
                        <span 
                          onClick={(e) => {
                            if (isWordHidden) {
                              toggleWordReveal(wordId, e);
                            } else if (isMemorizeMode && memorizeType === 'words') {
                              // Toggle back and forth on click
                              toggleWordReveal(wordId, e);
                            }
                          }}
                          className={isMemorizeMode && memorizeType === 'words' ? 'cursor-pointer hover:bg-amber-500/10 rounded px-0.5' : ''}
                          style={isWordHidden ? {
                            color: 'transparent',
                            backgroundColor: currentTheme.id === 'night' ? '#3f3f46' : '#e4e4e7',
                            borderRadius: '4px',
                            paddingLeft: '4px',
                            paddingRight: '4px',
                            marginRight: '2px',
                            marginLeft: '2px',
                            userSelect: 'none'
                          } : {}}
                          title={isWordHidden ? "انقر لإظهار هذه الكلمة" : undefined}
                        >
                          {word}
                        </span>
                        {' '}
                      </React.Fragment>
                    );
                  })}
                </span>
              );

              const ayahMarker = (
                <AyahMarker
                  ayahNumber={ayah.numberInSurah}
                  themeId={currentTheme.id}
                  isPlaying={isPlayingThisAyah}
                  isBookmarked={isBookmarked && !isMemorizeMode}
                  isMemorizeHidden={isMemorizeMode && memorizeType === 'words' && !revealedWords.has(`ayah-marker-${ayah.numberInSurah}`)}
                  onClick={(e) => {
                    if (isMemorizeMode) {
                      if (memorizeType === 'words') {
                        toggleWordReveal(`ayah-marker-${ayah.numberInSurah}`, e);
                      } else {
                        // Toggle verse hide/show
                        const newRevealed = new Set(revealedVerses);
                        if (newRevealed.has(ayah.numberInSurah)) {
                          newRevealed.delete(ayah.numberInSurah);
                        } else {
                          newRevealed.add(ayah.numberInSurah);
                        }
                        setRevealedVerses(newRevealed);
                      }
                    }
                  }}
                />
              );

              // Play and hide buttons direct shortcuts next to revealed verses in memorize mode
              const playButtonDirect = isMemorizeMode && !isVerseHidden && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayingAyahNumber(ayah.numberInSurah);
                    setIsAudioPlaying(true);
                  }}
                  className="inline-flex items-center justify-center p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-all scale-90 mx-1 align-middle cursor-pointer"
                  title="استماع لهذه الآية للتحقق"
                >
                  <Play size={11} className="fill-current" />
                </button>
              );

              const hideButtonDirect = isMemorizeMode && memorizeType === 'verses' && revealedVerses.has(ayah.numberInSurah) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newRevealed = new Set(revealedVerses);
                    newRevealed.delete(ayah.numberInSurah);
                    setRevealedVerses(newRevealed);
                  }}
                  className="inline-flex items-center justify-center p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-md transition-all scale-90 mx-1 align-middle cursor-pointer"
                  title="إخفاء الآية مجدداً"
                >
                  <EyeOff size={11} />
                </button>
              );

              return (
                <span 
                  key={ayah.number}
                  id={`ayah-${ayah.numberInSurah}`}
                  className={`inline transition-all duration-300 rounded relative px-1 ${isPlayingThisAyah ? 'bg-[var(--color-primary)]/20 dark:bg-[var(--color-primary)]/40 ring-2 ring-[var(--color-primary)] ring-offset-1 font-bold shadow-sm' : isActive ? (currentTheme.id === 'night' ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-primary)]/10') : !isMemorizeMode ? (currentTheme.id === 'night' ? 'hover:bg-gray-800 cursor-pointer' : 'hover:bg-[var(--color-primary)]/5 cursor-pointer') : ''}`}
                  onClick={(e) => {
                    if (isMemorizeMode) return; // Disable ayah menu in memorize mode
                    e.stopPropagation();
                    
                    setActiveAyahMenu(isActive ? null : ayah.numberInSurah);
                    setShowHighlightMenu(null);
                  }}
                >
                  {ayahContent}
                  {playButtonDirect}
                  {hideButtonDirect}
                  {ayahMarker}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Ayah Action Bar - Never clipped by top bars or side margins */}
      <AnimatePresence>
        {activeAyahMenu !== null && surahData && (() => {
          const activeAyahObj = surahData.ayahs?.find((a: any) => a.numberInSurah === activeAyahMenu);
          const activeSurahName = surahData.name ? getCleanSurahName(surahData.name) : '';
          const isBookmarked = isAyahBookmarked(activeAyahMenu);
          const isMarked = !!markedVerses[`${currentSurah}_${activeAyahMenu}`];
          const isPlayingThis = playingAyahNumber === activeAyahMenu && isAudioPlaying && currentSurah === surahData?.number;

          return (
            <motion.div
              id="floating-ayah-reader-bar"
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5 text-gray-900 dark:text-white pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-gray-100 dark:border-gray-800 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-[var(--color-primary)] dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {activeAyahMenu}
                  </div>
                  <span className="font-bold text-xs sm:text-sm font-serif text-[var(--color-primary-dark)] dark:text-emerald-300">
                    سُورَةُ {activeSurahName} • الآية {activeAyahMenu}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAyahMenu(null);
                    setShowHighlightMenu(null);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="إغلاق القائمة"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 select-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlayingThis) {
                      setIsAudioPlaying(false);
                    } else {
                      setPlayingAyahNumber(activeAyahMenu);
                      setIsAudioPlaying(true);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all border cursor-pointer ${
                    isPlayingThis
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/80 active:scale-95'
                  }`}
                >
                  {isPlayingThis ? <Pause size={18} /> : <Play size={18} />}
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {isPlayingThis ? 'إيقاف' : 'استماع'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentAyah(activeAyahMenu);
                    setCurrentView('tafsir');
                    setActiveAyahMenu(null);
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100/80 active:scale-95 rounded-2xl transition-all cursor-pointer"
                >
                  <BookOpen size={18} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] sm:text-[11px] font-bold">التفسير</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMarkVerse(activeAyahMenu);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all border cursor-pointer active:scale-95 ${
                    isMarked
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <Sparkles size={18} className={isMarked ? 'fill-current' : 'text-amber-500'} />
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {isMarked ? 'مميزة' : 'تمييز'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(activeAyahMenu);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all border cursor-pointer active:scale-95 ${
                    isBookmarked
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {isBookmarked ? 'محفوظة' : 'حفظ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeAyahObj?.text) {
                      navigator.clipboard.writeText(`﴿ ${activeAyahObj.text} ﴾ [سورة ${activeSurahName}: ${activeAyahMenu}]`);
                      setCopiedAyahId(activeAyahMenu);
                      setTimeout(() => setCopiedAyahId(null), 2000);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 active:scale-95 rounded-2xl transition-all cursor-pointer"
                >
                  {copiedAyahId === activeAyahMenu ? (
                    <Check size={18} className="text-emerald-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {copiedAyahId === activeAyahMenu ? 'تم النسخ' : 'نسخ'}
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default QuranReader;
