import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, BookOpen, Sparkles, MapPin, Hash, ShieldCheck, Compass, HeartHandshake, 
  Award, FileText, ArrowLeft, Layers, Sliders, Target, Volume2, Gamepad2, 
  Eye, CheckCircle2, Play, Pause, ListFilter, RotateCcw,
  Download, Trash2, Loader2, FastForward, Clock, Search, BookMarked, Check
} from 'lucide-react';
import { useQuranContext } from '../store/QuranContext';
import { getSurahMetaData, SurahMetaDetails } from '../data/surahMetaData';
import { QuranDataService } from '../services/QuranDataService';
import { AudioCacheService, CacheProgress } from '../services/audioCacheService';
import { QURAN_RECITERS, normalizeReciterId } from '../../utils/quranAudio';
import { getCleanSurahName } from './AyahMarker';

export type SurahTab = 'info' | 'audio' | 'tafsir' | 'memorize' | 'ayahs';

export const SurahSettingsModal: React.FC = () => {
  const { 
    showSurahSettingsModal, 
    setShowSurahSettingsModal, 
    surahSettingsNumber, 
    setCurrentSurah,
    setCurrentAyah,
    setSurahAndAyah,
    setCurrentView,
    reciter,
    setReciter,
    isAudioPlaying,
    setIsAudioPlaying,
    playingAyahNumber,
    setPlayingAyahNumber,
    playbackRate,
    setPlaybackRate,
    verseDelay,
    setVerseDelay,
    repeatMode,
    setRepeatMode,
    repeatTimes,
    setRepeatTimes,
    continuousPlay,
    setContinuousPlay
  } = useQuranContext();

  const [activeTab, setActiveTab] = useState<SurahTab>('info');
  const [surahData, setSurahData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchReciter, setSearchReciter] = useState<string>('');
  
  // Audio Download / Cache Status for this Surah
  const [audioDownloadStatus, setAudioDownloadStatus] = useState<{ isDownloaded: boolean; downloadedCount: number }>({
    isDownloaded: false,
    downloadedCount: 0
  });
  const [downloadProgress, setDownloadProgress] = useState<CacheProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check and load Surah data
  useEffect(() => {
    if (showSurahSettingsModal && surahSettingsNumber) {
      setActiveTab('info');
      setLoading(true);
      QuranDataService.getSurah(surahSettingsNumber).then((data) => {
        setSurahData(data);
        setLoading(false);
      });
    }
  }, [showSurahSettingsModal, surahSettingsNumber]);

  // Check offline audio status whenever surah or reciter changes
  useEffect(() => {
    let isMounted = true;
    const checkAudioStatus = async () => {
      if (showSurahSettingsModal && surahSettingsNumber && surahData?.ayahs) {
        const status = await AudioCacheService.getSurahDownloadStatus(
          surahSettingsNumber,
          surahData.ayahs.length,
          reciter,
          surahData.ayahs
        );
        if (isMounted) {
          setAudioDownloadStatus(status);
        }
      }
    };
    checkAudioStatus();
    return () => {
      isMounted = false;
    };
  }, [showSurahSettingsModal, surahSettingsNumber, reciter, surahData]);

  if (!showSurahSettingsModal || !surahSettingsNumber) return null;

  const surahNum = surahSettingsNumber;
  const rawName = surahData?.name || `السورة رقم ${surahNum}`;
  const cleanName = getCleanSurahName(rawName);
  const numberOfAyahs = surahData?.numberOfAyahs || surahData?.ayahs?.length || 7;
  const revelationType = surahData?.revelationType || 'Meccan';

  const meta: SurahMetaDetails = getSurahMetaData(
    surahNum,
    rawName,
    revelationType,
    numberOfAyahs,
    surahData?.englishName || ''
  );

  const filteredReciters = QURAN_RECITERS.filter(r => 
    r.name.toLowerCase().includes(searchReciter.toLowerCase()) || 
    (r.sub && r.sub.toLowerCase().includes(searchReciter.toLowerCase()))
  );

  const handleSelectReciter = (reciterId: string) => {
    setReciter(reciterId);
    try {
      localStorage.setItem('quran_reciter', reciterId);
      localStorage.setItem(`quran_surah_${surahNum}_reciter`, reciterId);
    } catch (e) {
      console.warn('Could not save reciter preference', e);
    }
  };

  const handleTogglePlaySurah = () => {
    setCurrentSurah(surahNum);
    if (isAudioPlaying) {
      setIsAudioPlaying(false);
    } else {
      setPlayingAyahNumber(1);
      setCurrentAyah(1);
      setIsAudioPlaying(true);
    }
  };

  const handleStartDownloadAudio = async () => {
    if (!surahData?.ayahs || isDownloading) return;
    setIsDownloading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await AudioCacheService.downloadSurah(
        surahNum,
        reciter,
        surahData.ayahs,
        (progress) => {
          setDownloadProgress(progress);
        },
        controller.signal
      );
      // Refresh status
      const status = await AudioCacheService.getSurahDownloadStatus(
        surahNum,
        surahData.ayahs.length,
        reciter,
        surahData.ayahs
      );
      setAudioDownloadStatus(status);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const handleDeleteAudioCache = async () => {
    if (!surahData?.ayahs) return;
    await AudioCacheService.deleteSurahCache(reciter, surahData.ayahs, surahNum);
    setAudioDownloadStatus({ isDownloaded: false, downloadedCount: 0 });
    setDownloadProgress(null);
  };

  const handleJumpToAyah = (ayahNum: number) => {
    setPlayingAyahNumber(null);
    setSurahAndAyah(surahNum, ayahNum);
    setCurrentView('reader');
    setShowSurahSettingsModal(false);
  };

  const handleOpenMemorize = () => {
    setCurrentSurah(surahNum);
    setPlayingAyahNumber(null);
    setCurrentView('memorize');
    setShowSurahSettingsModal(false);
  };

  const handleOpenTafsir = () => {
    setCurrentSurah(surahNum);
    setPlayingAyahNumber(null);
    setCurrentView('tafsir');
    setShowSurahSettingsModal(false);
  };

  const currentReciterObj = QURAN_RECITERS.find(r => normalizeReciterId(r.id) === normalizeReciterId(reciter)) || QURAN_RECITERS[0];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm text-right" 
        style={{
          paddingTop: 'max(0.75rem, var(--safe-area-top, 0px))',
          paddingBottom: 'max(0.75rem, var(--safe-area-bottom, 0px))'
        }}
        dir="rtl"
      >
        <motion.div key="SurahSettingsModal-anim-1"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-r from-[var(--color-primary-dark)] via-[#155e41] to-[var(--color-primary)] text-white overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/20 shadow-inner shrink-0">
                  {surahNum}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-300 shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold font-serif truncate">
                      خيارات وإعدادات <span className="font-quran text-xl sm:text-2xl text-amber-300 font-bold leading-none select-none">سورة {cleanName}</span>
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-100 opacity-90 truncate mt-0.5">
                    إعدادات الصوت والقراء، التفسير الشامل، فضائل السورة وأدوات الحفظ
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSurahSettingsModal(false)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                title="إغلاق النافذة"
              >
                <X size={20} />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 text-[11px] sm:text-xs font-bold relative z-10">
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 sm:py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <MapPin size={13} className="text-amber-300" />
                {revelationType === 'Meccan' || revelationType === 'مكية' ? '🕋 مكية' : '🕌 مدنية'}
              </span>
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 sm:py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <Hash size={13} className="text-amber-300" />
                {numberOfAyahs} آية
              </span>
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 sm:py-1 rounded-xl flex items-center gap-1.5 border border-white/20">
                <Layers size={13} className="text-amber-300" />
                الترتيب {surahNum}
              </span>
              <span className="bg-amber-400/25 text-amber-200 border border-amber-300/30 px-2.5 py-0.5 sm:py-1 rounded-xl flex items-center gap-1.5">
                <Volume2 size={13} className="text-amber-300" />
                القارئ الحالي: {currentReciterObj.name.split('(')[0]}
              </span>
            </div>
          </div>

          {/* Sub-Tabs Bar: Ordered starting with Surah Info as primary */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 p-1.5 gap-1 overflow-x-auto shrink-0 no-scrollbar">
            
            {/* 1. معلومات وفضائل السورة - Emerald / Gold Theme (الزر الأول والافتراضي) */}
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'info' 
                  ? 'bg-white dark:bg-gray-900 text-[var(--color-primary-dark)] dark:text-emerald-300 shadow-sm border border-emerald-200/80 dark:border-gray-700 font-black' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <FileText size={15} className="text-emerald-500" />
              <span>معلومات وفضائل السورة</span>
            </button>

            {/* 2. التلاوة وإعدادات الصوت - Teal Theme */}
            <button
              onClick={() => setActiveTab('audio')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'audio' 
                  ? 'bg-white dark:bg-gray-900 text-teal-700 dark:text-teal-300 shadow-sm border border-teal-200/80 dark:border-gray-700 font-black' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Volume2 size={15} className="text-teal-500" />
              <span>التلاوة وإعدادات الصوت</span>
            </button>

            {/* 3. التفسير والتدبر - Rose Theme */}
            <button
              onClick={() => setActiveTab('tafsir')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'tafsir' 
                  ? 'bg-white dark:bg-gray-900 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200/80 dark:border-gray-700 font-black' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <BookOpen size={15} className="text-rose-500" />
              <span>التفسير والتدبر</span>
            </button>

            {/* 4. الحفظ والتسميع - Amber Theme */}
            <button
              onClick={() => setActiveTab('memorize')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'memorize' 
                  ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200/80 dark:border-gray-700 font-black' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Target size={15} className="text-amber-500" />
              <span>الحفظ والتسميع</span>
            </button>

            {/* 5. فهرس آيات السورة - Blue Theme */}
            <button
              onClick={() => setActiveTab('ayahs')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'ayahs' 
                  ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/80 dark:border-gray-700 font-black' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <ListFilter size={15} className="text-blue-500" />
              <span>فهرس الآيات ({numberOfAyahs})</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-gray-800 dark:text-gray-100">

            {/* TAB: AUDIO & RECITATION SETTINGS (المخصصة للتلاوة والصوت والقراء والحفظ) */}
            {activeTab === 'audio' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                
                {/* 1. Quick Play Bar for This Surah */}
                <div className="bg-gradient-to-r from-teal-900/90 via-emerald-900/90 to-teal-950/90 text-white p-3.5 sm:p-4 rounded-2xl border border-teal-500/30 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={handleTogglePlaySurah}
                      className="w-11 h-11 rounded-2xl bg-teal-400 hover:bg-teal-300 text-teal-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0 font-bold cursor-pointer"
                      title={isAudioPlaying ? 'إيقاف التلاوة' : 'تشغيل تلاوة السورة'}
                    >
                      {isAudioPlaying ? <Pause size={20} /> : <Play size={20} className="mr-0.5" />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                        <span>تلاوة سورة {cleanName}</span>
                        {isAudioPlaying && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-300 text-[10px] font-medium border border-teal-400/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                            جاري التلاوة الآن
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-teal-100/80 truncate mt-0.5">
                        بصوت: {currentReciterObj.name} ({currentReciterObj.sub})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPlayingAyahNumber(null);
                      setCurrentSurah(surahNum);
                      setCurrentView('reader');
                      setShowSurahSettingsModal(false);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>فتح المصحف</span>
                    <ArrowLeft size={14} className="rtl:rotate-180" />
                  </button>
                </div>

                {/* 2. Reciter Picker with Search & Persistence */}
                <div className="bg-gray-50/80 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Volume2 size={16} className="text-teal-600" />
                      <span>اختيار القارئ المفضل لسورة {cleanName}:</span>
                    </h5>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                      يتم حفظ القارئ تلقائياً
                    </span>
                  </div>

                  {/* Search reciter */}
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchReciter}
                      onChange={(e) => setSearchReciter(e.target.value)}
                      placeholder="ابحث عن اسم القارئ (مثل: العفاسي، المنشاوي، عبد الباسط، المعيقلي...)"
                      className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
                    {filteredReciters.map((r) => {
                      const isSelected = normalizeReciterId(reciter) === normalizeReciterId(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleSelectReciter(r.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                            isSelected 
                              ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-900 dark:text-teal-200 font-black shadow-xs ring-1 ring-teal-500/30'
                              : 'bg-white dark:bg-gray-900/80 border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="min-w-0 pr-1">
                            <span className="block text-xs truncate">{r.name}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal block truncate">{r.desc || r.sub}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Audio Playback Preferences (Repeat, Speed, Delay) */}
                <div className="bg-gray-50/80 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-4">
                  <h5 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Sliders className="text-amber-500" size={16} />
                    <span>إعدادات تشغيل وتكرار التلاوة:</span>
                  </h5>

                  {/* Repeat Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <RotateCcw size={14} className="text-amber-600" />
                        <span>تكرار التلاوة:</span>
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {repeatMode === 'none' ? 'بدون تكرار' : repeatMode === 'ayah' ? `تكرار الآية (${repeatTimes} مرات)` : `تكرار السورة (${repeatTimes} مرات)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setRepeatMode('none')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          repeatMode === 'none'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        إيقاف التكرار
                      </button>
                      <button
                        onClick={() => {
                          setRepeatMode('ayah');
                          if (repeatTimes < 2) setRepeatTimes(3);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          repeatMode === 'ayah'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        تكرار الآية
                      </button>
                      <button
                        onClick={() => {
                          setRepeatMode('range');
                          if (repeatTimes < 2) setRepeatTimes(3);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          repeatMode === 'range'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        تكرار السورة كاملة
                      </button>
                    </div>

                    {repeatMode !== 'none' && (
                      <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto no-scrollbar">
                        <span className="text-[11px] text-gray-500 shrink-0">عدد المرات:</span>
                        {[2, 3, 5, 10, 20].map((times) => (
                          <button
                            key={times}
                            onClick={() => setRepeatTimes(times)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                              repeatTimes === times
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {times} مرات
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Continuous Play Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">التشغيل التلقائي المتواصل</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block">الانتقال التلقائي للسورة التالية عند انتهاء التلاوة</span>
                    </div>
                    <button
                      onClick={() => setContinuousPlay(!continuousPlay)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        continuousPlay ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          continuousPlay ? 'translate-x-1' : 'translate-x-6'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Speed and Delay */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1.5">
                        <FastForward size={14} className="text-teal-600" />
                        <span>سرعة التلاوة:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              playbackRate === rate
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1.5">
                        <Clock size={14} className="text-teal-600" />
                        <span>الفاصل الزمني بين الآيات:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((delay) => (
                          <button
                            key={delay}
                            onClick={() => setVerseDelay(delay)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              verseDelay === delay
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {delay === 0 ? 'بدون' : `${delay}ث`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Offline Audio Cache for This Surah */}
                <div className="bg-gray-50/80 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Download size={16} className="text-emerald-600" />
                        <span>تحميل تلاوة سورة {cleanName} للاستماع أوفلاين:</span>
                      </h5>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        بصوت: {currentReciterObj.name} ({numberOfAyahs} آية)
                      </p>
                    </div>

                    {audioDownloadStatus.isDownloaded ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 text-xs font-bold flex items-center gap-1 shrink-0">
                        <Check size={14} />
                        محملة كاملة
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">
                        {audioDownloadStatus.downloadedCount > 0 
                          ? `${audioDownloadStatus.downloadedCount} من ${numberOfAyahs} آية`
                          : 'غير محملة بعد'}
                      </span>
                    )}
                  </div>

                  {/* Progress bar if downloading */}
                  {isDownloading && downloadProgress && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-300">
                        <span>جاري تحميل التلاوة...</span>
                        <span>{downloadProgress.percentage}% ({downloadProgress.completed}/{downloadProgress.total})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {!audioDownloadStatus.isDownloaded ? (
                      <button
                        onClick={handleStartDownloadAudio}
                        disabled={isDownloading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>جاري تحميل صوت السورة...</span>
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            <span>تحميل صوت سورة {cleanName} أوفلاين</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleDeleteAudioCache}
                        className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                        <span>حذف تلاوة السورة لتوفير المساحة</span>
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: TAFSIR & CONTEMPLATION (مخصص بالكامل للتفسير والتدبر) */}
            {activeTab === 'tafsir' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                
                {/* Tafsir Hero Banner */}
                <div className="bg-gradient-to-r from-rose-900/90 via-pink-900/90 to-purple-950/90 text-white p-4 sm:p-5 rounded-2xl border border-rose-500/30 space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/30 text-rose-200 border border-rose-400/30 flex items-center justify-center shrink-0">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base sm:text-lg">التفسير الشامل والتدبر لسورة {cleanName}</h4>
                      <p className="text-xs text-rose-100/80 mt-0.5">
                        تفاسير معتمدة لآيات السورة ({numberOfAyahs} آية) مع أسباب النزول والمعاني البلاغية
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenTafsir}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                  >
                    <span>فتح قسم التفسير والتدبر التفاعلي الكامل للسورة</span>
                    <ArrowLeft size={16} className="rtl:rotate-180" />
                  </button>
                </div>

                {/* Available Tafsirs Info */}
                <div className="bg-gray-50/80 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-3">
                  <h5 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <BookMarked size={16} className="text-rose-600" />
                    <span>أمهات كتب التفسير المتاحة لسورة {cleanName}:</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { name: 'التفسير الميسر', author: 'نخبة من العلماء', desc: 'تفسير واضح ومباشر لجميع الآيات' },
                      { name: 'تفسير السعدي', author: 'الشيخ عبد الرحمن السعدي', desc: 'تيسير الكريم الرحمن في تفسير كلام المنان' },
                      { name: 'تفسير ابن كثير', author: 'الحافظ ابن كثير', desc: 'عمدة التفاسير بالقرآن والأثر والحديث' },
                      { name: 'تفسير القرطبي', author: 'الإمام القرطبي', desc: 'الجامع لأحكام القرآن واستنباط الفقه' },
                      { name: 'تفسير الطبري', author: 'الإمام ابن جرير الطبري', desc: 'جامع البيان عن تأويل آي القرآن' },
                      { name: 'تفسير البغوي', author: 'الإمام البغوي', desc: 'معالم التنزيل الموثوق' },
                      { name: 'التفسير الوسيط', author: 'د. محمد سيد طنطاوي', desc: 'شرح تحليلي معاصر ودقيق' },
                      { name: 'تفسير الجلالين', author: 'المحلي والسيوطي', desc: 'إيجاز وبلاغة في إيضاح المعاني' },
                    ].map((book, idx) => (
                      <div 
                        key={idx}
                        onClick={handleOpenTafsir}
                        className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700/70 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {book.name}
                          </span>
                          <span className="text-[10px] text-rose-500 font-medium">عرض التفسير</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {book.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Focus of the Surah */}
                <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-rose-900 dark:text-rose-300 font-bold text-xs sm:text-sm">
                    <Compass className="w-4 h-4 text-rose-600" />
                    <span>المقصد والمدار التفسيري لسورة {cleanName}:</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                    {meta.focus}
                  </p>
                </div>

              </motion.div>
            )}

            {/* TAB: SURAH INFO & VIRTUES */}
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Titles */}
                {meta.titles && meta.titles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      ألقاب السورة وأسماؤها الشريفة
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {meta.titles.map((title, idx) => (
                        <span
                          key={`stitle-${title}-${idx}`}
                          className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-xl text-xs font-bold shadow-xs"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Focus */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 text-[var(--color-primary-dark)] dark:text-emerald-400 font-bold text-sm">
                    <Compass className="w-5 h-5 text-[var(--color-primary)]" />
                    <span>مقصد وموضوع السورة الرئيسي</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                    {meta.focus}
                  </p>
                </div>

                {/* Key Themes */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                    المحاور والموضوعات الرئيسية
                  </h3>
                  <ul className="space-y-2">
                    {meta.themes.map((theme, idx) => (
                      <li
                        key={`stheme-${idx}-${theme.substring(0, 10)}`}
                        className="flex items-start gap-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed"
                      >
                        <span className="w-6 h-6 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{theme}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Virtues */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    فوائدها وفضائلها المثبتة
                  </h3>
                  <div className="space-y-2">
                    {meta.virtues.map((virtue, idx) => (
                      <div
                        key={`svirtue-${idx}-${virtue.substring(0, 10)}`}
                        className="flex items-start gap-2.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-200"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                        <span>{virtue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Actions */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-blue-600" />
                    العمل بالقرآن والتطبيق العملي
                  </h3>
                  <div className="space-y-2">
                    {meta.practicalActions.map((action, idx) => (
                      <div
                        key={`saction-${idx}-${action.substring(0, 10)}`}
                        className="flex items-start gap-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed text-blue-900 dark:text-blue-200"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Context */}
                {meta.historicalContext && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                    <span className="font-bold block text-gray-700 dark:text-gray-300 mb-0.5">📜 السياق النزولي والمعلوماتي:</span>
                    {meta.historicalContext}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: MEMORIZATION & QUIZ */}
            {activeTab === 'memorize' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl text-amber-900 dark:text-amber-200">
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
                    <Target className="text-amber-600" size={18} />
                    أدوات ومساعدات الحفظ والتسميع لسورة {cleanName}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    يمكنك التفاعل واختبار ترتيب الآيات والكلمات أو تشغيل ألعاب الأطفال التفاعلية لهذه السورة.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Memorization Room */}
                  <button
                    onClick={handleOpenMemorize}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 text-right hover:shadow-md transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Target size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">غرفة التسميع والاختبار</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        اختبار ترتيب الكلمات، خلط الآيات، وإحصائيات الحفظ لسورة {cleanName}
                      </p>
                    </div>
                  </button>

                  {/* Card 2: Kids Game */}
                  <button
                    onClick={handleOpenMemorize}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 text-right hover:shadow-md transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Gamepad2 size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">مغامرة أبطال القرآن (أطفال)</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        تحدي ممتع للأطفال بجمع النجوم واستكمال الكلمات المفقودة
                      </p>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setCurrentSurah(surahNum);
                      setPlayingAyahNumber(null);
                      setCurrentView('reader');
                      setShowSurahSettingsModal(false);
                    }}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye size={16} className="text-amber-500" />
                    <span>متابعة القراءة المباشرة في المصحف</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB: AYAHS INDEX */}
            {activeTab === 'ayahs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <ListFilter size={16} className="text-blue-500" />
                    انتقال سريع لآية محددة في سورة {cleanName} ({numberOfAyahs} آية):
                  </h4>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {Array.from({ length: numberOfAyahs }).map((_, idx) => {
                    const ayahNum = idx + 1;
                    return (
                      <button
                        key={ayahNum}
                        onClick={() => handleJumpToAyah(ayahNum)}
                        className="py-2 px-1 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-[var(--color-primary)] hover:text-white border border-gray-200/80 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all shadow-2xs text-center cursor-pointer"
                        title={`انتقال للآية ${ayahNum}`}
                      >
                        {ayahNum}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200/80 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => {
                setShowSurahSettingsModal(false);
                setCurrentSurah(surahNum);
                setPlayingAyahNumber(null);
                setCurrentView('reader');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[var(--color-primary-dark)] text-white hover:bg-opacity-90 transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <BookOpen size={16} />
              <span>اقرأ سورة {cleanName} في المصحف</span>
              <ArrowLeft size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
