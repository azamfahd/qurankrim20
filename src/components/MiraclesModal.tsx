import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  Stars, 
  Baby, 
  Waves, 
  Mountain, 
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  Leaf,
  Atom,
  Search,
  History,
  Rocket,
  Play,
  Square,
  Loader2
} from 'lucide-react';
import { miraclesData, MiracleCategory, MiracleItem } from '../data/miracles';
import { getQuranAudioUrl } from '../utils/quranAudio';
import { NumericalAnalysisViewer } from './NumericalAnalysisViewer';

interface MiraclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline?: boolean;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Stars': return <Stars className="w-6 h-6" />;
    case 'Baby': return <Baby className="w-6 h-6" />;
    case 'Waves': return <Waves className="w-6 h-6" />;
    case 'Mountain': return <Mountain className="w-6 h-6" />;
    case 'Bug': return <Bug className="w-6 h-6" />;
    case 'Leaf': return <Leaf className="w-6 h-6" />;
    case 'Atom': return <Atom className="w-6 h-6" />;
    case 'History': return <History className="w-6 h-6" />;
    case 'Rocket': return <Rocket className="w-6 h-6" />;
    default: return <Lightbulb className="w-6 h-6" />;
  }
};

const MiraclesModal: React.FC<MiraclesModalProps> = ({ isOpen, onClose, isOnline = true, onShowToast }) => {
  const [selectedCategory, setSelectedCategory] = useState<MiracleCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount or close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleAudio = async (miracle: MiracleItem) => {
    if (!isOnline) {
      if (onShowToast) onShowToast("عذراً، التشغيل الصوتي يتطلب اتصالاً بالإنترنت.", 'info');
      return;
    }

    if (playingId === miracle.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setIsLoadingAudio(null);
      return;
    }

    // Stop current playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPlayingId(miracle.id);
    setIsLoadingAudio(miracle.id);

    const reciterId = 'ar.alafasy';
    const fetchAudioUrl = async (surah?: number, ayah?: number, useFallback: boolean = false): Promise<string | null> => {
      if (!surah || !ayah) return null;
      if (!useFallback) {
        // Here we rely on getQuranAudioUrl falling back if globalAyahNumber is not passed
        return getQuranAudioUrl(reciterId, undefined, surah, ayah);
      } else {
        try {
          const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciterId}`);
          const result = await response.json();
          if (result.code === 200 && result.data?.audio) {
            return result.data.audio;
          }
        } catch (e) {
          console.warn("Failed to fetch audio from fallback API:", e);
        }
      }
      return null;
    };

    const playWithUrl = async (url: string, isRetry: boolean = false) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingId(null);
        setIsLoadingAudio(null);
      };
      
      audio.onerror = async () => {
        if (!isRetry) {
          const fallbackUrl = await fetchAudioUrl(miracle.surahNumber, miracle.ayahNumber, true);
          if (fallbackUrl && fallbackUrl !== url) {
            playWithUrl(fallbackUrl, true);
            return;
          }
        }
        setPlayingId(null);
        setIsLoadingAudio(null);
        audioRef.current = null;
        if (onShowToast) onShowToast("عذراً، فشل تحميل التلاوة.", 'error');
      };

      try {
        await audio.play();
        setIsLoadingAudio(null);
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message?.includes('interrupted')) {
          return;
        }
        if (!isRetry) {
          const fallbackUrl = await fetchAudioUrl(miracle.surahNumber, miracle.ayahNumber, true);
          if (fallbackUrl && fallbackUrl !== url) {
            playWithUrl(fallbackUrl, true);
            return;
          }
        }
        setPlayingId(null);
        setIsLoadingAudio(null);
        audioRef.current = null;
      }
    };

    const initialUrl = await fetchAudioUrl(miracle.surahNumber, miracle.ayahNumber);
    if (!initialUrl) {
      setPlayingId(null);
      setIsLoadingAudio(null);
      if (onShowToast) onShowToast("عذراً، لم نتمكن من العثور على رابط التلاوة.", 'error');
      return;
    }
    
    await playWithUrl(initialUrl);
  };

  // Flatten and filter miracles if there is a search query
  const searchResults = searchQuery.trim() !== "" 
    ? miraclesData.flatMap(cat => 
        cat.miracles
          .filter(m => 
            m.title.includes(searchQuery) || 
            m.scientificDiscovery.includes(searchQuery) || 
            m.explanation.includes(searchQuery)
          )
          .map(m => ({ ...m, categoryInfo: { title: cat.title, bgLight: cat.bgLight, color: cat.color } }))
      )
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white shrink-0 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_50%)]"></div>
            
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 flex items-center gap-4 pl-12">
              {selectedCategory ? (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-md"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                  <Sparkles className="w-7 h-7 text-indigo-100" />
                </div>
              )}
              
              <div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  {selectedCategory ? selectedCategory.title : 'العلم والإعجاز في القرآن'}
                </h2>
                <p className="text-indigo-100 font-medium text-sm sm:text-base mt-1.5 opacity-90">
                  {selectedCategory 
                    ? 'تأمل في دقة التعبير القرآني ومطابقته للحقائق العلمية'
                    : 'اكتشافات علمية حديثة سبق بها القرآن الكريم قبل 1400 عام'
                  }
                </p>
              </div>
            </div>
            
            {/* Search Bar - Only show when no category is selected */}
            {!selectedCategory && (
              <div className="relative mt-6 z-10">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن آية، معجزة، أو اكتشاف علمي..."
                    className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 text-white placeholder-white/50 rounded-2xl py-3.5 pr-12 pl-4 outline-none transition-all focus:ring-2 ring-white/30 backdrop-blur-md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-stone-50 dark:bg-gray-950">
            <AnimatePresence mode="wait">
              {searchQuery.trim() !== "" && !selectedCategory ? (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 max-w-3xl mx-auto pb-8"
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((miracle, index) => (
                      <div 
                        key={`${miracle.id}-${index}`}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-stone-200 dark:border-gray-800 shadow-sm overflow-hidden"
                      >
                        <div className="p-5 sm:p-6 space-y-5">
                          {/* Title & Tag */}
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                              {miracle.title}
                            </h3>
                            <span className={`shrink-0 px-3 py-1 text-xs font-black rounded-lg ${miracle.categoryInfo.bgLight} ${miracle.categoryInfo.color}`}>
                              {miracle.categoryInfo.title}
                            </span>
                          </div>

                          {/* Quranic Verse */}
                          <div className="bg-stone-50 dark:bg-gray-950 p-5 rounded-xl border border-stone-100 dark:border-gray-800 relative">
                            <BookOpen className="absolute top-4 left-4 w-12 h-12 text-stone-200/50 dark:text-gray-800/50 pointer-events-none" />
                            <p className="font-quran text-2xl sm:text-3xl text-indigo-900 dark:text-indigo-300 leading-loose text-center py-2 relative z-10">
                              {miracle.quranicVerse}
                            </p>
                            <div className="text-center mt-3 flex items-center justify-center gap-2">
                              <span className="inline-block px-3 py-1 bg-stone-200/50 dark:bg-gray-800/50 text-stone-600 dark:text-gray-400 text-xs font-bold rounded-full">
                                {miracle.surahInfo}
                              </span>
                              <button
                                onClick={() => toggleAudio(miracle)}
                                className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                                  playingId === miracle.id
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`}
                                title={playingId === miracle.id ? 'إيقاف' : 'تشغيل'}
                              >
                                {isLoadingAudio === miracle.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : playingId === miracle.id ? (
                                  <Square className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Numerical Analysis Visualizer if available */}
                          <NumericalAnalysisViewer id={miracle.id} />

                          {/* Explanation Content */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 mb-1">
                                <Lightbulb className="w-5 h-5" />
                                <h4 className="font-black text-sm">الاكتشاف العلمي</h4>
                              </div>
                              <p className="text-sm font-semibold text-stone-700 dark:text-gray-300 leading-relaxed">
                                {miracle.scientificDiscovery}
                              </p>
                            </div>
                            
                            <div className="space-y-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 mb-1">
                                <Sparkles className="w-5 h-5" />
                                <h4 className="font-black text-sm">وجه الإعجاز القرآني</h4>
                              </div>
                              <p className="text-sm font-semibold text-stone-700 dark:text-gray-300 leading-relaxed">
                                {miracle.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto bg-stone-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-stone-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-black text-stone-700 dark:text-gray-300 mb-2">لا توجد نتائج</h3>
                      <p className="text-stone-500 dark:text-gray-400 font-medium">لم نعثر على آيات أو معجزات تطابق بحثك '{searchQuery}'</p>
                    </div>
                  )}
                </motion.div>
              ) : !selectedCategory ? (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {miraclesData.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`group relative p-6 rounded-2xl text-right transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-stone-200 dark:border-gray-800 shadow-3xs hover:shadow-xl bg-white dark:bg-gray-900 overflow-hidden flex flex-col gap-4`}
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${(category.bgLight || 'bg-amber-50').split(' ')[0]}`}></div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${category.bgLight || 'bg-amber-50'} ${category.color || 'text-amber-600'} shadow-inner`}>
                          {getIcon(category.icon)}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-gray-800 flex items-center justify-center text-stone-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <ChevronRight className="w-5 h-5 rotate-180" />
                        </div>
                      </div>
                      
                      <div className="space-y-1 relative z-10">
                        <h3 className="text-xl font-black text-stone-900 dark:text-white">
                          {category.title}
                        </h3>
                        <p className="text-sm font-semibold text-stone-500 dark:text-gray-400">
                          {category.miracles.length} مواضيع إعجازية
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="items"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-3xl mx-auto pb-8"
                >
                  {selectedCategory.miracles.map((miracle, index) => (
                    <div 
                      key={miracle.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-stone-200 dark:border-gray-800 shadow-sm overflow-hidden"
                    >
                      <div className="p-5 sm:p-6 space-y-5">
                        {/* Title & Tag */}
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                            {miracle.title}
                          </h3>
                          <span className={`shrink-0 px-3 py-1 text-xs font-black rounded-lg ${selectedCategory.bgLight} ${selectedCategory.color}`}>
                            {selectedCategory.title}
                          </span>
                        </div>

                        {/* Quranic Verse */}
                        <div className="bg-stone-50 dark:bg-gray-950 p-5 rounded-xl border border-stone-100 dark:border-gray-800 relative">
                          <BookOpen className="absolute top-4 left-4 w-12 h-12 text-stone-200/50 dark:text-gray-800/50 pointer-events-none" />
                          <p className="font-quran text-2xl sm:text-3xl text-indigo-900 dark:text-indigo-300 leading-loose text-center py-2 relative z-10">
                            {miracle.quranicVerse}
                          </p>
                          <div className="text-center mt-3 flex items-center justify-center gap-2">
                            <span className="inline-block px-3 py-1 bg-stone-200/50 dark:bg-gray-800/50 text-stone-600 dark:text-gray-400 text-xs font-bold rounded-full">
                              {miracle.surahInfo}
                            </span>
                            <button
                              onClick={() => toggleAudio(miracle)}
                              className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                                playingId === miracle.id
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                              }`}
                              title={playingId === miracle.id ? 'إيقاف' : 'تشغيل'}
                            >
                              {isLoadingAudio === miracle.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : playingId === miracle.id ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Numerical Analysis Visualizer if available */}
                        <NumericalAnalysisViewer id={miracle.id} />

                        {/* Explanation Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 mb-1">
                              <Lightbulb className="w-5 h-5" />
                              <h4 className="font-black text-sm">الاكتشاف العلمي</h4>
                            </div>
                            <p className="text-sm font-semibold text-stone-700 dark:text-gray-300 leading-relaxed">
                              {miracle.scientificDiscovery}
                            </p>
                          </div>
                          
                          <div className="space-y-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 mb-1">
                              <Sparkles className="w-5 h-5" />
                              <h4 className="font-black text-sm">وجه الإعجاز القرآني</h4>
                            </div>
                            <p className="text-sm font-semibold text-stone-700 dark:text-gray-300 leading-relaxed">
                              {miracle.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MiraclesModal;
