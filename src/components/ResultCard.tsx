import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Copy, Check, Info, Sparkles, BookHeart, Share2, WifiOff, Bookmark as BookmarkIcon, Lightbulb, Quote } from 'lucide-react';
import { QuranResponse, Verse, Bookmark } from '../types';
import { getQuranAudioUrl } from '../utils/quranAudio';
import { AudioCacheService } from '../quran-platform/services/audioCacheService';
import { motion, AnimatePresence } from 'framer-motion';

const CopyButton: React.FC<{ text: string, label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`btn-ghost btn-icon transition-all duration-300 ${copied ? 'text-green-600 bg-green-50' : 'hover:bg-gray-100 text-gray-500'}`}
      style={{ width: 28, height: 28 }}
      title={label || "نسخ"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

const renderHighlightedText = (text: string, highlightClass: string = "text-[var(--color-gold-dark)] font-bold") => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={`hl-${index}-${part.slice(2, -2)}`} className={highlightClass}>{part.slice(2, -2)}</span>;
    }
    return <span key={`txt-${index}-${part.slice(0, 10)}`}>{part}</span>;
  });
};

const VerseSection: React.FC<{ 
  verse: Verse, 
  index: number, 
  isOnline: boolean,
  isBookmarked: boolean,
  onToggleBookmark: (verse: Verse) => void,
  reciter?: string,
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenQuran?: (surah?: number, ayah?: number, view?: any) => void;
}> = ({ verse, index, isOnline, isBookmarked, onToggleBookmark, reciter, onShowToast, onOpenQuran }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [activeTab, setActiveTab] = useState<'tafsir' | 'tadabbur'>('tafsir');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeReciter = reciter || 'ar.faresabbad';

  useEffect(() => {
    let isMounted = true;
    const checkCache = async () => {
      const url = getQuranAudioUrl(activeReciter, verse.number, verse.surahNumber, verse.ayahNumber);
      if (url) {
        const cached = await AudioCacheService.isUrlCached(url);
        if (isMounted) setIsCached(cached);
      }
    };
    checkCache();
    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [verse, activeReciter]);

  const toggleAudio = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      const fetchAudioUrl = async (reciterId: string, surah?: number, ayah?: number, useFallback: boolean = false): Promise<string | null> => {
        if (!useFallback) {
          return getQuranAudioUrl(reciterId, verse.number, surah, ayah);
        } else {
          try {
            if (surah && ayah) {
              const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciterId}`);
              const result = await response.json();
              if (result.code === 200 && result.data?.audio) {
                return result.data.audio;
              }
            }
          } catch (e) {
            console.warn("Failed to fetch audio from fallback API:", e);
          }
        }
        return null;
      };

      const initialUrl = await fetchAudioUrl(activeReciter, verse.surahNumber, verse.ayahNumber);
      if (!initialUrl) {
        onShowToast("عذراً، لم نتمكن من العثور على رابط التلاوة لهذا القارئ.", 'error');
        return;
      }

      // Check cache status and retrieve local blob URL if cached
      const playableSource = await AudioCacheService.getAudioSource(initialUrl);
      const isLocallyCached = playableSource.startsWith('blob:') || await AudioCacheService.isUrlCached(initialUrl);

      if (!isOnline && !isLocallyCached) {
        onShowToast("عذراً، التلاوة غير محفوظة أوفلاين، وتشغيلها يتطلب اتصالاً بالإنترنت.", 'info');
        return;
      }

      const playWithUrl = async (sourceUrl: string, isRetry: boolean = false) => {
        const audio = new Audio(sourceUrl);
        audioRef.current = audio;
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = async () => {
          console.warn("Audio error for URL:", sourceUrl);
          if (!isRetry) {
            const fallbackUrl = await fetchAudioUrl(activeReciter, verse.surahNumber, verse.ayahNumber, true);
            if (fallbackUrl && fallbackUrl !== sourceUrl) {
              console.log("Retrying with fallback URL:", fallbackUrl);
              playWithUrl(fallbackUrl, true);
              return;
            }
          }
          setIsPlaying(false);
          audioRef.current = null;
          onShowToast("عذراً، فشل تحميل التلاوة. قد يكون الرابط غير متاح حالياً.", 'error');
        };

        try {
          await audio.play();
          setIsPlaying(true);
          setIsCached(true);

          // Cache in background for offline use if played online
          if (isOnline && initialUrl) {
            AudioCacheService.cacheAudioUrl(initialUrl);
          }
        } catch (e: any) {
          if (e?.name === 'AbortError' || e?.message?.includes('interrupted')) {
            return;
          }
          console.warn("Initial audio play notice:", e.message || e);
          if (!isRetry) {
            const fallbackUrl = await fetchAudioUrl(activeReciter, verse.surahNumber, verse.ayahNumber, true);
            if (fallbackUrl && fallbackUrl !== sourceUrl) {
              playWithUrl(fallbackUrl, true);
              return;
            }
          }
          setIsPlaying(false);
          audioRef.current = null;
        }
      };

      await playWithUrl(playableSource);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        if (e?.name === 'AbortError' || e?.message?.includes('interrupted')) {
          return;
        }
        console.warn("Audio resume notice:", e?.message || e);
        setIsPlaying(false);
      });
    }
  };

  const copyText = `${verse.arabicText} ﴿${verse.ayahNumber}﴾\n[سورة ${verse.surahName}]\n\n- عبر تطبيق أنيس القلوب`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'أنيس القلوب - رفيقك القرآني',
          text: copyText,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(copyText);
      onShowToast('تم نسخ النص للمشاركة', 'success');
    }
  };

  return (
    <div className="relative group">
      {/* Verse Header & Actions */}
      <div className="flex flex-row justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-[var(--color-primary-light)]/30 border border-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg text-[var(--color-primary-dark)] font-medium flex items-center gap-1.5 text-xs shadow-sm">
             <BookHeart size={14} />
             <span className="font-bold">سورة {verse.surahName}</span>
             <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]"></span>
             <span className="font-bold">آية {verse.ayahNumber}</span>
          </div>
        </div>
        
        <div className="flex gap-0.5 bg-gray-50/80 p-1 rounded-lg border border-gray-100 shadow-sm">
           <CopyButton text={copyText} label="نسخ الآية" />
           <button 
             onClick={() => onToggleBookmark(verse)}
             className={`btn-ghost btn-icon transition-all duration-300 ${isBookmarked ? 'text-[var(--color-gold)] bg-white shadow-sm' : 'hover:bg-white text-gray-500'}`}
             style={{ width: 28, height: 28 }}
             title={isBookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}
           >
             <BookmarkIcon size={14} fill={isBookmarked ? "currentColor" : "none"} />
           </button>
           <button 
             onClick={handleShare}
             className="btn-ghost btn-icon transition-all duration-300 hover:bg-white text-[var(--color-gold)]"
             style={{ width: 28, height: 28 }}
             title="مشاركة"
           >
             <Share2 size={14} />
           </button>
           <button 
             onClick={toggleAudio}
             disabled={!isOnline && !isCached}
             className={`btn-ghost btn-icon transition-all duration-300 relative ${isPlaying ? 'bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white shadow-md' : 'hover:bg-white text-[var(--color-gold)]'}`}
             style={{ width: 28, height: 28 }}
             title={isCached ? "استماع (محفوظة دون اتصال)" : (isOnline ? "استماع" : "يتطلب اتصالاً بالإنترنت")}
           >
             {(!isOnline && !isCached) ? (
               <WifiOff size={14} />
             ) : isPlaying ? (
               <Pause size={14} />
             ) : (
               <>
                 <Play size={14} fill="currentColor" className="ml-0.5" />
                 {isCached && (
                   <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" title="محفوظة للاستماع دون اتصال" />
                 )}
               </>
             )}
           </button>
           <button 
             onClick={() => onOpenQuran?.(verse.surahNumber, verse.ayahNumber, 'reader')}
             className="btn-ghost btn-icon transition-all duration-300 hover:bg-white text-[var(--color-primary)]"
             style={{ width: 28, height: 28 }}
             title="فتح في المصحف"
           >
             <BookHeart size={14} />
           </button>
        </div>
      </div>

      {/* The Quran Text */}
      <div className="text-center mb-4 sm:mb-6 relative px-2 sm:px-4 py-2 sm:py-4">
        <Quote className="absolute top-0 right-2 sm:right-4 text-gray-100 w-10 h-10 sm:w-12 sm:h-12 -z-10 transform -scale-x-100 opacity-50" />
        <p className="quran-text font-bold text-[var(--color-primary-dark)] leading-[2.2] md:leading-[2.5] text-2xl sm:text-3xl md:text-4xl drop-shadow-sm" dir="rtl">
          {verse.arabicText}
          <span className="inline-flex items-center justify-center mx-2 sm:mx-3 text-[var(--color-gold-dark)] font-bold text-sm sm:text-base md:text-lg border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 rounded-full w-8 h-8 sm:w-10 sm:h-10 align-middle">
            {verse.ayahNumber}
          </span>
        </p>
      </div>

      {/* Tafsir and Tadabbur Tabs */}
      <div className="mt-2 sm:mt-4">
        <div className="flex p-1.5 bg-gray-50/80 border border-gray-100 rounded-2xl mb-4 sm:mb-6 w-full sm:w-fit mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('tafsir')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'tafsir' ? 'bg-white text-[var(--color-primary-dark)] shadow-sm border border-gray-100 scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 scale-95'}`}
          >
            <BookHeart size={18} className={`transition-colors ${activeTab === 'tafsir' ? 'text-[var(--color-gold)]' : 'text-gray-400'}`} />
            التفسير الميسر
          </button>
          <button
            onClick={() => setActiveTab('tadabbur')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'tadabbur' ? 'bg-white text-[var(--color-primary-dark)] shadow-sm border border-gray-100 scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 scale-95'}`}
          >
            <Sparkles size={18} className={`transition-colors ${activeTab === 'tadabbur' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
            إضاءة وتدبر
          </button>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'tafsir' ? (
              <motion.div
                key="tafsir"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm"
              >
                <p className="explanation-text text-gray-700 text-base sm:text-lg leading-relaxed text-justify">
                  {renderHighlightedText(verse.tafsir)}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="tadabbur"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-[var(--color-primary-light)]/5 to-transparent rounded-2xl p-5 sm:p-8 border border-[var(--color-primary)]/10 shadow-sm"
              >
                <p className="explanation-text text-gray-800 text-base sm:text-lg leading-relaxed text-justify font-medium">
                  {renderHighlightedText(verse.tadabbur)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const ResultCard: React.FC<{ 
  data: QuranResponse, 
  isOnline?: boolean,
  bookmarks?: Bookmark[],
  onToggleBookmark?: (verse: Verse) => void,
  reciter?: string,
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenQuran?: (surah?: number, ayah?: number, view?: any) => void;
}> = ({ data, isOnline = true, bookmarks = [], onToggleBookmark = () => {}, reciter, onShowToast, onOpenQuran }) => {
  // Auto-cache audio for all verses in search results for offline listening
  useEffect(() => {
    if (!data?.verses || data.verses.length === 0 || !isOnline) return;

    const activeReciter = reciter || 'ar.faresabbad';
    data.verses.forEach(async (v) => {
      try {
        const url = getQuranAudioUrl(activeReciter, v.number, v.surahNumber, v.ayahNumber);
        if (url) {
          await AudioCacheService.cacheAudioUrl(url);
        }
      } catch (e) {
        console.warn("Auto audio cache failed for verse:", v.surahNumber, v.ayahNumber, e);
      }
    });
  }, [data, reciter, isOnline]);

  return (
    <div className="w-full h-full mx-auto px-0 sm:px-2 flex flex-col flex-1">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 backdrop-blur-xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl sm:border border-white/60 overflow-hidden flex flex-col flex-1 min-h-[calc(100vh-160px)]"
      >
        
        {/* 1. Header & Intro */}
        <div className="p-6 sm:p-8 md:p-12 border-b border-gray-100 bg-gradient-to-b from-[var(--color-primary-light)]/20 to-transparent relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 shadow-sm animate-fade-in">
              <Check size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">آيات موثقة ومحققة</span>
            </div>
            
            <button 
              onClick={() => {
                const fullText = `${data.title}\n\n${data.introMessage}\n\n${(data.verses || []).map(v => `${v.arabicText} (${v.surahName} : ${v.ayahNumber})\n\nالتفسير: ${v.tafsir}\n\nالتدبر: ${v.tadabbur}`).join('\n\n---\n\n')}\n\nالخلاصة: ${data.summary}\n\n- تم بواسطة تطبيق أنيس القلوب`;
                navigator.clipboard.writeText(fullText);
                onShowToast('تم نسخ التحليل الكامل للمشاركة', 'success');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-[var(--color-primary)] rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-105 active:scale-95 text-xs font-bold"
            >
              <Copy size={14} />
              <span>نسخ الإجابة كاملة</span>
            </button>
          </div>

          <div className="relative z-10 bg-white/60 backdrop-blur-sm p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
               <div className="p-2 bg-[var(--color-gold)]/10 rounded-xl text-[var(--color-gold-dark)]">
                 <Info size={20} />
               </div>
               <span className="text-sm font-bold text-gray-800">تحليل الحالة والرسالة</span>
            </div>
            <p className="explanation-text text-gray-800 text-base sm:text-lg leading-relaxed text-justify font-medium">
               {renderHighlightedText(data.introMessage)}
            </p>
          </div>
        </div>

        {/* 2. Verses List */}
        {data.verses && data.verses.length > 0 && (
          <div className="p-6 sm:p-8 md:p-12 bg-white">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-gradient-to-l from-gray-200 to-transparent"></div>
              <span className="text-sm font-bold text-[var(--color-primary)] uppercase bg-[var(--color-primary-light)]/20 px-4 py-1.5 rounded-full">الآيات والتأملات</span>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            
            <div className="flex flex-col gap-8">
              {data.verses.map((verse, idx) => {
                const isBookmarked = bookmarks.some(b => b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber);
                return (
                  <React.Fragment key={`${verse.surahNumber}-${verse.ayahNumber}-${idx}`}>
                    <VerseSection 
                      verse={verse} 
                      index={idx}
                      isOnline={isOnline}
                      isBookmarked={isBookmarked}
                      onToggleBookmark={onToggleBookmark}
                      reciter={reciter}
                      onShowToast={onShowToast}
                      onOpenQuran={onOpenQuran}
                    />
                    {idx < data.verses!.length - 1 && (
                      <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mt-2"></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Tafakkur */}
        {data.tafakkur && (
          <div className="p-6 sm:p-8 md:p-12 bg-gray-50/80 border-t border-gray-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[var(--color-gold)]"></div>
            <div className="flex justify-between items-center mb-5 sm:mb-6 relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 text-gray-800 font-bold text-base sm:text-lg">
                <div className="p-2 sm:p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Lightbulb size={20} className="text-[var(--color-gold-dark)] sm:w-[22px] sm:h-[22px]" />
                </div>
                <span>التفكر والعمل</span>
              </div>
              <div className="flex gap-2 bg-white p-1 sm:p-1.5 rounded-xl border border-gray-100 shadow-sm">
                <CopyButton text={data.tafakkur} label="نسخ التفكر" />
              </div>
            </div>
            <p className="explanation-text text-gray-700 text-base sm:text-lg leading-relaxed text-justify font-medium relative z-10">
              {renderHighlightedText(data.tafakkur)}
            </p>
          </div>
        )}

        {/* 4. Summary Section */}
        {data.summary && (
          <div className="p-6 sm:p-8 md:p-12 bg-gradient-to-br from-[var(--color-primary-dark)] to-[#022c22] text-white relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
               <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-[var(--color-gold)] rounded-full blur-[80px] translate-x-1/3 translate-y-1/3"></div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 relative z-10">
              <div className="p-2 sm:p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Sparkles size={20} className="text-[var(--color-gold-light)] sm:w-[22px] sm:h-[22px]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--color-gold-light)]">الخلاصة</h3>
            </div>
            
            <p className="explanation-text text-white/90 text-base sm:text-lg leading-relaxed relative z-10 font-medium text-justify italic">
              "{renderHighlightedText(data.summary, "text-[var(--color-gold-light)] font-bold")}"
            </p>
          </div>
        )}

      </motion.div>
    </div>
  );
};
