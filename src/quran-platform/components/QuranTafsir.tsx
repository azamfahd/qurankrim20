import React, { useState, useEffect, useRef } from 'react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { SURAHS_STATIC_LIST } from '../data/surahsData';
import { 
  ChevronRight, 
  ChevronLeft, 
  Share2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  BookOpen, 
  Volume2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  WifiOff,
  Type,
  Maximize2
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export interface TafsirOption {
  id: string;
  name: string;
  author: string;
  category: 'primary' | 'contemporary' | 'classical' | 'translation';
  tag: string;
}

export const ALL_TAFSIRS: TafsirOption[] = [
  { 
    id: 'ar.muyassar', 
    name: 'التفسير الميسر', 
    author: 'مجمع الملك فهد لطباعة المصحف الشريف', 
    category: 'contemporary',
    tag: 'ميسر ومعتمد'
  },
  { 
    id: 'ar.saadi', 
    name: 'تفسير السعدي (تيسير الكريم الرحمن)', 
    author: 'الشيخ عبد الرحمن بن ناصر السعدي', 
    category: 'contemporary',
    tag: 'تربوي وإيماني'
  },
  { 
    id: 'ar.ibnkathir', 
    name: 'تفسير ابن كثير (تفسير القرآن العظيم)', 
    author: 'الحافظ عماد الدين ابن كثير', 
    category: 'primary',
    tag: 'أعظم كتب التفسير بالمأثور'
  },
  { 
    id: 'ar.qurtubi', 
    name: 'تفسير القرطبي (الجامع لأحكام القرآن)', 
    author: 'الإمام أبو عبد الله القرطبي', 
    category: 'classical',
    tag: 'أحكام القرآن وفقهه'
  },
  { 
    id: 'ar.tabari', 
    name: 'تفسير الطبري (جامع البيان عن تأويل آي القرآن)', 
    author: 'شيخ المفسرين الإمام محمد بن جرير الطبري', 
    category: 'primary',
    tag: 'شيخ المفسرين'
  },
  { 
    id: 'ar.baghawi', 
    name: 'تفسير البغوي (معالم التنزيل)', 
    author: 'الإمام الحسين بن مسعود البغوي', 
    category: 'classical',
    tag: 'تفسير أهل السنة والحديث'
  },
  { 
    id: 'ar.waseet', 
    name: 'التفسير الوسيط للقرآن الكريم', 
    author: 'فضيلة الإمام الأكبر د. محمد سيد طنطاوي', 
    category: 'contemporary',
    tag: 'بياني وبلاغي معاصر'
  },
  { 
    id: 'ar.jalalayn', 
    name: 'تفسير الجلالين', 
    author: 'جلال الدين المحلي وجلال الدين السيوطي', 
    category: 'classical',
    tag: 'موجز ولغوي'
  },
  { 
    id: 'ar.miqbas', 
    name: 'تنوير المقباس من تفسير ابن عباس', 
    author: 'منسوب لترجمان القرآن عبد الله بن عباس', 
    category: 'classical',
    tag: 'مأثورات تاريخية'
  },
  { 
    id: 'en.asad', 
    name: 'The Message of The Quran (Muhammad Asad)', 
    author: 'Muhammad Asad', 
    category: 'translation',
    tag: 'English Meaning'
  },
  { 
    id: 'en.transliteration', 
    name: 'English Transliteration (Roman Script)', 
    author: 'Phonetic Quran Transliteration', 
    category: 'translation',
    tag: 'Pronunciation'
  },
];

const QuranTafsir = () => {
  const { 
    currentSurah, 
    currentAyah, 
    setCurrentSurah, 
    setCurrentAyah, 
    setSurahAndAyah, 
    setCurrentView, 
    fontSize,
    setPlayingAyahNumber,
    setIsAudioPlaying
  } = useQuranContext();

  const [tafsirData, setTafsirData] = useState<any>(null);
  const [ayahData, setAyahData] = useState<any>(null);
  const [surahName, setSurahName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedTafsir, setSelectedTafsir] = useState(() => {
    return localStorage.getItem('quran_selected_tafsir') || 'ar.muyassar';
  });
  const [tafsirFontSize, setTafsirFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('quran_tafsir_font_size') || '18', 10);
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  const cardRef = useRef<HTMLDivElement>(null);
  const currentSurahMeta = SURAHS_STATIC_LIST.find(s => s.number === currentSurah) || SURAHS_STATIC_LIST[0];
  const maxAyahs = currentSurahMeta.numberOfAyahs;

  useEffect(() => {
    const handleOnlineStatus = () => setIsOfflineMode(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTafsir = async () => {
      setLoading(true);
      try {
        // Fetch the uthmani text for the ayah
        const ayahRes = await QuranDataService.getTafsir(currentSurah, currentAyah, 'quran-uthmani');
        if (isMounted) {
          setAyahData(ayahRes);
          if (ayahRes && ayahRes.surah) {
            setSurahName(ayahRes.surah.name);
          } else {
            setSurahName(currentSurahMeta.name);
          }
        }
        
        const data = await QuranDataService.getTafsir(currentSurah, currentAyah, selectedTafsir);
        if (isMounted) {
          setTafsirData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching Tafsir:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchTafsir();
    return () => {
      isMounted = false;
    };
  }, [currentSurah, currentAyah, selectedTafsir]);

  const handleSelectTafsir = (id: string) => {
    setSelectedTafsir(id);
    localStorage.setItem('quran_selected_tafsir', id);
  };

  const handleFontSizeChange = (delta: number) => {
    setTafsirFontSize(prev => {
      const next = Math.max(14, Math.min(32, prev + delta));
      localStorage.setItem('quran_tafsir_font_size', next.toString());
      return next;
    });
  };

  const handlePrevAyah = () => {
    if (currentAyah > 1) {
      setCurrentAyah(currentAyah - 1);
    } else if (currentSurah > 1) {
      const prevSurahMeta = SURAHS_STATIC_LIST.find(s => s.number === currentSurah - 1);
      if (prevSurahMeta) {
        setSurahAndAyah(currentSurah - 1, prevSurahMeta.numberOfAyahs);
      }
    }
  };

  const handleNextAyah = () => {
    if (currentAyah < maxAyahs) {
      setCurrentAyah(currentAyah + 1);
    } else if (currentSurah < 114) {
      setSurahAndAyah(currentSurah + 1, 1);
    }
  };

  const copyTafsir = () => {
    if (!tafsirData || !ayahData) return;
    const currentTafsirObj = ALL_TAFSIRS.find(t => t.id === selectedTafsir);
    const textToShare = `﴿ ${ayahData.text} ﴾\n[${surahName || `سورة ${currentSurah}`} - آية ${currentAyah}]\n\n📖 ${currentTafsirObj?.name} (${currentTafsirObj?.author}):\n${tafsirData.text}\n\n- تم النقل من تطبيق أنيس القلوب`;
    
    navigator.clipboard.writeText(textToShare);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareTafsir = () => {
    if (!tafsirData || !ayahData) return;
    const currentTafsirObj = ALL_TAFSIRS.find(t => t.id === selectedTafsir);
    const textToShare = `﴿ ${ayahData.text} ﴾\n[${surahName || `سورة ${currentSurah}`} - آية ${currentAyah}]\n\n📖 ${currentTafsirObj?.name} (${currentTafsirObj?.author}):\n${tafsirData.text}\n\n- تم النقل من تطبيق أنيس القلوب`;
    
    if (navigator.share) {
      navigator.share({
        title: `تفسير آية من ${surahName}`,
        text: textToShare
      }).catch(console.error);
    } else {
      copyTafsir();
    }
  };

  const playAyahAudio = () => {
    setPlayingAyahNumber(currentAyah);
    setIsAudioPlaying(true);
  };

  const downloadImageCard = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `tafsir-ayah-${currentSurah}-${currentAyah}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image, trying fallback...', err);
      try {
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
          skipFonts: true
        });
        
        const link = document.createElement('a');
        link.download = `tafsir-ayah-${currentSurah}-${currentAyah}.png`;
        link.href = dataUrl;
        link.click();
      } catch (fallbackErr) {
        console.error('Fallback image generation failed', fallbackErr);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const selectedTafsirObj = ALL_TAFSIRS.find(t => t.id === selectedTafsir) || ALL_TAFSIRS[0];

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Top Header Navigation */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 p-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setCurrentView('reader')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1 text-xs font-bold"
            title="العودة إلى المصحف"
          >
            <ChevronRight size={18} />
            <span className="hidden sm:inline">المصحف</span>
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Surah & Ayah Pickers */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <select
              value={currentSurah}
              onChange={(e) => setSurahAndAyah(parseInt(e.target.value, 10), 1)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {SURAHS_STATIC_LIST.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>

            <span className="text-gray-400 text-xs">:</span>

            <select
              value={currentAyah}
              onChange={(e) => setCurrentAyah(parseInt(e.target.value, 10))}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {Array.from({ length: maxAyahs }, (_, i) => i + 1).map((ayahNum) => (
                <option key={ayahNum} value={ayahNum}>
                  آية {ayahNum}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right controls: Font size, Share, Copy */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Font Controls */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleFontSizeChange(-1)}
              className="px-2 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
              title="تصغير خط التفسير"
            >
              -A
            </button>
            <span className="text-[10px] text-gray-400 px-1 font-mono">{tafsirFontSize}</span>
            <button
              onClick={() => handleFontSizeChange(1)}
              className="px-2 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
              title="تكبير خط التفسير"
            >
              +A
            </button>
          </div>

          <button 
            onClick={copyTafsir}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
            title="نسخ التفسير"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </button>

          <button 
            onClick={shareTafsir}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
            title="مشاركة النص"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-6 max-w-4xl mx-auto w-full pb-32 space-y-4">
        
        {/* Tafsir Scholar Selector Tabs Bar */}
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="text-[var(--color-primary)]" size={18} />
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                اختر كتاب التفسير والعالم:
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {ALL_TAFSIRS.length} تفاسير وترجمات معتمدة
            </span>
          </div>

          {/* Tafsirs Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
            {ALL_TAFSIRS.map((t) => {
              const isSelected = selectedTafsir === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTafsir(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/70 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {t.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ayah Navigation & Controls Strip */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <button
            onClick={handlePrevAyah}
            disabled={currentSurah === 1 && currentAyah === 1}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all text-gray-700 dark:text-gray-200"
          >
            <ArrowRight size={15} />
            <span>الآية السابقة</span>
          </button>

          <div className="text-center">
            <span className="text-xs font-bold text-[var(--color-primary-dark)] dark:text-emerald-400">
              {surahName}
            </span>
            <span className="text-[11px] text-gray-400 block font-medium">
              الآية {currentAyah} من {maxAyahs}
            </span>
          </div>

          <button
            onClick={handleNextAyah}
            disabled={currentSurah === 114 && currentAyah === maxAyahs}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all text-gray-700 dark:text-gray-200"
          >
            <span>الآية التالية</span>
            <ArrowLeft size={15} />
          </button>
        </div>

        {/* Hidden Card for High-Quality Image Export */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={cardRef} 
            className="bg-[#FCFAF7] p-10 relative overflow-hidden text-gray-900 border-4 border-amber-200" 
            style={{ width: '800px', borderRadius: '32px' }}
            dir="rtl"
          >
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-600/10 rounded-tr-full"></div>
            
            <div className="relative z-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 px-5 py-2 rounded-full font-bold border border-emerald-200 text-sm">
                {surahName} - آية {currentAyah}
              </div>
              
              <p 
                className="text-emerald-950 leading-loose px-4"
                style={{ fontSize: '32px', fontFamily: "'Amiri', serif" }}
              >
                ﴿ {ayahData?.text || ''} ﴾
              </p>
              
              <div className="w-24 h-0.5 bg-amber-400/60 mx-auto"></div>
              
              <div className="text-right bg-white p-6 rounded-2xl border border-amber-100 shadow-xs">
                <h3 className="font-bold text-emerald-900 text-lg mb-2">
                  {selectedTafsirObj.name} - {selectedTafsirObj.author}
                </h3>
                <p className="text-gray-800 leading-relaxed text-justify" style={{ fontSize: '19px' }}>
                  {tafsirData?.text || ''}
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-emerald-800/80 font-bold text-xs pt-2">
                <BookOpen size={16} />
                <span>تطبيق أنيس القلوب - المصحف الذكي والتفاسير المعتمدة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ayah Quranic Text Card */}
        {ayahData && (
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-3xl shadow-xs border border-amber-200/60 dark:border-amber-900/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                {surahName} - آية {currentAyah}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={playAyahAudio}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 transition-all"
                  title="استماع لتلاوة الآية"
                >
                  <Volume2 size={14} />
                  <span>تلاوة الآية</span>
                </button>

                <button 
                  onClick={downloadImageCard}
                  disabled={isGeneratingImage}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs disabled:opacity-60"
                  title="حفظ الآية والتفسير كبطاقة دعوية مصممة"
                >
                  {isGeneratingImage ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ImageIcon size={14} />}
                  <span>بطاقة صورة</span>
                </button>
              </div>
            </div>

            <p 
              className="text-[var(--color-primary-dark)] dark:text-emerald-300 leading-loose relative z-10 px-2 sm:px-6"
              style={{ fontSize: `${Math.max(22, fontSize)}px`, fontFamily: "'Amiri', serif" }}
            >
              ﴿ {ayahData.text} ﴾
            </p>
          </div>
        )}

        {/* Tafsir Content Card */}
        <div className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-3xl shadow-xs border border-gray-200/80 dark:border-gray-800 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xs z-10 rounded-3xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500 font-bold">جاري جلب التفسير المعتمد...</span>
              </div>
            </div>
          )}

          {/* Tafsir Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[var(--color-primary)] flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {selectedTafsirObj.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {selectedTafsirObj.author}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {selectedTafsirObj.tag}
              </span>
              {copied && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                  تم النسخ ✓
                </span>
              )}
            </div>
          </div>

          {/* Tafsir Text Body */}
          {tafsirData ? (
            <div 
              className="text-gray-800 dark:text-gray-200 leading-relaxed text-justify whitespace-pre-wrap selection:bg-emerald-100 dark:selection:bg-emerald-900/60"
              style={{ 
                fontSize: `${tafsirFontSize}px`,
                lineHeight: '1.8'
              }}
              dir={selectedTafsir.startsWith('en') ? 'ltr' : 'rtl'}
            >
              {tafsirData.text}
            </div>
          ) : !loading && (
            <div className="text-center py-8 text-gray-400 text-xs">
              لم يتم العثور على التفسير لهذه الآية. يمكنك تجربة التفسير الميسر أو تفاسير أخرى أعلاه.
            </div>
          )}
        </div>

        {/* Bottom Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePrevAyah}
            disabled={currentSurah === 1 && currentAyah === 1}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 hover:border-[var(--color-primary)] rounded-2xl text-right transition-all flex items-center justify-between disabled:opacity-40"
          >
            <div>
              <span className="text-[10px] text-gray-400 block">الانتقال إلى</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">الآية السابقة</span>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleNextAyah}
            disabled={currentSurah === 114 && currentAyah === maxAyahs}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 hover:border-[var(--color-primary)] rounded-2xl text-right transition-all flex items-center justify-between disabled:opacity-40"
          >
            <div>
              <span className="text-[10px] text-gray-400 block">الانتقال إلى</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">الآية التالية</span>
            </div>
            <ArrowLeft size={16} className="text-gray-400" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuranTafsir;
