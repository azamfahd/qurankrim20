import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Layers, Bookmark, Heart, Settings, PlayCircle, Info, Target, BarChart2, Minimize2 } from 'lucide-react';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const QuranReader = lazyWithRetry(() => import('./components/QuranReader'));
const QuranIndex = lazyWithRetry(() => import('./components/QuranIndex'));
const QuranAudioPlayer = lazyWithRetry(() => import('./components/QuranAudioPlayer'));
const QuranTafsir = lazyWithRetry(() => import('./components/QuranTafsir'));
const QuranInfo = lazyWithRetry(() => import('./components/QuranInfo'));
const QuranMemorize = lazyWithRetry(() => import('./components/QuranMemorize'));
const QuranStats = lazyWithRetry(() => import('./components/QuranStats'));
const QuranSettingsModal = lazyWithRetry(() => import('./components/QuranSettingsModal').then(m => ({ default: m.QuranSettingsModal })));
const SurahSettingsModal = lazyWithRetry(() => import('./components/SurahSettingsModal').then(m => ({ default: m.SurahSettingsModal })));
import { FloatingImmersiveBar } from './components/FloatingImmersiveBar';
import { QuranProvider, useQuranContext } from './store/QuranContext';

const ViewSuspenseFallback = () => (
  <div className="flex-1 h-full w-full flex items-center justify-center bg-[#FAFAF8] animate-fade-in">
    <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

interface QuranPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurah?: number;
  initialAyah?: number;
  initialView?: 'index' | 'reader' | 'tafsir' | 'info' | 'memorize' | 'stats';
}

const QuranPlatformContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentView, setCurrentView, setShowSettingsModal, isImmersive, setIsImmersive } = useQuranContext();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const renderContent = () => {
    switch (currentView) {
      case 'index':
        return <QuranIndex />;
      case 'reader':
        return <QuranReader />;
      case 'tafsir':
        return <QuranTafsir />;
      case 'info':
        return <QuranInfo />;
      case 'memorize':
        return <QuranMemorize />;
      case 'stats':
        return <QuranStats />;
      default:
        return <QuranIndex />;
    }
  };

  return (
    <motion.div key="QuranPlatformModal-anim-1"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#FAFAF8] overflow-hidden"
    >
      {/* Header */}
      <AnimatePresence>
        {!(currentView === 'reader' && isImmersive) && (
          <motion.header
            key="quran-platform-header"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-b border-amber-500/25 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-amber-50 shadow-lg px-3 sm:px-5 shrink-0 z-10"
            style={{
              paddingTop: 'max(0.45rem, var(--safe-area-top, 0px))',
              paddingBottom: '0.45rem',
            }}
          >
            {/* Expanded Navigation Bar Layout with Fixed Close & Index Buttons and Scrollable Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 w-full" dir="rtl">
              
              {/* 1. Fixed Action Controls (Always visible without scrolling) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Dedicated Fixed Close Button */}
                <button 
                  onClick={onClose}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer select-none bg-red-500/20 hover:bg-red-500/35 text-red-100 hover:text-white border border-red-500/40 shrink-0 active:scale-95 shadow-xs"
                  title="إغلاق قسم المصحف الشريف والعودة للتطبيق"
                >
                  <X size={15} className="text-red-300" />
                  <span className="hidden xs:inline sm:inline">إغلاق المصحف</span>
                  <span className="xs:hidden">إغلاق</span>
                </button>

                {/* Fixed Index (الفهرس) Button - Compact & Beautiful */}
                <button 
                  onClick={() => setCurrentView('index')}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border shrink-0 active:scale-95 shadow-xs ${
                    currentView === 'index' 
                      ? 'bg-emerald-500/35 text-emerald-100 border-emerald-400/80 shadow-xs ring-1 ring-emerald-400/40 font-black' 
                      : 'bg-emerald-500/15 text-emerald-100/90 hover:bg-emerald-500/25 hover:text-white border-emerald-500/30'
                  }`}
                  title="فهرس السور والأجزاء"
                >
                  <Layers size={15} className="text-emerald-300" />
                  <span>الفهرس</span>
                </button>
              </div>

              {/* Vertical divider */}
              <div className="h-6 sm:h-7 w-px bg-amber-500/30 shrink-0 mx-0.5"></div>

              {/* 2. Expanded Scrollable Navigation Frame */}
              <div className="relative flex-1 min-w-0 rounded-xl sm:rounded-2xl bg-black/30 border border-amber-500/25 p-1 sm:p-1.5 shadow-inner backdrop-blur-md group">
                {/* Visual scroll fade hints on edges */}
                <div className="pointer-events-none absolute left-1 top-1 bottom-1 w-5 bg-gradient-to-r from-emerald-950/90 to-transparent rounded-l-xl z-10 opacity-80"></div>
                <div className="pointer-events-none absolute right-1 top-1 bottom-1 w-5 bg-gradient-to-l from-emerald-950/90 to-transparent rounded-r-xl z-10 opacity-80"></div>

                {/* Scrollable track */}
                <div className="w-full overflow-x-auto no-scrollbar py-0.5 scroll-smooth" dir="rtl">
                  <div className="flex items-center gap-2 sm:gap-2.5 w-max min-w-full px-1.5">
                    
                    {/* 1. القراءة - Amber Theme */}
                    <button 
                      onClick={() => setCurrentView('reader')}
                      className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none border shrink-0 active:scale-95 shadow-3xs ${
                        currentView === 'reader' 
                          ? 'bg-amber-500/35 text-amber-100 border-amber-400/80 shadow-xs ring-1 ring-amber-400/40 font-black' 
                          : 'bg-amber-500/15 text-amber-100/90 hover:bg-amber-500/25 hover:text-white border-amber-500/30'
                      }`}
                      title="قراءة المصحف الشريف"
                    >
                      <BookOpen size={16} className="text-amber-300" />
                      <span>القراءة</span>
                    </button>

                    {/* 2. مشغل التلاوة وإعدادات الصوت - Cyan Theme */}
                    <QuranAudioPlayer />

                    {/* 3. زر إعدادات المصحف - Purple Theme */}
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none bg-purple-500/15 text-purple-100/90 hover:bg-purple-500/25 hover:text-white border border-purple-500/30 active:scale-95 shrink-0 shadow-3xs"
                      title="إعدادات المصحف والخطوط والقراءة"
                    >
                      <Settings size={16} className="text-purple-300" />
                      <span>إعدادات المصحف</span>
                    </button>

                    {/* فاصل جمالي خفيف */}
                    <div className="h-6 w-px bg-white/15 shrink-0 mx-0.5"></div>

                    {/* 4. التفسير والتدبر - Rose Theme */}
                    <button 
                      onClick={() => setCurrentView('tafsir')}
                      className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none border shrink-0 active:scale-95 shadow-3xs ${
                        currentView === 'tafsir' 
                          ? 'bg-rose-500/35 text-rose-100 border-rose-400/80 shadow-xs ring-1 ring-rose-400/40 font-black' 
                          : 'bg-rose-500/15 text-rose-100/90 hover:bg-rose-500/25 hover:text-white border-rose-500/30'
                      }`}
                      title="التفسير والتدبر القرآني"
                    >
                      <Heart size={16} className="text-rose-300" />
                      <span>التفسير والتدبر</span>
                    </button>

                    {/* 5. معلومات السورة - Indigo Theme */}
                    <button 
                      onClick={() => setCurrentView('info')}
                      className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none border shrink-0 active:scale-95 shadow-3xs ${
                        currentView === 'info' 
                          ? 'bg-indigo-500/35 text-indigo-100 border-indigo-400/80 shadow-xs ring-1 ring-indigo-400/40 font-black' 
                          : 'bg-indigo-500/15 text-indigo-100/90 hover:bg-indigo-500/25 hover:text-white border-indigo-500/30'
                      }`}
                      title="فضائل ومعلومات السورة"
                    >
                      <Info size={16} className="text-indigo-300" />
                      <span>معلومات السورة</span>
                    </button>

                    {/* 6. الحفظ - Teal Theme */}
                    <button 
                      onClick={() => setCurrentView('memorize')}
                      className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none border shrink-0 active:scale-95 shadow-3xs ${
                        currentView === 'memorize' 
                          ? 'bg-teal-500/35 text-teal-100 border-teal-400/80 shadow-xs ring-1 ring-teal-400/40 font-black' 
                          : 'bg-teal-500/15 text-teal-100/90 hover:bg-teal-500/25 hover:text-white border-teal-500/30'
                      }`}
                      title="مساعد الحفظ والمراجعة"
                    >
                      <Target size={16} className="text-teal-300" />
                      <span>الحفظ</span>
                    </button>

                    {/* 7. الإحصائيات - Orange Theme */}
                    <button 
                      onClick={() => setCurrentView('stats')}
                      className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none border shrink-0 active:scale-95 shadow-3xs ${
                        currentView === 'stats' 
                          ? 'bg-orange-500/35 text-orange-100 border-orange-400/80 shadow-xs ring-1 ring-orange-400/40 font-black' 
                          : 'bg-orange-500/15 text-orange-100/90 hover:bg-orange-500/25 hover:text-white border-orange-500/30'
                      }`}
                      title="إحصائيات القراءة والختمات"
                    >
                      <BarChart2 size={16} className="text-orange-300" />
                      <span>الإحصائيات</span>
                    </button>

                  </div>
                </div>
              </div>

            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main 
        className="flex-1 overflow-y-auto relative bg-[#FAFAF8] custom-scrollbar flex flex-col"
        style={{
          paddingBottom: 'max(0.5rem, var(--safe-area-bottom, 0px))',
          paddingLeft: 'max(0px, var(--safe-area-left, 0px))',
          paddingRight: 'max(0px, var(--safe-area-right, 0px))'
        }}
      >
        <Suspense fallback={<ViewSuspenseFallback />}>
          {renderContent()}
        </Suspense>
      </main>

      {/* Unified Settings Modals */}
      <Suspense fallback={null}>
        <QuranSettingsModal />
        <SurahSettingsModal />
      </Suspense>

      {/* Floating Immersive Fullscreen Control Bar */}
      <FloatingImmersiveBar />
    </motion.div>
  );
};

const QuranPlatformModal: React.FC<QuranPlatformModalProps> = ({ isOpen, onClose, initialSurah, initialAyah, initialView }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <QuranProvider initialSurah={initialSurah} initialAyah={initialAyah} initialView={initialView}>
          <QuranPlatformContent onClose={onClose} />
        </QuranProvider>
      )}
    </AnimatePresence>
  );
};

export default QuranPlatformModal;
