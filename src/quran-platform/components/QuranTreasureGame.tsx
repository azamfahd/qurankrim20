import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ArrowRight, Play, Volume2, ShieldAlert, Heart, Map, Lock, Unlock, CheckCircle2, XCircle, Gem, Crown, Check, Key, HelpCircle, FileText, Flame, Sparkles, Waves, Compass, Landmark, Sun, Moon } from 'lucide-react';
import { playGameSound } from '../../utils/gameAudio';

interface QuranTreasureGameProps {
  surahData: any;
}

const QuranTreasureGame: React.FC<QuranTreasureGameProps> = ({ surahData }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [gameState, setGameState] = useState<'map' | 'playing' | 'success' | 'gameover' | 'treasure'>('map');
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  
  // Game-specific states
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Word bridge state
  const [bridgeWords, setBridgeWords] = useState<{id: string, text: string}[]>([]);
  const [bridgeOrder, setBridgeOrder] = useState<{id: string, text: string}[]>([]);
  const [copiedCard, setCopiedCard] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanText = (text: string) => {
    return text.replace(/[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/g, '').replace(/ٱ/g, 'ا').trim();
  };

  const isBasmalah = (text: string) => {
    return cleanText(text) === "بسم الله الرحمن الرحيم";
  };

  const ayahs = surahData?.ayahs?.filter((a: any) => !isBasmalah(a.text)) || [];

  const LEVELS = [
    { id: 0, type: 'gate', title: 'بوابة الجبل النهارية', mode: 'day', icon: <Landmark className="w-6 h-6 text-amber-600" />, desc: 'أكمل الكلمة الناقصة المنقوشة على الصخر' },
    { id: 1, type: 'bridge', title: 'جسر الوادي المائي', mode: 'day', icon: <Waves className="w-6 h-6 text-sky-600" />, desc: 'رتب الكلمات لتعبر الجسر تحت الشمس' },
    { id: 2, type: 'cave', title: 'كهف الاستماع الليلي', mode: 'night', icon: <Sparkles className="w-6 h-6 text-purple-300" />, desc: 'ادخل الكهف المظلم واصغِ للتلاوة الكريستالية' },
    { id: 3, type: 'puzzle', title: 'دار الحكمة بالواحة', mode: 'day', icon: <HelpCircle className="w-6 h-6 text-emerald-600" />, desc: 'أجب عن سؤال السورة في ظلال الواحة' },
    { id: 4, type: 'guard', title: 'قلعة الحارس وقت الغروب', mode: 'dusk', icon: <ShieldAlert className="w-6 h-6 text-rose-500" />, desc: 'اختبر قوة حفظك أمام حارس القلعة' },
    { id: 5, type: 'treasure', title: 'الكنز القرآني المشع', mode: 'gold', icon: <Gem className="w-8 h-8 text-amber-300 animate-pulse" />, desc: 'افتتح صندوق المعرفة القرآني المبارك!' },
  ];

  const getRandomAyahs = (count: number, excludeAyahNum: number = -1) => {
    const pool = ayahs.filter((a: any) => a.numberInSurah !== excludeAyahNum);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const stopAllAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (_) {}
    }
  };

  useEffect(() => {
    if (gameState === 'success' || gameState === 'treasure') {
      stopAllAudio();
      playGameSound('win');
    } else {
      stopAllAudio();
    }

    return () => {
      stopAllAudio();
    };
  }, [gameState]);

  const handleCopyCard = () => {
    const surahNameClean = surahData?.name || 'القرآن الكريم';
    const cardText = `🏆 بطاقة وسام الكنز المعرفي القرآني - ${surahNameClean}\n` +
      `• عدد الآيات: ${surahData?.numberOfAyahs || 0} آية\n` +
      `• موطن النزول: ${surahData?.revelationType === 'Meccan' ? 'مكية 🕋' : 'مدنية 🕌'}\n` +
      `• النقاط المكتسبة: ${score} نقطة ⭐\n` +
      `• التقدير النهائي: ${health === 3 ? "درجة الشرف الأولى ⭐⭐⭐" : health === 2 ? "ممتاز جداً ⭐⭐" : "جيد جداً ⭐"}\n` +
      `تم إنجاز التحدي بنجاح في تطبيق أنيس القلوب! 💖`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cardText).then(() => {
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2500);
      }).catch(() => {});
    }
  };

  const startLevel = (levelIndex: number) => {
    stopAllAudio();
    setCurrentLevel(levelIndex);
    const level = LEVELS[levelIndex];
    setSelectedAnswer(null);
    setIsChecking(false);
    
    if (!ayahs || ayahs.length === 0) return;

    const randomAyah = ayahs[Math.floor(Math.random() * ayahs.length)];
    const randomAyahIndex = ayahs.findIndex((a: any) => a.numberInSurah === randomAyah.numberInSurah);

    if (level.type === 'gate') {
      const words = randomAyah.text.split(/\s+/);
      const hiddenIndex = Math.floor(Math.random() * words.length);
      const hiddenWord = words[hiddenIndex];
      
      const otherWords = Array.from(new Set(ayahs.flatMap((a: any) => a.text.split(/\s+/))));
      const fakePool = otherWords.filter(w => w !== hiddenWord).sort(() => Math.random() - 0.5);
      const options = [hiddenWord, ...fakePool.slice(0, 3)].sort(() => Math.random() - 0.5);
      
      setActiveQuestion({ type: 'gate', ayah: randomAyah, words, hiddenIndex, hiddenWord, options });
    } 
    else if (level.type === 'bridge') {
      const shortAyahs = ayahs.filter((a: any) => {
        const c = a.text.split(/\s+/).length;
        return c >= 3 && c <= 8;
      });
      const selected = shortAyahs.length > 0 ? shortAyahs[Math.floor(Math.random() * shortAyahs.length)] : randomAyah;
      
      const words = selected.text.split(/\s+/).map((w: string, i: number) => ({id: `w-${i}`, text: w}));
      setBridgeWords([...words].sort(() => Math.random() - 0.5));
      setBridgeOrder([]);
      setActiveQuestion({ type: 'bridge', ayah: selected, originalWords: words });
    }
    else if (level.type === 'cave') {
      const options = [randomAyah, ...getRandomAyahs(2, randomAyah.numberInSurah)].sort(() => Math.random() - 0.5);
      setActiveQuestion({ type: 'cave', ayah: randomAyah, options });
    }
    else if (level.type === 'puzzle') {
      const qType = Math.random() > 0.5 ? 'count' : 'name';
      let question, correct, options;
      
      if (qType === 'count') {
        question = `كم عدد آيات سورة ${surahData.name.replace('سُورَةُ ', '')}؟`;
        correct = surahData.numberOfAyahs;
        options = Array.from(new Set([correct, correct + 5, Math.max(1, correct - 2), correct + 10])).slice(0,4).sort(() => Math.random() - 0.5);
      } else {
        question = `ما هو اسم هذه السورة الكريمة؟`;
        correct = surahData.name.replace('سُورَةُ ', '');
        options = [correct, "البقرة", "الكهف", "الملك"].filter((v, i, a) => a.indexOf(v) === i).slice(0,4).sort(() => Math.random() - 0.5);
        if(!options.includes(correct)) options[0] = correct;
        options.sort(() => Math.random() - 0.5);
      }
      
      setActiveQuestion({ type: 'puzzle', question, correct, options });
    }
    else if (level.type === 'guard') {
      const curr = randomAyahIndex < ayahs.length - 1 ? ayahs[randomAyahIndex] : ayahs[0];
      const next = ayahs.find((a: any) => a.numberInSurah === curr.numberInSurah + 1);
      
      if (next) {
        const options = [next, ...getRandomAyahs(2, next.numberInSurah)].sort(() => Math.random() - 0.5);
        setActiveQuestion({ type: 'guard', currAyah: curr, nextAyah: next, options });
      } else {
        setActiveQuestion({ type: 'guard', currAyah: curr, nextAyah: curr, options: [curr] });
      }
    }
    else if (level.type === 'treasure') {
      setGameState('treasure');
      return;
    }
    
    setGameState('playing');
    playGameSound('start');
  };

  const handleAnswer = (answer: any, isCorrect: boolean) => {
    if (isChecking) return;
    setSelectedAnswer(answer);
    setIsChecking(true);
    
    if (isCorrect) {
      playGameSound('correct');
      setScore(s => s + 100);
      setTimeout(() => setGameState('success'), 1500);
    } else {
      playGameSound('wrong');
      setHealth(h => h - 1);
      setTimeout(() => {
        if (health <= 1) {
          setGameState('gameover');
          playGameSound('lost');
        } else {
          setIsChecking(false);
          setSelectedAnswer(null);
        }
      }, 1500);
    }
  };

  const handleBridgeWordClick = (word: any) => {
    if (isChecking) return;
    
    setBridgeOrder([...bridgeOrder, word]);
    setBridgeWords(bridgeWords.filter(w => w.id !== word.id));
    
    if (bridgeWords.length === 1) {
      setIsChecking(true);
      const finalOrder = [...bridgeOrder, word];
      const isCorrect = finalOrder.every((w, i) => w.id === activeQuestion.originalWords[i].id);
      
      if (isCorrect) {
        playGameSound('correct');
        setScore(s => s + 150);
        setTimeout(() => setGameState('success'), 1500);
      } else {
        playGameSound('wrong');
        setHealth(h => h - 1);
        setTimeout(() => {
          if (health <= 1) {
            setGameState('gameover');
            playGameSound('lost');
          } else {
            setIsChecking(false);
            setBridgeWords(activeQuestion.originalWords.sort(() => Math.random() - 0.5));
            setBridgeOrder([]);
          }
        }, 1500);
      }
    }
  };

  const playAudio = async (audioUrl: string) => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (_) {}
      audioRef.current.currentTime = 0;
      audioRef.current.src = audioUrl;
      try {
        await audioRef.current.play();
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message?.includes('interrupted')) {
          return;
        }
        console.warn('Audio playback notice:', e?.message || e);
      }
    }
  };

  const renderMap = () => {
    return (
      <div className="relative min-h-[600px] w-full bg-gradient-to-b from-sky-400 via-amber-100 to-emerald-100 rounded-3xl p-6 border-4 border-amber-500/50 overflow-hidden flex flex-col items-center shadow-2xl text-slate-800">
        {/* Sun & Cloud Atmosphere for Day Map */}
        <div className="absolute top-4 right-6 text-amber-500 opacity-90 animate-spin-slow">
          <Sun size={64} className="fill-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
        </div>
        <div className="absolute top-8 left-8 opacity-30 text-sky-700"><Sparkles size={28} /></div>
        <div className="absolute bottom-12 left-12 opacity-40 text-emerald-700"><Compass size={36} /></div>

        <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-amber-400/60 shadow-2xl flex justify-between w-full max-w-md relative z-10 mb-6 text-white">
          <div className="flex items-center gap-2 font-black text-amber-300">
            <Star className="text-amber-400 fill-amber-400 w-5 h-5" /> {score} نقطة
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`w-5 h-5 ${i < health ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-slate-700'}`} />
            ))}
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mb-1 relative z-10 text-center drop-shadow-sm">
          خريطة الكنز القرآني 🗺️
        </h2>
        <p className="text-emerald-800 font-bold mb-6 relative z-10 text-center text-sm sm:text-base max-w-md bg-white/70 px-4 py-1.5 rounded-full border border-emerald-300 shadow-sm">
          مغامرة في سورة {surahData?.name?.replace('سُورَةُ ', '')} • من الطبيعة النهارية إلى الكهف الكريستالي
        </p>

        <div className="relative w-full max-w-md flex-1 flex flex-col items-center justify-around z-10 py-4">
          {/* Path line */}
          <div className="absolute top-8 bottom-8 left-1/2 w-3 bg-gradient-to-b from-amber-400 via-emerald-500 to-amber-500 -translate-x-1/2 rounded-full z-0 border-x-2 border-white/80 shadow-md"></div>
          
          {LEVELS.map((level, idx) => {
            const isUnlocked = idx <= currentLevel;
            const isCurrent = idx === currentLevel;
            const isCompleted = idx < currentLevel;
            
            return (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative z-10 flex items-center gap-4 w-full ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`flex-1 ${idx % 2 === 0 ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                    {level.mode === 'night' ? (
                      <span className="bg-purple-950 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400 flex items-center gap-1">
                        <Moon size={10} /> بيئة الكهف الليلي
                      </span>
                    ) : level.mode === 'dusk' ? (
                      <span className="bg-rose-950 text-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-400 flex items-center gap-1">
                        <Flame size={10} /> بيئة الغروب
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Sun size={10} /> بيئة نهارية
                      </span>
                    )}
                  </div>
                  <h3 className={`font-black text-base sm:text-lg ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>{level.title}</h3>
                  <p className={`text-xs font-bold ${isUnlocked ? 'text-slate-700' : 'text-slate-400'}`}>{level.desc}</p>
                </div>
                
                <motion.button
                  whileHover={isCurrent ? { scale: 1.15 } : {}}
                  whileTap={isCurrent ? { scale: 0.95 } : {}}
                  onClick={() => isCurrent ? startLevel(idx) : null}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-300
                    ${isCompleted ? 'bg-emerald-600 border-emerald-200 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                      isCurrent ? (level.mode === 'night' 
                        ? 'bg-purple-600 border-purple-200 text-white animate-bounce cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.8)]' 
                        : 'bg-amber-500 border-amber-100 text-slate-950 animate-bounce cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.8)]') : 
                      'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed'}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-8 h-8 text-white" /> : (isUnlocked ? level.icon : <Lock className="w-5 h-5" />)}
                </motion.button>
                
                <div className="flex-1"></div>
              </motion.div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderActiveLevel = () => {
    if (!activeQuestion) return null;

    return (
      <div className="w-full min-h-[520px] flex flex-col items-center justify-center relative z-10">
        
        {/* ========================================================================
            LEVEL 0: GATE (بوابة الجبل النهارية - Sunny Mountain Rock Arch)
            ======================================================================== */}
        {activeQuestion.type === 'gate' && (
          <div className="w-full max-w-3xl bg-gradient-to-b from-sky-300 via-amber-50 to-emerald-100 rounded-3xl p-6 sm:p-10 border-4 border-amber-500 shadow-2xl relative overflow-hidden flex flex-col items-center text-center text-slate-900">
            {/* Sun Rays & Sky Ambient */}
            <div className="absolute top-4 right-6 text-amber-500 opacity-90 animate-spin-slow">
              <Sun size={48} className="fill-amber-400" />
            </div>

            <div className="bg-amber-100/90 border border-amber-400 text-amber-900 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-sm mb-6 flex items-center gap-2">
              <Landmark size={18} className="text-amber-600" />
              <span>بوابة الجبل النهارية: اكشف الكلمة المنقوشة على الصخور</span>
            </div>

            {/* Carved Mountain Rock Tablet */}
            <div className="w-full bg-gradient-to-b from-amber-100 via-stone-100 to-amber-200 p-6 sm:p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-4 border-amber-600/60 text-xl sm:text-3xl font-quran leading-loose mb-8 text-stone-900 relative" dir="rtl">
              <div className="absolute top-2 right-4 text-amber-700/60 text-xs font-mono font-bold">آية {activeQuestion.ayah?.numberInSurah}</div>
              {activeQuestion.words.map((w: string, i: number) => {
                if (i === activeQuestion.hiddenIndex) {
                  return (
                    <span key={i} className={`inline-block min-w-[90px] h-10 sm:h-14 border-b-4 mx-1.5 transition-all px-2 font-bold rounded-t-lg align-middle
                      ${selectedAnswer 
                        ? (selectedAnswer === activeQuestion.hiddenWord ? 'text-emerald-700 border-emerald-600 bg-emerald-100' : 'text-rose-700 border-rose-600 bg-rose-100')
                        : 'border-amber-600 text-amber-800 bg-amber-200/80 animate-pulse'}`}>
                      {selectedAnswer || "؟"}
                    </span>
                  );
                }
                return w + ' ';
              })}
            </div>

            {/* Keys / Sunlit Golden Stone Blocks */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {activeQuestion.options.map((opt: string, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.04, translateY: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleAnswer(opt, opt === activeQuestion.hiddenWord)}
                  disabled={isChecking}
                  className={`p-4 sm:p-6 rounded-2xl font-quran text-2xl sm:text-3xl shadow-lg border-2 transition-all flex items-center justify-center gap-2
                    ${selectedAnswer === opt 
                      ? (opt === activeQuestion.hiddenWord ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-rose-600 border-rose-400 text-white')
                      : 'bg-white border-amber-400 text-amber-950 hover:bg-amber-100 hover:border-amber-600'}`}
                >
                  <Key size={20} className="text-amber-600" />
                  <span>{opt}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================
            LEVEL 1: BRIDGE (جسر الوادي المائي - Sunny River Bridge Day)
            ======================================================================== */}
        {activeQuestion.type === 'bridge' && (
          <div className="w-full max-w-3xl bg-gradient-to-b from-sky-400 via-cyan-100 to-emerald-200 rounded-3xl p-6 sm:p-8 border-4 border-cyan-400 shadow-2xl relative overflow-hidden flex flex-col items-center text-center text-slate-900">
            {/* Sun & Blue Sky River Ambient */}
            <div className="absolute top-4 right-6 text-amber-500 opacity-90 animate-spin-slow">
              <Sun size={48} className="fill-amber-400" />
            </div>

            <div className="relative z-10 mb-4 flex items-center gap-2 text-sky-950 font-bold text-sm bg-white/80 px-4 py-1.5 rounded-full border border-sky-300 shadow-sm">
              <Waves size={18} className="text-cyan-600" />
              <span>جسر الوادي المائي المشمس: اضغط الكلمات لتثبيتها على ألواح الجسر</span>
            </div>

            {/* The Wooden Bridge Deck */}
            <div className="w-full bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 p-6 sm:p-8 rounded-3xl border-y-4 border-amber-950 shadow-2xl min-h-[140px] flex flex-wrap justify-center items-center gap-3 relative mb-8" dir="rtl">
              <div className="absolute -top-3 left-0 right-0 h-2 bg-amber-900 rounded-full border-b border-amber-950"></div>
              <div className="absolute -bottom-3 left-0 right-0 h-2 bg-amber-900 rounded-full border-t border-amber-950"></div>

              {bridgeOrder.map((w, i) => (
                <motion.div
                  key={`bo-${i}`}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-amber-100 text-amber-950 px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-quran text-2xl sm:text-3xl font-bold border-2 border-amber-500 shadow-md"
                >
                  {w.text}
                </motion.div>
              ))}
              {bridgeOrder.length === 0 && (
                <span className="text-amber-100/70 font-bold text-lg my-auto">
                  الجسر الخشبي ينتظر ترتيب الكلمات لعبور الوادي 🌉
                </span>
              )}
            </div>

            {/* Floating River Stones */}
            <div className="flex flex-wrap justify-center gap-3 relative z-10">
              <AnimatePresence>
                {bridgeWords.map((w) => (
                  <motion.button
                    key={w.id}
                    layout
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.1, translateY: -3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleBridgeWordClick(w)}
                    disabled={isChecking}
                    className="bg-white text-sky-950 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-quran text-2xl sm:text-3xl font-bold shadow-lg border-2 border-cyan-400 hover:bg-cyan-50 transition-colors"
                  >
                    {w.text}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ========================================================================
            LEVEL 2: CAVE (كهف الاستماع الليلي - Dark Night Crystal Cave)
            ======================================================================== */}
        {activeQuestion.type === 'cave' && (
          <div className="w-full max-w-3xl bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-10 border-4 border-purple-500/80 shadow-[0_0_60px_rgba(168,85,247,0.4)] relative overflow-hidden flex flex-col items-center text-center text-white">
            {/* Night Sky Outside Cave & Glowing Moon */}
            <div className="absolute top-4 left-6 flex items-center gap-2 text-purple-200">
              <Moon className="w-8 h-8 text-purple-300 fill-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
              <span className="text-xs font-bold text-purple-300">البيئة الليلية داخل الكهف</span>
            </div>
            <div className="absolute top-6 right-8 opacity-70 text-cyan-300 animate-pulse"><Sparkles size={28} /></div>

            <div className="mb-6 z-10 flex items-center gap-2 text-purple-200 font-bold text-sm bg-purple-900/80 px-4 py-1.5 rounded-full border border-purple-400 shadow-inner">
              <Sparkles size={18} className="text-purple-300" />
              <span>اصغِ للتلاوة الكريستالية داخل الكهف ثم اختر الآية المطابقة</span>
            </div>

            {/* Glowing Audio Crystal Orb */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => playAudio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${activeQuestion.ayah.number}.mp3`)}
              className="w-28 h-28 sm:w-36 sm:h-36 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(168,85,247,0.8)] border-4 border-purple-200 mb-8 relative z-10 group"
            >
              <div className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-ping pointer-events-none"></div>
              <Play className="w-14 h-14 ml-2 text-purple-100 group-hover:scale-110 transition-transform" />
            </motion.button>

            {/* Crystal Inscribed Options */}
            <div className="space-y-4 w-full relative z-10">
              {activeQuestion.options.map((opt: any, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(opt, opt.numberInSurah === activeQuestion.ayah.numberInSurah)}
                  disabled={isChecking}
                  className={`w-full p-4 sm:p-5 rounded-2xl font-quran text-xl sm:text-2xl shadow-xl border-2 text-right transition-all flex items-center justify-between
                    ${selectedAnswer === opt 
                      ? (opt.numberInSurah === activeQuestion.ayah.numberInSurah ? 'bg-emerald-900/90 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.6)]' : 'bg-rose-900/90 border-rose-500 text-rose-100')
                      : 'bg-slate-900/90 border-purple-500/50 text-purple-100 hover:bg-purple-950/80 hover:border-purple-300'}`}
                  dir="rtl"
                >
                  <span className="leading-loose">{opt.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================
            LEVEL 3: PUZZLE (دار الحكمة بالواحة - Oasis Wisdom Pavilion Day)
            ======================================================================== */}
        {activeQuestion.type === 'puzzle' && (
          <div className="w-full max-w-3xl bg-gradient-to-b from-amber-200 via-orange-50 to-emerald-100 rounded-3xl p-6 sm:p-10 border-4 border-amber-500 shadow-2xl relative overflow-hidden flex flex-col items-center text-center text-slate-900">
            <div className="absolute top-4 right-6 text-amber-500 opacity-90 animate-spin-slow">
              <Sun size={48} className="fill-amber-400" />
            </div>

            <div className="bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-500/60 p-6 sm:p-8 rounded-3xl shadow-xl mb-8 w-full text-amber-950 relative">
              <span className="bg-amber-500 text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full mb-3 inline-block">سؤال دار الحكمة بقلب الواحة</span>
              <h3 className="text-2xl sm:text-3xl font-black leading-snug">{activeQuestion.question}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              {activeQuestion.options.map((opt: any, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(opt, opt === activeQuestion.correct)}
                  disabled={isChecking}
                  className={`p-4 sm:p-6 rounded-2xl font-bold text-xl sm:text-2xl shadow-lg border-2 transition-all
                    ${selectedAnswer === opt 
                      ? (opt === activeQuestion.correct ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white')
                      : 'bg-white border-amber-400 text-amber-950 hover:bg-amber-100 hover:border-amber-600'}`}
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================
            LEVEL 4: GUARD (قلعة الحارس وقت الغروب - Sunset Citadel Guard)
            ======================================================================== */}
        {activeQuestion.type === 'guard' && (
          <div className="w-full max-w-3xl bg-gradient-to-b from-rose-950 via-red-900 to-slate-900 rounded-3xl p-6 sm:p-10 border-4 border-rose-500/80 shadow-[0_0_50px_rgba(225,29,72,0.3)] relative overflow-hidden flex flex-col items-center text-center text-white">
            <div className="bg-slate-900/90 text-rose-100 p-6 rounded-3xl shadow-2xl border-2 border-rose-500/60 font-quran text-2xl leading-loose mb-4 relative w-full" dir="rtl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-4 py-1 rounded-full font-bold text-xs sm:text-sm shadow-md flex items-center gap-1">
                <ShieldAlert size={16} /> قلعة الحارس وقت الغروب: الآية السابقة
              </div>
              <p className="mt-2 text-amber-100">{activeQuestion.currAyah.text}</p>
            </div>

            <p className="font-bold text-rose-200 my-4 text-lg sm:text-xl">ما هي الآية التالية المكملة للتسلسل الحفظي؟</p>

            <div className="space-y-3 w-full">
              {activeQuestion.options.map((opt: any, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(opt, opt.numberInSurah === activeQuestion.nextAyah.numberInSurah)}
                  disabled={isChecking}
                  className={`w-full p-4 rounded-2xl font-quran text-xl shadow-xl border-2 text-right transition-all
                    ${selectedAnswer === opt 
                      ? (opt.numberInSurah === activeQuestion.nextAyah.numberInSurah ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100' : 'bg-rose-950/90 border-rose-500 text-rose-100')
                      : 'bg-slate-900/90 border-rose-800/50 text-slate-100 hover:bg-rose-950/80 hover:border-rose-400'}`}
                  dir="rtl"
                >
                  <span className="leading-loose">{opt.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentMode = gameState === 'playing' ? LEVELS[currentLevel]?.mode : 'day';

  return (
    <div className={`rounded-3xl p-3 sm:p-6 border-4 shadow-2xl relative overflow-hidden min-h-[650px] md:h-[80vh] flex flex-col transition-colors duration-500
      ${currentMode === 'night' ? 'bg-slate-950 border-purple-800' : 
        currentMode === 'dusk' ? 'bg-slate-950 border-rose-800' : 
        'bg-slate-900 border-amber-600/60'}`}>
      <audio ref={audioRef} className="hidden" />
      
      {gameState === 'playing' && (
        <div className="flex justify-between items-center bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 shadow-lg mb-6 relative z-20">
          <div className="flex gap-1">
             {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`w-6 h-6 ${i < health ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-800'}`} />
            ))}
          </div>
          <div className="font-black text-amber-300 text-sm sm:text-base">مرحلة {currentLevel + 1} من {LEVELS.length}</div>
          <div className="flex items-center gap-2 bg-amber-950/80 px-3 py-1 rounded-xl text-amber-300 font-bold border border-amber-500/30">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {score} نقطة
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar relative w-full flex flex-col items-center justify-center">
        {gameState === 'map' && renderMap()}
        {gameState === 'playing' && (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex-1 flex flex-col items-center justify-center">
             {renderActiveLevel()}
           </motion.div>
        )}

        <AnimatePresence>
          {gameState === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6 text-center">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="w-24 h-24 sm:w-28 sm:h-28 bg-emerald-500/20 border-4 border-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] mb-4">
                <Check className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black mb-2 drop-shadow-md text-emerald-300">أحسنت يا بطل القرآن! 🌟</h2>
              <p className="text-xl font-bold opacity-90 mb-6 text-amber-300">+100 نقطة مكتسبة</p>

              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => { 
                  stopAllAudio();
                  if (currentLevel + 1 >= LEVELS.length) {
                    setGameState('treasure');
                  } else {
                    setGameState('map'); 
                    setCurrentLevel(l => l + 1);
                  }
                }} 
                className="bg-emerald-500 text-slate-950 px-8 py-3.5 rounded-2xl font-black text-xl sm:text-2xl shadow-xl hover:bg-emerald-400 transition-colors flex items-center gap-3"
              >
                {currentLevel + 1 >= LEVELS.length ? "افتح الكنز المعرفي 💎" : "المرحلة التالية"} <ArrowRight className="rotate-180" />
              </motion.button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6 text-center">
              <XCircle className="w-28 h-28 mb-4 text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]" />
              <h2 className="text-3xl sm:text-4xl font-black mb-2 drop-shadow-md text-rose-300">نفدت المحاولات!</h2>
              <p className="text-lg font-bold opacity-90 mb-8 max-w-md leading-relaxed text-slate-300">لا تحزن، الطريق إلى الكنز المعرفي يتطلب الصبر والمحاولة مرة أخرى!</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { stopAllAudio(); setHealth(3); setScore(0); setCurrentLevel(0); setGameState('map'); }} className="bg-rose-600 text-white px-8 py-3.5 rounded-2xl font-black text-xl shadow-xl hover:bg-rose-500 transition-colors">
                ابدأ من جديد 🔄
              </motion.button>
            </motion.div>
          )}

          {gameState === 'treasure' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 overflow-y-auto p-4 sm:p-6 flex flex-col items-center text-amber-300 text-center">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="relative mb-4 mt-2">
                <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-50 rounded-full"></div>
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 sm:border-8 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.7)] bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 flex items-center justify-center relative z-10">
                  <Gem className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </div>
                <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-amber-300 absolute -top-5 -right-2 z-20 drop-shadow-xl rotate-12" />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl font-black mb-2 drop-shadow-md text-amber-200">الكنز المعرفي القرآني! 💎</h2>
              <p className="text-amber-300/90 font-bold mb-6 text-sm sm:text-base">تهانينا الحارة! لقد أتممت جميع اختبارات ومراحل المغامرة بنجاح</p>

              {/* The Golden Royal Certificate Card */}
              <div className="bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 p-5 sm:p-8 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] max-w-lg w-full border-4 border-amber-400/80 relative mb-6 text-right text-amber-100">
                <div className="absolute top-3 left-3 text-amber-400/30"><Sparkles size={20} /></div>
                <div className="absolute top-3 right-3 text-amber-400/30"><Sparkles size={20} /></div>

                <div className="flex justify-center -mt-9 sm:-mt-12 mb-4">
                  <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black px-5 py-1.5 rounded-full border-2 border-amber-200 shadow-xl flex items-center gap-2 text-xs sm:text-sm">
                    <Trophy size={16} className="fill-slate-950" />
                    <span>بطاقة وسام الشرف القرآني</span>
                  </span>
                </div>

                <div className="space-y-3 divide-y divide-amber-500/20 text-xs sm:text-sm font-bold">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-amber-200 font-black text-base sm:text-lg">{surahData?.name}</span>
                    <span className="text-amber-400/90 flex items-center gap-1.5"><FileText size={15} /> السورة الكريمة:</span>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <span className="text-amber-100">{surahData?.numberOfAyahs} آية مباركة</span>
                    <span className="text-amber-400/90">عدد الآيات:</span>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <span className="text-amber-100">{surahData?.revelationType === 'Meccan' ? 'مكية (نزلت بمكة المكرمة) 🕋' : 'مدنية (نزلت بالمدينة المنورة) 🕌'}</span>
                    <span className="text-amber-400/90">موطن النزول:</span>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <span className="text-amber-300 font-black text-base sm:text-lg">{score} نقطة kenz</span>
                    <span className="text-amber-400/90 flex items-center gap-1.5"><Star size={15} className="fill-amber-400 text-amber-400" /> النقاط المكتسبة:</span>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Heart key={i} size={16} className={i < health ? "fill-rose-500 text-rose-500" : "text-slate-600"} />
                      ))}
                    </div>
                    <span className="text-amber-400/90">المحاولات المتبقية:</span>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-black">
                      {health === 3 ? "درجة الشرف الأولى ⭐⭐⭐" : health === 2 ? "ممتاز جداً ⭐⭐" : "جيد جداً ⭐"}
                    </span>
                    <span className="text-amber-400/90">التقييم النهائي:</span>
                  </div>
                </div>

                <div className="mt-5 bg-slate-900/80 p-3.5 rounded-2xl text-amber-200 font-medium text-xs border border-amber-500/30 text-center leading-relaxed">
                  <p className="font-bold text-amber-300 mb-0.5">«خيركم من تعلم القرآن وعلّمه»</p>
                  <p className="opacity-90">هنيئاً لك هذا المحصول المعرفي المبارك، استمر في حفظ وتدبر كتاب الله تعالى!</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button 
                    onClick={handleCopyCard}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md"
                  >
                    <Check size={16} className={copiedCard ? "text-emerald-400" : ""} />
                    <span>{copiedCard ? "تم نسخ بطاقة الكنز المعرفي!" : "مشاركة بطاقة الكنز القرآني 📋"}</span>
                  </button>
                </div>
              </div>

              <div className="pb-8 z-10">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => { stopAllAudio(); setHealth(3); setScore(0); setCurrentLevel(0); setGameState('map'); }} 
                  className="bg-amber-500 text-slate-950 px-8 py-3.5 rounded-2xl font-black text-lg shadow-xl border-2 border-amber-300 hover:bg-amber-400 transition-colors flex items-center gap-2"
                >
                  <Map size={20} />
                  <span>العودة لخريطة المغامرة 🗺️</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuranTreasureGame;
