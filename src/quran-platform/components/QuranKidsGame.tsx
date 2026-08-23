import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Trophy, RefreshCw, Heart, Music, CheckCircle2, XCircle } from 'lucide-react';
import { getCleanSurahName } from './AyahMarker';
import { playGameSound } from '../../utils/gameAudio';

interface QuranKidsGameProps {
  surahData: any;
  currentSurah: number;
}

const QuranKidsGame: React.FC<QuranKidsGameProps> = ({ surahData, currentSurah }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [score, setScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [question, setQuestion] = useState<{
    ayahNum: number;
    fullText: string;
    missingWord: string;
    options: string[];
    wordIndex: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [stars, setStars] = useState<number>(0);

  const startGame = () => {
    playGameSound('start');
    setGameState('playing');
    setScore(0);
    setStars(0);
    setCurrentLevel(1);
    generateQuestion();
  };

  const generateQuestion = () => {
    if (!surahData || !surahData.ayahs || surahData.ayahs.length === 0) return;
    
    // Pick a random ayah
    const randomAyahIdx = Math.floor(Math.random() * surahData.ayahs.length);
    const ayah = surahData.ayahs[randomAyahIdx];
    
    const words = ayah.text.trim().split(/\s+/).filter((w: string) => w.length > 2);
    if (words.length === 0) {
      // Fallback if no long words
      const allWords = ayah.text.trim().split(/\s+/);
      words.push(allWords[Math.floor(allWords.length / 2)] || 'الله');
    }
    const missingIdx = Math.floor(Math.random() * words.length);
    const missingWord = words[missingIdx];

    // Get distractors from the whole surah
    const allSurahWords: string[] = Array.from(new Set(surahData.ayahs.flatMap((a: any) => a.text.trim().split(/\s+/))));
    const distractors = allSurahWords.filter((w: string) => w !== missingWord && w.length > 2).sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Fallback if not enough distractors
    while (distractors.length < 3) {
      distractors.push('الله', 'الرَّحْمَٰنِ', 'الرَّحِيمِ')[distractors.length];
    }

    const options = [missingWord, ...distractors].sort(() => Math.random() - 0.5);

    setQuestion({
      ayahNum: ayah.numberInSurah,
      fullText: ayah.text,
      missingWord,
      options,
      wordIndex: missingIdx
    });
    setFeedback(null);
  };

  const handleAnswer = (selected: string) => {
    if (feedback !== null || !question) return;

    if (selected === question.missingWord) {
      playGameSound('correct');
      setFeedback('correct');
      setScore(s => s + 10);
      setStars(s => s + 1);
      
      setTimeout(() => {
        if (currentLevel >= 5) {
          setGameState('won');
          playGameSound('win');
        } else {
          setCurrentLevel(l => l + 1);
          generateQuestion();
        }
      }, 1500);
    } else {
      playGameSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        playGameSound('lost');
        setGameState('lost');
      }, 1500);
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl p-8 border-4 border-white shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"> 
          <div className="absolute top-10 left-10 text-4xl opacity-20">⭐</div> 
          <div className="absolute bottom-10 right-10 text-4xl opacity-20">🎈</div> 
          <div className="absolute top-1/2 right-20 text-4xl opacity-20">🚀</div>
        </div>
        
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-purple-200 relative z-10">
          <Sparkles className="w-12 h-12 text-purple-500" />
        </div>
        
        <h2 className="text-3xl font-black text-purple-800 mb-2 relative z-10">مغامرة الأبطال مع القرآن! 🦸‍♂️🦸‍♀️</h2>
        <p className="text-purple-600 font-bold mb-8 relative z-10 text-lg">العب واستمتع وتعلم سورة {getCleanSurahName(surahData?.name || '')}</p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg border-2 border-white/50 relative z-10"
        >
          ابدأ اللعب الآن! 🚀
        </motion.button>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    const isWon = gameState === 'won';
    return (
      <div className={`rounded-3xl p-8 border-4 border-white shadow-xl text-center relative overflow-hidden ${isWon ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-gradient-to-br from-orange-100 to-red-100'}`}>
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10"
        >
          {isWon ? <Trophy className="w-14 h-14 text-yellow-500" /> : <Heart className="w-14 h-14 text-red-500" />}
        </motion.div>
        
        <h2 className="text-4xl font-black mb-2 relative z-10 text-slate-800">
          {isWon ? 'أنت بطل رائع! 🌟' : 'حاول مرة أخرى يا بطل! 💪'}
        </h2>
        <p className="text-slate-600 font-bold mb-6 relative z-10 text-xl">
          {isWon ? `لقد أكملت جميع المستويات! نقاطك: ${score}` : `لقد وصلت للمستوى ${currentLevel}. نقاطك: ${score}`}
        </p>
        <div className="flex justify-center gap-2 mb-8 relative z-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-10 h-10 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
          ))}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="bg-white text-slate-800 px-8 py-3 rounded-2xl font-black text-lg shadow-md border-2 border-slate-200 relative z-10 flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={24} />
          {isWon ? 'العب مرة أخرى' : 'أعد المحاولة'}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-8 border-4 border-amber-500/40 shadow-2xl relative overflow-hidden min-h-[420px] flex flex-col text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 shadow-md relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-slate-950 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-md">
            {currentLevel}
          </div>
          <span className="font-bold text-amber-200">المستوى</span>
        </div>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-6 h-6 transition-all ${i < stars ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-slate-800'}`} />
          ))}
        </div>
        
        <div className="bg-amber-950/80 text-amber-300 px-4 py-2 rounded-xl font-black border border-amber-500/40 shadow-inner flex items-center gap-1">
          <span className="text-xl">{score}</span>
          <span className="text-xs">نقطة</span>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <h3 className="text-center font-bold text-amber-200/90 mb-4">أكمل الآية (سورة {getCleanSurahName(surahData?.name || '')} - آية {question?.ayahNum}):</h3>
        
        {/* Carved Stone Tablet */}
        <div className="bg-gradient-to-b from-stone-900 via-slate-900 to-stone-900 p-6 sm:p-8 rounded-3xl shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] border-2 border-amber-500/40 text-center mb-8 relative">
          {feedback === 'correct' && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-6 -right-6 text-emerald-400 bg-slate-900 border-2 border-emerald-400 rounded-full p-1 shadow-2xl">
              <CheckCircle2 size={48} className="fill-emerald-950" />
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-6 -right-6 text-rose-400 bg-slate-900 border-2 border-rose-400 rounded-full p-1 shadow-2xl">
              <XCircle size={48} className="fill-rose-950" />
            </motion.div>
          )}
          
          <p className="font-quran text-2xl sm:text-3xl leading-loose text-amber-100 break-words" dir="rtl">
            {question?.fullText.split(/\s+/).map((word, idx) => {
              const isTarget = word === question.missingWord;
              if (isTarget) {
                return (
                  <span key={idx} className={`inline-block mx-1.5 px-4 py-1 rounded-xl font-quran font-bold transition-all align-middle ${
                    feedback === 'correct' ? 'bg-emerald-900/90 text-emerald-200 border-2 border-emerald-400' :
                    feedback === 'wrong' ? 'bg-rose-900/90 text-rose-200 border-2 border-rose-400' :
                    'bg-amber-950/50 text-amber-300 border-2 border-dashed border-amber-500/60 min-w-[80px]'
                  }`}>
                    {feedback === 'correct' ? word : '؟'}
                  </span>
                );
              }
              return word + ' ';
            })}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto">
          {question?.options.map((opt, idx) => {
            let btnStyle = "bg-slate-900/90 hover:bg-amber-950/60 text-amber-200 border-2 border-amber-600/40 shadow-xl";
            if (feedback !== null) {
              if (opt === question.missingWord) {
                btnStyle = "bg-emerald-900/90 text-emerald-200 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105 z-10";
              } else {
                btnStyle = "bg-slate-900/40 text-slate-600 border-slate-800 opacity-40";
              }
            }
            return (
              <motion.button
                whileHover={feedback === null ? { scale: 1.03 } : {}}
                whileTap={feedback === null ? { scale: 0.95 } : {}}
                key={idx}
                onClick={() => handleAnswer(opt)}
                disabled={feedback !== null}
                className={`py-4 sm:py-5 rounded-2xl font-quran text-xl sm:text-2xl transition-all ${btnStyle}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuranKidsGame;
