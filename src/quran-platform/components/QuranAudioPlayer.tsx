import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, Pause, Volume2, Settings, X, Check, Repeat, ListOrdered, 
  SkipBack, SkipForward, RefreshCw, Download, Trash2, Loader2, CheckCircle, SlidersHorizontal
} from 'lucide-react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { AudioCacheService, CacheProgress } from '../services/audioCacheService';
import { getQuranAudioUrl } from '../../utils/quranAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { getCleanSurahName } from './AyahMarker';

export const RECITERS = [
  { id: 'ar.faresabbad', name: 'فارس عباد', sub: 'مرتل' },
  { id: 'ar.alafasy', name: 'مشاري راشد العفاسي', sub: 'العفاسي' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد', sub: 'مرتل' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي', sub: 'مرتل' },
  { id: 'ar.minshawimujawwad', name: 'محمد صديق المنشاوي', sub: 'مجود' },
  { id: 'ar.husary', name: 'محمود خليل الحصري', sub: 'مرتل' },
  { id: 'ar.husarymujawwad', name: 'محمود خليل الحصري', sub: 'مجود' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', sub: 'الحرم المكي' },
  { id: 'ar.yasseraddussary', name: 'ياسر الدوسري', sub: 'الحرم المكي' },
  { id: 'ar.abdurrahmaansudais', name: 'عبد الرحمن السديس', sub: 'الحرم المكي' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', sub: 'مرتل' },
  { id: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', sub: 'مرتل' },
  { id: 'ar.hanirifai', name: 'هاني الرفاعي', sub: 'مرتل' },
  { id: 'ar.hudhaify', name: 'علي الحذيفي', sub: 'الحرم المدني' },
  { id: 'ar.shaatree', name: 'أبو بكر الشاطري', sub: 'مرتل' },
  { id: 'ar.abdullahbasfar', name: 'عبد الله بصفر', sub: 'مرتل' },
];

const QuranAudioPlayer = () => {
  const { 
    currentSurah, 
    setCurrentSurah,
    isAudioPlaying, 
    setIsAudioPlaying, 
    reciter, 
    setReciter,
    playingAyahNumber,
    setPlayingAyahNumber,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    repeatMode,
    setRepeatMode,
    repeatTimes,
    setRepeatTimes,
    continuousPlay,
    setContinuousPlay,
    playbackRate,
    setPlaybackRate,
    verseDelay,
    setVerseDelay,
  } = useQuranContext();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [surahData, setSurahData] = useState<any>(null);
  const [currentPlayedTimes, setCurrentPlayedTimes] = useState(0);
  const [currentRangePlayedTimes, setCurrentRangePlayedTimes] = useState(0);
  const [searchReciter, setSearchReciter] = useState('');

  // Verse delay waiting states
  const [isWaitingBetweenAyahs, setIsWaitingBetweenAyahs] = useState(false);
  const [waitingCountdown, setWaitingCountdown] = useState(0);

  const delayTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Download/Offline cache states
  const [downloadStatus, setDownloadStatus] = useState<{ isDownloaded: boolean; downloadedCount: number }>({ isDownloaded: false, downloadedCount: 0 });
  const [downloadProgress, setDownloadProgress] = useState<CacheProgress | null>(null);
  const [resolvedAudioSrc, setResolvedAudioSrc] = useState<string>('');

  const checkDownloadStatus = async () => {
    if (surahData && surahData.ayahs) {
      const status = await AudioCacheService.getSurahDownloadStatus(
        currentSurah,
        surahData.numberOfAyahs,
        reciter,
        surahData.ayahs
      );
      setDownloadStatus(status);
    }
  };

  useEffect(() => {
    checkDownloadStatus();
  }, [currentSurah, reciter, surahData]);

  const handleDownloadSurah = async () => {
    if (!surahData || !surahData.ayahs) return;
    await AudioCacheService.downloadSurah(
      currentSurah,
      reciter,
      surahData.ayahs,
      (prog) => {
        setDownloadProgress(prog);
        if (prog.status === 'completed' || prog.status === 'error') {
          checkDownloadStatus();
          setTimeout(() => setDownloadProgress(null), 4000);
        }
      }
    );
  };

  const handleDeleteSurahCache = async () => {
    if (!surahData || !surahData.ayahs) return;
    if (window.confirm('هل أنت متأكد من حذف تلاوات هذه السورة المحفوظة أوفلاين لتوفير مساحة؟')) {
      await AudioCacheService.deleteSurahCache(reciter, surahData.ayahs);
      await checkDownloadStatus();
    }
  };

  // Fetch Surah metadata & ayahs for verse-by-verse sync
  useEffect(() => {
    const fetchSurah = async () => {
      const data = await QuranDataService.getSurah(currentSurah);
      if (data) {
        setSurahData(data);
        if (!rangeEnd || rangeEnd > data.numberOfAyahs) {
          setRangeEnd(data.numberOfAyahs);
        }
      }
    };
    fetchSurah();
  }, [currentSurah]);

  // Set default start/end ayah when surah changes
  useEffect(() => {
    if (surahData && surahData.number === currentSurah) {
      setRangeStart(1);
      setRangeEnd(surahData.numberOfAyahs || 7);
      
      // If playingAyahNumber is explicitly out of bounds for the new surah (e.g. from a previous state), reset it.
      // But if it was manually set just before the surahData arrived, it should be respected.
      if (playingAyahNumber !== null && playingAyahNumber > (surahData.numberOfAyahs || 0)) {
        setPlayingAyahNumber(null);
      }
    }
  }, [currentSurah, surahData]);

  // Determine current audio URL
  const getAudioUrl = () => {
    if (!surahData || surahData.number !== currentSurah) return '';
    
    // Verse-by-verse audio sync mode
    const activeAyahInSurah = playingAyahNumber || rangeStart;
    const ayahObj = surahData.ayahs?.find((a: any) => a.numberInSurah === activeAyahInSurah);
    if (!ayahObj) return '';
    return getQuranAudioUrl(reciter, ayahObj.number, currentSurah, activeAyahInSurah);
  };

  const currentAudioSrc = getAudioUrl();

  // Handle async Cache Storage source mapping
  useEffect(() => {
    let active = true;
    const resolveSource = async () => {
      if (!currentAudioSrc) {
        if (active) setResolvedAudioSrc('');
        return;
      }
      const source = await AudioCacheService.getAudioSource(currentAudioSrc);
      if (active) setResolvedAudioSrc(source);
    };
    resolveSource();
    return () => {
      active = false;
    };
  }, [currentAudioSrc]);

  // Play / Pause side effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioPlaying && resolvedAudioSrc && !isWaitingBetweenAyahs) {
      if (!playingAyahNumber) {
        setPlayingAyahNumber(rangeStart);
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error?.name === "AbortError" || error?.message?.includes("interrupted")) {
            return;
          }
          console.warn("Playback notification:", error.message || error);
          setIsAudioPlaying(false);
        });
      }
    } else if (!isAudioPlaying) {
      audio.pause();
    }
  }, [isAudioPlaying, playingAyahNumber, resolvedAudioSrc, isWaitingBetweenAyahs]);

  // Handle speed and delays cleanup
  useEffect(() => {
    if (!isAudioPlaying) {
      setIsWaitingBetweenAyahs(false);
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [isAudioPlaying]);

  useEffect(() => {
    setIsWaitingBetweenAyahs(false);
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, [playingAyahNumber, currentSurah]);

  // Reset counters when Surah or Range changes
  useEffect(() => {
    setCurrentPlayedTimes(0);
    setCurrentRangePlayedTimes(0);
  }, [currentSurah, rangeStart, rangeEnd]);

  // Reset ayah counter when playingAyahNumber changes manually
  useEffect(() => {
    setCurrentPlayedTimes(0);
  }, [playingAyahNumber]);

  // Sync playback speed with HTML5 audio
  const applyPlaybackRate = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  };

  useEffect(() => {
    applyPlaybackRate();
  }, [playbackRate, resolvedAudioSrc]);

  const handleNextAyah = () => {
    if (!surahData) return;
    const current = playingAyahNumber || rangeStart;
    if (current < surahData.numberOfAyahs) {
      setPlayingAyahNumber(current + 1);
      setIsAudioPlaying(true);
    } else if (continuousPlay && currentSurah < 114) {
      // End of surah, move to next
      setCurrentSurah(currentSurah + 1);
      setPlayingAyahNumber(null);
      setIsAudioPlaying(true);
    }
  };

  const handlePrevAyah = () => {
    const current = playingAyahNumber || rangeStart;
    if (current > 1) {
      setPlayingAyahNumber(current - 1);
      setIsAudioPlaying(true);
    } else if (currentSurah > 1) {
      // Move to previous Surah
      setCurrentSurah(currentSurah - 1);
      setPlayingAyahNumber(null);
      setIsAudioPlaying(true);
    }
  };

  // Advance to next verse or next Surah
  const proceedToNextAudio = () => {
    setIsWaitingBetweenAyahs(false);
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const currentAyah = playingAyahNumber || rangeStart;

    if (currentAyah < rangeEnd) {
      const nextAyah = currentAyah + 1;
      setPlayingAyahNumber(nextAyah);
    } else {
      // End of range reached
      if (repeatMode === 'range') {
        if (repeatTimes === 0 || currentRangePlayedTimes + 1 < repeatTimes) {
          setCurrentRangePlayedTimes(prev => prev + 1);
          setPlayingAyahNumber(rangeStart);
          
          if (playingAyahNumber === rangeStart && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
              if (e?.name !== "AbortError" && !e?.message?.includes("interrupted")) {
                console.warn("Range loop play notice:", e?.message || e);
              }
            });
          }
        } else {
          setCurrentRangePlayedTimes(0);
          if (continuousPlay && currentSurah < 114) {
            setCurrentSurah(currentSurah + 1);
      setPlayingAyahNumber(null);
            setIsAudioPlaying(true);
          } else {
            setIsAudioPlaying(false);
            setPlayingAyahNumber(null);
          }
        }
      } else {
        // No repeat mode, proceed continuously
        if (continuousPlay && currentSurah < 114) {
          setCurrentSurah(currentSurah + 1);
      setPlayingAyahNumber(null);
          setIsAudioPlaying(true);
        } else {
          setIsAudioPlaying(false);
          setPlayingAyahNumber(null);
        }
      }
    }
  };

  // Handle Ayah completion and Range / Repeat / Delay logic
  const handleAudioEnded = () => {
    const currentAyah = playingAyahNumber || rangeStart;

    // Handle repeat current verse
    if (repeatMode === 'ayah') {
      if (repeatTimes === 0 || currentPlayedTimes + 1 < repeatTimes) {
        setCurrentPlayedTimes(prev => prev + 1);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => {
            if (e?.name !== "AbortError" && !e?.message?.includes("interrupted")) {
              console.warn("Repeat play notice:", e?.message || e);
            }
          });
        }
        return;
      }
    }

    // Reset ayah played times counter for next verse
    setCurrentPlayedTimes(0);

    // Apply delay if configured and not at the very end of playback
    const isAtEnd = currentAyah >= rangeEnd && (!continuousPlay || currentSurah === 114);
    if (verseDelay > 0 && !isAtEnd) {
      setIsWaitingBetweenAyahs(true);
      setWaitingCountdown(verseDelay);

      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      let timeLeft = verseDelay;
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setWaitingCountdown(Math.max(0, timeLeft));
      }, 1000);

      delayTimeoutRef.current = setTimeout(() => {
        proceedToNextAudio();
      }, verseDelay * 1000);
    } else {
      proceedToNextAudio();
    }
  };

  // Media Session API remote control mapping
  const selectedReciterObj = RECITERS.find(r => r.id === reciter) || RECITERS[0];
  const handlersRef = useRef({
    play: () => setIsAudioPlaying(true),
    pause: () => setIsAudioPlaying(false),
    next: handleNextAyah,
    prev: handlePrevAyah
  });

  useEffect(() => {
    handlersRef.current = {
      play: () => setIsAudioPlaying(true),
      pause: () => setIsAudioPlaying(false),
      next: handleNextAyah,
      prev: handlePrevAyah
    };
  }, [playingAyahNumber, rangeStart, surahData, isAudioPlaying, currentSurah, continuousPlay]);

  useEffect(() => {
    if ('mediaSession' in navigator && surahData) {
      const activeAyah = playingAyahNumber || rangeStart;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `سورة ${getCleanSurahName(surahData.name)} - آية ${activeAyah}`,
        artist: selectedReciterObj.name,
        album: 'القرآن الكريم - المرتل',
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3233/3233519.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => handlersRef.current.play());
      navigator.mediaSession.setActionHandler('pause', () => handlersRef.current.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlersRef.current.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handlersRef.current.next());
    }
  }, [playingAyahNumber, rangeStart, surahData, reciter]);

  const filteredReciters = RECITERS.filter(r => 
    r.name.includes(searchReciter) || r.sub.includes(searchReciter)
  );

  return (
    <div className="relative">
      {/* Mini Player Bar */}
      <div className="flex items-center gap-1 sm:gap-2 bg-amber-500/10 dark:bg-amber-500/15 rounded-xl sm:rounded-2xl px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 border border-amber-500/20 shadow-3xs transition-all duration-300">
        <audio 
          ref={audioRef} 
          src={resolvedAudioSrc || undefined} 
          onEnded={handleAudioEnded}
          onPlay={applyPlaybackRate}
          onLoadedMetadata={applyPlaybackRate}
          onError={(e) => {
            const msg = (e.currentTarget as HTMLAudioElement)?.error?.message || "Audio source load error";
            console.warn("Audio element source error:", msg);
            setIsAudioPlaying(false);
          }}
        />

        {/* Playback Details */}
        {surahData && (
          <div className="hidden sm:flex flex-col text-right justify-center max-w-[100px] xs:max-w-[130px] sm:max-w-none ml-1 sm:ml-2 shrink-0">
            <span className="text-xs sm:text-sm font-black text-amber-100 truncate leading-tight">
              {getCleanSurahName(surahData.name)}: {playingAyahNumber || rangeStart}
            </span>
            <span className="text-[10px] sm:text-[11px] text-amber-200/80 truncate flex items-center gap-1 leading-none mt-0.5">
              {isWaitingBetweenAyahs ? (
                <span className="text-amber-600 font-bold animate-pulse">
                  الانتظار: {waitingCountdown}ث
                </span>
              ) : isAudioPlaying ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  مستمر {playbackRate !== 1 ? `(${playbackRate}x)` : ''}
                </span>
              ) : (
                <span className="truncate max-w-[80px] sm:max-w-[110px] font-medium">{selectedReciterObj.name}</span>
              )}
            </span>
          </div>
        )}

        {/* Separator */}
        {surahData && <div className="hidden sm:block h-6 w-px bg-amber-500/20 mx-1"></div>}

        {/* Controls in LTR */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" dir="ltr">
          {/* Audio Adjuster Button (toggles sound settings) */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center border shadow-3xs active:scale-95 ${
              showSettings 
                ? 'bg-amber-500/40 text-amber-100 font-bold border-amber-500/60 shadow-xs' 
                : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/35 border-amber-500/30'
            }`}
            title="إعدادات وصوت التلاوة والقراء"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Previous (Skip Backwards in LTR) */}
          <button
            onClick={handlePrevAyah}
            disabled={!surahData || (currentSurah === 1 && (playingAyahNumber || rangeStart) <= 1)}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-amber-500/20 disabled:opacity-30 text-amber-200 transition-colors cursor-pointer"
            title="الآية السابقة"
          >
            <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Play/Pause in gold/amber circle */}
          <button
            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
            disabled={!resolvedAudioSrc && !isWaitingBetweenAyahs}
            className={`p-1 sm:p-2 rounded-lg transition-all cursor-pointer ${
              isAudioPlaying 
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs' 
                : 'bg-amber-500/25 hover:bg-amber-500/45 text-amber-100'
            } active:scale-95 disabled:opacity-50 flex items-center justify-center`}
            title={isAudioPlaying ? "إيقاف مؤقت" : "تشغيل التلاوة"}
          >
            {isAudioPlaying ? <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" /> : <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Next (Skip Forward in LTR) */}
          <button
            onClick={handleNextAyah}
            disabled={!surahData || (currentSurah === 114 && (playingAyahNumber || rangeStart) >= surahData.numberOfAyahs)}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-amber-500/20 disabled:opacity-30 text-amber-200 transition-colors cursor-pointer"
            title="الآية التالية"
          >
            <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Audio Settings Panel */}
      {showSettings && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-80 sm:w-[400px] max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 z-[10000] text-right scrollbar-none"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Volume2 size={18} className="text-[var(--color-primary)]" />
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm">المشغل الصوتي المتقدم</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Continuous Play & Speed Settings Grid */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl mb-4 border border-gray-100 dark:border-gray-700/50 space-y-3.5 text-xs">
                
                {/* Continuous Play Switch */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-gray-700 dark:text-gray-200">القراءة المستمرة للسور</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-400">الانتقال التلقائي بين السور بدون توقف</span>
                  </div>
                  <button
                    onClick={() => setContinuousPlay(!continuousPlay)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${continuousPlay ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${continuousPlay ? '-translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {/* Playback Rate (Speed) */}
                <div className="space-y-1.5">
                  <span className="font-bold text-gray-700 dark:text-gray-200 block">سرعة التلاوة</span>
                  <div className="grid grid-cols-5 gap-1">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`py-1 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${playbackRate === rate ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'}`}
                      >
                        {rate === 1.0 ? 'طبيعي' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delay between Verses */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <span className="font-bold text-gray-700 dark:text-gray-200 block">فترة الانتظار بين الآيات (للتكرار والترديد)</span>
                  <div className="grid grid-cols-5 gap-1">
                    {[0, 1, 2, 3, 5].map((delay) => (
                      <button
                        key={delay}
                        onClick={() => setVerseDelay(delay)}
                        className={`py-1 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${verseDelay === delay ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'}`}
                      >
                        {delay === 0 ? 'بدون' : `${delay}ث`}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Range Controls */}
              {surahData && (
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl mb-4 border border-gray-100 dark:border-gray-700/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                    <span>تحديد نطاق الآيات</span>
                    <span className="text-[var(--color-primary)]">سورة {getCleanSurahName(surahData.name)} ({surahData.numberOfAyahs} آية)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-400 dark:text-gray-400 mb-1">من آية:</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={rangeEnd}
                        value={rangeStart}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(Number(e.target.value), rangeEnd));
                          setRangeStart(val);
                        }}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2 font-bold text-center outline-none focus:border-[var(--color-primary)] text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 dark:text-gray-400 mb-1">إلى آية:</label>
                      <input 
                        type="number" 
                        min={rangeStart} 
                        max={surahData.numberOfAyahs}
                        value={rangeEnd}
                        onChange={(e) => {
                          const val = Math.max(rangeStart, Math.min(Number(e.target.value), surahData.numberOfAyahs));
                          setRangeEnd(val);
                        }}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2 font-bold text-center outline-none focus:border-[var(--color-primary)] text-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Repetition Settings */}
                  <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">
                      <span className="flex items-center gap-1"><Repeat size={13} /> إعدادات التكرار (للحفظ)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        onClick={() => setRepeatMode('none')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${repeatMode === 'none' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-bold text-[var(--color-primary)]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        بدون تكرار
                      </button>
                      <button
                        onClick={() => setRepeatMode('ayah')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${repeatMode === 'ayah' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-bold text-[var(--color-primary)]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        تكرار الآية
                      </button>
                      <button
                        onClick={() => setRepeatMode('range')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${repeatMode === 'range' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-bold text-[var(--color-primary)]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        تكرار النطاق
                      </button>
                    </div>

                    {repeatMode !== 'none' && (
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500">عدد المرات:</span>
                        <div className="flex gap-1">
                          {[1, 3, 5, 10, 0].map(times => (
                            <button
                              key={times}
                              onClick={() => setRepeatTimes(times)}
                              className={`px-2 py-1 rounded border text-xs font-bold cursor-pointer ${repeatTimes === times ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                            >
                              {times === 0 ? '∞' : `${times}x`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offline Download Panel */}
              {surahData && (
                <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-2xl mb-4 border border-amber-100/60 dark:border-amber-900/20 text-xs">
                  <div className="flex items-center justify-between font-bold mb-2 text-gray-800 dark:text-gray-200">
                    <span className="flex items-center gap-1">
                      <Download size={13} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                      الاستماع دون اتصال (أوفلاين)
                    </span>
                    {downloadStatus.isDownloaded ? (
                      <span className="text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle size={10} /> جاهز أوفلاين
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {downloadStatus.downloadedCount > 0 ? `محمل ${downloadStatus.downloadedCount}/${surahData.numberOfAyahs}` : 'غير محملة على الجهاز'}
                      </span>
                    )}
                  </div>

                  {downloadProgress ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Loader2 size={11} className="animate-spin" />
                          جاري تحميل السورة...
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{downloadProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${downloadProgress.percentage}%` }}
                        ></div>
                      </div>
                      {downloadProgress.status === 'completed' && (
                        <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">تم تحميل السورة بالكامل بنجاح!</p>
                      )}
                      {downloadProgress.status === 'error' && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">{downloadProgress.error}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {!downloadStatus.isDownloaded ? (
                        <button
                          onClick={handleDownloadSurah}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                        >
                          <Download size={12} />
                          تحميل السورة ({surahData.numberOfAyahs} آية)
                        </button>
                      ) : (
                        <button
                          onClick={handleDeleteSurahCache}
                          className="flex-1 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          حذف السورة المحملة
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reciters List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">اختيار القارئ:</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-400">{selectedReciterObj.name}</span>
                </div>

                <input 
                  type="text"
                  placeholder="بحث عن قارئ..."
                  value={searchReciter}
                  onChange={(e) => setSearchReciter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2 text-xs mb-2 outline-none focus:border-[var(--color-primary)] text-gray-850 dark:text-white"
                />

                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {filteredReciters.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setReciter(r.id);
                      }}
                      className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${reciter === r.id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] dark:text-white font-bold border border-[var(--color-primary)]/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                      <div>
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[10px] text-gray-400">{r.sub}</div>
                      </div>
                      {reciter === r.id && <Check size={16} className="text-[var(--color-primary)]" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default QuranAudioPlayer;
