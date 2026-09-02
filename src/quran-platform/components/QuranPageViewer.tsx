import React, { useState, useEffect, useRef } from 'react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { QuranSyncService } from '../services/quranSyncService';
import { ChevronRight, ChevronLeft, Bookmark, BookOpen, Share2, Palette, EyeOff, Eye, Play, Pause, Sliders, Maximize2, Settings2, Sparkles, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MUSHAF_THEMES } from './QuranSettingsModal';
import { AyahMarker, getCleanSurahName, DecoratedBismillah } from './AyahMarker';
export const QuranPageViewer: React.FC = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    mushafTheme, 
    fontSize, 
    playingAyahNumber, 
    isAudioPlaying,
    setIsAudioPlaying,
    setPlayingAyahNumber,
    currentSurah,
    setCurrentSurah,
    currentAyah,
    setCurrentAyah,
    setSurahAndAyah,
    setCurrentView,
    setReadingMode,
    setShowSettingsModal,
    openSurahSettings,
    isImmersive,
    setIsImmersive
  } = useQuranContext();

  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAyahMenu, setActiveAyahMenu] = useState<string | null>(null);
  const [copiedAyahId, setCopiedAyahId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<{surah: number, ayah: number}[]>([]);
  const [markedVerses, setMarkedVerses] = useState<Record<string, boolean>>({});

  const toggleMarkVerse = (surahNum: number, ayahNum: number) => {
    const key = `${surahNum}_${ayahNum}`;
    const next = { ...markedVerses };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = true;
    }
    setMarkedVerses(next);
    localStorage.setItem("quran_marked_verses", JSON.stringify(next));
    setActiveAyahMenu(null);
    QuranSyncService.isUserLoggedIn().then(logged => {
      if (logged) QuranSyncService.pushToCloud();
    });
  };
  const [pageTurnDirection, setPageTurnDirection] = useState<'next' | 'prev'>('next');
  const [isMemorizeMode, setIsMemorizeMode] = useState<boolean>(false);
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const lastScrollTop = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef<boolean>(false);

  const themeConfig = MUSHAF_THEMES.find(t => t.id === mushafTheme) || MUSHAF_THEMES[0];

  const currentSurahRef = useRef(currentSurah);
  const currentAyahRef = useRef(currentAyah);

  useEffect(() => {
    currentSurahRef.current = currentSurah;
  }, [currentSurah]);

  useEffect(() => {
    currentAyahRef.current = currentAyah;
  }, [currentAyah]);

  // Fetch Page Data when currentPage changes
  useEffect(() => {
    const fetchPage = async () => {
      isAutoScrollingRef.current = true; // Block scroll detection immediately on page load initiation
      setLoading(true);
      const data = await QuranDataService.getPage(currentPage);
      setPageData(data);
      setLoading(false);
      setActiveAyahMenu(null);
      setRevealedWords(new Set());
      setIsHeaderVisible(true);
      lastScrollTop.current = 0;

      if (data && data.ayahs && data.ayahs.length > 0) {
        const latestSurah = currentSurahRef.current;
        const latestAyah = currentAyahRef.current;
        
        // Check if the currently set currentSurah AND currentAyah are on this page
        const isCurrentAyahOnPage = data.ayahs.some((a: any) => a.surah.number === latestSurah && a.numberInSurah === latestAyah);
        
        if (isCurrentAyahOnPage) {
          if (!isAudioPlaying) {
            setPlayingAyahNumber(latestAyah);
          }
        } else {
          // If our selected surah is on this page, but maybe not the selected ayah, let's select the first ayah of our surah on this page!
          const ourSurahAyah = data.ayahs.find((a: any) => a.surah.number === latestSurah);
          if (ourSurahAyah) {
            setCurrentSurah(latestSurah);
            setCurrentAyah(ourSurahAyah.numberInSurah);
            if (!isAudioPlaying) {
              setPlayingAyahNumber(ourSurahAyah.numberInSurah);
            }
          } else {
            // Otherwise, fall back to the first ayah of the page
            const firstAyah = data.ayahs[0];
            setCurrentSurah(firstAyah.surah.number);
            setCurrentAyah(firstAyah.numberInSurah);
            if (!isAudioPlaying) {
              setPlayingAyahNumber(firstAyah.numberInSurah);
            }
          }
        }
      }
    };
    fetchPage();

    const savedBookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
    setBookmarks(savedBookmarks);
    const savedMarked = JSON.parse(localStorage.getItem('quran_marked_verses') || '{}');
    setMarkedVerses(savedMarked);
  }, [currentPage]);

  // Sync Audio Playback with Page numbers
  useEffect(() => {
    if (pageData && pageData.ayahs && playingAyahNumber && isAudioPlaying) {
      // Check if active playing verse belongs to another page
      const ayahOnThisPage = pageData.ayahs.find((a: any) => a.surah.number === currentSurah && a.numberInSurah === playingAyahNumber);
      if (!ayahOnThisPage) {
        // Find page of playing ayah
        QuranDataService.getSurah(currentSurah).then(surah => {
          if (surah && surah.ayahs) {
            const foundAyah = surah.ayahs.find((a: any) => a.numberInSurah === playingAyahNumber);
            if (foundAyah && foundAyah.page && foundAyah.page !== currentPage) {
              isAutoScrollingRef.current = true; // Block scroll detection
              setCurrentPage(foundAyah.page);
            }
          }
        });
      }
    }
  }, [playingAyahNumber, isAudioPlaying, currentSurah]);

  // Auto-scroll to target verse on page when currentAyah changes, currentSurah changes, or page loads
  useEffect(() => {
    let scrollEndTimer: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    if (!loading && pageData) {
      isAutoScrollingRef.current = true; // Lock scroll detection immediately before scrolling starts
      
      timer = setTimeout(() => {
        const element = currentAyah 
          ? document.getElementById(`page-ayah-${currentSurah}-${currentAyah}`)
          : null;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          scrollEndTimer = setTimeout(() => {
            isAutoScrollingRef.current = false; // Unlock scroll detection after scroll is complete and stable
          }, 1200);
        } else {
          // If no matching element, release immediately
          isAutoScrollingRef.current = false;
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        clearTimeout(scrollEndTimer);
      };
    }
  }, [loading, pageData, currentAyah, currentPage, currentSurah]);

  // Dismiss Ayah action menu when tapping outside both the active ayah AND the floating action bar
  useEffect(() => {
    if (activeAyahMenu === null) return;

    // Click/Touch Outside listener: Hide only if tapping outside both the active ayah AND the action bar
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('#floating-ayah-page-bar') ||
        target.closest(`#page-ayah-${activeAyahMenu}`)
      ) {
        return;
      }
      setActiveAyahMenu(null);
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

  const handleNextPage = () => {
    if (currentPage < 604) {
      isAutoScrollingRef.current = true;
      setPageTurnDirection('next');
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      isAutoScrollingRef.current = true;
      setPageTurnDirection('prev');
      setCurrentPage(currentPage - 1);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const currentScrollTop = container.scrollTop;
    if (currentScrollTop > lastScrollTop.current + 15 && currentScrollTop > 40) {
      setIsHeaderVisible(false);
    } else if (currentScrollTop < lastScrollTop.current - 10 || currentScrollTop <= 15) {
      setIsHeaderVisible(true);
    }
    lastScrollTop.current = currentScrollTop;

    // Detect active Surah on scroll only if we are not currently auto-scrolling
    if (isAutoScrollingRef.current) return;

    const containerRect = container.getBoundingClientRect();
    const sections = container.querySelectorAll('[id^="page-surah-section-"]');
    
    const containerTop = containerRect.top;
    const targetY = containerTop + 120; // 120px from top of container is the reading focal point

    let bestSection: { id: number; distance: number; visibleHeight: number } | null = null;
    let closestSurahId: number | null = null;

    sections.forEach((section: any) => {
      const rect = section.getBoundingClientRect();
      const idParts = section.id.split('-');
      const surahId = parseInt(idParts[idParts.length - 1], 10);

      // Check if this section spans the focal point targetY
      if (rect.top <= targetY && rect.bottom >= targetY) {
        closestSurahId = surahId;
      }

      // Also calculate distance of the section's top to the targetY
      const distance = Math.abs(rect.top - targetY);
      
      // Calculate visible height of this section in the container
      const topVisible = Math.max(rect.top, containerRect.top);
      const bottomVisible = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, bottomVisible - topVisible);

      if (!bestSection || visibleHeight > bestSection.visibleHeight || (visibleHeight === bestSection.visibleHeight && distance < bestSection.distance)) {
        bestSection = { id: surahId, distance, visibleHeight };
      }
    });

    // If no section spanned targetY directly, fallback to the best visible section
    if (closestSurahId === null && bestSection && bestSection.visibleHeight > 0) {
      closestSurahId = bestSection.id;
    }

    if (closestSurahId !== null && closestSurahId !== currentSurah) {
      // Pause playback if active surah changes due to scroll
      if (isAudioPlaying) {
        setIsAudioPlaying(false);
      }
      
      if (pageData && pageData.ayahs) {
        const firstAyahOfThisSurahOnPage = pageData.ayahs.find((a: any) => a.surah.number === closestSurahId);
        if (firstAyahOfThisSurahOnPage) {
          setSurahAndAyah(closestSurahId, firstAyahOfThisSurahOnPage.numberInSurah);
          setPlayingAyahNumber(firstAyahOfThisSurahOnPage.numberInSurah);
        } else {
          setSurahAndAyah(closestSurahId, 1);
          setPlayingAyahNumber(1);
        }
      }
    }
  };

  const toggleBookmark = (surahNum: number, ayahNum: number) => {
    const isBookmarked = bookmarks.some(b => b.surah === surahNum && b.ayah === ayahNum);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => !(b.surah === surahNum && b.ayah === ayahNum));
    } else {
      newBookmarks = [...bookmarks, { surah: surahNum, ayah: ayahNum }];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
    setActiveAyahMenu(null);

    // Auto-sync background
    QuranSyncService.isUserLoggedIn().then(logged => {
      if (logged) QuranSyncService.pushToCloud();
    });
  };

  if (loading) {
    return (
      <div className={`flex flex-col justify-center items-center h-full ${themeConfig.previewBg}`}>
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-gray-500">جاري تحميل الصفحة {currentPage} من المصحف...</p>
      </div>
    );
  }

  if (!pageData || !pageData.ayahs || pageData.ayahs.length === 0) {
    return (
      <div className={`flex justify-center items-center h-full text-gray-500 ${themeConfig.previewBg}`}>
        عذراً، تعذر تحميل الصفحة {currentPage}.
      </div>
    );
  }

  // Get Surah Info from first ayah of page
  const firstAyah = pageData.ayahs[0];
  
  const juzNumber = firstAyah.juz;

  // Group ayahs by surah on this page
  const ayahsBySurah: { [key: number]: { surah: any; ayahs: any[] } } = {};
  pageData.ayahs.forEach((ayah: any) => {
    const surahId = ayah.surah.number;
    if (!ayahsBySurah[surahId]) {
      ayahsBySurah[surahId] = { surah: ayah.surah, ayahs: [] };
    }
    ayahsBySurah[surahId].ayahs.push(ayah);
  });

  // Determine primary surah for header
  let primarySurah = firstAyah.surah;
  
  // If the currentSurah from context is on this page, make it primary
  if (ayahsBySurah[currentSurah]) {
    primarySurah = ayahsBySurah[currentSurah].surah;
  }

  return (
    <div className={`flex flex-col h-full ${themeConfig.previewBg} relative select-none overflow-hidden text-right`} dir="rtl">
      
      {/* Integrated Minimal Page Header Bar */}
      <AnimatePresence>
        {(isHeaderVisible && !isImmersive) && (
          <motion.div key="QuranPageViewer-anim-1"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-b border-gray-200/50 dark:border-gray-800 shrink-0 bg-black/5 dark:bg-white/5"
          >
            <div className="flex items-center justify-between px-3 sm:px-6 py-2 text-xs font-bold">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                  onClick={() => setCurrentView('index')}
                  className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-700 dark:text-gray-200 flex items-center gap-1"
                  title="الرجوع إلى الفهرس"
                >
                  <ChevronRight size={18} />
                  <span className="text-xs font-bold hidden sm:inline">الفهرس</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-primary-dark)] dark:text-emerald-400 font-quran font-bold text-base sm:text-lg leading-none select-none">سُورَةُ {getCleanSurahName(primarySurah.name)}</span>
                </div>
              </div>

              <div className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-bold">
                الجزء {juzNumber} • صفحة {currentPage} من ٦٠٤
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setIsMemorizeMode(!isMemorizeMode);
                    setRevealedWords(new Set());
                  }}
                  className={`p-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isMemorizeMode 
                      ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50' 
                      : 'hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                  }`}
                  title="وضع اختبار الحفظ"
                >
                  {isMemorizeMode ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span className="hidden sm:inline">اختبار الحفظ</span>
                </button>

                <button
                  onClick={() => openSurahSettings(primarySurah.number)}
                  className="p-1.5 px-2.5 sm:px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="إعدادات وخيارات السورة"
                >
                  <Sliders size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">إعدادات السورة</span>
                </button>

                <button 
                  onClick={() => {
                    setIsImmersive(true);
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    }
                  }}
                  className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-all"
                  title="ملء الشاشة (إخفاء الأشرطة والقوائم)"
                >
                  <Maximize2 size={16} />
                  <span className="hidden sm:inline">ملء الشاشة</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memorization Test Mode Helper Banner */}
      {isMemorizeMode && (
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between shrink-0 gap-2">
          <span>💡 وضع اختبار الحفظ مفعل: انقر على أي كلمة مخفية لإظهارها</span>
          <button
            onClick={() => setRevealedWords(new Set())}
            className="px-2 py-1 rounded-lg bg-amber-600 text-white text-[11px] hover:bg-amber-700 transition-colors shrink-0"
          >
            إعادة إخفاء الكل
          </button>
        </div>
      )}

      {/* Main Mushaf Frame Page Area - Immersive Full-Screen Layout */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 flex items-start justify-center touch-pan-y"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: pageTurnDirection === 'next' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: pageTurnDirection === 'next' ? 30 : -30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            dragSnapToOrigin={true}
            onDragEnd={(_, info) => {
              const swipeThreshold = 40;
              const velocityThreshold = 150;
              if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                handleNextPage();
              } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                handlePrevPage();
              }
            }}
            className={`w-full max-w-5xl my-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl relative border-2 sm:border-4 transition-all duration-300 touch-pan-y cursor-grab active:cursor-grabbing ${themeConfig.previewBorder} ${themeConfig.previewBg} ${themeConfig.textColor}`}
            style={{
              boxShadow: mushafTheme === 'night' ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 20px 40px -10px rgba(139, 90, 43, 0.15)',
            }}
          >
            {/* Islamic Corner Ornaments */}
            <div className={`absolute top-2 right-2 text-xs select-none ${mushafTheme === 'night' ? 'text-emerald-500/60' : 'opacity-40'}`}>☸</div>
            <div className={`absolute top-2 left-2 text-xs select-none ${mushafTheme === 'night' ? 'text-emerald-500/60' : 'opacity-40'}`}>☸</div>
            <div className={`absolute bottom-2 right-2 text-xs select-none ${mushafTheme === 'night' ? 'text-emerald-500/60' : 'opacity-40'}`}>☸</div>
            <div className={`absolute bottom-2 left-2 text-xs select-none ${mushafTheme === 'night' ? 'text-emerald-500/60' : 'opacity-40'}`}>☸</div>

            {/* Content Grouped by Surah */}
            <div className="space-y-6">
              {Object.values(ayahsBySurah).map(({ surah, ayahs }) => {
                const isFirstVerseOfSurahOnPage = ayahs[0].numberInSurah === 1;

                return (
                  <div key={surah.number} id={`page-surah-section-${surah.number}`} className="relative">
                    {/* Surah Header Ornament Banner if verse 1 */}
                    {isFirstVerseOfSurahOnPage && (
                      <div className="my-4 sm:my-6 text-center">
                        <div className={`inline-block border-2 border-amber-600/40 px-6 sm:px-8 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white font-bold text-base sm:text-lg shadow-md my-1`}>
                          سُورَةُ {getCleanSurahName(surah.name)}
                        </div>
                        {surah.number !== 1 && surah.number !== 9 && (
                          <DecoratedBismillah fontSize={fontSize} themeId={mushafTheme} />
                        )}
                      </div>
                    )}

                    {/* Verses Flow */}
                    <div 
                      className={`text-justify leading-[2.4] tracking-wide ${themeConfig.textColor}`} 
                      style={{ 
                        fontSize: `${fontSize}px`, 
                        fontFamily: "'Amiri', 'Uthmani', serif",
                        direction: 'rtl'
                      }}
                    >
                      {ayahs.map((ayah: any, aIdx: number) => {
                        let text = ayah.text;
                        if (surah.number !== 1 && ayah.numberInSurah === 1 && text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ')) {
                          text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
                        }

                        const isPlayingThisAyah = playingAyahNumber === ayah.numberInSurah && currentSurah === surah.number && isAudioPlaying;
                        const isBookmarked = bookmarks.some(b => b.surah === surah.number && b.ayah === ayah.numberInSurah);
                        const isMarked = markedVerses[`${surah.number}_${ayah.numberInSurah}`];
                        const markedClass = isMarked ? 'bg-amber-100/90 dark:bg-amber-950/70 border-b-2 border-amber-500 shadow-xs ring-1 ring-amber-400/40 rounded px-1' : '';

                        return (
                          <span
                            key={`${surah.number}_${ayah.numberInSurah || ayah.number || aIdx}`}
                            id={`page-ayah-${surah.number}-${ayah.numberInSurah}`}
                            onClick={(e) => {
                              if (isMemorizeMode) return;
                              e.stopPropagation();
                              const menuId = `${surah.number}-${ayah.numberInSurah}`;
                              setActiveAyahMenu(activeAyahMenu === menuId ? null : menuId);
                            }}
                            className={`inline relative rounded px-0.5 transition-all duration-300 ${!isMemorizeMode ? 'cursor-pointer hover:bg-amber-500/10' : ''} ${isPlayingThisAyah ? 'bg-[var(--color-primary)]/25 dark:bg-[var(--color-primary)]/40 ring-2 ring-[var(--color-primary)] font-bold text-[var(--color-primary-dark)] dark:text-emerald-300' : activeAyahMenu === `${surah.number}-${ayah.numberInSurah}` ? 'bg-amber-400/25 dark:bg-amber-400/40 ring-2 ring-amber-500 font-bold' : themeConfig.textColor} ${markedClass}`}
                          >
                            {isMarked && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold mx-1 align-middle shadow-xs animate-pulse" title="آية مميزة للتركيز والمراجعة">
                                <Sparkles size={9} /> مميزة
                              </span>
                            )}
                            {isMemorizeMode ? (
                              <span>
                                {text.split(' ').map((word: string, wIdx: number) => {
                                  if (!word) return null;
                                  const wordKey = `${surah.number}_${ayah.numberInSurah}_${wIdx}`;
                                  const isRevealed = revealedWords.has(wordKey);

                                  if (isRevealed) {
                                    return (
                                      <span 
                                        key={wordKey} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const next = new Set(revealedWords);
                                          next.delete(wordKey);
                                          setRevealedWords(next);
                                        }}
                                        className="inline-block mx-0.5 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-bold cursor-pointer hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
                                        title="انقر لإخفاء الكلمة"
                                      >
                                        {word}{' '}
                                      </span>
                                    );
                                  }

                                  return (
                                    <span
                                      key={wordKey}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const next = new Set(revealedWords);
                                        next.add(wordKey);
                                        setRevealedWords(next);
                                      }}
                                      className="inline-block mx-0.5 px-2 py-0.5 rounded-md bg-amber-300/80 dark:bg-amber-800/80 text-transparent select-none cursor-pointer hover:bg-amber-400 dark:hover:bg-amber-700 border border-amber-500/40 shadow-xs active:scale-95 transition-all"
                                      title="انقر لإظهار الكلمة"
                                    >
                                      <span className="opacity-0 select-none">{word}</span>
                                    </span>
                                  );
                                })}
                              </span>
                            ) : (
                              <span>{text}</span>
                            )}
                            
                            {/* Verse Number Ornate Ornaments */}
                            <AyahMarker
                              ayahNumber={ayah.numberInSurah}
                              themeId={mushafTheme}
                              isPlaying={isPlayingThisAyah}
                              isBookmarked={isBookmarked}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Page Number & Integrated Navigation Bar at bottom of page frame */}
            <div className="mt-8 pt-4 border-t border-amber-600/20 flex items-center justify-between px-1 sm:px-3 select-none">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-30 text-white font-bold text-xs shadow-sm transition-all"
                title="الصفحة السابقة"
              >
                <ChevronRight size={18} />
                <span className="hidden sm:inline">الصفحة السابقة</span>
                <span className="sm:hidden">السابقة</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full border-2 border-amber-600/40 flex items-center justify-center font-bold text-xs sm:text-sm text-[var(--color-primary-dark)] dark:text-amber-300 shadow-inner bg-amber-500/5">
                  {currentPage}
                </div>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= 604}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-30 text-white font-bold text-xs shadow-sm transition-all"
                title="الصفحة التالية"
              >
                <span className="hidden sm:inline">الصفحة التالية</span>
                <span className="sm:hidden">التالية</span>
                <ChevronLeft size={18} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Ayah Action Bar - Never clipped by top bars or side margins */}
      <AnimatePresence>
        {activeAyahMenu !== null && (() => {
          const [activeSurahStr, activeAyahStr] = activeAyahMenu.split('-');
          const activeSurahNum = parseInt(activeSurahStr, 10);
          const activeAyahNum = parseInt(activeAyahStr, 10);
          const activeAyahObj = pageData?.ayahs?.find((a: any) => a.surah.number === activeSurahNum && a.numberInSurah === activeAyahNum);
          const activeSurahName = activeAyahObj?.surah?.name ? getCleanSurahName(activeAyahObj.surah.name) : (primarySurah ? getCleanSurahName(primarySurah.name) : '');
          const isBookmarked = bookmarks.some(b => b.surah === activeSurahNum && b.ayah === activeAyahNum);
          const isMarked = !!markedVerses[`${activeSurahNum}_${activeAyahNum}`];
          const isPlayingThis = playingAyahNumber === activeAyahNum && currentSurah === activeSurahNum && isAudioPlaying;

          return (
            <motion.div key="QuranPageViewer-anim-2"
              id="floating-ayah-page-bar"
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
                    {activeAyahNum}
                  </div>
                  <span className="font-bold text-xs sm:text-sm font-serif text-[var(--color-primary-dark)] dark:text-emerald-300">
                    سُورَةُ {activeSurahName} • الآية {activeAyahNum}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAyahMenu(null);
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
                      setSurahAndAyah(activeSurahNum, activeAyahNum);
                      setPlayingAyahNumber(activeAyahNum);
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
                    setSurahAndAyah(activeSurahNum, activeAyahNum);
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
                    toggleMarkVerse(activeSurahNum, activeAyahNum);
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
                    toggleBookmark(activeSurahNum, activeAyahNum);
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
                      navigator.clipboard.writeText(`﴿ ${activeAyahObj.text} ﴾ [سورة ${activeSurahName}: ${activeAyahNum}]`);
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
