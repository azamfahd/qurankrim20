import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Layers, Bookmark, Heart, Settings, PlayCircle, Info, Target, BarChart2, Minimize2 } from 'lucide-react';
import QuranReader from './components/QuranReader';
import QuranIndex from './components/QuranIndex';
import QuranAudioPlayer from './components/QuranAudioPlayer';
import QuranTafsir from './components/QuranTafsir';
import QuranInfo from './components/QuranInfo';
import QuranMemorize from './components/QuranMemorize';
import QuranStats from './components/QuranStats';
import { QuranSettingsModal } from './components/QuranSettingsModal';
import { SurahSettingsModal } from './components/SurahSettingsModal';
import { FloatingImmersiveBar } from './components/FloatingImmersiveBar';
import { QuranProvider, useQuranContext } from './store/QuranContext';

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
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#FAFAF8] overflow-hidden"
    >
      {/* Header */}
      <AnimatePresence>
        {!(currentView === 'reader' && isImmersive) && (
          <motion.header
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-b border-amber-500/25 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-amber-50 shadow-md flex flex-col px-2.5 sm:px-4 py-2 sm:py-3 shrink-0 z-10 gap-2.5 sm:gap-3.5"
          >
            {/* Top row: Left (Audio & Settings) | Right (Close & Brand Title) */}
            <div className="flex items-center justify-between w-full gap-2 sm:gap-4 min-w-0" dir="rtl">
              {/* Right Side: Close Button + Brand Logo & Title */}
              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
                <button
                  onClick={onClose}
                  className="p-1 sm:p-1.5 hover:bg-white/10 text-amber-100/80 hover:text-amber-200 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                  title="إغلاق"
                >
                  <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
                
                <div className="flex items-center gap-1.5 sm:gap-2.5 select-none min-w-0">
                  <div className="p-1 sm:p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-3xs shrink-0">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h1 className="font-['Reem_Kufi',serif] font-black text-base xs:text-lg sm:text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 truncate leading-snug tracking-wider drop-shadow-md">
                    المصحف الشريف الذكي
                  </h1>
                </div>
              </div>

              {/* Left Side: Audio Player and Settings Button */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Advanced Audio Player component containing playback controls */}
                <QuranAudioPlayer />

                {/* Settings button with elegant rounded box matching audio player */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-200 hover:bg-amber-500/35 transition-all flex items-center justify-center font-bold shadow-3xs border border-amber-500/30 cursor-pointer active:scale-95 shrink-0"
                  title="إعدادات القراءة والثيمات"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Navigation Tabs scrollable bar */}
            <div className="w-full overflow-x-auto no-scrollbar py-0.5" dir="rtl">
              <div className="flex items-center gap-1.5 sm:gap-2 w-max md:mx-auto">
                <button 
                  onClick={() => setCurrentView('index')}
                  className={`px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                    currentView === 'index' 
                      ? 'bg-amber-400/25 text-amber-200 border-amber-400/60 shadow-xs font-black' 
                      : 'bg-transparent border-transparent text-amber-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers size={15} className={currentView === 'index' ? 'text-amber-300' : 'text-amber-200/50'} />
                  <span>الفهرس</span>
                </button>

                <button 
                  onClick={() => setCurrentView('reader')}
                  className={`px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                    currentView === 'reader' 
                      ? 'bg-amber-400/25 text-amber-200 border-amber-400/60 shadow-xs font-black' 
                      : 'bg-transparent border-transparent text-amber-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BookOpen size={15} className={currentView === 'reader' ? 'text-amber-300' : 'text-amber-200/50'} />
                  <span>القراءة</span>
                </button>

                <button 
                  onClick={() => setCurrentView('tafsir')}
                  className={`px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                    currentView === 'tafsir' 
                      ? 'bg-amber-400/25 text-amber-200 border-amber-400/60 shadow-xs font-black' 
                      : 'bg-transparent border-transparent text-amber-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Heart size={15} className={currentView === 'tafsir' ? 'text-amber-300' : 'text-amber-200/50'} />
                  <span>التفسير والتدبر</span>
                </button>

                <button 
                  onClick={() => setCurrentView('info')}
                  className={`px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                    currentView === 'info' 
                      ? 'bg-amber-400/25 text-amber-200 border-amber-400/60 shadow-xs font-black' 
                      : 'bg-transparent border-transparent text-amber-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Info size={15} className={currentView === 'info' ? 'text-amber-300' : 'text-amber-200/50'} />
                  <span>معلومات السورة</span>
                </button>

                <button 
                  onClick={() => setCurrentView('memorize')}
                  className={`px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                    currentView === 'memorize' 
                      ? 'bg-amber-400/25 text-amber-200 border-amber-400/60 shadow-xs font-black' 
                      : 'bg-transparent border-transparent text-amber-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Target size={15} className={currentView === 'memorize' ? 'text-amber-300' : 'text-amber-200/50'} />
                  <span>الحفظ</span>
                </button>

                <button 
                  onClick={() => setCurrentView('stats')}
                  className={`px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                    currentView === 'stats' 
                      ? 'bg-amber-400/25 text-amber-200 border-amber-400/60 shadow-xs font-black' 
                      : 'bg-transparent border-transparent text-amber-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart2 size={15} className={currentView === 'stats' ? 'text-amber-300' : 'text-amber-200/50'} />
                  <span>الإحصائيات</span>
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#FAFAF8] custom-scrollbar">
        {renderContent()}
      </main>

      {/* Unified Settings Modals */}
      <QuranSettingsModal />
      <SurahSettingsModal />

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
