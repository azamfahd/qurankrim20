import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Copy, Check, Info, Sparkles, BookHeart, Share2, WifiOff, Bookmark as BookmarkIcon, Lightbulb, BookOpen, CheckCircle2 } from 'lucide-react';
import { QuranResponse, Verse, Bookmark } from '../types';
import { getQuranAudioUrl } from '../utils/quranAudio';
import { AudioCacheService } from '../quran-platform/services/audioCacheService';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPoolManager } from '../services/audioPoolManager';

const CopyButton: React.FC<{ text: string, label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      type="button"
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
        copied 
          ? 'text-emerald-700 bg-emerald-100 border border-emerald-300' 
          : 'hover:bg-amber-100/70 text-slate-600 hover:text-slate-900 border border-transparent'
      }`}
      title={label || "نسخ"}
      aria-label={label || "نسخ"}
    >
      {copied ? <Check size={13} className="stroke-[2.5]" /> : <Copy size={13} />}
    </button>
  );
};

const renderHighlightedText = (text: string, customHighlightClass?: string) => {
  if (!text) return null;

  const paragraphs = text.split(/\n\s*\n/);

  return (
    <div className="space-y-2.5 text-inherit">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n');
        return (
          <div key={`p-${pIdx}`} className="leading-relaxed text-inherit">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              const isHeading = /^#{1,4}\s+/.test(trimmed);
              const isBullet = !isHeading && (/^[•\-\*]\s+/.test(trimmed) || /^\d+[\.\)]\s+/.test(trimmed));
              const cleanLine = isHeading 
                ? trimmed.replace(/^#{1,4}\s+/, '') 
                : (isBullet ? trimmed.replace(/^([•\-\*]|\d+[\.\)])\s+/, '') : trimmed);

              const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
              const renderedLine = parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  const content = part.slice(2, -2);
                  return (
                    <strong 
                      key={`hl-${pIdx}-${lIdx}-${index}`} 
                      className={customHighlightClass || "font-black text-amber-950 drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.1)]"}
                    >
                      {content}
                    </strong>
                  );
                }
                return <span key={`txt-${pIdx}-${lIdx}-${index}`}>{part}</span>;
              });

              if (isHeading) {
                return (
                  <h4 key={`h-${lIdx}`} className="font-black text-amber-950 mt-2.5 mb-1 text-right flex items-center gap-1.5 text-inherit drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.06)]">
                    <span className="w-1.5 h-3.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span>{renderedLine}</span>
                  </h4>
                );
              }

              if (isBullet) {
                return (
                  <div key={`line-${lIdx}`} className="flex items-start gap-2 my-1 text-right text-inherit">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0"></span>
                    <div className="flex-1 text-right leading-relaxed text-slate-900 text-inherit font-semibold">{renderedLine}</div>
                  </div>
                );
              }

              return (
                <p key={`line-${lIdx}`} className={lIdx > 0 ? "mt-1.5 text-right leading-relaxed text-slate-900 text-inherit font-semibold" : "text-right leading-relaxed text-slate-900 text-inherit font-semibold"}>
                  {renderedLine}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const VerseSection: React.FC<{ 
  verse: Verse, 
  index: number, 
  isOnline: boolean,
  isBookmarked: boolean,
  onToggleBookmark: (verse: Verse) => void,
  reciter?: string,
  sizeClass?: string,
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenQuran?: (surah?: number, ayah?: number, view?: any) => void;
}> = ({ verse, index, isOnline, isBookmarked, onToggleBookmark, reciter, sizeClass = 'reading-size-comfortable', onShowToast, onOpenQuran }) => {
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
        AudioPoolManager.release(audioRef.current);
        audioRef.current = null;
      }
    };
  }, [verse, activeReciter]);

  const toggleAudio = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        AudioPoolManager.release(audioRef.current);
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      const fetchAudioUrl = async (reciterId: string, surah?: number, ayah?: number, useFallback: boolean = false): Promise<string | null> => {
        if (!useFallback) {
          return getQuranAudioUrl(reciterId, verse.number, surah, ayah);
        } else {
          try {
            const apiRes = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciterId}`);
            if (apiRes.ok) {
              const data = await apiRes.json();
              return data?.data?.audio || null;
            }
          } catch {}
          return null;
        }
      };

      try {
        const audioUrl = await fetchAudioUrl(activeReciter, verse.surahNumber, verse.ayahNumber);
        if (!audioUrl) {
          onShowToast('تعذر جلب ملف التلاوة الصوتية', 'error');
          return;
        }

        const audio = AudioPoolManager.acquire();
        audio.src = audioUrl;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          onShowToast('حدث خطأ أثناء تشغيل التلاوة', 'error');
        };

        audioRef.current = audio;
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio playback error:', err);
        setIsPlaying(false);
        onShowToast('تعذر تشغيل الصوت', 'error');
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const copyText = `${verse.arabicText} ﴿${verse.ayahNumber}﴾\n[سورة ${verse.surahName}]\n\n- عبر تطبيق أنيس القلوب`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `سورة ${verse.surahName} - آية ${verse.ayahNumber}`,
          text: copyText,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(copyText);
      onShowToast('تم نسخ الآية الكريمة للمشاركة', 'success');
    }
  };

  return (
    <div className="relative group rounded-2xl p-3.5 sm:p-5 bg-gradient-to-b from-[#fdfbf7] via-white to-[#fbf9f4] border border-amber-200/80 shadow-xs hover:shadow-md transition-all duration-200">
      {/* Verse Header & Compact Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="bg-emerald-950 text-white px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-2xs border border-emerald-700/40">
             <BookHeart size={13} className="text-amber-300" />
             <span>سورة {verse.surahName}</span>
             <span className="w-1 h-1 rounded-full bg-amber-400"></span>
             <span>آية {verse.ayahNumber}</span>
          </div>
        </div>
        
        {/* Compact Action Toolbar */}
        <div className="flex items-center gap-0.5 bg-white/95 p-0.5 rounded-xl border border-amber-200/70 shadow-2xs shrink-0">
           <CopyButton text={copyText} label="نسخ الآية" />
           <button 
             type="button"
             onClick={() => onToggleBookmark(verse)}
             className={`p-1.5 rounded-lg transition-all cursor-pointer ${
               isBookmarked 
                 ? 'text-amber-500 bg-amber-50 border border-amber-300' 
                 : 'hover:bg-amber-100/60 text-slate-500'
             }`}
             title={isBookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}
             aria-label={isBookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}
           >
             <BookmarkIcon size={13} fill={isBookmarked ? "currentColor" : "none"} />
           </button>
           <button 
             type="button"
             onClick={handleShare}
             className="p-1.5 rounded-lg transition-all hover:bg-amber-100/60 text-amber-700 cursor-pointer"
             title="مشاركة الآية"
             aria-label="مشاركة الآية"
           >
             <Share2 size={13} />
           </button>
           <button 
             type="button"
             onClick={toggleAudio}
             disabled={!isOnline && !isCached}
             className={`p-1.5 rounded-lg transition-all relative cursor-pointer ${
               isPlaying 
                 ? 'bg-amber-500 text-slate-950 shadow-2xs ring-1 ring-amber-400 font-bold' 
                 : 'hover:bg-amber-100/60 text-amber-700'
             }`}
             title={isCached ? "استماع (محفوظة دون اتصال)" : (isOnline ? "استماع للتلاوة" : "يتطلب اتصالاً بالإنترنت")}
             aria-label="استماع للتلاوة"
           >
             {(!isOnline && !isCached) ? (
               <WifiOff size={13} />
             ) : isPlaying ? (
               <Pause size={13} />
             ) : (
               <>
                 <Play size={13} fill="currentColor" className="ml-0.5" />
                 {isCached && (
                   <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white" title="محفوظة للاستماع دون اتصال" />
                 )}
               </>
             )}
           </button>
           <button 
             type="button"
             onClick={() => onOpenQuran?.(verse.surahNumber, verse.ayahNumber, 'reader')}
             className="p-1.5 rounded-lg transition-all hover:bg-emerald-100/60 text-emerald-800 cursor-pointer flex items-center gap-1 font-bold text-xs"
             title="فتح وقراءة في المصحف"
             aria-label="فتح في المصحف"
           >
             <BookOpen size={13} />
           </button>
        </div>
      </div>

      {/* The Quran Text Display with Uthmani Calligraphy and High Contrast Drop Shadow */}
      <div className="text-center my-3 relative px-3 sm:px-5 py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-[#fffefc] via-white to-[#fbf9f4] border border-amber-300/80 shadow-xs overflow-hidden">
        <p className="quran-verse-display font-black relative z-10 px-1 sm:px-2 text-center select-text leading-[2.2] sm:leading-[2.4] text-slate-950 font-quran drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.12)]" dir="rtl" style={{ fontSize: '1.28rem' }}>
          {verse.arabicText}
          <span className="inline-flex items-center justify-center mx-1.5 text-amber-800 font-black text-xs border border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-full w-7 h-7 align-middle shadow-2xs shrink-0 whitespace-nowrap drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.08)]">
            ﴿{verse.ayahNumber}﴾
          </span>
        </p>
      </div>

      {/* Tafsir and Tadabbur Compact Tabs */}
      <div className="mt-3">
        <div className="flex p-0.5 bg-amber-100/70 border border-amber-200/80 rounded-xl mb-2.5 w-full sm:w-fit mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('tafsir')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'tafsir' 
                ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-400' 
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            <BookHeart size={13} />
            <span>التفسير الميسر</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tadabbur')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'tadabbur' 
                ? 'bg-emerald-800 text-white shadow-xs border border-emerald-600' 
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            <Sparkles size={13} />
            <span>إضاءة وتدبر</span>
          </button>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'tafsir' ? (
              <motion.div
                key="tafsir"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-xl p-3 sm:p-4 border border-amber-200/80 shadow-2xs relative"
              >
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-amber-100 text-[11px] font-black text-amber-950 drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.06)]">
                  <BookHeart size={13} className="text-amber-600" />
                  <span>بيان المعاني وتفسير الآية:</span>
                </div>
                <div className={`explanation-text text-slate-950 font-bold sm:font-semibold drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.08)] ${sizeClass}`}>
                  {renderHighlightedText(verse.tafsir)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tadabbur"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 rounded-xl p-3 sm:p-4 border border-emerald-200 shadow-2xs relative"
              >
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-emerald-100 text-[11px] font-black text-emerald-950 drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.06)]">
                  <Sparkles size={13} className="text-emerald-600" />
                  <span>لطائف التدبر والمقاصد الإيمانية:</span>
                </div>
                <div className={`explanation-text text-slate-950 font-bold sm:font-semibold drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.08)] ${sizeClass}`}>
                  {renderHighlightedText(verse.tadabbur)}
                </div>
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
  // Default is 'reading-size-comfortable' (حجم نص متوسط، أنيق ومريح للقراءة)
  const [readingSize, setReadingSize] = useState<'reading-size-compact' | 'reading-size-comfortable' | 'reading-size-large'>('reading-size-comfortable');

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
    <div className="w-full h-full mx-auto px-0 sm:px-1 flex flex-col flex-1 pb-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-amber-200/80 overflow-hidden flex flex-col flex-1 min-h-[calc(100vh-160px)] relative"
      >
        {/* Level 1: Hero Header & Core Topic Analysis (تحليل الرسالة وجوهر الموضوع) */}
        <div className="p-3.5 sm:p-5 border-b border-amber-200/60 bg-gradient-to-b from-amber-50/50 via-white to-transparent relative">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3.5 relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100/90 text-emerald-900 rounded-full border border-emerald-300/80 shadow-2xs text-[11px] font-bold">
                <CheckCircle2 size={13} className="text-emerald-700 stroke-[2.5]" />
                <span>آيات موثقة ومحققة</span>
              </div>
            </div>

            {/* Reading Size & Action Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Font Size Toggle Buttons */}
              <div className="flex items-center gap-0.5 bg-white/95 p-0.5 rounded-xl border border-amber-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setReadingSize('reading-size-compact');
                    onShowToast('حجم الخط: مصغر', 'info');
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    readingSize === 'reading-size-compact' 
                      ? 'bg-amber-500 text-slate-950 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
                  }`}
                  title="خط مصغر"
                >
                  أ-
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReadingSize('reading-size-comfortable');
                    onShowToast('حجم الخط: متوسط (الافتراضي)', 'info');
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    readingSize === 'reading-size-comfortable' 
                      ? 'bg-amber-500 text-slate-950 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
                  }`}
                  title="خط متوسط ومريح (الافتراضي)"
                >
                  أ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReadingSize('reading-size-large');
                    onShowToast('حجم الخط: مكبر', 'info');
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    readingSize === 'reading-size-large' 
                      ? 'bg-amber-500 text-slate-950 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
                  }`}
                  title="خط مكبر"
                >
                  أ+
                </button>
              </div>

              <button 
                type="button"
                onClick={() => {
                  const fullText = `${data.title}\n\n${data.introMessage}\n\n${(data.verses || []).map(v => `${v.arabicText} (${v.surahName} : ${v.ayahNumber})\n\nالتفسير: ${v.tafsir}\n\nالتدبر: ${v.tadabbur}`).join('\n\n---\n\n')}\n\nالتفكر: ${data.tafakkur || ''}\n\nالخلاصة: ${data.summary}\n\n- تم بواسطة تطبيق أنيس القلوب`;
                  navigator.clipboard.writeText(fullText);
                  onShowToast('تم نسخ التحليل كاملاً', 'success');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200/80 text-amber-950 rounded-xl shadow-2xs transition-all text-xs font-bold cursor-pointer border border-amber-300/60"
              >
                <Copy size={12} />
                <span>نسخ</span>
              </button>
            </div>
          </div>

          {/* Core Message Card */}
          <div className="relative z-10 bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-amber-300/70 shadow-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-amber-100">
               <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                   <Info size={15} />
                 </div>
                 <div>
                   <h3 className="text-sm sm:text-base font-bold text-slate-950">
                     {data.title || 'تحليل الرسالة وتوضيح نتائج البحث'}
                   </h3>
                 </div>
               </div>
               
               <div className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-bold text-[10px] sm:text-xs flex items-center gap-1 border border-amber-200">
                 <Sparkles size={11} className="text-amber-700" />
                 <span>صياغة موجهة وذكية</span>
               </div>
            </div>

            <div className={`explanation-text text-slate-800 font-medium ${readingSize}`}>
               {renderHighlightedText(data.introMessage)}
            </div>
          </div>
        </div>

        {/* Level 2: Verses List (عرض الآيات القرآنية والتأملات بالخط العثماني) */}
        {data.verses && data.verses.length > 0 && (
          <div className="p-3.5 sm:p-5 bg-white/70 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-l from-amber-300 to-transparent"></div>
              <div className="flex items-center gap-1.5 bg-emerald-950 text-white px-3 py-1 rounded-full border border-amber-400/30 shadow-2xs text-xs font-bold">
                <BookOpen size={13} className="text-amber-400" />
                <span>الآيات القرآنية والتأملات</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {data.verses.length}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-300 to-transparent"></div>
            </div>
            
            <div className="flex flex-col gap-4 sm:gap-5">
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
                      sizeClass={readingSize}
                      onShowToast={onShowToast}
                      onOpenQuran={onOpenQuran}
                    />
                    {idx < data.verses!.length - 1 && (
                      <div className="w-1/3 mx-auto h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent my-1"></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Level 3: Tafakkur & Practical Real-Life Action (التفكر والعمل والبصيرة الواقعية) */}
        {data.tafakkur && (
          <div className="p-3.5 sm:p-5 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/50 border-t border-amber-200/80 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex justify-between items-center mb-2.5 relative z-10 flex-wrap gap-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                <div className="p-1.5 bg-amber-500 text-slate-950 rounded-xl shadow-2xs">
                  <Lightbulb size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-xs sm:text-sm">التفكر والعمل والتطبيق الواقعي</h4>
                </div>
              </div>
              <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-amber-200 shadow-2xs">
                <CopyButton text={data.tafakkur} label="نسخ التفكر" />
              </div>
            </div>
            <div className={`explanation-text text-slate-800 font-medium relative z-10 ${readingSize}`}>
              {renderHighlightedText(data.tafakkur)}
            </div>
          </div>
        )}

        {/* Level 4: Soft, Harmonious, Heartfelt Summary (الخلاصة والرسالة القلبية) */}
        {data.summary && (
          <div className="p-3.5 sm:p-5 bg-gradient-to-br from-emerald-50/95 via-[#f6faf8] to-amber-50/70 border-t-2 border-emerald-300/80 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-700 text-white rounded-xl shadow-2xs">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-950">الخلاصة والرسالة القلبية</h3>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                خلاصة الهداية 🌸
              </div>
            </div>
            
            <div className={`explanation-text text-slate-800 font-medium relative z-10 leading-relaxed ${readingSize}`}>
              {renderHighlightedText(data.summary, "text-emerald-950 font-bold")}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};
