import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, Calendar, CheckCircle2, Circle, TrendingUp, AlertCircle, Play, Pause, Check, 
  RotateCcw, Eye, EyeOff, Brain, Volume2, Sparkles, Repeat, Layers, RefreshCw, ArrowRight, ArrowLeft, Star, Award,
  ListOrdered, History, Trash2, HelpCircle, Shuffle, XCircle, BookOpen, Gamepad2, Mic, MicOff, VolumeX, ShieldCheck,
  Trophy, Activity, FileText, CheckSquare, AlertTriangle, Scale, BarChart, ChevronDown, ChevronUp, Lock, Clock, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { AudioCacheService } from '../services/audioCacheService';
import { getQuranAudioUrl } from '../../utils/quranAudio';
import { getCleanSurahName } from './AyahMarker';
import QuranGamesHub from './QuranGamesHub';

type TabType = 'plans' | 'repetition' | 'memory_test' | 'kids_game';

export const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '') // Remove diacritics and Quranic symbols
    .replace(/[أإآٱ]/g, 'ا') // Normalize Alef
    .replace(/ى/g, 'ي') // Normalize Alef Maqsura
    .replace(/ة/g, 'ه') // Normalize Taa Marbuta
    .replace(/[^\u0621-\u064A\s]/g, '') // Keep Arabic letters and spaces
    .trim()
    .replace(/\s+/g, ' ');
};

export const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const QuranMemorize: React.FC = () => {
  const { currentSurah, setCurrentView, reciter } = useQuranContext();
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [surahData, setSurahData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- TAB 1: PLANS STATE ---
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [customPlanDays, setCustomPlanDays] = useState<number>(1);
  const [activePlan, setActivePlan] = useState<any>(null);

  // --- TAB 2: REPETITION STUDIO STATE ---
  const [repStartAyah, setRepStartAyah] = useState<number>(1);
  const [repEndAyah, setRepEndAyah] = useState<number>(5);
  const [verseRepeats, setVerseRepeats] = useState<number>(3); // Repeat per verse
  const [passageRepeats, setPassageRepeats] = useState<number>(2); // Repeat per passage
  const [pauseSeconds, setPauseSeconds] = useState<number>(2); // Delay between verses
  const [isPlayingRepetition, setIsPlayingRepetition] = useState<boolean>(false);
  const [currentRepAyah, setCurrentRepAyah] = useState<number>(1);
  const [currentVerseRepeatCount, setCurrentVerseRepeatCount] = useState<number>(1);
  const [currentPassageRepeatCount, setCurrentPassageRepeatCount] = useState<number>(1);
  const [isPausedBetweenVerses, setIsPausedBetweenVerses] = useState<boolean>(false);

  // Audio ref for repetition studio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- TAB 3: VOICE RECITATION & MEMORY TEST STATE ---
  const [testSubTab, setTestSubTab] = useState<'voice_recitation' | 'hide_words' | 'ordering' | 'mistakes'>('voice_recitation');
  const [hideMode, setHideMode] = useState<'25' | '50' | '75' | '100' | 'ends'>('50');
  const [testStartAyah, setTestStartAyah] = useState<number>(1);
  const [testEndAyah, setTestEndAyah] = useState<number>(5);
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({});
  const [allRevealed, setAllRevealed] = useState<boolean>(false);

  // --- PROFESSIONAL POPUP CARD MODAL STATE (بطاقة منبثقة) ---
  const [popupModalCard, setPopupModalCard] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    content: null,
  });

  // --- LIVE VOICE RECITATION STATE ---
  const [recitationEvalMode, setRecitationEvalMode] = useState<'tajweed_strict' | 'standard_normal'>('standard_normal');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isRecitationHidden, setIsRecitationHidden] = useState<boolean>(true); // Hidden text by default during live recitation
  const [showStagesStepper, setShowStagesStepper] = useState<boolean>(false); // Collapsible stepper card
  const [isOrderingTextMasked, setIsOrderingTextMasked] = useState<boolean>(true); // Masked text for stage 2 ordering test
  const [playingCorrectionAyah, setPlayingCorrectionAyah] = useState<number | null>(null);
  const correctionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [voiceTargetAyahNum, setVoiceTargetAyahNum] = useState<number>(1);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [matchedWordIndices, setMatchedWordIndices] = useState<number[]>([]);
  const [voiceErrorsCount, setVoiceErrorsCount] = useState<number>(0);
  const [liveCorrectionAlert, setLiveCorrectionAlert] = useState<string | null>(null);
  const [voiceSessionErrors, setVoiceSessionErrors] = useState<Array<{
    ayahNum: number;
    expectedWord: string;
    spokenWord: string;
    time: string;
  }>>([]);
  const [recitationPassedVerses, setRecitationPassedVerses] = useState<number[]>([]);
  const [recitationMatchedMap, setRecitationMatchedMap] = useState<Record<number, number[]>>({});
  const recognitionRef = useRef<any>(null);
  const loggedErrorsSetRef = useRef<Set<string>>(new Set());

  const playAyahCorrection = (ayahNum: number) => {
    if (playingCorrectionAyah === ayahNum && correctionAudioRef.current) {
      correctionAudioRef.current.pause();
      setPlayingCorrectionAyah(null);
      return;
    }

    if (correctionAudioRef.current) {
      correctionAudioRef.current.pause();
    }

    const url = getQuranAudioUrl(reciter || 'ar.alafasy', currentSurah, ayahNum);
    const audio = new Audio(url);
    correctionAudioRef.current = audio;
    setPlayingCorrectionAyah(ayahNum);

    audio.play().catch(err => {
      if (err?.name === 'AbortError' || err?.message?.includes('interrupted')) {
        return;
      }
      console.warn("Audio correction playback notice:", err?.message || err);
      setPlayingCorrectionAyah(null);
    });

    audio.onended = () => {
      setPlayingCorrectionAyah(null);
    };
  };

  // --- TWO-STAGE OFFICIAL EXAM STATE ---
  const [examActive, setExamActive] = useState<boolean>(false);
  const [examStage, setExamStage] = useState<'stage1_voice' | 'stage2_quiz' | 'result'>('stage1_voice');
  const [stage1Passed, setStage1Passed] = useState<boolean>(false);
  const [voiceTestFinished, setVoiceTestFinished] = useState<boolean>(false);
  const [stage1LockNotice, setStage1LockNotice] = useState<string | null>(null);
  const [stage1RecitationScore, setStage1RecitationScore] = useState<number>(0);
  const [stage2QuizScore, setStage2QuizScore] = useState<number>(0);
  const [examResultData, setExamResultData] = useState<{
    passed: boolean;
    finalScore: number;
    totalErrors: number;
    gradeLabel: string;
    detailedErrors: Array<{ ayahNum: number; description: string }>;
  } | null>(null);

  // --- AUTOMATED HIDDEN WORDS QUIZ STATE ---
  const [hiddenQuizActive, setHiddenQuizActive] = useState<boolean>(false);
  const [hiddenQuizQuestions, setHiddenQuizQuestions] = useState<Array<{
    ayahNum: number;
    wordIndex: number;
    fullAyahText: string;
    targetWord: string;
    options: string[];
    userAnswer?: string;
    isCorrect?: boolean;
  }>>([]);
  const [hiddenQuizIndex, setHiddenQuizIndex] = useState<number>(0);
  const [hiddenQuizCompleted, setHiddenQuizCompleted] = useState<boolean>(false);
  const [hiddenQuizStats, setHiddenQuizStats] = useState<{ correct: number; wrong: number; stars: number }>({ correct: 0, wrong: 0, stars: 0 });

  // --- ORDERING QUIZ STATE ---
  const [orderingType, setOrderingType] = useState<'verses' | 'words'>('verses');

  // Verse Ordering
  const [shuffledVerses, setShuffledVerses] = useState<any[]>([]);
  const [userVerseOrder, setUserVerseOrder] = useState<any[]>([]);
  const [verseTestChecked, setVerseTestChecked] = useState<boolean>(false);
  const [isVerseTestCorrect, setIsVerseTestCorrect] = useState<boolean | null>(null);

  // Word Ordering
  const [selectedWordAyahNum, setSelectedWordAyahNum] = useState<number>(1);
  const [shuffledWords, setShuffledWords] = useState<{ id: string; text: string }[]>([]);
  const [userWordOrder, setUserWordOrder] = useState<{ id: string; text: string }[]>([]);
  const [wordTestChecked, setWordTestChecked] = useState<boolean>(false);
  const [isWordTestCorrect, setIsWordTestCorrect] = useState<boolean | null>(null);

  // Quiz Stats & Mistakes Log
  const [testStats, setTestStats] = useState({
    correct: 0,
    wrong: 0,
    totalTests: 0,
    score: 0
  });

  const [mistakesLog, setMistakesLog] = useState<Array<{
    id: string;
    surahName: string;
    surahNumber: number;
    ayahNumber: number;
    text: string;
    type: string;
    date: string;
    userAnswer?: string;
  }>>([]);

  // Fetch Surah Data
  useEffect(() => {
    let isMounted = true;
    const fetchSurah = async () => {
      setLoading(true);
      const data = await QuranDataService.getSurah(currentSurah);
      if (isMounted && data) {
        setSurahData(data);
        const maxAyah = data.numberOfAyahs || 7;
        setRepEndAyah(Math.min(5, maxAyah));
        setTestEndAyah(Math.min(5, maxAyah));
      }
      if (isMounted) setLoading(false);
    };
    fetchSurah();

    // Check active plan
    const savedPlans = JSON.parse(localStorage.getItem('quran_memorize_plans') || '{}');
    if (savedPlans[currentSurah]) {
      setActivePlan(savedPlans[currentSurah]);
    } else {
      setActivePlan(null);
    }

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentSurah]);

  // Plans config
  const plans = [
    { id: 'custom_1', title: 'خطة يوم واحد', days: 1, description: 'حفظ وتسميع السورة كاملة في يوم واحد لمن يرغب في التحدي السريع.' },
    { id: 'custom_2', title: 'خطة يومين', days: 2, description: 'تقسيم السورة على يومين متتاليين للحفظ المريح والمركّز.' },
    { id: '3', title: 'خطة 3 أيام', days: 3, description: 'مراجعة وتثبيت السورة في 3 أيام لمن سبق له حفظها.' },
    { id: '1', title: 'خطة أسبوعية (7 أيام)', days: 7, description: 'تقسيم السورة على 7 أيام للحفظ مع مراجعة يومية مركزة.' },
    { id: '2', title: 'خطة شهرية (30 يوم)', days: 30, description: 'حفظ براحة تامة خلال شهر مع التركيز على التثبيت والتدبر.' },
    { id: 'custom_input', title: 'خطة مخصصة', days: Math.max(1, customPlanDays), description: 'حدد عدد الأيام التي تريدها بنفسك بحرية تامة حسب وقتك.' },
  ];

  const startPlan = () => {
    if (!selectedPlan || !surahData) return;
    
    let targetDays = 7;
    let planTitle = 'خطة حفظ السورة';

    if (selectedPlan === 'custom_input') {
      targetDays = Math.max(1, customPlanDays);
      planTitle = `خطة مخصصة (${targetDays} ${targetDays === 1 ? 'يوم' : targetDays === 2 ? 'يومين' : 'أيام'})`;
    } else {
      const planDetails = plans.find(p => p.id === selectedPlan);
      if (!planDetails) return;
      targetDays = planDetails.days;
      planTitle = planDetails.title;
    }

    const totalAyahs = surahData.numberOfAyahs;
    const ayahsPerDay = Math.ceil(totalAyahs / targetDays);

    const newPlan = {
      id: selectedPlan,
      title: planTitle,
      surah: currentSurah,
      startDate: new Date().toISOString(),
      days: targetDays,
      ayahsPerDay,
      progress: 0,
      completedDays: [],
      isCompleted: false,
      isCertified: false,
    };

    const savedPlans = JSON.parse(localStorage.getItem('quran_memorize_plans') || '{}');
    savedPlans[currentSurah] = newPlan;
    localStorage.setItem('quran_memorize_plans', JSON.stringify(savedPlans));
    setActivePlan(newPlan);
  };

  const markDayCompleted = (dayIndex: number) => {
    if (!activePlan) return;
    const updatedPlan = { ...activePlan };
    if (!updatedPlan.completedDays.includes(dayIndex)) {
      updatedPlan.completedDays.push(dayIndex);
      const isAllDays = updatedPlan.completedDays.length === updatedPlan.days;
      
      // Progress caps at 90% if not certified by official exam yet
      updatedPlan.progress = (isAllDays && !updatedPlan.isCertified)
        ? 90
        : updatedPlan.isCertified
        ? 100
        : Math.round((updatedPlan.completedDays.length / updatedPlan.days) * 90);

      const savedPlans = JSON.parse(localStorage.getItem('quran_memorize_plans') || '{}');
      savedPlans[currentSurah] = updatedPlan;
      localStorage.setItem('quran_memorize_plans', JSON.stringify(savedPlans));
      setActivePlan(updatedPlan);
    }
  };

  const deletePlan = () => {
    const savedPlans = JSON.parse(localStorage.getItem('quran_memorize_plans') || '{}');
    delete savedPlans[currentSurah];
    localStorage.setItem('quran_memorize_plans', JSON.stringify(savedPlans));
    setActivePlan(null);
    setSelectedPlan(null);
  };

  // --- AUDIO REPETITION LOGIC ---
  const getAudioUrl = (surah: number, ayah: number) => {
    const ayahObj = surahData?.ayahs?.find((a: any) => a.numberInSurah === ayah);
    return getQuranAudioUrl(reciter, ayahObj?.number, surah, ayah);
  };

  const playRepetition = () => {
    if (isPlayingRepetition) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingRepetition(false);
      return;
    }

    setIsPlayingRepetition(true);
    setCurrentRepAyah(repStartAyah);
    setCurrentVerseRepeatCount(1);
    setCurrentPassageRepeatCount(1);
    playAyahAudio(repStartAyah, 1, 1);
  };

  const playAyahAudio = async (ayahNum: number, vRepeat: number, pRepeat: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const rawUrl = getAudioUrl(currentSurah, ayahNum);
    const audioSrc = await AudioCacheService.getAudioSource(rawUrl);
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const setupEndedHandler = (audioInstance: HTMLAudioElement) => {
      audioInstance.onended = () => {
        // Verse repeat logic
        if (vRepeat < verseRepeats) {
          if (pauseSeconds > 0) {
            setIsPausedBetweenVerses(true);
            setTimeout(() => {
              setIsPausedBetweenVerses(false);
              setCurrentVerseRepeatCount(vRepeat + 1);
              playAyahAudio(ayahNum, vRepeat + 1, pRepeat);
            }, pauseSeconds * 1000);
          } else {
            setCurrentVerseRepeatCount(vRepeat + 1);
            playAyahAudio(ayahNum, vRepeat + 1, pRepeat);
          }
        } else {
          // Verse completed repeats, move to next verse or end of passage
          if (ayahNum < repEndAyah) {
            const nextAyah = ayahNum + 1;
            if (pauseSeconds > 0) {
              setIsPausedBetweenVerses(true);
              setTimeout(() => {
                setIsPausedBetweenVerses(false);
                setCurrentRepAyah(nextAyah);
                setCurrentVerseRepeatCount(1);
                playAyahAudio(nextAyah, 1, pRepeat);
              }, pauseSeconds * 1000);
            } else {
              setCurrentRepAyah(nextAyah);
              setCurrentVerseRepeatCount(1);
              playAyahAudio(nextAyah, 1, pRepeat);
            }
          } else {
            // Passage completed 1 loop, check passageRepeats
            if (pRepeat < passageRepeats) {
              if (pauseSeconds > 0) {
                setIsPausedBetweenVerses(true);
                setTimeout(() => {
                  setIsPausedBetweenVerses(false);
                  setCurrentPassageRepeatCount(pRepeat + 1);
                  setCurrentRepAyah(repStartAyah);
                  setCurrentVerseRepeatCount(1);
                  playAyahAudio(repStartAyah, 1, pRepeat + 1);
                }, pauseSeconds * 1000);
              } else {
                setCurrentPassageRepeatCount(pRepeat + 1);
                setCurrentRepAyah(repStartAyah);
                setCurrentVerseRepeatCount(1);
                playAyahAudio(repStartAyah, 1, pRepeat + 1);
              }
            } else {
              // Completed all verse & passage repeats!
              setIsPlayingRepetition(false);
              audioRef.current = null;
            }
          }
        }
      };
    };

    audio.onerror = async () => {
      console.warn("Audio load error, trying fallback endpoint for:", currentSurah, ayahNum);
      try {
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${currentSurah}:${ayahNum}/${reciter}`);
        const result = await response.json();
        if (result.code === 200 && result.data?.audio) {
          const fallbackAudio = new Audio(result.data.audio);
          audioRef.current = fallbackAudio;
          setupEndedHandler(fallbackAudio);
          fallbackAudio.play().catch(err => {
            if (err?.name === 'AbortError' || err?.message?.includes('interrupted')) {
              return;
            }
            console.warn('Fallback audio playback notice:', err?.message || err);
            setIsPlayingRepetition(false);
          });
          return;
        }
      } catch (e) {
        console.warn('Fallback fetch error:', e);
      }
      setIsPlayingRepetition(false);
    };

    setupEndedHandler(audio);

    audio.play().catch(err => {
      if (err?.name === 'AbortError' || err?.message?.includes('interrupted')) {
        return;
      }
      console.warn('Audio playback notice:', err?.message || err);
      if (audio.onerror) {
        (audio.onerror as any)();
      } else {
        setIsPlayingRepetition(false);
      }
    });
  };

  const stopRepetition = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingRepetition(false);
  };

  // --- HIDE WORDS HELPER ---
  const shouldHideWord = (wordIndex: number, totalWords: number, word: string): boolean => {
    if (allRevealed) return false;
    if (hideMode === '100') return true;
    if (hideMode === 'ends') return wordIndex === totalWords - 1;

    const percent = parseInt(hideMode, 10) / 100;
    // Deterministic pseudo-random based on word index
    const hash = (wordIndex * 13 + word.length * 7) % 100;
    return hash < percent * 100;
  };

  const toggleWordReveal = (key: string) => {
    setRevealedWords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- AUTOMATED HIDDEN WORDS QUIZ HELPER ---
  const startAutomatedHiddenQuiz = () => {
    if (!surahData?.ayahs) return;
    const ayahsInRange = surahData.ayahs.filter(
      (a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah
    );
    if (ayahsInRange.length === 0) return;

    const allSurahWords: string[] = surahData.ayahs.flatMap((a: any) => a.text.trim().split(/\s+/));
    const uniqueSurahWords: string[] = Array.from(new Set(allSurahWords)).filter((w: string) => w.length > 2);

    const questions: Array<{
      ayahNum: number;
      wordIndex: number;
      fullAyahText: string;
      targetWord: string;
      options: string[];
    }> = [];

    ayahsInRange.forEach((ayah: any) => {
      const words = ayah.text.trim().split(/\s+/);
      words.forEach((word: string, wIdx: number) => {
        const isHidden = hideMode === '100' ? true : hideMode === 'ends' ? wIdx === words.length - 1 : ((wIdx * 13 + word.length * 7) % 100) < (parseInt(hideMode, 10) || 50);
        if (isHidden) {
          const pool: string[] = uniqueSurahWords.filter(w => w !== word);
          const distractors: string[] = [];
          while (distractors.length < 3 && pool.length > 0) {
            const randIdx = Math.floor(Math.random() * pool.length);
            const picked = pool.splice(randIdx, 1)[0];
            if (picked && !distractors.includes(picked)) distractors.push(picked);
          }
          const options = [word, ...distractors].sort(() => Math.random() - 0.5);

          questions.push({
            ayahNum: ayah.numberInSurah,
            wordIndex: wIdx,
            fullAyahText: ayah.text,
            targetWord: word,
            options
          });
        }
      });
    });

    if (questions.length === 0) {
      ayahsInRange.forEach((ayah: any) => {
        const words = ayah.text.trim().split(/\s+/);
        if (words.length > 0) {
          const midIdx = Math.floor(words.length / 2);
          const targetWord = words[midIdx];
          const pool = uniqueSurahWords.filter(w => w !== targetWord);
          const distractors = pool.slice(0, 3);
          const options = [targetWord, ...distractors].sort(() => Math.random() - 0.5);
          questions.push({
            ayahNum: ayah.numberInSurah,
            wordIndex: midIdx,
            fullAyahText: ayah.text,
            targetWord,
            options
          });
        }
      });
    }

    setHiddenQuizQuestions(questions);
    setHiddenQuizIndex(0);
    setHiddenQuizCompleted(false);
    setHiddenQuizStats({ correct: 0, wrong: 0, stars: 0 });
    setHiddenQuizActive(true);
  };

  const handleAnswerHiddenQuiz = (selectedOption: string) => {
    const currentQ = hiddenQuizQuestions[hiddenQuizIndex];
    if (!currentQ) return;

    const isCorrect = selectedOption === currentQ.targetWord;
    const updatedQ = {
      ...currentQ,
      userAnswer: selectedOption,
      isCorrect
    };

    const updatedQuestions = [...hiddenQuizQuestions];
    updatedQuestions[hiddenQuizIndex] = updatedQ;
    setHiddenQuizQuestions(updatedQuestions);

    const newStats = {
      correct: isCorrect ? hiddenQuizStats.correct + 1 : hiddenQuizStats.correct,
      wrong: !isCorrect ? hiddenQuizStats.wrong + 1 : hiddenQuizStats.wrong,
      stars: isCorrect ? hiddenQuizStats.stars + 5 : hiddenQuizStats.stars
    };
    setHiddenQuizStats(newStats);

    if (!isCorrect) {
      const mistakeEntry = {
        id: `mistake_${Date.now()}`,
        surahName: getCleanSurahName(surahData?.name || ''),
        surahNumber: currentSurah,
        ayahNumber: currentQ.ayahNum,
        text: `الكلمة المخفية في آية ${currentQ.ayahNum}: الكلمة الصحيحة هي "${currentQ.targetWord}"`,
        type: 'اختبار الكلمات المخفية التلقائي',
        date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        userAnswer: `اخترت: "${selectedOption}" (والصحيح: "${currentQ.targetWord}")`
      };
      const updatedMistakes = [mistakeEntry, ...mistakesLog];
      setMistakesLog(updatedMistakes);
      localStorage.setItem('quran_mistakes_log', JSON.stringify(updatedMistakes));
    }

    if (hiddenQuizIndex + 1 < hiddenQuizQuestions.length) {
      setHiddenQuizIndex(hiddenQuizIndex + 1);
    } else {
      setHiddenQuizCompleted(true);
      const earnedStars = newStats.stars;
      const updatedGlobalStats = {
        ...testStats,
        totalTests: testStats.totalTests + 1,
        correct: testStats.correct + newStats.correct,
        wrong: testStats.wrong + newStats.wrong,
        score: testStats.score + earnedStars
      };
      setTestStats(updatedGlobalStats);
      localStorage.setItem('quran_quiz_stats', JSON.stringify(updatedGlobalStats));
    }
  };

  // --- ORDERING QUIZ HELPERS ---
  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('quran_quiz_stats') || '{"correct":0,"wrong":0,"totalTests":0,"score":0}');
    setTestStats(savedStats);

    const savedMistakes = JSON.parse(localStorage.getItem('quran_mistakes_log') || '[]');
    setMistakesLog(savedMistakes);
  }, []);

  const startVerseOrderingTest = () => {
    if (!surahData?.ayahs) return;
    const targetAyahs = surahData.ayahs.filter(
      (a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah
    );
    if (targetAyahs.length === 0) return;

    const shuffled = [...targetAyahs].sort(() => Math.random() - 0.5);
    setShuffledVerses(shuffled);
    setUserVerseOrder([]);
    setVerseTestChecked(false);
    setIsVerseTestCorrect(null);
  };

  const handleSelectVerseForOrdering = (verse: any) => {
    if (userVerseOrder.some(v => v.numberInSurah === verse.numberInSurah)) {
      setUserVerseOrder(userVerseOrder.filter(v => v.numberInSurah !== verse.numberInSurah));
    } else {
      setUserVerseOrder([...userVerseOrder, verse]);
    }
  };

  const checkVerseOrdering = () => {
    if (!surahData?.ayahs) return;
    const correctOrder = surahData.ayahs
      .filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah)
      .sort((a: any, b: any) => a.numberInSurah - b.numberInSurah);

    let isCorrect = userVerseOrder.length === correctOrder.length;
    if (isCorrect) {
      for (let i = 0; i < correctOrder.length; i++) {
        if (userVerseOrder[i].numberInSurah !== correctOrder[i].numberInSurah) {
          isCorrect = false;
          break;
        }
      }
    }

    setVerseTestChecked(true);
    setIsVerseTestCorrect(isCorrect);

    // Update Stats
    const newStats = {
      ...testStats,
      totalTests: testStats.totalTests + 1,
      correct: isCorrect ? testStats.correct + 1 : testStats.correct,
      wrong: !isCorrect ? testStats.wrong + 1 : testStats.wrong,
      score: isCorrect ? testStats.score + 15 : testStats.score,
    };
    setTestStats(newStats);
    localStorage.setItem('quran_quiz_stats', JSON.stringify(newStats));

    // Log Mistake if wrong
    if (!isCorrect) {
      const mistakeEntry = {
        id: `mistake_${Date.now()}`,
        surahName: getCleanSurahName(surahData.name),
        surahNumber: currentSurah,
        ayahNumber: testStartAyah,
        text: `ترتيب الآيات من ${testStartAyah} إلى ${testEndAyah}`,
        type: 'ترتيب الآيات',
        date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        userAnswer: userVerseOrder.map(v => `آية ${v.numberInSurah}`).join(' ← ')
      };
      const updatedMistakes = [mistakeEntry, ...mistakesLog];
      setMistakesLog(updatedMistakes);
      localStorage.setItem('quran_mistakes_log', JSON.stringify(updatedMistakes));
    }
  };

  const startWordOrderingTest = () => {
    if (!surahData?.ayahs) return;
    const ayahObj = surahData.ayahs.find((a: any) => a.numberInSurah === selectedWordAyahNum) || surahData.ayahs[0];
    if (!ayahObj) return;

    const rawWords = ayahObj.text.trim().split(/\s+/);
    const mappedWords = rawWords.map((word: string, index: number) => ({
      id: `${index}_${word}`,
      text: word
    }));

    const shuffled = [...mappedWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setUserWordOrder([]);
    setWordTestChecked(false);
    setIsWordTestCorrect(null);
  };

  const handleSelectWord = (wordObj: { id: string; text: string }) => {
    if (userWordOrder.some(w => w.id === wordObj.id)) {
      setUserWordOrder(userWordOrder.filter(w => w.id !== wordObj.id));
    } else {
      setUserWordOrder([...userWordOrder, wordObj]);
    }
  };

  const checkWordOrdering = () => {
    const ayahObj = surahData?.ayahs?.find((a: any) => a.numberInSurah === selectedWordAyahNum);
    if (!ayahObj) return;

    const originalSentence = ayahObj.text.trim().replace(/\s+/g, ' ');
    const userSentence = userWordOrder.map(w => w.text).join(' ');

    const isCorrect = originalSentence === userSentence;
    setWordTestChecked(true);
    setIsWordTestCorrect(isCorrect);

    // Update Stats
    const newStats = {
      ...testStats,
      totalTests: testStats.totalTests + 1,
      correct: isCorrect ? testStats.correct + 1 : testStats.correct,
      wrong: !isCorrect ? testStats.wrong + 1 : testStats.wrong,
      score: isCorrect ? testStats.score + 10 : testStats.score,
    };
    setTestStats(newStats);
    localStorage.setItem('quran_quiz_stats', JSON.stringify(newStats));

    // Log Mistake if wrong
    if (!isCorrect) {
      const mistakeEntry = {
        id: `mistake_${Date.now()}`,
        surahName: getCleanSurahName(surahData.name),
        surahNumber: currentSurah,
        ayahNumber: selectedWordAyahNum,
        text: ayahObj.text,
        type: 'ترتيب كلمات آية',
        date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        userAnswer: userSentence || 'لم يتم اختيار كافة الكلمات'
      };
      const updatedMistakes = [mistakeEntry, ...mistakesLog];
      setMistakesLog(updatedMistakes);
      localStorage.setItem('quran_mistakes_log', JSON.stringify(updatedMistakes));
    }
  };

  const clearMistakesLog = () => {
    setMistakesLog([]);
    localStorage.removeItem('quran_mistakes_log');
  };

  // --- LIVE VOICE RECITATION & SPEECH LISTENING LOGIC ---
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isMediaRecording, setIsMediaRecording] = useState<boolean>(false);
  const isListeningIntentRef = useRef<boolean>(false);
  const currentTargetAyahRef = useRef<number>(1);
  const spokenWordsConsumedRef = useRef<number>(0);
  const globalTranscriptRef = useRef<string>('');

  const toggleSpeechListening = async (ayahNum: number) => {
    if (isListening || isMediaRecording || isListeningIntentRef.current) {
      stopSpeechListening();
      return;
    }

    setLiveCorrectionAlert(null);
    setIsRecitationHidden(true); // Keep verses hidden by default during recitation for testing/memorization
    setTimeout(() => {
      document.getElementById('surah-verses-view')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    isListeningIntentRef.current = true;
    currentTargetAyahRef.current = ayahNum;
    setVoiceTargetAyahNum(ayahNum);
    setMatchedWordIndices([]);
    setRecitationMatchedMap({});
    setRecitationPassedVerses([]);
    setLiveTranscript('');
    globalTranscriptRef.current = '';
    spokenWordsConsumedRef.current = 0;
    loggedErrorsSetRef.current.clear();

    // 1. Explicitly request microphone stream via getUserMedia to trigger browser permission modal if needed
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
      }
    } catch (micErr: any) {
      console.warn('Microphone permission error:', micErr);
      setLiveCorrectionAlert('⚠️ يرجى السماح بصلاحية الميكروفون من إعدادات المتصفح للبدء بالتسميع الصوتي!');
      setIsListening(false);
      isListeningIntentRef.current = false;
      return;
    }

    startWebSpeechRecognition(stream);
  };

  const startWebSpeechRecognition = (stream: MediaStream | null) => {
    // 2. Try Web Speech API SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      isListeningIntentRef.current = false;
      startMediaRecorderFallback(currentTargetAyahRef.current, stream);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      let finalTranscriptChunk = '';

      recognition.onstart = () => {
        setIsListening(true);
        setLiveCorrectionAlert('🎙️ التسجيل الصوتي المتصل مفعّل بنجاح! اتلُ الآيات تباعاً وبدون توقف...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final.trim()) {
          globalTranscriptRef.current = (globalTranscriptRef.current + ' ' + final).trim();
        }
        const currentFull = (globalTranscriptRef.current + ' ' + interim).trim();
        setLiveTranscript(currentFull);
        evaluateSpokenTranscript(currentFull);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setLiveCorrectionAlert('🎙️ تم تفعيل نظام التسجيل والتسميع المباشر بالميكروفون بنجاح!');
          isListeningIntentRef.current = false;
          startMediaRecorderFallback(currentTargetAyahRef.current, stream);
        } else if (event.error === 'network') {
          setLiveCorrectionAlert('⚠️ خادم التسميع الصوتي مشغول. تم التحويل لنظام التسجيل الصوتي المباشر.');
          isListeningIntentRef.current = false;
          startMediaRecorderFallback(currentTargetAyahRef.current, stream);
        } else if (event.error === 'no-speech') {
          setLiveCorrectionAlert('ℹ️ لم يتم التقاط صوت واضح. استمر بالتلاوة...');
        }
      };

      recognition.onend = () => {
        // Automatically restart if user hasn't explicitly stopped it
        if (isListeningIntentRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            isListeningIntentRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Error starting speech recognition:', e);
      isListeningIntentRef.current = false;
      startMediaRecorderFallback(currentTargetAyahRef.current, stream);
    }
  };

  const startMediaRecorderFallback = (ayahNum: number, existingStream: MediaStream | null) => {
    try {
      const stream = existingStream || micStreamRef.current;
      if (!stream) {
        setLiveCorrectionAlert('⚠️ تعذر تشغيل الميكروفون. يرجى التأكد من السماح بإذن الميكروفون في المتصفح.');
        setIsListening(false);
        isListeningIntentRef.current = false;
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      setIsListening(true);
      setIsMediaRecording(true);
      setVoiceTargetAyahNum(ayahNum);
      setLiveCorrectionAlert('🎙️ الميكروفون يعمل وتسجيل التسميع المتصل مفعّل بنجاح! اقرأ آيات المقطع بصوتك الان.');

      mediaRecorder.start(1000);
    } catch (err) {
      console.error('MediaRecorder fallback error:', err);
      setIsListening(false);
      setIsMediaRecording(false);
      isListeningIntentRef.current = false;
      setLiveCorrectionAlert('⚠️ تعذر بدء التسجيل.');
    }
  };

  const stopSpeechListening = () => {
    isListeningIntentRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      } catch (e) {}
    }
    setIsListening(false);
    setIsMediaRecording(false);
  };

  const evaluateSpokenTranscript = (spokenText: string) => {
    if (!surahData?.ayahs) return;
    const targetAyahs = surahData.ayahs.filter(
      (a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah
    );
    if (targetAyahs.length === 0) return;

    const allSpokenWords = normalizeArabic(spokenText).split(/\s+/).filter(Boolean);
    const isTajweedMode = recitationEvalMode === 'tajweed_strict';
    const allowSkipping = !isTajweedMode;
    const strictness = isTajweedMode ? 0 : 2;
    const maxLookAhead = isTajweedMode ? 1 : 4;

    let spokenIdx = 0;
    const newPassedVerses: number[] = [];
    const newMatchedMap: Record<number, number[]> = {};

    targetAyahs.forEach((ayah: any) => {
      const ayahNum = ayah.numberInSurah;
      const expectedWords = ayah.text.trim().split(/\s+/);
      const normExpected = expectedWords.map((w: string) => normalizeArabic(w));
      const matched: number[] = [];
      let expectedIdx = 0;

      while (spokenIdx < allSpokenWords.length && expectedIdx < normExpected.length) {
        const currentSpoken = allSpokenWords[spokenIdx];
        let bestMatchIdx = -1;
        let bestMatchDist = Infinity;

        for (let lookAhead = 0; lookAhead <= maxLookAhead; lookAhead++) {
          const checkIdx = expectedIdx + lookAhead;
          if (checkIdx >= normExpected.length) break;
          const expectedWord = normExpected[checkIdx];

          if (currentSpoken === expectedWord) {
            bestMatchIdx = checkIdx;
            bestMatchDist = 0;
            break;
          }

          const dist = levenshteinDistance(currentSpoken, expectedWord);
          const threshold = expectedWord.length <= 3 ? 0 : strictness;
          if (dist <= threshold && dist < bestMatchDist) {
            bestMatchIdx = checkIdx;
            bestMatchDist = dist;
          }
        }

        if (bestMatchIdx !== -1) {
          if (bestMatchIdx > expectedIdx) {
            for (let skippedIdx = expectedIdx; skippedIdx < bestMatchIdx; skippedIdx++) {
              logVoiceError(ayahNum, expectedWords[skippedIdx], "[تم تجاوز الكلمة]");
              matched.push(skippedIdx);
            }
          }
          if (bestMatchDist > 0 && recitationEvalMode === 'tajweed_strict') {
            logVoiceError(ayahNum, expectedWords[bestMatchIdx], currentSpoken);
          }
          matched.push(bestMatchIdx);
          expectedIdx = bestMatchIdx + 1;
          spokenIdx++;
        } else {
          spokenIdx++;
        }

        if (matched.length >= normExpected.length) {
          break;
        }
      }

      const uniqueMatched = Array.from(new Set(matched)).sort((a, b) => a - b);
      newMatchedMap[ayahNum] = uniqueMatched;

      if (uniqueMatched.length >= normExpected.length) {
        newPassedVerses.push(ayahNum);
      }
    });

    setRecitationPassedVerses(newPassedVerses);
    setRecitationMatchedMap(newMatchedMap);

    if (newPassedVerses.length === targetAyahs.length) {
      setLiveCorrectionAlert(`🎉 ممتااااز! لقد أتممت تسميع المقطع كاملاً بنجاح مستمر وبدون توقف!`);
      setVoiceTestFinished(true);
      stopSpeechListening();
    } else {
      setLiveCorrectionAlert(`🎙️ جاري الاستماع المستمر... تم إكمال ${newPassedVerses.length} من ${targetAyahs.length} آيات بنجاح.`);
    }
  };

  const logVoiceError = (ayahNum: number, expectedWord: string, spokenWord: string) => {
    const errorKey = `${ayahNum}-${expectedWord}`;
    if (loggedErrorsSetRef.current.has(errorKey)) return;
    loggedErrorsSetRef.current.add(errorKey);

    setVoiceErrorsCount(prev => prev + 1);
    setLiveCorrectionAlert(`⚠️ خطأ في نطق كلمة "${expectedWord}" (آية ${ayahNum})`);

    const errorEntry = {
      ayahNum,
      expectedWord,
      spokenWord,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setVoiceSessionErrors(prev => [errorEntry, ...prev]);

    // Save to global mistakes log
    const mistakeEntry = {
      id: `voice_err_${Date.now()}`,
      surahName: getCleanSurahName(surahData?.name || ''),
      surahNumber: currentSurah,
      ayahNumber: ayahNum,
      text: `خطأ تسميع صوتي في آية ${ayahNum}: الكلمة الصحيحة هي "${expectedWord}"`,
      type: 'تسميع صوتي مباشر',
      date: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      userAnswer: `النطق المسموع: "${spokenWord}"`
    };

    const updatedMistakes = [mistakeEntry, ...mistakesLog];
    setMistakesLog(updatedMistakes);
    localStorage.setItem('quran_mistakes_log', JSON.stringify(updatedMistakes));
  };

  // --- TWO-STAGE OFFICIAL MEMORIZATION EXAM WORKFLOW ---
  const startOfficialExam = () => {
    setExamActive(true);
    setExamStage('stage1_voice');
    setStage1Passed(false);
    setVoiceTestFinished(false);
    setStage1LockNotice(null);
    setStage1RecitationScore(0);
    setStage2QuizScore(0);
    setVoiceSessionErrors([]);
    setVoiceErrorsCount(0);
    setRecitationPassedVerses([]);
    setExamResultData(null);
    
    // Explicitly reset the voice recitation targets back to testStartAyah
    setVoiceTargetAyahNum(testStartAyah);
    currentTargetAyahRef.current = testStartAyah;
    setMatchedWordIndices([]);
  };

  const completeExamStage1Voice = (accuracyPercent?: number) => {
    const rangeAyahs = (surahData?.ayahs || []).filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah);
    const totalAyahsInRange = rangeAyahs.length;
    const passedAyahsInRange = recitationPassedVerses.filter(num => num >= testStartAyah && num <= testEndAyah).length;
    
    const totalWords = rangeAyahs.reduce((acc: number, cur: any) => acc + cur.text.split(/\s+/).length, 0);
    const errorsCount = voiceSessionErrors.length;

    let calculatedAccuracy = 0;
    if (passedAyahsInRange > 0 || matchedWordIndices.length > 0) {
      calculatedAccuracy = Math.max(0, Math.min(100, Math.round(((totalWords - errorsCount) / Math.max(1, totalWords)) * 100)));
    } else if (accuracyPercent !== undefined) {
      calculatedAccuracy = accuracyPercent;
    }

    // Strict condition: User must have recited and passed at least 70% of the selected range OR accuracy >= 70% with at least 1 passed verse
    const isPassed = passedAyahsInRange > 0 && (passedAyahsInRange >= Math.ceil(totalAyahsInRange * 0.7) || calculatedAccuracy >= 70);

    if (!isPassed) {
      setStage1LockNotice(`🔒 لا يمكنك الانتقال للمرحلة الثانية حتى تجتاز المرحلة الأولى! تم تسميع ${passedAyahsInRange} من ${totalAyahsInRange} آية. يرجى تلاوة جميع الآيات بصوتك واجتياز 70% منها على الأقل.`);
      return;
    }

    setStage1Passed(true);
    setStage1LockNotice(null);
    setStage1RecitationScore(calculatedAccuracy);
    setExamStage('stage2_quiz');
    // Prepare Stage 2 Ordering & Fill-in test automatically
    startVerseOrderingTest();
  };

  // Auto-advance to Stage 2 when Stage 1 recitation range is completed
  useEffect(() => {
    if (examActive && examStage === 'stage1_voice') {
      const rangeAyahs = (surahData?.ayahs || []).filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah);
      if (rangeAyahs.length > 0) {
        const passedAyahsInRange = recitationPassedVerses.filter(num => num >= testStartAyah && num <= testEndAyah).length;
        if (passedAyahsInRange >= rangeAyahs.length) {
          stopSpeechListening();
          if (voiceSessionErrors.length > 0) {
            setVoiceTestFinished(true);
            setLiveCorrectionAlert('⚠️ لقد أتممت تسميع المقطع ولكن تم تسجيل بعض الأخطاء. يرجى اختيار الإعادة للتصحيح أو الانتقال للمرحلة التالية.');
          } else {
            completeExamStage1Voice();
          }
        }
      }
    }
  }, [recitationPassedVerses, examActive, examStage, testStartAyah, testEndAyah, voiceSessionErrors]);

  const evaluateExamFinalDecision = (quizAccuracyPercent: number) => {
    setStage2QuizScore(quizAccuracyPercent);
    
    const finalScore = Math.round((stage1RecitationScore * 0.6) + (quizAccuracyPercent * 0.4));
    const totalErrors = voiceSessionErrors.length + (quizAccuracyPercent < 100 ? 1 : 0);
    
    // Strict requirement: Score must be >= 80% to be certified as memorized
    const passed = finalScore >= 80 && totalErrors <= 3;
    const gradeLabel = finalScore >= 95 ? 'ممتاز مرتفع 🏆' : finalScore >= 90 ? 'ممتاز ⭐' : finalScore >= 80 ? 'جيد جداً 👍' : 'غير مجتاز (يحتاج تكرار) ⚠️';

    const detailedErrors = voiceSessionErrors.map(e => ({
      ayahNum: e.ayahNum,
      description: `كلمة "${e.expectedWord}" (النطق المسموع: "${e.spokenWord}")`
    }));

    if (quizAccuracyPercent < 80) {
      detailedErrors.push({
        ayahNum: testStartAyah,
        description: 'أخطاء في اختبار الترتيب والكلمات'
      });
    }

    const result = {
      passed,
      finalScore,
      totalErrors,
      gradeLabel,
      detailedErrors
    };

    setExamResultData(result);
    setExamStage('result');

    if (passed) {
      // Save Surah to Certified Memorized Surahs in LocalStorage
      const isTajweedDistinction = recitationEvalMode === 'tajweed_strict';
      const memorizedList = JSON.parse(localStorage.getItem('quran_memorized_surahs') || '[]');
      const existingIdx = memorizedList.findIndex((item: any) => item.surahNumber === currentSurah);
      const surahEntry = {
        surahNumber: currentSurah,
        surahName: getCleanSurahName(surahData?.name || ''),
        score: finalScore,
        date: new Date().toLocaleDateString('ar-EG'),
        totalAyahs: surahData?.numberOfAyahs || 0,
        accuracy: finalScore,
        grade: gradeLabel,
        hasDistinctionStar: isTajweedDistinction,
        evalMode: recitationEvalMode,
        evalModeLabel: isTajweedDistinction ? 'ترتيل وتجويد متميز 🌟' : 'حفظ وقراءة عادية'
      };

      if (existingIdx >= 0) {
        memorizedList[existingIdx] = surahEntry;
      } else {
        memorizedList.push(surahEntry);
      }
      localStorage.setItem('quran_memorized_surahs', JSON.stringify(memorizedList));

      // Update global memorized ayahs stats
      const stats = JSON.parse(localStorage.getItem('quran_stats') || '{"memorizedAyahs": 0}');
      stats.memorizedAyahs = (stats.memorizedAyahs || 0) + (surahData?.numberOfAyahs || 0);
      localStorage.setItem('quran_stats', JSON.stringify(stats));

      // Update or create active plan matching the tested range or entire surah
      const savedPlans = JSON.parse(localStorage.getItem('quran_memorize_plans') || '{}');
      const planToUpdate = savedPlans[currentSurah] || activePlan || {
        id: '1',
        surah: currentSurah,
        days: 1,
        ayahsPerDay: surahData?.numberOfAyahs || 1,
        completedDays: [],
        startDate: new Date().toISOString()
      };

      if (isTajweedDistinction) {
        planToUpdate.hasDistinctionStar = true;
      }

      const completedDaysSet = new Set<number>(planToUpdate.completedDays || []);
      const totalAyahsInSurah = surahData?.numberOfAyahs || totalAyahs || 1;
      const ayahsPerDay = planToUpdate.ayahsPerDay || Math.ceil(totalAyahsInSurah / (planToUpdate.days || 1));

      // Mark days in plan that fall into the tested range [testStartAyah, testEndAyah]
      for (let d = 0; d < (planToUpdate.days || 1); d++) {
        const dStart = d * ayahsPerDay + 1;
        const dEnd = Math.min((d + 1) * ayahsPerDay, totalAyahsInSurah);
        if (testStartAyah <= dStart && testEndAyah >= dEnd) {
          completedDaysSet.add(d);
        }
      }

      // If full surah was tested
      if (testStartAyah === 1 && testEndAyah === totalAyahsInSurah) {
        for (let d = 0; d < (planToUpdate.days || 1); d++) {
          completedDaysSet.add(d);
        }
      }

      const updatedDaysList = Array.from(completedDaysSet);
      planToUpdate.completedDays = updatedDaysList;
      const progressPercent = Math.round((updatedDaysList.length / (planToUpdate.days || 1)) * 100);
      planToUpdate.progress = Math.min(100, progressPercent);

      // Certify plan if all days completed or full surah passed
      if (updatedDaysList.length >= (planToUpdate.days || 1) || (testStartAyah === 1 && testEndAyah === totalAyahsInSurah)) {
        planToUpdate.progress = 100;
        planToUpdate.isCompleted = true;
        planToUpdate.isCertified = true;
      }

      savedPlans[currentSurah] = planToUpdate;
      localStorage.setItem('quran_memorize_plans', JSON.stringify(savedPlans));
      setActivePlan(planToUpdate);
    }
  };

  const calculateProficiencyLevel = () => {
    if (testStats.totalTests === 0) return { label: 'لم تبدأ الاختبارات بعد', color: 'text-gray-500', bg: 'bg-gray-100' };
    const accuracy = Math.round((testStats.correct / testStats.totalTests) * 100);
    if (accuracy >= 90) return { label: 'حافظ متقن ممتاز 🌟 (90%+)', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (accuracy >= 75) return { label: 'مستوى جيد جداً 👍 (75%-89%)', color: 'text-blue-700', bg: 'bg-blue-100' };
    if (accuracy >= 50) return { label: 'مستوى متوسط - يحتاج مراجعة 📚 (50%-74%)', color: 'text-amber-700', bg: 'bg-amber-100' };
    return { label: 'مستوى مبتدئ - ينصح بالتكرار 💡 (أقل من 50%)', color: 'text-red-700', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw size={32} className="animate-spin text-[var(--color-primary)] mb-3" />
        <p className="text-gray-500 font-medium">جاري تحميل بيانات السورة للحفظ...</p>
      </div>
    );
  }

  const surahName = getCleanSurahName(surahData?.name || '');
  const totalAyahs = surahData?.numberOfAyahs || 1;

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full h-full pb-28 space-y-5">
      {/* Integrated Header Card with Navigation */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-[var(--color-primary-dark)] to-teal-950 p-4 sm:p-5 text-white shadow-lg border border-emerald-700/40 relative overflow-hidden space-y-4">
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-black tracking-wide bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-600/50">
                منظومة الحفظ الذاتي والتثبيت
              </span>
              <span className="text-[9px] font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">
                ملاءمة للأطفال والكبار 🌟
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Brain className="text-[var(--color-gold-light)] shrink-0" size={22} />
              مركز الحفظ والتثبيت الذكي
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium">
              أدوات تفاعلية متكاملة لحفظ وتكرار سورة <span className="font-bold text-[var(--color-gold-light)] px-0.5">{surahName}</span> ({totalAyahs} آية مباركة).
            </p>
          </div>

          <button
            onClick={() => setCurrentView('reader')}
            className="shrink-0 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <BookOpen size={14} className="text-[var(--color-gold-light)]" />
            <span>العودة للمصحف</span>
          </button>
        </div>

        {/* Integrated Navigation Cards inside the Main Header Card */}
        <div className="relative z-10 pt-3 border-t border-emerald-700/40">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => { setActiveTab('plans'); stopRepetition(); }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer text-center ${
                activeTab === 'plans'
                  ? 'bg-white text-emerald-950 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 bg-black/20 border border-white/10'
              }`}
            >
              <Calendar size={16} className={activeTab === 'plans' ? 'text-emerald-700 shrink-0' : 'text-amber-300 shrink-0'} />
              <span>خطط الحفظ البرمجية</span>
            </button>

            <button
              onClick={() => { setActiveTab('repetition'); stopRepetition(); }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer text-center ${
                activeTab === 'repetition'
                  ? 'bg-white text-emerald-950 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 bg-black/20 border border-white/10'
              }`}
            >
              <Repeat size={16} className={activeTab === 'repetition' ? 'text-amber-600 shrink-0' : 'text-amber-300 shrink-0'} />
              <span>استوديو التكرار التفاعلي</span>
            </button>

            <button
              onClick={() => { setActiveTab('memory_test'); stopRepetition(); }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer text-center sm:col-span-1 ${
                activeTab === 'memory_test'
                  ? 'bg-white text-emerald-950 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 bg-black/20 border border-white/10'
              }`}
            >
              <Brain size={16} className={activeTab === 'memory_test' ? 'text-indigo-600 shrink-0' : 'text-amber-300 shrink-0'} />
              <span>اختبار الحفظ 🏆</span>
            </button>

            <button
              onClick={() => { setActiveTab('kids_game'); stopRepetition(); }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer text-center sm:col-span-3 lg:col-span-1 lg:col-start-auto col-span-1 ${
                activeTab === 'kids_game'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md ring-2 ring-purple-400 scale-[1.01]'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 bg-black/20 border border-white/10'
              }`}
            >
              <Gamepad2 size={16} className={activeTab === 'kids_game' ? 'text-white shrink-0' : 'text-purple-300 shrink-0'} />
              <span>ألعاب الأبطال 🎈</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MEMORIZATION PLANS */}
      {activeTab === 'plans' && (
        <AnimatePresence mode="wait">
          {!activePlan ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="no-plan" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Calendar className="text-emerald-600" size={18} />
                    اختر خطة مخصصة لسورة {surahName}:
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">اختر الخطة الزمانية التي تناسب وقتك وطاقتك اليومية.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const currentDays = plan.id === 'custom_input' ? Math.max(1, customPlanDays) : plan.days;
                  const dailyAyahs = Math.ceil(totalAyahs / currentDays);

                  return (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div
                            className={`p-1.5 rounded-md transition-colors ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Calendar size={16} />
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="text-emerald-600" size={18} />
                          ) : (
                            <Circle className="text-slate-300" size={18} />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${
                            plan.id === 'custom_1' || plan.id === 'custom_2'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : plan.id === '1'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : plan.id === '2'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : plan.id === '3'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-teal-100 text-teal-800 border-teal-200'
                          }`}>
                            {currentDays} {currentDays === 1 ? 'يوم' : currentDays === 2 ? 'يومين' : 'أيام'} • ~{dailyAyahs} آية/يوم
                          </span>
                          <h4 className="font-black text-slate-900 text-xs">{plan.title}</h4>
                        </div>

                        <p className="text-[10px] text-slate-600 leading-snug font-medium">{plan.description}</p>

                        {/* Interactive Days Input for Custom Plan */}
                        {plan.id === 'custom_input' && isSelected && (
                          <div className="mt-2 pt-1.5 border-t border-emerald-200/80 space-y-1" onClick={(e) => e.stopPropagation()}>
                            <label className="block text-[9px] font-black text-emerald-900">اختر عدد الأيام المطلوب:</label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCustomPlanDays((prev) => Math.max(1, prev - 1))}
                                className="w-7 h-7 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all cursor-pointer shadow-2xs"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={customPlanDays}
                                onChange={(e) => setCustomPlanDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-16 p-1 bg-white border border-emerald-400 rounded-md text-center font-black text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomPlanDays((prev) => prev + 1)}
                                className="w-7 h-7 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all cursor-pointer shadow-2xs"
                              >
                                +
                              </button>
                              <span className="text-xs font-bold text-slate-700">أيام</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-bold text-slate-500">
                        <span>المدة: {currentDays} {currentDays === 1 ? 'يوم' : currentDays === 2 ? 'يومين' : 'أيام'}</span>
                        <span className="text-emerald-700">معدل: ~{dailyAyahs} آيات</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan.id);
                          setPopupModalCard({
                            isOpen: true,
                            title: `تفاصيل خطة: ${plan.title}`,
                            subtitle: `سورة ${surahName} (${totalAyahs} آية مباركة) - المدة المقترحة: ${currentDays} يوم`,
                            content: (
                              <div className="space-y-4 text-right">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                                  <h4 className="font-black text-sm text-emerald-900">وصف الخطة البرمجية للحفظ:</h4>
                                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">{plan.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs font-black">
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <span className="text-gray-500 block text-[10px]">عدد الأيام الإجمالي:</span>
                                    <span className="text-gray-900 text-sm">{currentDays} يوم</span>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <span className="text-gray-500 block text-[10px]">معدل الحفظ اليومي:</span>
                                    <span className="text-emerald-700 text-sm">~{dailyAyahs} آيات يومياً</span>
                                  </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold">
                                  🌟 نصيحة للتثبيت الاحترافي: قم بقراءة الآيات بتريد، ثم تكرارها عبر استوديو التكرار الصوتي، ثم خوض اختبار الحفظ الرسمي لتوثيق السورة باللون الأخضر.
                                </div>
                              </div>
                            ),
                          });
                        }}
                        className="mt-2 w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Search size={12} className="text-emerald-700" />
                        <span>عرض في بطاقة منبثقة 🔍</span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 border border-emerald-600/30 shadow-sm text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto shadow-2xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">جاهز لبدء رحلة الحفظ؟</h3>
                    <p className="text-slate-600 mt-0.5 max-w-md mx-auto text-xs font-medium leading-relaxed">
                      سيتم تقسيم سورة <span className="font-bold text-emerald-800">{surahName}</span> ({totalAyahs} آية) على{' '}
                      <span className="font-black text-emerald-700 text-xs">
                        {selectedPlan === 'custom_input' ? customPlanDays : (plans.find((p) => p.id === selectedPlan)?.days || 1)}
                      </span>{' '}
                      {selectedPlan === 'custom_input' && customPlanDays === 1 ? 'يوم' : selectedPlan === 'custom_input' && customPlanDays === 2 ? 'يومين' : 'أيام'}{' '}
                      بحيث تحفظ حوالي{' '}
                      <span className="font-black text-emerald-700 text-xs">
                        {Math.ceil(totalAyahs / (selectedPlan === 'custom_input' ? Math.max(1, customPlanDays) : (plans.find((p) => p.id === selectedPlan)?.days || 1)))}
                      </span>{' '}
                      آيات يومياً بشكل متناسق.
                    </p>
                  </div>

                  <button
                    onClick={startPlan}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-7 py-2.5 rounded-xl font-black text-xs hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    اعتماد الخطة والبدء الآن 🚀
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="active-plan" className="space-y-4">
              {/* STATUS BANNER BASED ON CERTIFICATION */}
              {!activePlan.isCertified ? (
                <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/5 border-2 border-red-400/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-right shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <AlertTriangle size={22} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black bg-red-600 text-white px-3 py-0.5 rounded-full border border-red-700 shadow-2xs">
                          🔴 خطة حمراء (غير مجتازة للاختبار)
                        </span>
                        <span className="text-xs font-bold text-red-800">
                          نسبة الإنجاز اليومي: {activePlan.progress}%
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-slate-900">
                        لا يتم احتساب الحفظ ولا تحويل الخطة للون الأخضر إلا بعد اجتياز الاختبار!
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        تظهر خطة سورة <span className="font-bold text-red-900">{surahName}</span> باللون الأحمر حتى تقرر اختبار نفسك. يجب اجتياز الاختبار الشامل من مرحلتين (تسميع صوتي مقتطع + ترتيب الآيات) للتحول للون الأخضر المعتمد رسمياً 🏆.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('memory_test');
                      setTestSubTab('voice_recitation');
                      startOfficialExam();
                    }}
                    className="shrink-0 w-full md:w-auto px-5 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Trophy size={18} />
                    <span>خوض اختبار التسميع والترتيب لفك اللون الأخضر 🎙️</span>
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-emerald-600/5 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-right shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Award size={22} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black bg-emerald-600 text-white px-3 py-0.5 rounded-full border border-emerald-700 shadow-2xs">
                          🟢 خطة خضراء معتمدة ومحفوظة (100%)
                        </span>
                        <span className="text-xs font-bold text-emerald-800">
                          موثقة رسمياً في سجلك
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-slate-900">
                        مبارك! تم اجتياز الاختبار الشامل واجتياز سورة {surahName} بنجاح 🏆
                      </h4>
                      <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                        تكللت جهودك في حفظ وتسميع السورة بالنجاح. تم تحويل الخطة للون الأخضر المحفوظ وتوثيق السورة في قسم السور المعتمدة.
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs">
                    مكتملة ومحفوظة 🌟
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Sidebar with Stats */}
                <div className="md:col-span-4 space-y-4">
                  <div className={`rounded-2xl p-5 border shadow-2xs space-y-5 transition-all ${
                    activePlan.isCertified
                      ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-amber-50/30 border-emerald-300'
                      : 'bg-gradient-to-br from-red-50/80 via-amber-50/30 to-white border-red-200'
                  }`}>
                    <div className="flex flex-col gap-3 pb-3 border-b border-slate-200/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                            activePlan.isCertified
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}>
                            {activePlan.isCertified ? '🟢 معتمدة بالكامل' : '🔴 بانتظار الاختبار الصوتي'}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">
                            {activePlan.completedDays.length} من {activePlan.days} أيام
                          </span>
                        </div>
                        <h3 className="font-black text-lg text-slate-900 leading-tight">
                          خطة حفظ سورة {surahName}
                        </h3>
                      </div>
                      <button 
                        onClick={deletePlan} 
                        className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer w-full text-center"
                      >
                        إلغاء الخطة
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-black text-slate-700">
                        <span>نسبة التقدّم</span>
                        <span className={activePlan.isCertified ? 'text-emerald-700' : 'text-red-700'}>
                          {activePlan.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-700 shadow-2xs ${
                            activePlan.isCertified
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                              : 'bg-gradient-to-r from-red-500 to-amber-500'
                          }`}
                          style={{ width: `${activePlan.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content with Days Grid */}
                <div className="md:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                  {/* Days Grid */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <CheckCircle2 size={18} className={activePlan.isCertified ? 'text-emerald-600' : 'text-amber-600'} />
                      جدول الأيام والمهمات اليومية:
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                      {Array.from({ length: activePlan.days }).map((_, i) => {
                        const isCompleted = activePlan.completedDays.includes(i);
                        const isNext = !isCompleted && (i === 0 || activePlan.completedDays.includes(i - 1));
                        const startAyah = i * activePlan.ayahsPerDay + 1;
                        const endAyah = Math.min((i + 1) * activePlan.ayahsPerDay, totalAyahs);

                        if (startAyah > totalAyahs) return null;

                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border transition-all ${
                              isCompleted
                                ? activePlan.isCertified
                                  ? 'bg-emerald-50/90 border-emerald-200'
                                  : 'bg-amber-50/90 border-amber-200'
                                : isNext
                                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20'
                                : 'bg-slate-50 border-slate-200/60 opacity-60'
                            } flex flex-col items-center text-center justify-between gap-1.5`}
                          >
                            <div className="space-y-0.5">
                              <span
                                className={`text-xs font-black block ${
                                  isCompleted
                                    ? activePlan.isCertified
                                      ? 'text-emerald-800'
                                      : 'text-amber-800'
                                    : isNext
                                    ? 'text-amber-900'
                                    : 'text-slate-500'
                                }`}
                              >
                                اليوم {i + 1}
                              </span>
                              <span className="text-[10px] text-slate-600 font-bold block">
                                الآيات {startAyah} - {endAyah}
                              </span>
                            </div>

                            {isCompleted ? (
                              <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center shadow-2xs ${
                                activePlan.isCertified ? 'bg-emerald-600' : 'bg-amber-600'
                              }`}>
                                <Check size={14} />
                              </div>
                            ) : isNext ? (
                              <button
                                onClick={() => markDayCompleted(i)}
                                className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer active:scale-90"
                                title="تحديد اليوم كمكتمل"
                              >
                                <Play size={13} className="ml-0.5" />
                              </button>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                                <Circle size={14} className="text-slate-400" />
                              </div>
                            )}

                            {/* Direct Test Button for This Day */}
                            <button
                              onClick={() => {
                                setTestStartAyah(startAyah);
                                setTestEndAyah(endAyah);
                                setActiveTab('memory_test');
                                setTestSubTab('voice_recitation');
                                startOfficialExam();
                              }}
                              className={`w-full mt-1.5 py-1 px-2 rounded-lg text-[10px] font-black transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                                isCompleted
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                              }`}
                              title={`اختبار آيات اليوم ${i + 1} (${startAyah} - ${endAyah})`}
                            >
                              <Mic size={11} />
                              <span>{isCompleted ? 'إعادة اختبار اليوم 🎙️' : 'اختبار مقطع اليوم 🎙️'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* TAB 2: REPETITION STUDIO */}
      {activeTab === 'repetition' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          
          {/* Settings Column */}
          <div className="md:col-span-5 space-y-4 md:sticky md:top-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                    <Repeat className="text-amber-600 shrink-0" size={18} />
                    إعدادات تكرار المقطع والآيات
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">حدد المقطع وعدد التكرارات لترسيخ الآيات في الذهن بسهولة.</p>
                </div>
                <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 self-start">
                  تقنية الحفظ السمعي بالتكرار
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Range Selector */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">من الآية:</label>
                  <select
                    value={repStartAyah}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setRepStartAyah(val);
                      if (val > repEndAyah) setRepEndAyah(val);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-black text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {Array.from({ length: totalAyahs }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        آية {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">إلى الآية:</label>
                  <select
                    value={repEndAyah}
                    onChange={(e) => setRepEndAyah(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-black text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {Array.from({ length: totalAyahs - repStartAyah + 1 }).map((_, i) => {
                      const ayahNum = repStartAyah + i;
                      return (
                        <option key={ayahNum} value={ayahNum}>
                          آية {ayahNum}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Verse Repeats */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">تكرار كل آية:</label>
                  <select
                    value={verseRepeats}
                    onChange={(e) => setVerseRepeats(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-black text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={1}>مرة واحدة (1x)</option>
                    <option value={2}>مرتان (2x)</option>
                    <option value={3}>3 مرات (3x)</option>
                    <option value={5}>5 مرات (5x)</option>
                    <option value={10}>10 مرات (10x)</option>
                  </select>
                </div>

                {/* Passage Repeats */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">تكرار المقطع:</label>
                  <select
                    value={passageRepeats}
                    onChange={(e) => setPassageRepeats(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-black text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={1}>مرة واحدة (1x)</option>
                    <option value={2}>مرتان (2x)</option>
                    <option value={3}>3 مرات (3x)</option>
                    <option value={5}>5 مرات (5x)</option>
                  </select>
                </div>
              </div>

              {/* Delay pause option */}
              <div className="flex flex-col bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                  <Volume2 size={16} className="text-amber-600 shrink-0" />
                  <span>فترة صمت بين الآيات:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[0, 2, 4, 6].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setPauseSeconds(sec)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center ${
                        pauseSeconds === sec
                          ? 'bg-amber-600 text-white shadow-2xs scale-105'
                          : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/50'
                      }`}
                    >
                      {sec === 0 ? 'بدون' : `${sec}ث`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Controls & Status */}
              <div className="flex flex-col gap-3 bg-gradient-to-r from-emerald-950 via-[var(--color-primary-dark)] to-teal-950 p-4 rounded-2xl text-white shadow-sm border border-emerald-700/40">
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    onClick={playRepetition}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                      isPlayingRepetition
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isPlayingRepetition ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isPlayingRepetition ? 'إيقاف التكرار' : 'تشغيل التكرار الآن 🎧'}</span>
                  </button>

                  {isPlayingRepetition && (
                    <button
                      onClick={stopRepetition}
                      className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-red-600 transition-colors cursor-pointer shrink-0"
                      title="إنهاء التكرار"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>

                {/* Status info */}
                {isPlayingRepetition ? (
                  <div className="text-center text-xs font-bold text-emerald-100 space-y-0.5 bg-black/20 p-2 rounded-xl">
                    <p className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      <span>الآية الحالية: <strong className="text-white">{currentRepAyah}</strong></span>
                    </p>
                    <p className="text-emerald-200/80 text-[10px]">
                      تكرار الآية: {currentVerseRepeatCount}/{verseRepeats} | المقطع: {currentPassageRepeatCount}/{passageRepeats}
                    </p>
                    {isPausedBetweenVerses && (
                      <p className="text-amber-300 font-extrabold text-[10px] animate-pulse">فترة ترديد صامتة...</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-100/90 font-medium text-center bg-black/20 p-2 rounded-xl">
                    المقطع: <strong className="text-[var(--color-gold-light)] font-bold">الآيات {repStartAyah}-{repEndAyah}</strong> ({repEndAyah - repStartAyah + 1} آية)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Verses Preview List */}
          <div className="md:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <BookOpen size={15} className="text-emerald-600" />
                نص آيات المقطع المحدد للتكرار (عرض المصحف المرقم):
              </h4>
              {isPlayingRepetition && (
                <span className="text-[11px] text-amber-900 font-black flex items-center gap-1 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  <Sparkles size={13} className="text-amber-600 animate-pulse" /> يتلى الآن آية {currentRepAyah}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6 rounded-3xl bg-[#fdfaf6] border-2 border-[#e8dfce] shadow-inner font-quran text-right text-xl sm:text-2xl leading-loose sm:leading-[2.5] text-gray-900" dir="rtl" style={{ wordSpacing: '4px' }}>
              {surahData?.ayahs
                ?.filter((a: any) => a.numberInSurah >= repStartAyah && a.numberInSurah <= repEndAyah)
                ?.map((ayah: any) => {
                  const isCurrent = isPlayingRepetition && currentRepAyah === ayah.numberInSurah;
                  const words = ayah.text.trim().split(/\s+/);
                  return (
                    <span key={ayah.numberInSurah} className={`inline ${isCurrent ? 'bg-amber-100/90 px-2 py-1 rounded-xl border border-amber-300 shadow-2xs' : ''}`}>
                      {words.map((word: string, wIdx: number) => (
                        <span key={wIdx} className="inline-block mx-0.5 sm:mx-1">
                          {word}
                        </span>
                      ))}
                      
                      {/* Ayah End Marker */}
                      <span className="inline-flex items-center justify-center w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] mx-1 sm:mx-1.5 text-xs sm:text-sm rounded-full font-sans font-bold bg-[#f0e6d2] text-[#8c6b32] border-2 border-[#d6c5a3] relative -top-1 align-middle">
                        <span className="relative z-10">{ayah.numberInSurah}</span>
                        <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="4 2"/>
                          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1"/>
                        </svg>
                      </span>
                    </span>
                  );
                })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: HIDE WORDS & MEMORY TEST */}
      {activeTab === 'memory_test' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          
          {/* Top Section: Motivational Header & Navigation in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Kids Motivational Card */}
            <div className="md:col-span-7 lg:col-span-8 bg-gradient-to-r from-emerald-950 via-[var(--color-primary-dark)] to-teal-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-emerald-700/40 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-right">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block">
                    🏆 تحدي الأبطال واختبارات الحفظ
                  </span>
                  <h3 className="text-base sm:text-lg font-black flex items-center justify-center sm:justify-start gap-1.5 leading-snug">
                    <Brain className="text-[var(--color-gold-light)] shrink-0" size={20} />
                    اختبر حفظك واجمع النجوم الذهبية! 🌟
                  </h3>
                  <p className="text-[10px] sm:text-xs text-emerald-100/90 font-medium leading-relaxed max-w-md">
                    رتب الكلمات والآيات، أخفِ الكلمات لتسميع غيبي متقن، وتابع مستواك خطوة بخطوة.
                  </p>
                </div>

                {/* Star Counter & Level */}
                <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-2xs shrink-0">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-300 font-black text-xl">
                      <Star fill="currentColor" size={20} className="text-amber-300" />
                      <span>{testStats.score}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-emerald-100 font-bold block mt-0.5">النجوم المكتسبة</span>
                  </div>
                  <div className="w-[1px] h-10 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-black text-white">{testStats.correct} صح / {testStats.wrong} خطأ</div>
                    <span className="text-[9px] sm:text-[10px] text-emerald-100 font-bold block mt-1">إجمالي: {testStats.totalTests} اختبارات</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-center rounded-2xl bg-white p-2 gap-2 border border-slate-200/80 shadow-xs h-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-1.5 h-full">
                <button
                  onClick={() => setTestSubTab('voice_recitation')}
                  className={`flex flex-col items-center justify-center text-center p-2 rounded-xl text-[10px] sm:text-xs font-black transition-all gap-1.5 cursor-pointer ${
                    testSubTab === 'voice_recitation'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Mic size={18} className={testSubTab === 'voice_recitation' ? 'text-white' : 'text-emerald-600'} />
                  <span>التسميع الصوتي</span>
                </button>
                <button
                  onClick={() => setTestSubTab('hide_words')}
                  className={`flex flex-col items-center justify-center text-center p-2 rounded-xl text-[10px] sm:text-xs font-black transition-all gap-1.5 cursor-pointer ${
                    testSubTab === 'hide_words'
                      ? 'bg-emerald-50 text-[var(--color-primary-dark)] shadow-sm border border-emerald-200/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <EyeOff size={18} className={testSubTab === 'hide_words' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>تخفي الكلمات</span>
                </button>
                <button
                  onClick={() => {
                    setTestSubTab('ordering');
                    startVerseOrderingTest();
                  }}
                  className={`flex flex-col items-center justify-center text-center p-2 rounded-xl text-[10px] sm:text-xs font-black transition-all gap-1.5 cursor-pointer ${
                    testSubTab === 'ordering'
                      ? 'bg-amber-50 text-amber-900 shadow-sm border border-amber-200/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <ListOrdered size={18} className={testSubTab === 'ordering' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>ترتيب الآيات</span>
                </button>
                <button
                  onClick={() => setTestSubTab('mistakes')}
                  className={`flex flex-col items-center justify-center text-center p-2 rounded-xl text-[10px] sm:text-xs font-black transition-all gap-1.5 cursor-pointer ${
                    testSubTab === 'mistakes'
                      ? 'bg-indigo-50 text-indigo-900 shadow-sm border border-indigo-200/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <History size={18} className={testSubTab === 'mistakes' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>سجل الأخطاء</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Test Area */}
          <div>

          {/* SUB-TAB 0: LIVE VOICE RECITATION & OFFICIAL EXAM */}
          {testSubTab === 'voice_recitation' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              
              {/* TWO-STAGE OFFICIAL EXAM MODAL / ACTIVE VIEW */}
              {examActive && (
                <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-amber-400 shadow-md space-y-3 text-right relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-3xs">
                        <Award size={13} className="text-amber-600 shrink-0" />
                        اختبار الحفظ الرسمي: {getCleanSurahName(surahData?.name || '')}
                      </span>
                    </div>

                    <button
                      onClick={() => setExamActive(false)}
                      className="px-2 py-0.5 rounded bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 font-bold text-[10px] sm:text-xs flex items-center gap-0.5 transition-all cursor-pointer border border-gray-200"
                    >
                      <XCircle size={12} /> خروج
                    </button>
                  </div>

                  {/* Exam Stages Progress */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setExamStage('stage1_voice')}
                      className={`p-1.5 rounded-lg border flex items-center justify-between text-right cursor-pointer transition-all ${
                        examStage === 'stage1_voice'
                          ? 'bg-amber-50 border-amber-400 font-bold text-amber-900 ring-1 ring-amber-300 shadow-3xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Mic size={13} className={examStage === 'stage1_voice' ? 'text-amber-600 shrink-0' : 'text-gray-400 shrink-0'} />
                        <span className="text-[10px] sm:text-[11px] font-black">المرحلة 1: التسميع</span>
                      </div>
                      <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border font-bold shrink-0">60%</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!stage1Passed) {
                          setStage1LockNotice('🔒 لا يمكنك الانتقال للمرحلة الثانية مباشرة! يجب إكمال التسميع الصوتي واجتياز المرحلة الأولى بنجاح أولاً.');
                        } else {
                          setExamStage('stage2_quiz');
                        }
                      }}
                      className={`p-1.5 rounded-lg border flex items-center justify-between text-right transition-all ${
                        examStage === 'stage2_quiz'
                          ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950 ring-1 ring-emerald-300 shadow-3xs'
                          : stage1Passed
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                          : 'bg-gray-100 border-gray-200 text-gray-400 opacity-85 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {stage1Passed ? <ListOrdered size={13} className="text-emerald-600 shrink-0" /> : <Lock size={13} className="text-amber-600 shrink-0" />}
                        <span className="text-[10px] sm:text-[11px] font-black">
                          المرحلة 2: الترتيب {stage1Passed ? '✔️' : '🔒'}
                        </span>
                      </div>
                      <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border font-bold shrink-0">40%</span>
                    </button>
                  </div>

                  {/* STAGE 1: VOICE RECITATION EXAM */}
                  {examStage === 'stage1_voice' && (
                    <div className="space-y-2.5 bg-amber-50/20 p-3 rounded-lg border border-amber-200/80">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-xs text-amber-950 flex items-center gap-1">
                          <Mic className="text-amber-600 shrink-0" size={14} />
                          المرحلة 1: تسميع آيات السورة بصوتك
                        </h4>
                        <p className="text-[10px] text-amber-800 font-medium">
                          اقرأ الآيات بصوت واضح عبر الميكروفون للتقييم الفوري ورصد الأخطاء بدقّة.
                        </p>
                      </div>

                      {/* Lock Warning Notice if attempted advance prematurely */}
                      {stage1LockNotice && (
                        <div className="p-2 bg-red-50 text-red-950 font-medium border border-red-200 rounded-lg text-[10px] flex items-center gap-1.5 shadow-3xs">
                          <AlertTriangle size={14} className="text-red-600 shrink-0" />
                          <span>{stage1LockNotice}</span>
                        </div>
                      )}

                      {/* Recitation Evaluation Mode Selector */}
                      <div className="p-2 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/50 rounded-lg space-y-1.5">
                        <label className="text-[10px] font-black text-amber-950 flex items-center gap-1">
                          <Star size={11} className="text-amber-500 fill-amber-400 shrink-0" />
                          نمط التسميع والتقييم:
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRecitationEvalMode('tajweed_strict')}
                            className={`p-1.5 rounded border text-right transition-all cursor-pointer flex flex-col justify-center gap-0.5 active:scale-98 ${
                              recitationEvalMode === 'tajweed_strict'
                                ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-3xs'
                                : 'bg-white text-gray-800 border-gray-200 hover:bg-amber-50/50 shadow-3xs'
                            }`}
                          >
                            <span className="text-[10px] font-black flex items-center gap-1">
                              <Sparkles size={11} className={recitationEvalMode === 'tajweed_strict' ? 'text-amber-200' : 'text-amber-600'} />
                              ترتيل وتجويد دقيق (⭐ نجمة تميز)
                            </span>
                            <span className={`text-[9px] leading-tight ${recitationEvalMode === 'tajweed_strict' ? 'text-amber-100' : 'text-gray-450'}`}>
                              الترتيل ومخارج الحروف والتشكيل (يمنح ⭐ نجمة التميز).
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecitationEvalMode('standard_normal')}
                            className={`p-1.5 rounded border text-right transition-all cursor-pointer flex flex-col justify-center gap-0.5 active:scale-98 ${
                              recitationEvalMode === 'standard_normal'
                                ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-3xs'
                                : 'bg-white text-gray-800 border-gray-200 hover:bg-emerald-50/50 shadow-3xs'
                            }`}
                          >
                            <span className="text-[10px] font-black flex items-center gap-1">
                              <BookOpen size={11} className={recitationEvalMode === 'standard_normal' ? 'text-emerald-200' : 'text-emerald-600'} />
                              قراءة عادية (تسميع عادي ✔️)
                            </span>
                            <span className={`text-[9px] leading-tight ${recitationEvalMode === 'standard_normal' ? 'text-emerald-100' : 'text-gray-450'}`}>
                              التركيز على نطق كلمات السورة الأساسية بدون نجمة.
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Range Controls */}
                      <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-amber-200/60">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5">من الآية:</label>
                          <select
                            value={testStartAyah}
                            onChange={(e) => setTestStartAyah(parseInt(e.target.value, 10))}
                            className="w-full p-1 rounded border border-gray-200 text-[11px] font-bold bg-white"
                          >
                            {Array.from({ length: totalAyahs }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>آية {i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5">إلى الآية:</label>
                          <select
                            value={testEndAyah}
                            onChange={(e) => setTestEndAyah(parseInt(e.target.value, 10))}
                            className="w-full p-1 rounded border border-gray-200 text-[11px] font-bold bg-white"
                          >
                            {Array.from({ length: totalAyahs - testStartAyah + 1 }).map((_, i) => {
                              const ayahNum = testStartAyah + i;
                              return <option key={ayahNum} value={ayahNum}>آية {ayahNum}</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Plan Partition Quick Selectors */}
                      {activePlan && (
                        <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-lg space-y-1 text-right">
                          <div className="flex items-center justify-between text-[10px] font-black text-emerald-950">
                            <span className="flex items-center gap-1">
                              <Sparkles size={11} className="text-emerald-600 shrink-0" />
                              تقسيم الاختبار حسب خطة الحفظ ({activePlan.days} أيام):
                            </span>
                            <span className="text-[9px] bg-emerald-200 px-1.5 py-0.2 rounded font-bold text-emerald-900">
                              ~{activePlan.ayahsPerDay} آية/يوم
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: activePlan.days }).map((_, i) => {
                              const start = i * activePlan.ayahsPerDay + 1;
                              const end = Math.min((i + 1) * activePlan.ayahsPerDay, totalAyahs);
                              if (start > totalAyahs) return null;
                              const isSelected = testStartAyah === start && testEndAyah === end;
                              const isDayDone = activePlan.completedDays?.includes(i);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setTestStartAyah(start);
                                    setTestEndAyah(end);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-3xs ring-1 ring-emerald-400'
                                      : isDayDone
                                      ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-200'
                                      : 'bg-white text-gray-800 hover:bg-emerald-50 border border-gray-200'
                                  }`}
                                >
                                  <span>يوم {i + 1} ({start}-{end})</span>
                                  {isDayDone && <CheckCircle2 size={10} className="text-emerald-600" />}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => {
                                setTestStartAyah(1);
                                setTestEndAyah(totalAyahs);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                testStartAyah === 1 && testEndAyah === totalAyahs
                                  ? 'bg-amber-600 text-white shadow-3xs ring-1 ring-amber-400'
                                  : 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-200'
                              }`}
                            >
                              <span>السورة كاملة (1-{totalAyahs})</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Listening Button */}
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-amber-200/60 text-center space-y-2">
                        <button
                          onClick={() => toggleSpeechListening(testStartAyah)}
                          className={`px-4 py-1.5 rounded-lg font-black text-[11px] text-white transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                          <span>{isListening ? 'إيقاف الاستماع الصوتي 🛑' : 'ابدأ التسميع بصوتك الآن 🎙️'}</span>
                        </button>

                        {/* Live Status / Permission Alert Banner */}
                        {liveCorrectionAlert && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-2 rounded border text-[10px] font-bold w-full max-w-sm shadow-3xs ${
                              liveCorrectionAlert.includes('ممتااااز') || liveCorrectionAlert.includes('بنجاح')
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                : liveCorrectionAlert.includes('يرجى') || liveCorrectionAlert.includes('تنبيه') || liveCorrectionAlert.includes('خاطئ')
                                ? 'bg-amber-50 border-amber-300 text-amber-950'
                                : 'bg-blue-50 border-blue-200 text-blue-950'
                            }`}
                          >
                            {liveCorrectionAlert}
                          </motion.div>
                        )}

                        {isListening && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 animate-pulse">
                            <Activity size={13} className="text-emerald-600 shrink-0" />
                            <span>🎙️ جاري الاستماع المستمر لتلاوتك... اتلُ الآيات تباعاً</span>
                          </div>
                        )}
                      </div>

                      {/* Live Errors Summary */}
                      {voiceSessionErrors.length > 0 && (
                        <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 space-y-1">
                          <h5 className="font-bold text-[10px] text-red-900 flex items-center gap-1">
                            <AlertTriangle size={13} className="text-red-600 shrink-0" /> الأخطاء المرصودة ({voiceSessionErrors.length}):
                          </h5>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {voiceSessionErrors.map((err, idx) => (
                              <div key={idx} className="text-[10px] text-red-800 bg-white p-1.5 rounded border border-red-100 flex items-center justify-between">
                                <span>آية {err.ayahNum}: "{err.expectedWord}"</span>
                                <span className="text-gray-400 text-[9px]">{err.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Automatic Transition Guidance */}
                      <div className="p-2 bg-emerald-50 border border-emerald-200/60 rounded-lg text-center text-[10px] text-emerald-900 font-bold flex items-center justify-center gap-1 shadow-3xs">
                        <Sparkles size={12} className="text-emerald-600 animate-pulse shrink-0" />
                        <span>عند إتمام التسميع بصوتك، سيتم الانتقال تلقائياً للمرحلة الثانية (اختبار الترتيب والكلمات).</span>
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: QUIZ & ORDERING EXAM */}
                  {examStage === 'stage2_quiz' && (
                    <div className="space-y-3.5 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-black text-xs sm:text-sm text-emerald-900 flex items-center gap-1.5">
                            <ListOrdered className="text-emerald-600 shrink-0" size={16} />
                            المرحلة 2: اختبار ترتيب الآيات
                          </h4>
                          <p className="text-[11px] text-emerald-800 font-medium">
                            رتب آيات المقطع بالشكل الصحيح لاختبار ثبات وترابط الحفظ.
                          </p>
                        </div>

                        <button
                          onClick={() => setIsOrderingTextMasked(!isOrderingTextMasked)}
                          className="px-3 py-1 bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          {isOrderingTextMasked ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} className="text-emerald-600" />}
                          <span>{isOrderingTextMasked ? 'إظهار النص' : 'إخفاء (اختبار ذهني 🔒)'}</span>
                        </button>
                      </div>

                      {/* Reuse Verse Ordering Component */}
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-3">
                        <div className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                          <span>انقر الآيات بالترتيب الصحيح:</span>
                          <span className="text-[10px] text-amber-700 font-black bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {isOrderingTextMasked ? '🔒 وضع الكلمات المخفية مفعّل' : '👁️ النص كامل'}
                          </span>
                        </div>
                        
                        {/* Selected Order */}
                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-dashed border-emerald-300 space-y-1.5 min-h-[60px] max-h-48 overflow-y-auto">
                          {userVerseOrder.length === 0 ? (
                            <p className="text-[11px] text-gray-400 text-center py-3 font-medium">انقر الآيات المبعثرة بالأسفل لتنسيقها هنا بالتسلسل الصحيح...</p>
                          ) : (
                            userVerseOrder.map((v, idx) => (
                              <div key={v.numberInSurah} className="p-2 bg-white rounded-lg border border-emerald-200 flex items-center justify-between text-xs shadow-2xs">
                                <span className="font-bold text-emerald-800 shrink-0">.{idx + 1} آية {v.numberInSurah}</span>
                                <span className="font-quran text-sm text-gray-800 text-right pr-2">{v.text}</span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Shuffled Verses Pool */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {shuffledVerses.map(v => {
                            if (userVerseOrder.some(u => u.numberInSurah === v.numberInSurah)) return null;

                            const words = v.text.trim().split(/\s+/);
                            const maskedText = isOrderingTextMasked
                              ? words.map((w: string, i: number) => (i === 0 ? w : '••••')).join(' ')
                              : v.text;

                            return (
                              <div
                                key={v.numberInSurah}
                                onClick={() => setUserVerseOrder([...userVerseOrder, v])}
                                className="p-2.5 bg-amber-50/90 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer text-right font-quran text-sm transition-all shadow-2xs flex items-center justify-between gap-2 group"
                              >
                                <span className="text-amber-950 font-medium group-hover:text-amber-900">{maskedText}</span>
                                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-sans font-black shrink-0 border border-amber-300">
                                  + إضافة
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Submit Stage 2 & Final Decision Button */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            const correctVerses = (surahData?.ayahs || [])
                              .filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah)
                              .sort((a: any, b: any) => a.numberInSurah - b.numberInSurah);
                            
                            let isCorrect = userVerseOrder.length === correctVerses.length;
                            if (isCorrect) {
                              for (let i = 0; i < correctVerses.length; i++) {
                                if (userVerseOrder[i]?.numberInSurah !== correctVerses[i]?.numberInSurah) {
                                  isCorrect = false;
                                  break;
                                }
                              }
                            }

                            const quizScore = isCorrect ? 100 : 50;
                            evaluateExamFinalDecision(quizScore);
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trophy size={16} />
                          <span>إتمام واحتساب النتيجة النهائية 📊</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* EXAM RESULT & DECISION DISPLAY */}
                  {examStage === 'result' && examResultData && (
                    <div className="space-y-6 text-center py-4">
                      {examResultData.passed ? (
                        /* PASSED CERTIFICATE & MEMORIZED RECORDED */
                        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-8 rounded-3xl border-2 border-emerald-400 shadow-lg space-y-4 max-w-lg mx-auto">
                          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
                            <Trophy size={40} />
                          </div>
                          
                          <div className="space-y-1">
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full inline-block">
                              مبروووووك! اعتماد وتوثيق حفظ السورة 🏆
                            </span>
                            <h3 className="text-2xl font-black text-emerald-950">
                              تم حفظ سورة {getCleanSurahName(surahData?.name || '')} بنجاح! 🎉
                            </h3>
                            <p className="text-xs text-emerald-800 font-bold">
                              التقدير النهائي: <span className="text-amber-700">{examResultData.gradeLabel}</span> (الدرجة: {examResultData.finalScore}%)
                            </p>
                          </div>

                          <div className="p-4 bg-white/90 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1 font-medium text-right">
                            <div className="flex items-center gap-1 font-bold text-emerald-800 mb-1">
                              <CheckCircle2 size={16} className="text-emerald-600" /> تم حفظ وتسجيل بيانات السورة تلقائياً في:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-gray-700 font-bold">
                              <li>سجل السور المحفوظة المعتمدة في قسم التحاليل والإنجازات</li>
                              <li>زيادة إجمالي الآيات المحفوظة لـ +{surahData?.numberOfAyahs} آية</li>
                              <li>إكمال خطة الحفظ البرمجية للسورة بنسبة 100%</li>
                            </ul>
                          </div>

                          <div className="pt-2 flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setExamActive(false);
                                setCurrentView('stats');
                              }}
                              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <BarChart size={16} />
                              <span>عرض في قسم التحاليل والإنجازات 📊</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* FAILED / REJECTED - MUST REPEAT MEMORIZATION */
                        <div className="bg-red-50/90 p-8 rounded-3xl border-2 border-red-300 shadow-lg space-y-5 max-w-lg mx-auto">
                          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                            <AlertCircle size={36} />
                          </div>

                          <div className="space-y-1">
                            <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full inline-block">
                              لم يتم اجتياز الاختبار بنجاح ⚠️
                            </span>
                            <h3 className="text-xl font-black text-red-950">
                              يتوجب إعادة الحفظ والتسميع لسورة {getCleanSurahName(surahData?.name || '')}
                            </h3>
                            <p className="text-xs text-red-800 font-bold">
                              النسبة المحققة: {examResultData.finalScore}% (النسبة المطلوبة للاعتماد 80% على الأقل)
                            </p>
                          </div>

                          {/* Error Analysis Report */}
                          <div className="p-4 bg-white rounded-2xl border border-red-200 text-right space-y-2">
                            <h5 className="font-bold text-xs text-red-900 flex items-center gap-1.5 border-b border-red-100 pb-2">
                              <AlertTriangle size={16} className="text-red-600" /> تقرير الأخطاء التي أدت إلى رفض الحفظ:
                            </h5>
                            
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {examResultData.detailedErrors.map((err, idx) => (
                                <div key={idx} className="text-xs text-red-800 bg-red-50 p-2 rounded-lg border border-red-100 font-medium">
                                  ⚠️ آية {err.ayahNum}: {err.description}
                                </div>
                              ))}
                            </div>

                            <p className="text-[11px] text-gray-600 font-bold pt-2 border-t border-gray-100">
                              ملاحظة هامة: نظراً لكثرة الأخطاء، لم يتم تسجيل السورة كـ "محفوظة" في سجلك لحين إعادة التكرار والتسميع المتقن.
                            </p>
                          </div>

                          <div className="pt-2 flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setExamActive(false);
                                setActiveTab('repetition');
                              }}
                              className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Repeat size={16} />
                              <span>الانتقال لاستوديو التكرار لإعادة الحفظ 🔁</span>
                            </button>
                            <button
                              onClick={startOfficialExam}
                              className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-300 transition-colors cursor-pointer"
                            >
                              إعادة الاختبار الصوتي 🎙️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VOICE RECITATION STUDIO BOARD */}
              <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-3xs space-y-3.5">
                {/* Compact Controller - Hidden during active exam stage to prevent duplicate cards */}
                {!examActive && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-200/60">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <span className="text-[11px] font-bold text-gray-700 shrink-0">تحديد المقطع:</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={testStartAyah}
                          onChange={(e) => setTestStartAyah(parseInt(e.target.value, 10))}
                          className="p-1 rounded border border-gray-250 text-[11px] font-bold text-gray-800 bg-white"
                        >
                          {Array.from({ length: totalAyahs }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>من {i + 1}</option>
                          ))}
                        </select>
                        <select
                          value={testEndAyah}
                          onChange={(e) => setTestEndAyah(parseInt(e.target.value, 10))}
                          className="p-1 rounded border border-gray-250 text-[11px] font-bold text-gray-800 bg-white"
                        >
                          {Array.from({ length: totalAyahs - testStartAyah + 1 }).map((_, i) => {
                            const ayahNum = testStartAyah + i;
                            return <option key={ayahNum} value={ayahNum}>إلى {ayahNum}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => toggleSpeechListening(testStartAyah)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isListening ? <MicOff size={11} /> : <Mic size={11} />}
                        <span>{isListening ? 'إيقاف التسميع 🛑' : 'ابدأ التسميع الصوتي 🎙️'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Correction Alert Banner */}
                {liveCorrectionAlert && !examActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 rounded border font-bold text-[10px] text-right shadow-3xs ${
                      liveCorrectionAlert.includes('ممتااااز')
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    {liveCorrectionAlert}
                  </motion.div>
                )}

                {/* Text Visibility Toggle & Verses List */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">نص المقطع للتسميع المستمر:</span>
                  <button
                    type="button"
                    onClick={() => setIsRecitationHidden(!isRecitationHidden)}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isRecitationHidden ? <Eye size={12} className="text-amber-700" /> : <EyeOff size={12} className="text-amber-700" />}
                    <span>{isRecitationHidden ? 'إظهار نص الآيات' : 'إخفاء نص الآيات للاختبار 🔒'}</span>
                  </button>
                </div>

                {/* Verses List with Word-By-Word Hidden Live Matching & Audio Correction */}
                <div id="surah-verses-view" className="p-4 sm:p-6 rounded-3xl bg-[#fdfaf6] border-2 border-[#e8dfce] shadow-inner font-quran text-right text-xl sm:text-2xl leading-loose sm:leading-[2.5] text-gray-900" dir="rtl" style={{ wordSpacing: '4px' }}>
                  {(surahData?.ayahs || [])
                    .filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah)
                    .map((ayah: any) => {
                      const words = ayah.text.trim().split(/\s+/);
                      const isPassed = recitationPassedVerses.includes(ayah.numberInSurah);
                      const ayahErrors = voiceSessionErrors.filter(e => e.ayahNum === ayah.numberInSurah);
                      const hasError = ayahErrors.length > 0;

                      return (
                        <span key={ayah.numberInSurah} className="inline">
                          {words.map((word: string, wIdx: number) => {
                            const isMatched = isListening && (recitationMatchedMap[ayah.numberInSurah] || []).includes(wIdx);
                            const isErroneous = ayahErrors.some(e => normalizeArabic(e.expectedWord) === normalizeArabic(word));

                            // If hidden mode is ON and word is not matched or passed or erroneous, render as masked/blurred
                            const showRealWord = !isRecitationHidden || isMatched || isPassed || isErroneous;

                            return (
                              <span
                                key={wIdx}
                                className={`inline-block mx-0.5 sm:mx-1 px-1 sm:px-2 py-0.5 rounded-lg transition-all font-bold cursor-pointer relative ${
                                  isErroneous
                                    ? 'bg-red-200 text-red-950 border-b-2 border-red-400'
                                    : isMatched || isPassed
                                    ? 'bg-emerald-200 text-emerald-950 border-b-2 border-emerald-400'
                                    : showRealWord
                                    ? 'text-gray-800 hover:bg-gray-200'
                                    : 'bg-slate-200/90 text-slate-400/20 select-none blur-[3px] hover:blur-none transition-all'
                                }`}
                                title={showRealWord ? undefined : 'كلمة مخفية - أسمعها بصوتك لتظهر بالأخضر!'}
                                onClick={() => isErroneous ? playAyahCorrection(ayah.numberInSurah) : undefined}
                              >
                                {showRealWord ? word : '••••'}
                                {isErroneous && <div className="absolute -top-3 right-0 text-[9px] bg-red-600 text-white px-1 rounded-sm leading-tight">خطأ</div>}
                              </span>
                            );
                          })}
                          
                          {/* Ayah End Marker */}
                          <span 
                            className={`inline-flex items-center justify-center w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] mx-1 sm:mx-1.5 text-xs sm:text-sm rounded-full font-sans font-bold cursor-pointer transition-all relative -top-1 align-middle ${
                              hasError ? 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200' :
                              isPassed ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300' :
                              'bg-[#f0e6d2] text-[#8c6b32] border-2 border-[#d6c5a3] hover:bg-[#e8d7b3]'
                            }`}
                            onClick={() => playAyahCorrection(ayah.numberInSurah)}
                            title={hasError ? 'انقر للاستماع للتصحيح' : `الاستماع للآية ${ayah.numberInSurah}`}
                          >
                            <span className="relative z-10">{ayah.numberInSurah}</span>
                            {/* Decorative traditional circle */}
                            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                               <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="4 2"/>
                               <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                          </span>
                        </span>
                      );
                    })}
                </div>

                {/* Displaying errors below the mushaf text if any */}
                {voiceSessionErrors.length > 0 && (
                   <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                      <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> أخطاء التسميع المسجلة:</h4>
                      <div className="flex flex-col gap-2">
                         {Array.from(new Set(voiceSessionErrors.map(e => e.ayahNum))).map(ayahNum => (
                             <div key={ayahNum} className="flex flex-wrap items-center gap-2 text-sm">
                                 <span className="font-bold bg-red-100 px-2 py-1 rounded-md text-red-700">آية {ayahNum}</span>
                                 <span className="text-gray-700">
                                     {voiceSessionErrors.filter(e => e.ayahNum === ayahNum).map(e => e.expectedWord).join('، ')}
                                 </span>
                                 <button
                                     onClick={() => playAyahCorrection(ayahNum)}
                                     className="mr-auto px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                 >
                                    <Volume2 size={14} /> استماع للتصحيح
                                 </button>
                             </div>
                         ))}
                      </div>
                   </div>
                )}

                {voiceTestFinished && (
                   <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 mt-4 text-center space-y-4 shadow-sm">
                     <h4 className="font-bold text-amber-900 text-lg">لقد أنهيت التسميع!</h4>
                     {voiceSessionErrors.length > 0 ? (
                       <p className="text-amber-800 text-sm font-medium">
                         هناك بعض الأخطاء في التسميع. هل تود إعادة التسميع لتثبيت الحفظ وتصحيح الأخطاء، أم الانتقال إلى المرحلة التالية؟
                       </p>
                     ) : (
                       <p className="text-emerald-700 font-bold">
                         أحسنت! حفظك متقن ولا توجد أخطاء. يمكنك الآن الانتقال للمرحلة التالية.
                       </p>
                     )}
                     <div className="flex items-center justify-center gap-3">
                       {voiceSessionErrors.length > 0 && (
                         <button
                           onClick={() => startOfficialExam()}
                           className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                         >
                           <RotateCcw size={16} /> إعادة الحفظ والتسميع
                         </button>
                       )}
                       <button
                         onClick={() => completeExamStage1Voice()}
                         className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                       >
                         الانتقال للمرحلة الثانية <ArrowLeft size={16} />
                       </button>
                     </div>
                   </div>
                )}

                {/* 3-STAGE PROGRESS STEPPER (COLLAPSIBLE DROPDOWN) */}
                <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-3 transition-all pt-2">
                  <button
                    onClick={() => setShowStagesStepper(!showStagesStepper)}
                    className="w-full flex items-center justify-between gap-3 text-right cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className="text-amber-400 shrink-0" size={24} />
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-amber-300 group-hover:text-amber-200 transition-colors">
                          مسار المراحل المتراتبة لاجتياز السورة واعتماد الحفظ 🏆
                        </h3>
                        <p className="text-[11px] text-gray-300">انقر لعرض/إخفاء تفاصيل المراحل الثلاث للاعتماد والتقييم</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold bg-white/10 text-amber-200 px-3 py-1 rounded-full border border-white/20">
                        سورة {getCleanSurahName(surahData?.name || '')}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 group-hover:bg-white/20 transition-colors border border-white/10">
                        {showStagesStepper ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showStagesStepper && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-white/10 space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Stage 1 Card */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            examStage === 'stage1_voice' || !examActive
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">المرحلة 1</span>
                              <Mic size={16} className="text-amber-400" />
                            </div>
                            <h4 className="font-bold text-xs text-white">التسميع الصوتي المباشر للآيات المخفية</h4>
                            <p className="text-[10px] text-gray-300 mt-1">الآيات مخفية وتكشف باللون الأخضر ✔️ عند النطق الصح والأحمر ⚠️ مع زر الصوت عند الخطأ.</p>
                          </div>

                          {/* Stage 2 Card */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            examStage === 'stage2_quiz'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md">المرحلة 2</span>
                              <ListOrdered size={16} className="text-emerald-400" />
                            </div>
                            <h4 className="font-bold text-xs text-white">اختبار ترتيب الآيات والتثبيت</h4>
                            <p className="text-[10px] text-gray-300 mt-1">تنسيق وترتيب آيات المقطع للتأكد من الترابط الذهني التام وعدم التلعثم.</p>
                          </div>

                          {/* Stage 3 Card */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            examStage === 'result'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black bg-teal-500 text-slate-950 px-2 py-0.5 rounded-md">المرحلة 3</span>
                              <Trophy size={16} className="text-teal-300" />
                            </div>
                            <h4 className="font-bold text-xs text-white">الاعتماد والتحويل للون الأخضر</h4>
                            <p className="text-[10px] text-gray-300 mt-1">منح الشهادة واعتماد الحفظ بـ 100% وتحويل خطة السورة للون الأخضر رسمياً.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUB-TAB 1: HIDE WORDS */}
          {testSubTab === 'hide_words' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <Brain className="text-[var(--color-primary)]" size={20} />
                    إعدادات التسميع وتخفي الكلمات
                  </h4>

                  <button
                    onClick={startAutomatedHiddenQuiz}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-emerald-600 text-white font-bold text-xs hover:shadow-lg transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles size={16} />
                    <span>ابدأ الاختبار التلقائي للكلمات المخفية 🎯</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">من الآية:</label>
                    <select
                      value={testStartAyah}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTestStartAyah(val);
                        if (val > testEndAyah) setTestEndAyah(val);
                      }}
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-800 focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {Array.from({ length: totalAyahs }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          آية {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">إلى الآية:</label>
                    <select
                      value={testEndAyah}
                      onChange={(e) => setTestEndAyah(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-800 focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {Array.from({ length: totalAyahs - testStartAyah + 1 }).map((_, i) => {
                        const ayahNum = testStartAyah + i;
                        return (
                          <option key={ayahNum} value={ayahNum}>
                            آية {ayahNum}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">درجة إخفاء الكلمات للأبطال:</label>
                    <select
                      value={hideMode}
                      onChange={(e) => setHideMode(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-800 focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="25">25% (سهل - إخفاء طفيف)</option>
                      <option value="50">50% (متوسط - توازن)</option>
                      <option value="75">75% (حماسي - أغلب الكلمات)</option>
                      <option value="100">100% (تحدي الأبطال - تسميع كامل)</option>
                      <option value="ends">أواخر وفواصل الآيات فقط</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
                  <div className="text-xs text-amber-900 font-medium flex items-center gap-2">
                    <Sparkles className="text-amber-500 shrink-0" size={18} />
                    <span>تلميح للأطفال: اضغط على أي كلمة مخفية لإظهارها، أو انقر زر الاختبار التلقائي بالأعلى لاختبار نفسك وكسب النجوم!</span>
                  </div>
                  <button
                    onClick={() => setAllRevealed(!allRevealed)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {allRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{allRevealed ? 'إخفاء الكلمات مجدداً' : 'إظهار كامل المقطع'}</span>
                  </button>
                </div>
              </div>

              {/* AUTOMATED QUIZ MODE ACTIVE */}
              {hiddenQuizActive ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-[var(--color-primary)] shadow-md space-y-6 text-right">
                  {!hiddenQuizCompleted ? (
                    <div>
                      {/* Quiz Progress Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-primary)] text-white">
                          سؤال {hiddenQuizIndex + 1} من {hiddenQuizQuestions.length}
                        </span>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                          <Star fill="currentColor" size={16} />
                          <span>النجوم في هذا الاختبار: +{hiddenQuizStats.stars}</span>
                        </div>
                        <button
                          onClick={() => setHiddenQuizActive(false)}
                          className="text-xs text-gray-400 hover:text-red-500 font-bold"
                        >
                          خروج من الاختبار
                        </button>
                      </div>

                      {/* Question Content */}
                      {(() => {
                        const q = hiddenQuizQuestions[hiddenQuizIndex];
                        if (!q) return null;
                        const ayahWords = q.fullAyahText.trim().split(/\s+/);

                        return (
                          <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                              اختر الكلمة الصحيحة الناقصة في الآية {q.ayahNum}:
                            </div>

                            {/* Verse context with blank spot */}
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 font-quran text-2xl text-right leading-[2.6] text-gray-800 flex flex-wrap gap-x-2.5 gap-y-3">
                              {ayahWords.map((w, idx) => {
                                if (idx === q.wordIndex) {
                                  return (
                                    <span key={idx} className="bg-amber-300 border-2 border-dashed border-amber-500 text-amber-950 px-4 py-1 rounded-xl font-quran font-bold animate-pulse shadow-sm">
                                      [ ❓ الكلمة المخفية ]
                                    </span>
                                  );
                                }
                                return <span key={idx}>{w}</span>;
                              })}
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              {q.options.map((option, optIdx) => (
                                <button
                                  key={optIdx}
                                  onClick={() => handleAnswerHiddenQuiz(option)}
                                  className="p-4 rounded-xl bg-white border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 font-quran text-xl text-gray-900 transition-all font-bold text-center shadow-sm hover:scale-[1.01]"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Quiz Results Card */
                    <div className="text-center py-6 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                        <Sparkles size={32} />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        🎉 أكملت اختبار الكلمات المخفية بنجاح!
                      </h4>
                      <p className="text-sm font-bold text-emerald-700">
                        نتيجة الاختبار التلقائية: {hiddenQuizStats.correct} من {hiddenQuizQuestions.length} صحيحة
                      </p>
                      <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 inline-block font-bold">
                        ⭐ تمت إضافة +{hiddenQuizStats.stars} نجمة تلقائياً إلى رصيدك ومستواك!
                      </p>

                      <div className="pt-4 flex justify-center gap-3">
                        <button
                          onClick={startAutomatedHiddenQuiz}
                          className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                          إعادة الاختبار 🎲
                        </button>
                        <button
                          onClick={() => setHiddenQuizActive(false)}
                          className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors"
                        >
                          العودة للقراءة والتسميع
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Interactive Words Display */
                                <div className="p-4 sm:p-6 rounded-3xl bg-[#fdfaf6] border-2 border-[#e8dfce] shadow-inner font-quran text-right text-xl sm:text-2xl leading-loose sm:leading-[2.5] text-gray-900" dir="rtl" style={{ wordSpacing: '4px' }}>
                  {surahData?.ayahs
                    ?.filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah)
                    ?.map((ayah: any) => {
                      const words = ayah.text.trim().split(/\s+/);
                      return (
                        <span key={ayah.numberInSurah} className="inline">
                          {words.map((word: string, wIdx: number) => {
                            const wordKey = `${ayah.numberInSurah}_${wIdx}`;
                            const isHidden = shouldHideWord(wIdx, words.length, word) && !revealedWords[wordKey];

                            return (
                              <span
                                key={wIdx}
                                onClick={() => toggleWordReveal(wordKey)}
                                className={`cursor-pointer transition-all duration-200 px-1.5 py-0.5 rounded-lg select-none inline-block mx-0.5 sm:mx-1 ${
                                  isHidden
                                    ? 'bg-amber-200 text-transparent blur-[5px] border border-amber-400 hover:blur-none hover:text-amber-950 hover:bg-amber-100 shadow-2xs'
                                    : revealedWords[wordKey]
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                                    : 'hover:bg-amber-50/80'
                                }`}
                                title={isHidden ? 'اضغط لإظهار الكلمة' : ''}
                              >
                                {word}
                              </span>
                            );
                          })}

                          {/* Ayah End Marker */}
                          <span className="inline-flex items-center justify-center w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] mx-1 sm:mx-1.5 text-xs sm:text-sm rounded-full font-sans font-bold bg-[#f0e6d2] text-[#8c6b32] border-2 border-[#d6c5a3] relative -top-1 align-middle">
                            <span className="relative z-10">{ayah.numberInSurah}</span>
                            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="4 2"/>
                              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                          </span>
                        </span>
                      );
                    })}
                </div>
              )}


            </motion.div>
          )}

          {/* SUB-TAB 2: ORDERING QUIZ */}
          {testSubTab === 'ordering' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* Type Switch: Verse Ordering vs Word Ordering */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <ListOrdered className="text-[var(--color-primary)]" size={22} />
                      تحدي وإعادة ترتيب الآيات والكلمات
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">اختر أسلوب الاختبار، اضغط الكلمات/الآيات بالترتيب الصحيح:</p>
                  </div>

                  <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                    <button
                      onClick={() => {
                        setOrderingType('verses');
                        startVerseOrderingTest();
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        orderingType === 'verses'
                          ? 'bg-[var(--color-primary)] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ترتيب الآيات
                    </button>
                    <button
                      onClick={() => {
                        setOrderingType('words');
                        startWordOrderingTest();
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        orderingType === 'words'
                          ? 'bg-[var(--color-primary)] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ترتيب كلمات آية واحدة
                    </button>
                  </div>
                </div>

                {/* Range controls */}
                {orderingType === 'verses' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-xl">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">من الآية:</label>
                      <select
                        value={testStartAyah}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTestStartAyah(val);
                          if (val > testEndAyah) setTestEndAyah(val);
                        }}
                        className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                      >
                        {Array.from({ length: totalAyahs }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>آية {i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">إلى الآية:</label>
                      <select
                        value={testEndAyah}
                        onChange={(e) => setTestEndAyah(parseInt(e.target.value, 10))}
                        className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                      >
                        {Array.from({ length: totalAyahs - testStartAyah + 1 }).map((_, i) => {
                          const ayahNum = testStartAyah + i;
                          return <option key={ayahNum} value={ayahNum}>آية {ayahNum}</option>;
                        })}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={startVerseOrderingTest}
                        className="w-full bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Shuffle size={16} />
                        <span>إعادة المخلطة للآيات 🎲</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-xl">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">اختر الآية المراد خلط كلماتها:</label>
                      <select
                        value={selectedWordAyahNum}
                        onChange={(e) => setSelectedWordAyahNum(parseInt(e.target.value, 10))}
                        className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                      >
                        {Array.from({ length: totalAyahs }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>آية {i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={startWordOrderingTest}
                        className="w-full bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Shuffle size={16} />
                        <span>خلط الكلمات وابدأ التحدي 🎲</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QUIZ INTERACTIVE BOARD: VERSE ORDERING */}
              {orderingType === 'verses' && (
                <div className="space-y-6">
                  {/* Selected Answer Box */}
                  <div className="bg-emerald-50/50 rounded-2xl p-6 border-2 border-dashed border-emerald-300 min-h-[140px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> ترتيبي للآيات (اضغط لإزالتها):
                      </span>
                      {userVerseOrder.length > 0 && (
                        <button
                          onClick={() => {
                            setUserVerseOrder([]);
                            setVerseTestChecked(false);
                            setIsVerseTestCorrect(null);
                          }}
                          className="text-xs text-red-500 font-bold hover:underline"
                        >
                          إعادة الضبط
                        </button>
                      )}
                    </div>

                    {userVerseOrder.length === 0 ? (
                      <p className="text-xs text-center text-gray-400 py-6">اضغط على الآيات المبعثرة بالأسفل لترتيبها هنا بالشكل الصحيح...</p>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const correctVerses = (surahData?.ayahs || [])
                            .filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah)
                            .sort((a: any, b: any) => a.numberInSurah - b.numberInSurah);

                          return userVerseOrder.map((v, idx) => {
                            const expectedVerse = correctVerses[idx];
                            const isItemCorrect = verseTestChecked && expectedVerse && v.numberInSurah === expectedVerse.numberInSurah;
                            const isItemWrong = verseTestChecked && expectedVerse && v.numberInSurah !== expectedVerse.numberInSurah;

                            return (
                              <motion.div
                                key={v.numberInSurah}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={() => {
                                  if (!verseTestChecked) handleSelectVerseForOrdering(v);
                                }}
                                className={`p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                                  !verseTestChecked
                                    ? 'bg-white border-emerald-200 shadow-sm cursor-pointer hover:bg-red-50 group'
                                    : isItemCorrect
                                    ? 'bg-emerald-50/90 border-2 border-emerald-400 shadow-sm'
                                    : 'bg-red-50 border-2 border-red-400 shadow-md'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                      !verseTestChecked
                                        ? 'bg-emerald-600 text-white'
                                        : isItemCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-red-600 text-white'
                                    }`}>
                                      {idx + 1}
                                    </span>

                                    {verseTestChecked && (
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                                        isItemCorrect
                                          ? 'bg-emerald-200 text-emerald-900'
                                          : 'bg-red-200 text-red-900'
                                      }`}>
                                        {isItemCorrect ? (
                                          <>
                                            <CheckCircle2 size={14} />
                                            <span>موضع صحيح (آية {v.numberInSurah})</span>
                                          </>
                                        ) : (
                                          <>
                                            <XCircle size={14} />
                                            <span>خطأ! الموضع الصحيح هنا هو (آية {expectedVerse?.numberInSurah})</span>
                                          </>
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {!verseTestChecked && (
                                    <XCircle className="text-gray-300 group-hover:text-red-500 shrink-0" size={18} />
                                  )}
                                </div>

                                <p className="font-quran text-right text-lg text-gray-800">{v.text}</p>

                                {isItemWrong && expectedVerse && (
                                  <div className="mt-1 p-2.5 bg-white/90 rounded-lg border border-red-200 text-xs text-red-900 text-right">
                                    <span className="font-bold text-red-700 block mb-0.5">⚠️ الآية التي يجب أن تكون في الموضع ({idx + 1}):</span>
                                    <span className="font-quran text-base text-gray-800">{expectedVerse.text}</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Shuffled Verses Pool */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <Shuffle size={16} className="text-amber-500" /> الآيات المبعثرة (اضغط لاختيارها):
                    </h5>

                    <div className="space-y-3">
                      {shuffledVerses.map((v) => {
                        const isChosen = userVerseOrder.some(selected => selected.numberInSurah === v.numberInSurah);
                        if (isChosen) return null;

                        return (
                          <motion.div
                            key={v.numberInSurah}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectVerseForOrdering(v)}
                            className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100 transition-all text-right shadow-sm"
                          >
                            <p className="font-quran text-xl text-gray-800">{v.text}</p>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Verify Button */}
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={checkVerseOrdering}
                        disabled={userVerseOrder.length === 0}
                        className="px-8 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
                      >
                        <Sparkles size={18} />
                        <span>تحقق من إجابتي 🎯</span>
                      </button>
                    </div>

                    {/* Feedback result */}
                    {verseTestChecked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 p-5 rounded-2xl text-center border font-bold text-sm shadow-sm ${
                          isVerseTestCorrect
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                        }`}
                      >
                        {isVerseTestCorrect ? (
                          <div className="space-y-2">
                            <p className="text-lg flex items-center justify-center gap-2">
                              🎉 أحسنت يا بطل القرآن! إجابة صحيحة 100%!
                            </p>
                            <p className="text-xs text-emerald-700 font-medium">تمت إضافة +15 نجمة إلى رصيدك! ⭐</p>
                          </div>
                        ) : (
                          <div className="space-y-3 text-right">
                            <p className="text-base font-bold flex items-center justify-center gap-2 text-red-700 text-center">
                              ❌ توجد أخطاء في الترتيب، تم تظليلها باللون الأحمر أعلاه لمراجعتها!
                            </p>
                            <p className="text-xs text-gray-600 text-center">راجع الإشارات الحمراء أعلاه لرؤية الآية الصحيحة لكل موضع 💪</p>

                            {/* Full Correct Order Review Box */}
                            <div className="bg-white p-4 rounded-xl border border-red-200 mt-3 text-right">
                              <h6 className="font-bold text-xs text-emerald-800 mb-2 flex items-center gap-1.5">
                                <CheckCircle2 size={16} /> الترتيب الصحيح الكامل للآيات:
                              </h6>
                              <div className="space-y-2">
                                {(surahData?.ayahs || [])
                                  .filter((a: any) => a.numberInSurah >= testStartAyah && a.numberInSurah <= testEndAyah)
                                  .sort((a: any, b: any) => a.numberInSurah - b.numberInSurah)
                                  .map((a: any) => (
                                    <div key={a.numberInSurah} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                                      <span className="text-xs font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-200">
                                        آية {a.numberInSurah}
                                      </span>
                                      <p className="font-quran text-base text-gray-800 text-right flex-1">{a.text}</p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* QUIZ INTERACTIVE BOARD: WORD ORDERING */}
              {orderingType === 'words' && (
                <div className="space-y-6">
                  {/* Selected Words Box */}
                  <div className="bg-emerald-50/50 rounded-2xl p-6 border-2 border-dashed border-emerald-300 min-h-[120px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> ترتيبي لكلمات الآية:
                      </span>
                      {userWordOrder.length > 0 && (
                        <button
                          onClick={() => setUserWordOrder([])}
                          className="text-xs text-red-500 font-bold hover:underline"
                        >
                          إعادة الضبط
                        </button>
                      )}
                    </div>

                    {userWordOrder.length === 0 ? (
                      <p className="text-xs text-center text-gray-400 py-4">اضغط على الكلمات المبعثرة بالأسفل لبناء الآية...</p>
                    ) : (
                      <div className="font-quran text-right text-2xl leading-[2.6] text-gray-800 flex flex-wrap gap-3.5">
                        {(() => {
                          const targetAyahObj = surahData?.ayahs?.find((a: any) => a.numberInSurah === selectedWordAyahNum);
                          const targetWords = targetAyahObj ? targetAyahObj.text.trim().split(/\s+/) : [];

                          return userWordOrder.map((w, idx) => {
                            const expectedWord = targetWords[idx];
                            const isWordCorrect = wordTestChecked && expectedWord && w.text === expectedWord;
                            const isWordWrong = wordTestChecked && expectedWord && w.text !== expectedWord;

                            return (
                              <div key={w.id} className="flex flex-col items-center">
                                <span
                                  onClick={() => {
                                    if (!wordTestChecked) handleSelectWord(w);
                                  }}
                                  className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm font-quran ${
                                    !wordTestChecked
                                      ? 'bg-white border-emerald-300 text-emerald-950 hover:bg-red-50 hover:text-red-600'
                                      : isWordCorrect
                                      ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-bold'
                                      : 'bg-red-100 border-2 border-red-500 text-red-950 font-bold animate-pulse'
                                  }`}
                                >
                                  {w.text}
                                  {wordTestChecked && (
                                    <span className="mr-1 text-xs">
                                      {isWordCorrect ? ' ✓' : ' ✕'}
                                    </span>
                                  )}
                                </span>

                                {isWordWrong && (
                                  <span className="mt-1 text-sm font-quran bg-red-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                                    الصحيح: {expectedWord}
                                  </span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Shuffled Words Pool */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <Shuffle size={16} className="text-amber-500" /> الكلمات المبعثرة للآية {selectedWordAyahNum}:
                    </h5>

                    <div className="font-quran text-right text-2xl leading-[2.6] text-gray-800 flex flex-wrap gap-2.5 mb-6">
                      {shuffledWords.map((w) => {
                        const isChosen = userWordOrder.some(selected => selected.id === w.id);
                        if (isChosen) return null;

                        return (
                          <motion.span
                            key={w.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectWord(w)}
                            className="font-quran bg-amber-100 border border-amber-300 text-amber-950 px-3.5 py-1.5 rounded-xl shadow-sm cursor-pointer hover:bg-amber-200 transition-colors"
                          >
                            {w.text}
                          </motion.span>
                        );
                      })}
                    </div>

                    {/* Verify Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={checkWordOrdering}
                        disabled={userWordOrder.length === 0}
                        className="px-8 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
                      >
                        <Sparkles size={18} />
                        <span>تحقق من إجابتي 🎯</span>
                      </button>
                    </div>

                    {/* Feedback result */}
                    {wordTestChecked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 p-5 rounded-2xl text-center border font-bold text-sm shadow-sm ${
                          isWordTestCorrect
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                        }`}
                      >
                        {isWordTestCorrect ? (
                          <div className="space-y-2">
                            <p className="text-lg flex items-center justify-center gap-2">
                              🎉 ممتاز جداً يا بطل! ترتيب صحيح بالكامل!
                            </p>
                            <p className="text-xs text-emerald-700 font-medium">تمت إضافة +10 نجوم إلى رصيدك! ⭐</p>
                          </div>
                        ) : (
                          <div className="space-y-3 text-right">
                            <p className="text-base font-bold flex items-center justify-center gap-2 text-red-700 text-center">
                              ❌ الكلمات المظللة باللون الأحمر تحتوي على خطأ بالترتيب!
                            </p>
                            <p className="text-xs text-gray-600 text-center">لاحظ الكلمة الصحيحة أسفل كل كلمة مظللة بالأحمر لتتعلم منها 💪</p>

                            {/* Full Correct Verse Box */}
                            <div className="bg-white p-4 rounded-xl border border-red-200 mt-3 text-right">
                              <h6 className="font-bold text-xs text-emerald-800 mb-2 flex items-center gap-1.5">
                                <CheckCircle2 size={16} /> النص الكامل الصحيح للآية {selectedWordAyahNum}:
                              </h6>
                              <p className="font-quran text-2xl text-emerald-950 leading-[2.4] bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                                {surahData?.ayahs?.find((a: any) => a.numberInSurah === selectedWordAyahNum)?.text}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SUB-TAB 3: MISTAKES & LEVEL LOG */}
          {testSubTab === 'mistakes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* Level & Statistics Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <Award className="text-amber-500" size={22} />
                      مستواك الحالي في حفظ وتلاوة القرآن
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">يتم احتساب مستواك دائمياً بناءً على إجاباتك واختباراتك:</p>
                  </div>

                  {(() => {
                    const prof = calculateProficiencyLevel();
                    return (
                      <span className={`px-4 py-2 rounded-2xl font-bold text-xs shadow-sm ${prof.bg} ${prof.color}`}>
                        {prof.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                    <span className="text-emerald-700 font-bold text-xl block mb-1">{testStats.correct}</span>
                    <span className="text-xs text-emerald-800">إجابات صحيحة</span>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                    <span className="text-red-700 font-bold text-xl block mb-1">{testStats.wrong}</span>
                    <span className="text-xs text-red-800">أخطاء مسجلة</span>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                    <span className="text-amber-700 font-bold text-xl block mb-1">{testStats.score}</span>
                    <span className="text-xs text-amber-800">إجمالي النجوم</span>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <span className="text-blue-700 font-bold text-xl block mb-1">
                      {testStats.totalTests > 0 ? `${Math.round((testStats.correct / testStats.totalTests) * 100)}%` : '0%'}
                    </span>
                    <span className="text-xs text-blue-800">نسبة الدقة</span>
                  </div>
                </div>
              </div>

              {/* Mistakes Log List */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <History className="text-[var(--color-primary)]" size={20} />
                    سجل الأخطاء للمراجعة والتمكين
                  </h4>

                  {mistakesLog.length > 0 && (
                    <button
                      onClick={clearMistakesLog}
                      className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={14} /> مسح السجل
                    </button>
                  )}
                </div>

                {mistakesLog.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                    <p className="text-sm font-bold text-gray-700">لا توجد أخطاء مسجلة بفضل الله!</p>
                    <p className="text-xs text-gray-400 mt-1">واصل التثبيت والاختبار للحفاظ على مستواك الممتار.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mistakesLog.map((log) => (
                      <div key={log.id} className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-lg">
                            {log.surahName} - آية {log.ayahNumber} ({log.type})
                          </span>
                          <span className="text-gray-400">{log.date}</span>
                        </div>

                        <p className="font-quran text-lg text-gray-800 text-right">{log.text}</p>
                        
                        {log.userAnswer && (
                          <div className="text-xs text-red-600 font-medium bg-white p-2 rounded-lg border border-red-100">
                            إجابتك السابقة: {log.userAnswer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          </div>
        </motion.div>
      )}

      {/* TAB 4: KIDS GAME */}
      {activeTab === 'kids_game' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
           <QuranGamesHub surahData={surahData} currentSurah={currentSurah} />
        </motion.div>
      )}

      {/* Return to Reader Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setCurrentView('reader')}
          className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
        >
          العودة لقراءة المصحف
        </button>
      </div>

      {/* PROFESSIONAL POPUP CARD MODAL (بطاقة منبثقة احترافية) */}
      <AnimatePresence>
        {popupModalCard.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-right relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
                    بطاقة منبثقة احترافية 🌟
                  </span>
                  <h3 className="text-lg font-black text-gray-900">{popupModalCard.title}</h3>
                  {popupModalCard.subtitle && (
                    <p className="text-xs text-gray-500 font-medium">{popupModalCard.subtitle}</p>
                  )}
                </div>
                <button
                  onClick={() => setPopupModalCard({ isOpen: false, title: '', content: null })}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-2 space-y-4">
                {popupModalCard.content}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setPopupModalCard({ isOpen: false, title: '', content: null })}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  إغلاق البطاقة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranMemorize;

