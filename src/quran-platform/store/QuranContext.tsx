import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { QuranDataService } from '../services/QuranDataService';

type ViewType = 'index' | 'reader' | 'tafsir' | 'info' | 'memorize' | 'stats';

export type MushafTheme = 'royal_green' | 'shamarli' | 'golden' | 'tajweed' | 'night';

// Standard start page of each of the 114 Surahs in the standard 604-page Medina Mushaf
const SURAH_START_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 600,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604
];

interface QuranContextProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentSurah: number;
  setCurrentSurah: (surah: number) => void;
  currentAyah: number;
  setCurrentAyah: (ayah: number) => void;
  setSurahAndAyah: (surah: number, ayah: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isAudioPlaying: boolean;
  setIsAudioPlaying: (playing: boolean) => void;
  reciter: string;
  setReciter: (reciter: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  readingMode: 'page' | 'scroll';
  setReadingMode: (mode: 'page' | 'scroll') => void;
  mushafTheme: MushafTheme;
  setMushafTheme: (theme: MushafTheme) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  showSurahSettingsModal: boolean;
  setShowSurahSettingsModal: (show: boolean) => void;
  surahSettingsNumber: number;
  setSurahSettingsNumber: (num: number) => void;
  openSurahSettings: (surahNum?: number) => void;
  playingAyahNumber: number | null;
  setPlayingAyahNumber: (ayah: number | null) => void;
  rangeStart: number;
  setRangeStart: (start: number) => void;
  rangeEnd: number;
  setRangeEnd: (end: number) => void;
  repeatMode: 'none' | 'ayah' | 'range';
  setRepeatMode: (mode: 'none' | 'ayah' | 'range') => void;
  repeatTimes: number;
  setRepeatTimes: (times: number) => void;
  isImmersive: boolean;
  setIsImmersive: (immersive: boolean) => void;
  continuousPlay: boolean;
  setContinuousPlay: (val: boolean) => void;
  playbackRate: number;
  setPlaybackRate: (val: number) => void;
  verseDelay: number;
  setVerseDelay: (val: number) => void;
}

const QuranContext = createContext<QuranContextProps | undefined>(undefined);

interface QuranProviderProps {
  children: ReactNode;
  initialSurah?: number;
  initialAyah?: number;
  initialView?: ViewType;
}

export const QuranProvider: React.FC<QuranProviderProps> = ({ children, initialSurah: propsSurah, initialAyah: propsAyah, initialView: propsView }) => {
  const [currentView, setCurrentView] = useState<ViewType>(propsView || 'index');
  const [currentSurah, setCurrentSurah] = useState<number>(() => {
    return propsSurah || Number(localStorage.getItem('quran_last_surah') || '1');
  });
  const [currentAyah, setCurrentAyah] = useState<number>(() => {
    return propsAyah || Number(localStorage.getItem('quran_last_ayah') || '1');
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (propsSurah && SURAH_START_PAGES[propsSurah - 1]) {
      return SURAH_START_PAGES[propsSurah - 1];
    }
    return Number(localStorage.getItem('quran_last_page') || '1');
  });

  const pendingPositionRef = useRef<{ surah: number; ayah: number } | null>(null);

  const setSurahAndAyah = (surahNum: number, ayahNum: number) => {
    pendingPositionRef.current = { surah: surahNum, ayah: ayahNum };
    setCurrentSurah(surahNum);
    setCurrentAyah(ayahNum);
  };

  // Save last read position to localStorage when changed
  useEffect(() => {
    if (currentSurah) {
      localStorage.setItem('quran_last_surah', currentSurah.toString());
    }
  }, [currentSurah]);

  useEffect(() => {
    if (currentAyah) {
      localStorage.setItem('quran_last_ayah', currentAyah.toString());
    }
  }, [currentAyah]);

  useEffect(() => {
    if (currentPage) {
      localStorage.setItem('quran_last_page', currentPage.toString());
    }
  }, [currentPage]);

  // Sync with props if they change (e.g. clicking another verse while modal is open)
  useEffect(() => {
    if (propsSurah) {
      setCurrentSurah(propsSurah);
      if (SURAH_START_PAGES[propsSurah - 1]) {
        setCurrentPage(SURAH_START_PAGES[propsSurah - 1]);
      }
      QuranDataService.getSurah(propsSurah).then(surah => {
        if (surah && surah.ayahs) {
          const targetAyah = propsAyah || 1;
          const found = surah.ayahs.find((a: any) => a.numberInSurah === targetAyah);
          if (found && found.page) {
            setCurrentPage(found.page);
          }
        }
      }).catch(e => console.warn('Error finding page for surah:', e));
    }
    if (propsAyah) setCurrentAyah(propsAyah);
    if (propsView) setCurrentView(propsView);
  }, [propsSurah, propsAyah, propsView]);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [reciter, setReciter] = useState<string>(() => localStorage.getItem('quran_reciter') || 'ar.faresabbad');
  const [fontSize, setFontSize] = useState<number>(22);
  const [readingMode, setReadingMode] = useState<'page' | 'scroll'>('page');
  const [mushafTheme, setMushafTheme] = useState<MushafTheme>(localStorage.getItem('quran_mushaf_theme') as MushafTheme || 'royal_green');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSurahSettingsModal, setShowSurahSettingsModal] = useState<boolean>(false);
  const [surahSettingsNumber, setSurahSettingsNumber] = useState<number>(1);

  const openSurahSettings = (surahNum?: number) => {
    setSurahSettingsNumber(surahNum || currentSurah || 1);
    setShowSurahSettingsModal(true);
  };
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(7);
  const [repeatMode, setRepeatMode] = useState<'none' | 'ayah' | 'range'>('none');
  const [repeatTimes, setRepeatTimes] = useState<number>(1);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);

  const [continuousPlay, setContinuousPlayState] = useState<boolean>(() => {
    return localStorage.getItem('quran_continuous_play') !== 'false';
  });
  const [playbackRate, setPlaybackRateState] = useState<number>(() => {
    return Number(localStorage.getItem('quran_playback_rate') || '1');
  });
  const [verseDelay, setVerseDelayState] = useState<number>(() => {
    return Number(localStorage.getItem('quran_verse_delay') || '0');
  });

  const setContinuousPlay = (val: boolean) => {
    setContinuousPlayState(val);
    localStorage.setItem('quran_continuous_play', val.toString());
  };

  const setPlaybackRate = (val: number) => {
    setPlaybackRateState(val);
    localStorage.setItem('quran_playback_rate', val.toString());
  };

  const setVerseDelay = (val: number) => {
    setVerseDelayState(val);
    localStorage.setItem('quran_verse_delay', val.toString());
  };

  // Synchronize currentPage when currentSurah or currentAyah changes
  useEffect(() => {
    let active = true;

    // Check if there is a pending atomic position update
    const pending = pendingPositionRef.current;
    if (pending) {
      // If the current state doesn't match the pending atomic update yet,
      // it means we are in an intermediate render state. Skip this effect!
      if (currentSurah !== pending.surah || currentAyah !== pending.ayah) {
        return;
      }
      // Once they both match, we can clear the pending ref
      pendingPositionRef.current = null;
    }

    // 1. Instant fallback for start of Surah
    if (currentAyah === 1) {
      const startPage = SURAH_START_PAGES[currentSurah - 1];
      if (startPage && startPage !== currentPage) {
        setCurrentPage(startPage);
        return;
      }
    }

    // 2. Dynamic lookup for specific Ayah (e.g. from search, bookmarks)
    const syncPage = async () => {
      try {
        const surah = await QuranDataService.getSurah(currentSurah);
        if (!active || !surah || !surah.ayahs) return;
        
        const ayahObj = surah.ayahs.find((a: any) => a.numberInSurah === currentAyah);
        if (ayahObj && ayahObj.page && ayahObj.page !== currentPage) {
          setCurrentPage(ayahObj.page);
        }
      } catch (error) {
        console.error('Error synchronizing page:', error);
      }
    };
    
    syncPage();
    return () => {
      active = false;
    };
  }, [currentSurah, currentAyah]);

  return (
    <QuranContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentSurah,
        setCurrentSurah,
        currentAyah,
        setCurrentAyah,
        setSurahAndAyah,
        currentPage,
        setCurrentPage,
        isAudioPlaying,
        setIsAudioPlaying,
        reciter,
        setReciter,
        fontSize,
        setFontSize,
        readingMode,
        setReadingMode,
        mushafTheme,
        setMushafTheme,
        showSettingsModal,
        setShowSettingsModal,
        showSurahSettingsModal,
        setShowSurahSettingsModal,
        surahSettingsNumber,
        setSurahSettingsNumber,
        openSurahSettings,
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
        isImmersive,
        setIsImmersive,
        continuousPlay,
        setContinuousPlay,
        playbackRate,
        setPlaybackRate,
        verseDelay,
        setVerseDelay,
      }}
    >
      {children}
    </QuranContext.Provider>
  );
};

export const useQuranContext = () => {
  const context = useContext(QuranContext);
  if (!context) {
    throw new Error('useQuranContext must be used within a QuranProvider');
  }
  return context;
};

