import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Type, 
  BookOpen, 
  AlignJustify, 
  Settings2, 
  Settings, 
  Sparkles, 
  Eye, 
  EyeOff,
  Search,
  Check,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useQuranContext, MushafTheme } from '../store/QuranContext';
import { MUSHAF_THEMES } from './QuranSettingsModal';
import { getCleanSurahName } from './AyahMarker';

export const FloatingImmersiveBar: React.FC = () => {
  const {
    isImmersive,
    setIsImmersive,
    currentPage,
    setCurrentPage,
    currentSurah,
    setCurrentSurah,
    fontSize,
    setFontSize,
    mushafTheme,
    setMushafTheme,
    readingMode,
    setReadingMode,
    isAudioPlaying,
    setIsAudioPlaying,
    playingAyahNumber,
    setPlayingAyahNumber,
    setShowSettingsModal,
    openSurahSettings,
    setCurrentView
  } = useQuranContext();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showPageInput, setShowPageInput] = useState<boolean>(false);
  const [inputPageVal, setInputPageVal] = useState<string>('');
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls after 4 seconds of inactivity when in immersive mode
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 4500);
  };

  useEffect(() => {
    if (isImmersive) {
      resetIdleTimer();
      const handleActivity = () => resetIdleTimer();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('keydown', handleActivity);
      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('keydown', handleActivity);
      };
    } else {
      setIsIdle(false);
    }
  }, [isImmersive]);

  // Request native fullscreen if available
  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsImmersive(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsImmersive(false);
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPageVal, 10);
    if (!isNaN(p) && p >= 1 && p <= 604) {
      setCurrentPage(p);
      setShowPageInput(false);
      setInputPageVal('');
    }
  };

  if (!isImmersive) return null;

  return (
    <div 
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] transition-opacity duration-500 ${isIdle ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}
      dir="rtl"
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="immersive-bar-expanded"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-gray-900/90 dark:bg-gray-950/95 backdrop-blur-xl text-white rounded-3xl p-2 sm:p-2.5 shadow-2xl border border-white/10 flex items-center gap-1.5 sm:gap-3 max-w-[95vw] overflow-x-auto no-scrollbar"
          >
            {/* Exit Immersive / Fullscreen */}
            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                setIsImmersive(false);
              }}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1 shrink-0 active:scale-95"
              title="خروج من القراءة الكاملة"
            >
              <Minimize2 size={18} />
              <span className="text-xs font-bold hidden md:inline">إغلاق الشاشة الكاملة</span>
            </button>

            <div className="h-6 w-px bg-white/15 shrink-0" />

            {/* Page Navigation Controls (Page Mode) */}
            {readingMode === 'page' && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 text-white transition-colors"
                  title="الصفحة السابقة"
                >
                  <ChevronRight size={18} />
                </button>

                {showPageInput ? (
                  <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={604}
                      value={inputPageVal}
                      onChange={(e) => setInputPageVal(e.target.value)}
                      placeholder={`${currentPage}`}
                      autoFocus
                      className="w-14 px-2 py-1 bg-black/40 border border-white/20 rounded-lg text-center text-xs font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button type="submit" className="p-1 rounded-lg bg-amber-600 text-xs font-bold px-2">
                      انتقال
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setShowPageInput(true);
                      setInputPageVal(`${currentPage}`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300 transition-colors flex items-center gap-1"
                    title="انتقال مباشر إلى صفحة"
                  >
                    <span>صفحة {currentPage}</span>
                    <span className="text-[10px] opacity-60">/ 604</span>
                  </button>
                )}

                <button
                  onClick={() => currentPage < 604 && setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= 604}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 text-white transition-colors"
                  title="الصفحة التالية"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            )}

            {/* Reading Mode Switcher */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => setReadingMode('page')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  readingMode === 'page' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-300 hover:text-white'
                }`}
                title="عرض الصفحات التقليدية"
              >
                <BookOpen size={14} />
                <span className="hidden sm:inline">صفحات</span>
              </button>
              <button
                onClick={() => setReadingMode('scroll')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  readingMode === 'scroll' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-300 hover:text-white'
                }`}
                title="عرض التمرير المستمر"
              >
                <AlignJustify size={14} />
                <span className="hidden sm:inline">تمرير</span>
              </button>
            </div>

            <div className="h-6 w-px bg-white/15 shrink-0 hidden sm:block" />

            {/* Quick Font Size Adjuster */}
            <div className="flex items-center gap-1 shrink-0 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center font-bold text-xs active:scale-95"
                title="تصغير الخط"
              >
                A-
              </button>
              <span className="text-[11px] font-bold px-1 min-w-[28px] text-center text-amber-200">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(42, fontSize + 2))}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center font-bold text-xs active:scale-95"
                title="تكبير الخط"
              >
                A+
              </button>
            </div>

            {/* Theme Picker Quick Dots */}
            <div className="flex items-center gap-1.5 shrink-0 bg-white/10 p-1 rounded-xl">
              {MUSHAF_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMushafTheme(t.id);
                    localStorage.setItem('quran_mushaf_theme', t.id);
                  }}
                  className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                    t.previewBg
                  } border-2 ${mushafTheme === t.id ? 'border-amber-400 scale-110 shadow-md' : 'border-white/30 hover:scale-105'}`}
                  title={t.name}
                >
                  {mushafTheme === t.id && <Check size={10} className={t.textColor} />}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-white/15 shrink-0" />

            {/* Audio Quick Play/Pause */}
            <button
              onClick={() => setIsAudioPlaying(!isAudioPlaying)}
              className={`p-2.5 rounded-2xl font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                isAudioPlaying ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isAudioPlaying ? 'إيقاف التلاوة' : 'تشغيل التلاوة الصوتية'}
            >
              {isAudioPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Surah Settings Shortcut */}
            <button
              onClick={() => openSurahSettings(currentSurah)}
              className="px-3 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
              title="إعدادات خيارات السورة، الفضائل والتفسير"
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>إعدادات السورة</span>
            </button>

            {/* Collapse Pill Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition-colors shrink-0"
              title="تصغير الشريط"
            >
              <ChevronDown size={18} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="immersive-bar-collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="px-4 py-2.5 rounded-full bg-gray-900/90 dark:bg-gray-950/95 backdrop-blur-md text-amber-300 hover:text-white font-bold text-xs border border-white/20 shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <BookOpen size={16} />
              <span>أدوات القراءة (صفحة {currentPage})</span>
              <ChevronUp size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
