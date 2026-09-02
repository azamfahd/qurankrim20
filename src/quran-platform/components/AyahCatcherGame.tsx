import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Heart, Leaf, TreeDeciduous, Cloud, Clock, AlertTriangle, Wind, Zap, Layers, CloudRain, Map, Star, Flag } from 'lucide-react';
import { getCleanSurahName } from './AyahMarker';
import { playGameSound } from '../../utils/gameAudio';

interface AyahCatcherGameProps {
  surahData: any;
}

type FallingWord = {
  id: string;
  word: string;
  left: number; // percentage X position
  duration: number;
  delay: number;
};

type Phase = {
  title: string;
  ayahs: any[];
  targetCount: number;
};

type GameState = 'setup' | 'playing' | 'transition' | 'phase_complete' | 'won' | 'lost';

const AyahCatcherGame: React.FC<AyahCatcherGameProps> = ({ surahData }) => {
  const totalAyahs = surahData?.ayahs?.length || 0;
  
  const [gameState, setGameState] = useState<GameState>('setup');
  const [score, setScore] = useState<number>(0);
  const [health, setHealth] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  
  // Customization Options
  const [isHintEnabled, setIsHintEnabled] = useState<boolean>(false);
  const [fallStyle, setFallStyle] = useState<'normal' | 'fast' | 'waves' | 'dense'>('normal');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);

  // Progressive Gameplay State
  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState<number>(0);
  const [ayahsCompletedInPhase, setAyahsCompletedInPhase] = useState<number>(0);

  // Current Level State
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [targetAyahText, setTargetAyahText] = useState<string>('');
  const [ayahNum, setAyahNum] = useState<number>(0);

  // Initialize range when data loads
  useEffect(() => {
    if (totalAyahs > 0) {
      setRangeStart(1);
      setRangeEnd(Math.min(10, totalAyahs)); // Default to first 10 ayahs
    }
  }, [totalAyahs]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            playGameSound('lost');
            setGameState('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, currentPhaseIdx]);

  const startGame = () => {
    playGameSound('start');
    
    // Ensure valid range
    const start = Math.max(1, Math.min(rangeStart, rangeEnd));
    const end = Math.min(totalAyahs, Math.max(rangeStart, rangeEnd));
    
    // Helpers to remove Basmalah
    const isBasmalah = (text: string) => {
      const clean = text.replace(/[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/g, '').replace(/ٱ/g, 'ا').trim();
      return clean === "بسم الله الرحمن الرحيم";
    };

    const removeBasmalahPrefix = (text: string) => {
      const words = text.trim().split(/\s+/);
      if (words.length > 4) {
        const first4 = words.slice(0, 4).join(" ");
        if (isBasmalah(first4)) {
          return words.slice(4).join(" ");
        }
      }
      return text;
    };

    // Filter range and remove basmalah prefix if it's attached to the first ayah
    let activeAyahs = surahData.ayahs
      .filter((a: any) => a.numberInSurah >= start && a.numberInSurah <= end)
      .map((a: any) => ({ ...a, text: removeBasmalahPrefix(a.text) }));
      
    if (activeAyahs.length === 0) {
      activeAyahs = surahData.ayahs.slice(0, 1);
    }
    
    // SHUFFLE the selected ayahs so they appear in random order
    activeAyahs.sort(() => Math.random() - 0.5);
    
    const CHUNK_SIZE = 5; // Divide the selected range into blocks of 5 ayahs
    const newPhases: Phase[] = [];
    
    for (let i = 0; i < activeAyahs.length; i += CHUNK_SIZE) {
      const chunk = activeAyahs.slice(i, i + CHUNK_SIZE);
      newPhases.push({
        title: `المجموعة ${Math.floor(i/CHUNK_SIZE) + 1} (مختلطة)`,
        ayahs: chunk,
        targetCount: Math.min(3, chunk.length) // Play up to 3 ayahs per phase
      });
    }

    // Add comprehensive final boss stage if there's more than one chunk
    if (newPhases.length > 1) {
      newPhases.push({
        title: "المرحلة الشاملة 👑",
        ayahs: activeAyahs,
        targetCount: Math.min(4, activeAyahs.length) // comprehensive test
      });
    }

    setPhases(newPhases);
    setCurrentPhaseIdx(0);
    setAyahsCompletedInPhase(0);
    setScore(0);
    setHealth(3);
    setGameState('playing');
    
    generateLevel(newPhases[0], 0);
  };

  const generateLevel = (phase: Phase, ayahIndexInPhase: number) => {
    if (!phase || !phase.ayahs || phase.ayahs.length === 0) return;
    
    // Pick the exact shuffled ayah without repetition
    const safeIndex = ayahIndexInPhase % phase.ayahs.length;
    const ayah = phase.ayahs[safeIndex];
    
    let words = ayah.text.trim().split(/\s+/);
    
    // If the Ayah is very long, take a random chunk of 8 words to keep gameplay balanced
    if (words.length > 12) {
       const maxStart = words.length - 8;
       const randomStart = Math.floor(Math.random() * maxStart);
       words = words.slice(randomStart, randomStart + 8);
       setTargetAyahText("... " + words.join(" ") + " ...");
    } else {
       setTargetAyahText(ayah.text);
    }

    setTargetWords(words);
    setSelectedWords([]);
    setAyahNum(ayah.numberInSurah);

    // Adjust time limit based on fall style
    let timeLimit = 40 + (words.length * 4);
    if (fallStyle === 'fast') timeLimit = Math.max(30, 20 + (words.length * 3));
    if (fallStyle === 'dense') timeLimit += 15;
    setTimeLeft(timeLimit);

    // Add distractors from the *entire* Surah to keep vocabulary challenging
    const allWords = Array.from(new Set(surahData.ayahs.flatMap((a: any) => a.text.trim().split(/\s+/))));
    let numDistractors = fallStyle === 'dense' ? 15 : 6;
    let distractors = allWords.filter(w => !words.includes(w)).sort(() => Math.random() - 0.5).slice(0, numDistractors);
    
    const options = [...words, ...distractors].sort(() => Math.random() - 0.5);
    
    // Create distinct physical lanes to guarantee no overlap
    const NUM_LANES = 5;
    const availableWidth = 80; // 10% to 90%
    const laneWidth = availableWidth / NUM_LANES;
    const laneNextAvailableTime = Array(NUM_LANES).fill(0);
    
    const fallers: FallingWord[] = options.map((word, i) => {
      let duration = 10;
      let desiredDelay = 0;

      // Base timing and duration
      if (fallStyle === 'normal') {
        duration = 11;
        desiredDelay = i * 1.5;
      } else if (fallStyle === 'fast') {
        duration = 7;
        desiredDelay = i * 0.9;
      } else if (fallStyle === 'dense') {
        duration = 9;
        desiredDelay = i * 0.5;
      } else if (fallStyle === 'waves') {
        duration = 10;
        const batchIndex = Math.floor(i / 3);
        desiredDelay = batchIndex * 3.5;
      }

      // Pick a lane
      let lane;
      if (fallStyle === 'waves') {
        // Guarantee 3 distinct lanes per wave batch
        const waveLanes = [[0,2,4], [1,3,0], [2,4,1], [3,0,2], [4,1,3]];
        const batchIndex = Math.floor(i / 3);
        const idxInWave = i % 3;
        lane = waveLanes[batchIndex % waveLanes.length][idxInWave];
      } else {
        // Pick the lane that is free the earliest to ensure maximum vertical spacing
        lane = 0;
        let minTime = Infinity;
        for (let l = 0; l < NUM_LANES; l++) {
          if (laneNextAvailableTime[l] < minTime) {
            minTime = laneNextAvailableTime[l];
            lane = l;
          }
        }
      }

      // Ensure no vertical overlap in the same lane
      // A card needs about 15% of the total fall duration to clear its own height and give a gap
      const minGap = duration * 0.15; 
      
      const actualDelay = Math.max(desiredDelay, laneNextAvailableTime[lane]);
      
      // Update the lane's available time for the next word
      laneNextAvailableTime[lane] = actualDelay + minGap;

      // Calculate horizontal position with slight random jitter within the lane
      const jitter = Math.random() * (laneWidth * 0.4);
      const leftPosition = 10 + (lane * laneWidth) + jitter;

      return {
        id: `opt-${i}-${word}-${Math.random().toString(36).substr(2, 5)}`,
        word,
        left: leftPosition,
        delay: actualDelay,
        duration
      };
    });
    
    setFallingWords(fallers);
  };

  const handleCatch = (fw: FallingWord) => {
    if (gameState !== 'playing') return;

    const nextExpectedWordIndex = selectedWords.length;
    const expectedWord = targetWords[nextExpectedWordIndex];

    if (fw.word === expectedWord) {
      playGameSound('correct');
      const newSelected = [...selectedWords, fw.word];
      setSelectedWords(newSelected);
      setFallingWords(prev => prev.filter(o => o.id !== fw.id));
      setScore(s => s + 20);

      // Complete Ayah
      if (newSelected.length === targetWords.length) {
        setFallingWords([]); // Clear remaining falling words immediately
        setGameState('transition');
        
        setTimeout(() => {
          const nextCompleted = ayahsCompletedInPhase + 1;
          setAyahsCompletedInPhase(nextCompleted);
          
          if (nextCompleted >= phases[currentPhaseIdx].targetCount) {
            // Phase Complete
            if (currentPhaseIdx >= phases.length - 1) {
              playGameSound('win');
              setGameState('won');
            } else {
              playGameSound('win');
              setGameState('phase_complete');
            }
          } else {
            // Next Ayah in same phase
            setGameState('playing');
            generateLevel(phases[currentPhaseIdx], nextCompleted);
          }
        }, 1500); // 1.5s pause to read the full built ayah
      }
    } else {
      // Wrong catch
      playGameSound('wrong');
      setHealth(h => {
        const newH = h - 1;
        if (newH <= 0) {
          setTimeout(() => {
            playGameSound('lost');
            setGameState('lost');
          }, 300);
        }
        return newH;
      });
      setScore(s => Math.max(0, s - 5));
    }
  };

  // ----------------------------------------------------------------------
  // RENDER VIEWS
  // ----------------------------------------------------------------------

  if (gameState === 'setup') {
    return (
      <div className="bg-gradient-to-br from-sky-200 via-emerald-100 to-teal-200 rounded-3xl p-6 sm:p-8 border-4 border-white shadow-2xl text-center relative overflow-hidden min-h-[650px] md:h-[80vh] flex flex-col justify-center">
        <div className="absolute top-10 left-10 opacity-40"><Cloud size={80} className="text-white" /></div>
        <div className="absolute top-32 right-10 opacity-50"><Cloud size={60} className="text-white" /></div>
        <div className="absolute bottom-10 right-10 opacity-30"><TreeDeciduous size={100} className="text-emerald-700" /></div>
        
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl border-4 border-emerald-300 relative z-10">
          <Leaf className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-black text-emerald-800 mb-2 relative z-10 drop-shadow-md">صيد الآيات 🍂</h2>
        <p className="text-emerald-700 font-bold mb-6 relative z-10 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          الكلمات تتساقط كأوراق الشجر! اصطد الكلمة الصحيحة بالترتيب قبل انتهاء الوقت لتكوين الآية.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 relative z-10 w-full max-w-4xl mx-auto">
          
          {/* Range Selector */}
          <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border-2 border-white shadow-sm w-full lg:col-span-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Map className="text-emerald-600" size={24} />
              <span className="text-emerald-900 font-black text-lg sm:text-xl block">حدد النطاق (تقسيم السورة إلى مراحل):</span>
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              <div className="flex flex-col items-center">
                <label className="text-sm font-bold text-emerald-700 mb-2">من آية</label>
                <input 
                  type="number" min={1} max={totalAyahs} value={rangeStart} 
                  onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="w-24 p-2 sm:p-3 rounded-xl text-center font-black text-xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none shadow-inner text-emerald-800 bg-white"
                />
              </div>
              <div className="h-1 w-8 sm:w-16 bg-emerald-300 rounded-full mt-6"></div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-bold text-emerald-700 mb-2">إلى آية</label>
                <input 
                  type="number" min={1} max={totalAyahs} value={rangeEnd} 
                  onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="w-24 p-2 sm:p-3 rounded-xl text-center font-black text-xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none shadow-inner text-emerald-800 bg-white"
                />
              </div>
            </div>
            <p className="text-sm font-bold text-emerald-600 mt-4 bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-100">
              السورة تحتوي على {totalAyahs} آية
            </p>
          </div>

          {/* Hint Options */}
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border-2 border-white shadow-sm flex-1 w-full">
            <span className="text-emerald-800 font-bold text-base sm:text-lg block mb-3">مساعدة في الكلمة الأولى؟</span>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <button 
                onClick={() => setIsHintEnabled(true)}
                className={`px-4 py-2 rounded-xl font-bold transition-all border-2 flex items-center gap-2 text-sm sm:text-base ${isHintEnabled ? 'bg-emerald-500 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
              >
                نعم 💡
              </button>
              <button 
                onClick={() => setIsHintEnabled(false)}
                className={`px-4 py-2 rounded-xl font-bold transition-all border-2 flex items-center gap-2 text-sm sm:text-base ${!isHintEnabled ? 'bg-emerald-500 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
              >
                لا، سأتذكرها 🧠
              </button>
            </div>
          </div>

          {/* Falling Style Options */}
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border-2 border-white shadow-sm flex-1 w-full">
            <span className="text-emerald-800 font-bold text-base sm:text-lg block mb-3">نمط الكلمات:</span>
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => setFallStyle('normal')}
                className={`px-3 py-2 rounded-xl font-bold transition-all border-2 flex items-center gap-1.5 text-sm sm:text-base ${fallStyle === 'normal' ? 'bg-sky-500 text-white border-sky-600 shadow-md transform scale-105' : 'bg-white text-sky-600 border-sky-200 hover:bg-sky-50'}`}
              >
                <CloudRain size={16} /> طبيعي
              </button>
              <button 
                onClick={() => setFallStyle('fast')}
                className={`px-3 py-2 rounded-xl font-bold transition-all border-2 flex items-center gap-1.5 text-sm sm:text-base ${fallStyle === 'fast' ? 'bg-orange-500 text-white border-orange-600 shadow-md transform scale-105' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}
              >
                <Zap size={16} /> سريع
              </button>
              <button 
                onClick={() => setFallStyle('waves')}
                className={`px-3 py-2 rounded-xl font-bold transition-all border-2 flex items-center gap-1.5 text-sm sm:text-base ${fallStyle === 'waves' ? 'bg-indigo-500 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
              >
                <Layers size={16} /> أمواج
              </button>
              <button 
                onClick={() => setFallStyle('dense')}
                className={`px-3 py-2 rounded-xl font-bold transition-all border-2 flex items-center gap-1.5 text-sm sm:text-base ${fallStyle === 'dense' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md transform scale-105' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
              >
                <Wind size={16} /> كثيف
              </button>
            </div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 sm:px-12 sm:py-5 rounded-2xl font-black text-lg sm:text-2xl shadow-xl border-2 border-white/50 relative z-10 mx-auto"
        >
          ابدأ التحدي الآن! 🚀
        </motion.button>
      </div>
    );
  }

  if (gameState === 'phase_complete') {
    const nextPhase = phases[currentPhaseIdx + 1];
    return (
      <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl p-8 border-4 border-white shadow-2xl text-center relative overflow-hidden min-h-[650px] md:h-[80vh] flex flex-col justify-center items-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10 border-4 border-purple-200"
        >
          <Flag className="w-16 h-16 text-purple-500" />
        </motion.div>
        
        <h2 className="text-4xl sm:text-5xl font-black mb-4 relative z-10 text-purple-800 drop-shadow-sm">عمل رائع! 🌟</h2>
        <p className="text-purple-700 font-bold mb-8 relative z-10 text-xl sm:text-2xl">
          لقد أتممت <span className="bg-purple-200 px-3 py-1 rounded-lg">({phases[currentPhaseIdx]?.title})</span> بنجاح!
        </p>

        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl mb-8 border-2 border-white max-w-md w-full shadow-lg">
           <h3 className="text-purple-900 font-bold mb-3 text-lg">استعد للمهمة القادمة:</h3>
           <p className="text-2xl font-black text-purple-600 flex items-center justify-center gap-2">
             <Star className="text-yellow-500" /> {nextPhase?.title}
           </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCurrentPhaseIdx(prev => prev + 1);
            setAyahsCompletedInPhase(0);
            setGameState('playing');
            generateLevel(phases[currentPhaseIdx + 1], 0);
          }}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-xl border-2 border-white/50 relative z-10 mx-auto"
        >
          ابدأ المرحلة التالية 🚀
        </motion.button>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    const isWon = gameState === 'won';
    return (
      <div className={`rounded-3xl p-8 border-4 border-white shadow-2xl text-center relative overflow-hidden min-h-[650px] md:h-[80vh] flex flex-col justify-center ${isWon ? 'bg-gradient-to-br from-green-100 to-emerald-200' : 'bg-gradient-to-br from-orange-100 to-red-200'}`}>
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10"
        >
          {isWon ? <Trophy className="w-16 h-16 text-yellow-500" /> : <AlertTriangle className="w-16 h-16 text-red-500" />}
        </motion.div>
        
        <h2 className="text-4xl sm:text-5xl font-black mb-4 relative z-10 text-slate-800 drop-shadow-sm">
          {isWon ? 'أنت بطل الالتقاط! 🏆' : (health <= 0 ? 'نفدت المحاولات! 💔' : 'انتهى الوقت! ⏱️')}
        </h2>
        <p className="text-slate-700 font-bold mb-8 relative z-10 text-xl sm:text-2xl max-w-2xl mx-auto">
          {isWon ? `لقد أكملت جميع المراحل والمرحلة الشاملة بنجاح! نقاطك: ${score}` : `لقد وصلت إلى ${phases[currentPhaseIdx]?.title}. نقاطك: ${score}`}
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGameState('setup')}
          className="bg-white text-slate-800 px-8 py-4 rounded-2xl font-black text-xl shadow-xl border-2 border-slate-200 relative z-10 flex items-center justify-center gap-3 mx-auto"
        >
          <RefreshCw size={24} />
          {isWon ? 'العب نطاقاً جديداً' : 'أعد المحاولة يا بطل'}
        </motion.button>
      </div>
    );
  }

  // PLAYING & TRANSITION STATES
  return (
    <div className="bg-gradient-to-b from-sky-50 via-sky-100 to-green-100 rounded-3xl p-3 sm:p-6 border-4 border-white shadow-2xl relative overflow-hidden min-h-[650px] md:h-[80vh] flex flex-col">
      {/* Header Info Bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 bg-white/70 backdrop-blur-md p-3 rounded-2xl border-2 border-white shadow-lg relative z-20">
        
        {/* Phase Info */}
        <div className="flex items-center gap-3 bg-emerald-50 pr-2 pl-4 py-1.5 rounded-xl border border-emerald-100">
          <div className="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-md border-2 border-emerald-200">
            {ayahsCompletedInPhase + 1}
          </div>
          <div className="flex flex-col text-right">
            <span className="font-black text-emerald-800 text-sm sm:text-base hidden sm:block">{phases[currentPhaseIdx]?.title}</span>
            <span className="font-bold text-emerald-600 text-xs hidden sm:block">
              الآية {ayahsCompletedInPhase + 1} من {phases[currentPhaseIdx]?.targetCount}
            </span>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-black text-sm sm:text-lg border-2 shadow-inner transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : 'bg-sky-100 text-sky-700 border-sky-300'}`}>
          <Clock size={20} className={timeLeft <= 10 ? 'animate-bounce' : ''} />
          <span>{timeLeft} ثانية</span>
        </div>

        <div className="flex items-center gap-1 bg-red-50 p-2 rounded-xl border-2 border-red-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${i < health ? 'text-red-500 fill-red-500 scale-110 drop-shadow-md' : 'text-slate-300'}`} />
          ))}
        </div>
        
        <div className="bg-yellow-100 text-yellow-700 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-black shadow-inner flex items-center gap-2 border-2 border-yellow-200">
          <span className="text-lg sm:text-xl">{score}</span>
          <span className="text-xs sm:text-sm">نقطة</span>
        </div>
      </div>

      {/* Target area (Where words are placed) */}
      <div className="flex flex-col items-center justify-start relative z-20 w-full mb-4">
        <div className="bg-emerald-100 text-emerald-800 font-bold px-4 py-1.5 rounded-full text-xs sm:text-sm mb-3 border border-emerald-200 shadow-sm">
          أكمل الآية {ayahNum}
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full bg-white/60 backdrop-blur-sm p-4 rounded-2xl border-2 border-white shadow-md" dir="rtl">
          {targetWords.map((word, idx) => {
            const isSelected = idx < selectedWords.length;
            const isCurrentTarget = idx === selectedWords.length;
            const showHint = !isSelected && idx === 0 && isHintEnabled;
            return (
              <div 
                key={`slot-${idx}`} 
                className={`flex items-center justify-center rounded-xl px-3 py-2 min-w-[50px] sm:min-w-[70px] font-quran text-xl sm:text-3xl transition-all duration-300 shadow-sm ${
                  isSelected 
                    ? 'bg-emerald-500 text-white border-b-4 border-emerald-700 font-bold shadow-md transform scale-100' 
                    : isCurrentTarget
                      ? 'bg-white text-emerald-400 border-2 border-dashed border-emerald-400 animate-pulse scale-105 shadow-sm'
                      : 'bg-white/40 text-emerald-800/30 border-2 border-dashed border-slate-300 scale-95'
                }`}
              >
                {isSelected ? selectedWords[idx] : (showHint ? <span className="opacity-40">{targetWords[idx]}</span> : "؟")}
              </div>
            );
          })}
        </div>
      </div>

      {/* Falling Area (The "Sky") */}
      <div className="flex-1 relative w-full overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-sky-50 rounded-2xl border-4 border-sky-400 shadow-[inset_0_4px_20px_rgba(0,0,0,0.15)]">
        {/* Clouds in the sky */}
        <div className="absolute top-4 left-10 opacity-60"><Cloud size={60} className="text-white drop-shadow-md" /></div>
        <div className="absolute top-1/4 right-20 opacity-50"><Cloud size={80} className="text-white drop-shadow-md" /></div>
        <div className="absolute top-1/2 left-20 opacity-40"><Cloud size={40} className="text-white drop-shadow-md" /></div>

        <AnimatePresence>
          {gameState === 'playing' && fallingWords.map((fw) => (
            <motion.button
              key={fw.id}
              initial={{ y: -80, x: "-50%" }}
              animate={{ y: [ -80, 1000 ] }} // Ensure it falls way past the bottom
              transition={{ 
                duration: fw.duration, 
                repeat: Infinity, 
                ease: "linear",
                delay: fw.delay 
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCatch(fw)}
              className="absolute top-0 bg-white text-emerald-900 px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-quran text-2xl sm:text-4xl font-bold shadow-[0_6px_16px_rgba(0,0,0,0.2)] border-b-4 border-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors z-30 whitespace-nowrap cursor-pointer flex items-center justify-center min-w-[70px] sm:min-w-[100px]"
              style={{ left: `${fw.left}%` }}
            >
              {fw.word}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Transition Overlay (Success Banner) */}
        <AnimatePresence>
          {gameState === 'transition' && (
            <motion.div 
              key="ayah-catcher-transition"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            >
              <div className="bg-white/90 backdrop-blur-md px-8 py-5 rounded-3xl border-4 border-emerald-400 shadow-2xl flex items-center gap-4 flex-col sm:flex-row">
                <Star className="text-yellow-500 w-12 h-12 animate-spin-slow" />
                <span className="text-3xl font-black text-emerald-700">أحسنت! أكملت الآية</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Bottom edge visual indicator */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-emerald-300 to-transparent opacity-60 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default AyahCatcherGame;
