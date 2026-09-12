import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, Pause, Volume2, Settings, X, Check, Repeat, ListOrdered, 
  SkipBack, SkipForward, RefreshCw, Download, Trash2, Loader2, CheckCircle, SlidersHorizontal,
  FolderDown, CheckSquare, Square, Search, Sparkles, Layers
} from 'lucide-react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { AudioCacheService, CacheProgress } from '../services/audioCacheService';
import { getQuranAudioUrl } from '../../utils/quranAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadManager } from '../../services/DownloadManager';
import { getCleanSurahName } from './AyahMarker';
import { SURAHS_STATIC_LIST, SurahItem } from '../data/surahsData';

import { MediaSessionService } from '../../services/mediaSessionService';
import { QURAN_RECITERS, getQuranAudioFallbackUrl } from '../../utils/quranAudio';

export const RECITERS = QURAN_RECITERS;

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

  // Custom Surahs Batch Download state
  const [showCustomSurahsPicker, setShowCustomSurahsPicker] = useState(false);
  const [selectedBatchSurahs, setSelectedBatchSurahs] = useState<number[]>([1, 18, 36, 67]);
  const [surahSearchQuery, setSurahSearchQuery] = useState('');
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchDownloadInfo, setBatchDownloadInfo] = useState<{
    totalSurahs: number;
    completedSurahs: number;
    currentSurahNumber: number;
    currentSurahName: string;
    currentSurahAyahProgress: number;
  } | null>(null);

  // Verse delay waiting states
  const [isWaitingBetweenAyahs, setIsWaitingBetweenAyahs] = useState(false);
  const [waitingCountdown, setWaitingCountdown] = useState(0);

  const delayTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Download/Offline cache states
  const [downloadStatus, setDownloadStatus] = useState<{ isDownloaded: boolean; downloadedCount: number }>({ isDownloaded: false, downloadedCount: 0 });
  const [downloadProgress, setDownloadProgress] = useState<CacheProgress | null>(null);
  const [resolvedAudioSrc, setResolvedAudioSrc] = useState<string>('');
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Batch download helper functions
  const toggleSelectSurah = (num: number) => {
    setSelectedBatchSurahs(prev => 
      prev.includes(num) ? prev.filter(id => id !== num) : [...prev, num]
    );
  };

  const selectPopularSurahs = () => {
    // Fatihah, Kahf, Yasin, Rahman, Waqiah, Mulk, Ikhlas, Falaq, Nas
    setSelectedBatchSurahs([1, 18, 36, 55, 56, 67, 112, 113, 114]);
  };

  const selectJuzAmma = () => {
    const juzAmmaNumbers: number[] = [];
    for (let i = 78; i <= 114; i++) juzAmmaNumbers.push(i);
    setSelectedBatchSurahs(juzAmmaNumbers);
  };

  const selectAllSurahs = () => {
    if (selectedBatchSurahs.length === SURAHS_STATIC_LIST.length) {
      setSelectedBatchSurahs([]);
    } else {
      setSelectedBatchSurahs(SURAHS_STATIC_LIST.map(s => s.number));
    }
  };

  const handleStartBatchDownload = async () => {
    if (selectedBatchSurahs.length === 0) return;
    setIsBatchDownloading(true);

    const totalSurahs = selectedBatchSurahs.length;
    let completedSurahs = 0;

    for (const surahNum of selectedBatchSurahs) {
      const sMeta = SURAHS_STATIC_LIST.find(s => s.number === surahNum);
      const surahName = sMeta ? getCleanSurahName(sMeta.name) : `السورة ${surahNum}`;

      setBatchDownloadInfo({
        totalSurahs,
        completedSurahs,
        currentSurahNumber: surahNum,
        currentSurahName: surahName,
        currentSurahAyahProgress: 0
      });

      try {
        const fullSurahData = await QuranDataService.getSurah(surahNum);
        if (fullSurahData && fullSurahData.ayahs) {
          await AudioCacheService.downloadSurah(
            surahNum,
            reciter,
            fullSurahData.ayahs,
            (prog) => {
              setBatchDownloadInfo(prev => prev ? {
                ...prev,
                currentSurahAyahProgress: prog.percentage
              } : null);
            }
          );
        }
      } catch (err) {
        console.warn(`Failed downloading audio for surah ${surahNum}:`, err);
      }

      completedSurahs++;
      setBatchDownloadInfo(prev => prev ? {
        ...prev,
        completedSurahs,
        currentSurahAyahProgress: 100
      } : null);
    }

    setIsBatchDownloading(false);
    setTimeout(() => {
      setBatchDownloadInfo(null);
      checkDownloadStatus();
    }, 3000);
  };

  // Reset fallback state when audio context changes
  useEffect(() => {
    setIsUsingFallback(false);
  }, [playingAyahNumber, currentSurah, reciter]);

  const handleAudioError = async () => {
    if (!surahData || !isAudioPlaying) return;
    console.warn("Audio element source error on:", resolvedAudioSrc);
    
    // Check if we are already using a fallback
    const activeAyahInSurah = playingAyahNumber || rangeStart;
    const ayahObj = surahData.ayahs?.find((a: any) => a.numberInSurah === activeAyahInSurah);
    if (!ayahObj) {
      setIsAudioPlaying(false);
      return;
    }

    const primaryUrl = getQuranAudioUrl(reciter, ayahObj.number, currentSurah, activeAyahInSurah);
    const fallbackUrl = getQuranAudioFallbackUrl(reciter, ayahObj.number, currentSurah, activeAyahInSurah);

    // Only try fallback if we haven't already and a valid fallback exists
    if (!isUsingFallback && fallbackUrl && fallbackUrl !== primaryUrl) {
      console.log("Attempting fallback audio URL:", fallbackUrl);
      setIsUsingFallback(true);
      const fallbackSource = await AudioCacheService.getAudioSource(fallbackUrl);
      setResolvedAudioSrc(fallbackSource);
      // Wait for React to update src and then try play
      setTimeout(() => {
        if (audioRef.current && isAudioPlaying) {
          audioRef.current.play().catch(e => {
            console.warn("Fallback audio also failed:", e);
            setIsAudioPlaying(false);
          });
        }
      }, 200);
    } else {
      setIsAudioPlaying(false);
    }
  };

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

  const handleDownloadSurah = async (forceDownload = false) => {
    if (!surahData || !surahData.ayahs) return;
    
    if (!forceDownload && downloadStatus.isDownloaded) {
      const reciterName = RECITERS.find(r => r.id === reciter)?.name || '';
      alert(`سورة (${surahData.name}) بصوت ${reciterName} محملة وموجودة بالفعل لديك في الذاكرة وجاهزة للاستماع بدون إنترنت.`);
      return;
    }
    
    DownloadManager.addTask({
      id: `quran-surah-${currentSurah}-${reciter}`,
      title: `تحميل سورة ${surahData.name} - ${RECITERS.find(r => r.id === reciter)?.name || ''}`,
      type: 'quran-surah',
      payload: { surahNumber: currentSurah, reciterId: reciter },
      totalItems: surahData.ayahs.length,
      execute: async (task, signal) => {
        await AudioCacheService.downloadSurah(
          currentSurah,
          reciter,
          surahData.ayahs,
          (prog) => {
            DownloadManager.updateProgress(task.id, prog.completed, prog.total, prog.percentage);
            setDownloadProgress(prog);
            if (prog.status === 'completed' || prog.status === 'error') {
              checkDownloadStatus();
              setTimeout(() => setDownloadProgress(null), 4000);
            }
          },
          signal
        );
      }
    });
  };

  const handleDeleteSurahCache = async () => {
    if (!surahData || !surahData.ayahs) return;
    if (window.confirm('هل أنت متأكد من حذف تلاوات هذه السورة المحفوظة أوفلاين لتوفير مساحة؟')) {
      await AudioCacheService.deleteSurahCache(reciter, surahData.ayahs, currentSurah);
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
    if (surahData) {
      const activeAyah = playingAyahNumber || rangeStart;
      MediaSessionService.updateMetadata({
        title: `سورة ${getCleanSurahName(surahData.name)} - آية ${activeAyah}`,
        artist: selectedReciterObj.name,
        album: 'القرآن الكريم - رفيقك القرآني'
      }, {
        onPlay: () => handlersRef.current.play(),
        onPause: () => handlersRef.current.pause(),
        onPrevious: () => handlersRef.current.prev(),
        onNext: () => handlersRef.current.next()
      });
    }
  }, [playingAyahNumber, rangeStart, surahData, reciter]);

  useEffect(() => {
    MediaSessionService.setPlaybackState(isAudioPlaying ? 'playing' : 'paused');
  }, [isAudioPlaying]);

  const filteredReciters = RECITERS.filter(r => 
    r.name.includes(searchReciter) || r.sub.includes(searchReciter)
  );

  return (
    <div className="relative shrink-0 flex items-center">
      {/* Background Audio Element */}
      <audio 
        ref={audioRef} 
        src={resolvedAudioSrc || undefined} 
        onEnded={handleAudioEnded}
        onPlay={applyPlaybackRate}
        onLoadedMetadata={applyPlaybackRate}
        onError={handleAudioError}
      />

      {/* Compact Audio Settings Button matching exact style and dimensions of nav tabs */}
      <button 
        onClick={() => setShowSettings(true)}
        className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none border shrink-0 active:scale-95 shadow-3xs ${
          isAudioPlaying 
            ? 'bg-cyan-500/35 text-cyan-100 border-cyan-400/80 shadow-xs ring-1 ring-cyan-400/40 font-black' 
            : 'bg-cyan-500/15 text-cyan-100/90 hover:bg-cyan-500/25 hover:text-white border-cyan-500/30'
        }`}
        title="إعدادات الصوت والتلاوة"
      >
        <Volume2 size={16} className={isAudioPlaying ? "text-cyan-300 animate-pulse" : "text-cyan-300"} />
        <span>إعدادات الصوت</span>
        {isAudioPlaying && (
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-0.5" />
        )}
      </button>

      {/* Advanced Audio Settings Panel Modal */}
      {createPortal(
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              key="quran-audio-settings-wrapper"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5"
            >
              {/* Backdrop */}
              <motion.div
                key="quran-audio-settings-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div
                key="quran-audio-settings-container"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[10000] text-right overflow-hidden"
                dir="rtl"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                      <Volume2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">المشغل الصوتي وإعدادات التلاوة</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">التحكم في القراء، سرعة الصوت، ونظام تكرار الحفظ</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowSettings(false)} 
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body - Scrollable Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                  
                  {/* Top: Rich Playback Controller Card */}
                  {surahData && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-cyan-500/10 dark:from-amber-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 p-4 sm:p-5 rounded-2xl border border-amber-500/25 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-black text-gray-900 dark:text-amber-100">
                              سورة {getCleanSurahName(surahData.name)}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                              الآية {playingAyahNumber || rangeStart} من {surahData.numberOfAyahs}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                            <span>القارئ الحالي:</span>
                            <span className="font-bold text-[var(--color-primary)]">{selectedReciterObj.name}</span>
                            {selectedReciterObj.sub && (
                              <span className="text-[10px] text-gray-400">({selectedReciterObj.sub})</span>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                          {isWaitingBetweenAyahs ? (
                            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold animate-pulse flex items-center gap-1.5 border border-amber-500/30">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                              انتظار للترديد: {waitingCountdown} ثانية
                            </span>
                          ) : isAudioPlaying ? (
                            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              جارٍ الاستماع الآن
                            </span>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                              متوقف
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Playback Control Bar */}
                      <div className="flex items-center justify-center gap-4 sm:gap-6 pt-4" dir="ltr">
                        {/* Previous Ayah */}
                        <button
                          onClick={handlePrevAyah}
                          disabled={!surahData || (currentSurah === 1 && (playingAyahNumber || rangeStart) <= 1)}
                          className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-700 dark:text-gray-200 transition-all cursor-pointer active:scale-95 shadow-xs border border-gray-200/70 dark:border-gray-700 flex items-center gap-1.5 text-xs font-bold"
                          title="الآية السابقة"
                        >
                          <SkipBack size={18} />
                          <span className="hidden sm:inline">السابقة</span>
                        </button>

                        {/* Play/Pause Main Button */}
                        <button
                          onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                          disabled={!resolvedAudioSrc && !isWaitingBetweenAyahs}
                          className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 text-sm sm:text-base shadow-md ${
                            isAudioPlaying
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          }`}
                          title={isAudioPlaying ? "إيقاف مؤقت" : "تشغيل"}
                        >
                          {isAudioPlaying ? (
                            <>
                              <Pause size={20} />
                              <span>إيقاف مؤقت</span>
                            </>
                          ) : (
                            <>
                              <Play size={20} className="ml-0.5" />
                              <span>تشغيل التلاوة</span>
                            </>
                          )}
                        </button>

                        {/* Next Ayah */}
                        <button
                          onClick={handleNextAyah}
                          disabled={!surahData || (currentSurah === 114 && (playingAyahNumber || rangeStart) >= surahData.numberOfAyahs)}
                          className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-700 dark:text-gray-200 transition-all cursor-pointer active:scale-95 shadow-xs border border-gray-200/70 dark:border-gray-700 flex items-center gap-1.5 text-xs font-bold"
                          title="الآية التالية"
                        >
                          <span className="hidden sm:inline">التالية</span>
                          <SkipForward size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Two-Column Responsive Settings Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    
                    {/* Column 1: Playback, Speed, Delay & Memorization */}
                    <div className="space-y-4">
                      
                      {/* Playback & Speed Controls */}
                      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-3.5 text-xs">
                        <div className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                          <SlidersHorizontal size={14} className="text-[var(--color-primary)]" />
                          <span>خصائص وسرعة التلاوة</span>
                        </div>

                        {/* Continuous Play Switch */}
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
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
                          <div className="grid grid-cols-5 gap-1.5">
                            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => setPlaybackRate(rate)}
                                className={`py-1.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                  playbackRate === rate 
                                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                {rate === 1.0 ? 'طبيعي' : `${rate}x`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Delay between Verses */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                          <span className="font-bold text-gray-700 dark:text-gray-200 block">فترة الانتظار بين الآيات (للتكرار والترديد)</span>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[0, 1, 2, 3, 5].map((delay) => (
                              <button
                                key={delay}
                                onClick={() => setVerseDelay(delay)}
                                className={`py-1.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                  verseDelay === delay 
                                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                {delay === 0 ? 'بدون' : `${delay} ث`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Verse Range & Repetition Settings */}
                      {surahData && (
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-3.5 text-xs">
                          <div className="flex items-center justify-between font-bold text-gray-800 dark:text-gray-200">
                            <span className="flex items-center gap-1.5">
                              <Repeat size={14} className="text-[var(--color-primary)]" />
                              تحديد نطاق الآيات والتكرار
                            </span>
                            <span className="text-[var(--color-primary)] font-bold">
                              {surahData.numberOfAyahs} آية
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">من الآية:</label>
                              <input 
                                type="number" 
                                min={1} 
                                max={rangeEnd}
                                value={rangeStart}
                                onChange={(e) => {
                                  const val = Math.max(1, Math.min(Number(e.target.value), rangeEnd));
                                  setRangeStart(val);
                                }}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 font-bold text-center outline-none focus:border-[var(--color-primary)] text-gray-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">إلى الآية:</label>
                              <input 
                                type="number" 
                                min={rangeStart} 
                                max={surahData.numberOfAyahs}
                                value={rangeEnd}
                                onChange={(e) => {
                                  const val = Math.max(rangeStart, Math.min(Number(e.target.value), surahData.numberOfAyahs));
                                  setRangeEnd(val);
                                }}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 font-bold text-center outline-none focus:border-[var(--color-primary)] text-gray-800 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Repetition Mode */}
                          <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2">
                            <span className="text-gray-600 dark:text-gray-300 font-bold block">نمط التكرار (للحفظ والمراجعة):</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => setRepeatMode('none')}
                                className={`py-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                  repeatMode === 'none' 
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'
                                }`}
                              >
                                بدون تكرار
                              </button>
                              <button
                                onClick={() => setRepeatMode('ayah')}
                                className={`py-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                  repeatMode === 'ayah' 
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'
                                }`}
                              >
                                تكرار الآية
                              </button>
                              <button
                                onClick={() => setRepeatMode('range')}
                                className={`py-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                  repeatMode === 'range' 
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'
                                }`}
                              >
                                تكرار النطاق
                              </button>
                            </div>

                            {repeatMode !== 'none' && (
                              <div className="mt-2.5 flex items-center justify-between pt-1">
                                <span className="text-gray-500 font-medium">عدد مرات التكرار:</span>
                                <div className="flex gap-1">
                                  {[1, 3, 5, 10, 0].map(times => (
                                    <button
                                      key={times}
                                      onClick={() => setRepeatTimes(times)}
                                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                                        repeatTimes === times 
                                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs' 
                                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {times === 0 ? '∞ دائم' : `${times}x`}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* زر تحميل تلاوات سور مخصصة أخرى */}
                          <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                            <button
                              type="button"
                              onClick={() => setShowCustomSurahsPicker(true)}
                              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-amber-500/10 hover:from-emerald-500/20 hover:via-cyan-500/20 hover:to-amber-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 flex items-center justify-between font-bold text-xs cursor-pointer transition-all active:scale-98 shadow-3xs"
                            >
                              <span className="flex items-center gap-1.5">
                                <FolderDown size={15} className="text-emerald-600 dark:text-emerald-400" />
                                <span>تحميل أصوات سور أخرى (أوفلاين)</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/20 font-black text-emerald-700 dark:text-emerald-300">
                                تخصيص السور ▾
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Reciters Selector & Offline Cache */}
                    <div className="space-y-4">
                      
                      {/* Reciters Selection Box */}
                      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">اختيار القارئ المفضل:</span>
                          <span className="text-[11px] text-[var(--color-primary)] font-bold">{selectedReciterObj.name}</span>
                        </div>

                        <input 
                          type="text"
                          placeholder="ابحث عن اسم القارئ أو الرواية..."
                          value={searchReciter}
                          onChange={(e) => setSearchReciter(e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[var(--color-primary)] text-gray-850 dark:text-white"
                        />

                        <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                          {filteredReciters.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => setReciter(r.id)}
                              className={`w-full text-right flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                                reciter === r.id 
                                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary-dark)] dark:text-white font-black border border-[var(--color-primary)]/30 shadow-xs' 
                                  : 'bg-white dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800'
                              }`}
                            >
                              <div>
                                <div className="font-bold">{r.name}</div>
                                {r.sub && <div className="text-[10px] text-gray-400 mt-0.5">{r.sub}</div>}
                              </div>
                              {reciter === r.id && (
                                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
                                  <Check size={14} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Offline Download Panel */}
                      {surahData && (
                        <div className="bg-amber-50/60 dark:bg-amber-950/15 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 text-xs space-y-2.5">
                          <div className="flex items-center justify-between font-bold text-gray-800 dark:text-gray-200">
                            <span className="flex items-center gap-1.5">
                              <Download size={15} className="text-amber-600 dark:text-amber-400" />
                              الاستماع دون اتصال بالإنترنت (أوفلاين)
                            </span>
                            {downloadStatus.isDownloaded ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadSurah(false)}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <CheckCircle size={12} /> جاهز أوفلاين
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {downloadStatus.downloadedCount > 0 ? `محمل ${downloadStatus.downloadedCount}/${surahData.numberOfAyahs}` : 'غير محملة'}
                              </span>
                            )}
                          </div>

                          {downloadProgress ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-300">
                                <span className="flex items-center gap-1.5 font-bold">
                                  <Loader2 size={13} className="animate-spin text-amber-500" />
                                  جاري تحميل تلاوة السورة...
                                </span>
                                <span className="font-black text-amber-600 dark:text-amber-400">{downloadProgress.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-300" 
                                  style={{ width: `${downloadProgress.percentage}%` }}
                                ></div>
                              </div>
                              {downloadProgress.status === 'completed' && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">تم حفظ السورة بنجاح للاستماع دون اتصال!</p>
                              )}
                              {downloadProgress.status === 'error' && (
                                <p className="text-[11px] text-red-600 dark:text-red-400 font-bold">{downloadProgress.error}</p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1">
                              {!downloadStatus.isDownloaded ? (
                                <button
                                  onClick={() => handleDownloadSurah(false)}
                                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer active:scale-98"
                                >
                                  <Download size={15} />
                                  تحميل تلاوة سورة {getCleanSurahName(surahData.name)} ({surahData.numberOfAyahs} آية)
                                </button>
                              ) : (
                                <button
                                  onClick={handleDeleteSurahCache}
                                  className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  حذف الملفات الصوتية المحملة للسورة
                                </button>
                              )}

                              {/* زر ثانوي لاختيار سور متعددة للتحميل */}
                              <button
                                onClick={() => setShowCustomSurahsPicker(true)}
                                className="w-full py-2 px-3 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                              >
                                <FolderDown size={14} className="text-amber-500" />
                                تحديد وتحميل سور أخرى مع هذا القارئ
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 flex justify-end shrink-0">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    حفظ وإغلاق
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Sub-Modal: Custom Surahs Audio Batch Downloader */}
      {createPortal(
        <AnimatePresence>
          {showCustomSurahsPicker && (
            <motion.div 
              key="quran-custom-surahs-wrapper"
              className="fixed inset-0 z-[10005] flex items-center justify-center p-3 sm:p-5"
            >
              {/* Backdrop */}
              <motion.div
                key="quran-custom-surahs-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isBatchDownloading && setShowCustomSurahsPicker(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                key="quran-custom-surahs-card"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg md:max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[10010] text-right overflow-hidden"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <FolderDown size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">تحديد السور لتحميل أصواتها أوفلاين</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        القارئ المحدد: <span className="font-bold text-[var(--color-primary)]">{selectedReciterObj.name}</span>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => !isBatchDownloading && setShowCustomSurahsPicker(false)} 
                    disabled={isBatchDownloading}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
                  
                  {/* Quick Filters / Shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-gray-500 font-bold ml-1">تحديد سريع:</span>
                    <button
                      type="button"
                      onClick={selectPopularSurahs}
                      disabled={isBatchDownloading}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Sparkles size={12} />
                      السور المشهورة
                    </button>
                    <button
                      type="button"
                      onClick={selectJuzAmma}
                      disabled={isBatchDownloading}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 font-bold border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Layers size={12} />
                      جزء عمّ (37 سورة)
                    </button>
                    <button
                      type="button"
                      onClick={selectAllSurahs}
                      disabled={isBatchDownloading}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors cursor-pointer text-[11px]"
                    >
                      {selectedBatchSurahs.length === SURAHS_STATIC_LIST.length ? 'إلغاء تحديد الكل' : 'تحديد كل السور (114)'}
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={14} className="absolute right-3.5 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ابحث عن السورة بالاسم أو الرقم..."
                      value={surahSearchQuery}
                      onChange={(e) => setSurahSearchQuery(e.target.value)}
                      disabled={isBatchDownloading}
                      className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pr-9 pl-3.5 py-2 text-xs outline-none focus:border-[var(--color-primary)] text-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Batch Download Progress Status (If active) */}
                  {batchDownloadInfo && (
                    <div className="bg-amber-500/10 dark:bg-amber-500/15 p-3.5 rounded-2xl border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                          <Loader2 size={14} className="animate-spin text-amber-500" />
                          جاري تحميل: {batchDownloadInfo.currentSurahName} ({batchDownloadInfo.completedSurahs + 1} من {batchDownloadInfo.totalSurahs})
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-black">
                          {batchDownloadInfo.currentSurahAyahProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${batchDownloadInfo.currentSurahAyahProgress}%` }}
                        />
                      </div>
                      {batchDownloadInfo.completedSurahs === batchDownloadInfo.totalSurahs && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] text-center">
                          اكتمل تحميل جميع السور المحددة بنجاح!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Surahs Checklist Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {SURAHS_STATIC_LIST
                      .filter(s => {
                        const cleanName = getCleanSurahName(s.name);
                        const q = surahSearchQuery.trim().toLowerCase();
                        if (!q) return true;
                        return cleanName.includes(q) || s.number.toString().includes(q) || s.name.includes(q);
                      })
                      .map(s => {
                        const isSelected = selectedBatchSurahs.includes(s.number);
                        const cleanName = getCleanSurahName(s.name);
                        return (
                          <button
                            key={s.number}
                            type="button"
                            onClick={() => toggleSelectSurah(s.number)}
                            disabled={isBatchDownloading}
                            className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-bold shadow-3xs' 
                                : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {s.number}
                              </span>
                              <div>
                                <span className="font-bold">سورة {cleanName}</span>
                                <span className="text-[10px] text-gray-400 block">{s.numberOfAyahs} آية</span>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              isSelected 
                                ? 'bg-emerald-600 text-white border-emerald-600' 
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                            }`}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Footer with Action */}
                <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 flex items-center justify-between shrink-0">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">
                    المحدد: <span className="text-emerald-600 dark:text-emerald-400 font-black">{selectedBatchSurahs.length}</span> سورة
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomSurahsPicker(false)}
                      disabled={isBatchDownloading}
                      className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 font-bold text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={handleStartBatchDownload}
                      disabled={isBatchDownloading || selectedBatchSurahs.length === 0}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
                    >
                      {isBatchDownloading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>تحميل السور المحددة ({selectedBatchSurahs.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default QuranAudioPlayer;
