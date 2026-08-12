import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Flame, Heart, RefreshCw, Sparkles, CheckCircle2, XCircle, 
  HelpCircle, Zap, Shield, Award, ArrowRight, ArrowLeft, WifiOff, Map, 
  BookOpen, Compass, Lightbulb, Share2, Layers, Check, ChevronLeft
} from 'lucide-react';
import { 
  QuizQuestion, QuizStage, QUIZ_STAGES, getAllQuestions, 
  getStoredUserProgress, saveUserQuizProgress, UserQuizProgress 
} from '../data/islamicQuizData';
import { generateNewQuizQuestions } from '../services/quizAiGenerator';
import { playGameSound } from '../../utils/gameAudio';

interface IslamicQuizGameProps {
  onBackToHub?: () => void;
}

export const IslamicQuizGame: React.FC<IslamicQuizGameProps> = ({ onBackToHub }) => {
  // Game progress and saved state
  const [userProgress, setUserProgress] = useState<UserQuizProgress>(getStoredUserProgress);
  const [allQuestionsList, setAllQuestionsList] = useState<QuizQuestion[]>(getAllQuestions);
  
  // Game view state
  const [view, setView] = useState<'stage_map' | 'quiz' | 'stage_complete' | 'out_of_questions'>('stage_map');
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  
  // Active Question status
  const [hearts, setHearts] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [stageScore, setStageScore] = useState<number>(0);
  const [correctInStage, setCorrectInStage] = useState<number>(0);

  // AI Refresh loading state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiModalStatus, setAiModalStatus] = useState<{
    show: boolean;
    isError?: boolean;
    isOffline?: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Lifeline usage in current stage
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [usedFiftyFifty, setUsedFiftyFifty] = useState<boolean>(false);

  // Load questions when stage changes
  const startStage = (stageId: number) => {
    setSelectedStage(stageId);
    const questionsForStage = allQuestionsList.filter(q => q.stage === stageId || (stageId === 1 && !q.stage));
    
    // If not enough questions, fallback to any available questions
    let selectedSet = questionsForStage.length >= 3 
      ? questionsForStage 
      : allQuestionsList.sort(() => Math.random() - 0.5).slice(0, 8);

    // Shuffle questions and select up to 10 questions per stage session
    selectedSet = [...selectedSet].sort(() => Math.random() - 0.5);
    if (selectedSet.length > 10) {
      selectedSet = selectedSet.slice(0, 10);
    }

    setCurrentQuestions(selectedSet);
    setQuestionIndex(0);
    setHearts(3);
    setStageScore(0);
    setCorrectInStage(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setDisabledOptions([]);
    setUsedHint(false);
    setUsedFiftyFifty(false);
    setView('quiz');
    playGameSound('start');
  };

  const currentQ = currentQuestions[questionIndex];

  // Handle Answer Selection
  const handleAnswer = (optionIdx: number) => {
    if (isAnswered) return;

    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQ.correctIndex;

    if (isCorrect) {
      playGameSound('win');
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 20 + newStreak * 5;
      setStageScore(prev => prev + points);
      setCorrectInStage(prev => prev + 1);

      // Save user score progress
      const newProgress: UserQuizProgress = {
        ...userProgress,
        totalScore: userProgress.totalScore + points,
        streak: Math.max(userProgress.streak, newStreak),
        completedQuestions: Array.from(new Set([...userProgress.completedQuestions, currentQ.id]))
      };
      setUserProgress(newProgress);
      saveUserQuizProgress(newProgress);
    } else {
      playGameSound('wrong');
      setStreak(0);
      const newHearts = hearts - 1;
      setHearts(newHearts);

      if (newHearts <= 0) {
        // Lost hearts in stage
        setTimeout(() => {
          setView('stage_complete');
        }, 1500);
      }
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setDisabledOptions([]);

    if (questionIndex + 1 < currentQuestions.length && hearts > 0) {
      setQuestionIndex(prev => prev + 1);
    } else {
      // Completed current stage questions
      completeStage();
    }
  };

  // Stage Completion logic
  const completeStage = () => {
    const starsEarned = correctInStage >= currentQuestions.length - 1 ? 3 : correctInStage >= 1 ? 2 : 1;
    const nextStageId = selectedStage + 1;
    
    const updatedUnlocked = Array.from(new Set([...userProgress.unlockedStages, nextStageId]));
    const updatedProgress: UserQuizProgress = {
      ...userProgress,
      stars: userProgress.stars + starsEarned,
      unlockedStages: updatedUnlocked,
      highScore: Math.max(userProgress.highScore, stageScore)
    };

    setUserProgress(updatedProgress);
    saveUserQuizProgress(updatedProgress);
    setView('stage_complete');
  };

  // 50:50 Lifeline
  const handleFiftyFifty = () => {
    if (usedFiftyFifty || isAnswered || !currentQ) return;
    const wrongIndices = currentQ.options
      .map((_, idx) => idx)
      .filter(idx => idx !== currentQ.correctIndex);
    
    // Pick 2 wrong indices to disable
    const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setDisabledOptions(shuffledWrong);
    setUsedFiftyFifty(true);
  };

  // AI Refresh / Generate Questions
  const handleAiRefresh = async () => {
    setIsGeneratingAI(true);
    setAiModalStatus(null);

    const result = await generateNewQuizQuestions(selectedStage, 6);
    setIsGeneratingAI(false);

    if (result.isOffline) {
      setAiModalStatus({
        show: true,
        isOffline: true,
        title: 'تنبيه الاتصال بالإنترنت 📶',
        message: result.message
      });
      return;
    }

    if (result.success) {
      // Reload questions
      const updatedAll = getAllQuestions();
      setAllQuestionsList(updatedAll);
      setAiModalStatus({
        show: true,
        isError: false,
        title: 'تم التحديث بنجاح! 🌟',
        message: result.message
      });

      // If in stage complete, start freshly updated questions
      const freshQuestions = updatedAll.filter(q => q.stage === selectedStage);
      if (freshQuestions.length > 0) {
        setCurrentQuestions(freshQuestions.sort(() => Math.random() - 0.5));
      }
    } else {
      setAiModalStatus({
        show: true,
        isError: true,
        title: 'خطأ في التحديث ⚠️',
        message: result.message
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 dir-rtl p-3 sm:p-6 rounded-3xl font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-700/60 shadow-xl mb-6 relative z-10">
        <div className="flex items-center gap-3">
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              title="العودة"
            >
              <ArrowRight size={20} />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent flex items-center gap-2">
              <span>فرسان القرآن والعلوم الإسلامية</span>
              <Trophy size={18} className="text-amber-400 shrink-0" />
            </h1>
            <p className="text-xs text-slate-400 font-bold hidden sm:block">تحدي المعرفة والألغاز القرآنية للأطفال والكبار</p>
          </div>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm font-bold">
          <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Trophy size={15} className="text-amber-400" />
            <span>{userProgress.totalScore} نقطة</span>
          </div>

          <div className="bg-orange-500/20 text-orange-300 border border-orange-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Flame size={15} className="text-orange-400" />
            <span>{streak} متتالي</span>
          </div>

          <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Star size={15} className="text-emerald-400" />
            <span>{userProgress.stars} نجوم</span>
          </div>

          <button
            onClick={() => setView('stage_map')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md font-bold text-xs"
          >
            <Map size={15} />
            <span>المراحل</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: STAGE MAP & LEVEL SELECTOR */}
      {view === 'stage_map' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="text-center space-y-2 bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-slate-800 p-6 rounded-3xl border border-emerald-500/30">
            <div className="inline-flex p-3 bg-emerald-500/20 rounded-2xl text-emerald-300 mb-2 border border-emerald-500/40">
              <Compass size={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">خارطة مراحل الفروسية القرآنية 🗺️</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto font-medium leading-relaxed">
              انطلق في رحلة إيمانية ممتعة تتدرج من الأسئلة السهلة إلى المعجزات وألغاز الرموز الشريعة المتقدمة!
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleAiRefresh}
                disabled={isGeneratingAI}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg text-sm"
              >
                <RefreshCw size={18} className={isGeneratingAI ? "animate-spin" : ""} />
                <span>{isGeneratingAI ? "جاري التوليد بالذكاء الاصطناعي..." : "تحديث الأسئلة بأسئلة جديدة (AI)"}</span>
              </button>
            </div>
          </div>

          {/* Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUIZ_STAGES.map((stg) => {
              const isUnlocked = stg.unlockedByDefault || userProgress.unlockedStages.includes(stg.id);
              const questionsInStage = allQuestionsList.filter(q => q.stage === stg.id);

              return (
                <motion.div
                  key={stg.id}
                  whileHover={isUnlocked ? { scale: 1.02 } : {}}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-slate-800/90 border-emerald-500/40 hover:border-emerald-400 shadow-lg cursor-pointer'
                      : 'bg-slate-800/40 border-slate-700/50 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => isUnlocked && startStage(stg.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-slate-700/50 rounded-xl">{stg.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          المرحلة {stg.id}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{stg.title}</h3>
                      </div>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                      stg.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300' :
                      stg.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {stg.difficultyLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mb-4 leading-relaxed">{stg.subtitle}</p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700/50">
                    <span className="text-slate-400 font-bold">
                      {questionsInStage.length} أسئلة متاحة أوفلاين
                    </span>

                    {isUnlocked ? (
                      <span className="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                        <span>ابدأ المرحلة</span>
                        <ChevronLeft size={14} />
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        <Star size={12} />
                        <span>يتطلب {stg.requiredStars} نجمة</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* VIEW 2: ACTIVE QUIZ GAMEPLAY */}
      {view === 'quiz' && currentQ && (
        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          {/* Progress & Hearts Bar */}
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((hIdx) => (
                <Heart
                  key={hIdx}
                  size={22}
                  className={`transition-all duration-300 ${
                    hIdx <= hearts ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex-1 max-w-xs space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>المرحلة {selectedStage}</span>
                <span>سؤال {questionIndex + 1} من {currentQuestions.length}</span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full transition-all duration-500"
                  style={{ width: `${((questionIndex + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-black text-amber-300 border border-slate-600">
              +{stageScore} نقطة
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/90 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-6"
          >
            {/* Category Badge & Lifelines */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-4">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>{currentQ.categoryLabel}</span>
              </span>

              {/* Lifeline Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHint(true)}
                  disabled={showHint || !currentQ.hint}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  title="تلميح"
                >
                  <Lightbulb size={14} />
                  <span>تلميح</span>
                </button>

                <button
                  onClick={handleFiftyFifty}
                  disabled={usedFiftyFifty || isAnswered}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  title="حذف خيارين"
                >
                  <Zap size={14} />
                  <span>50:50</span>
                </button>
              </div>
            </div>

            {/* Hint Alert if activated */}
            {showHint && currentQ.hint && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl text-amber-200 text-xs font-bold flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400 shrink-0" />
                <span>تلميح مساعد: {currentQ.hint}</span>
              </motion.div>
            )}

            {/* SYMBOLS EMOJI PUZZLE DISPLAY */}
            {currentQ.symbols && (
              <div className="bg-gradient-to-r from-purple-900/50 via-slate-800 to-indigo-900/50 p-6 rounded-2xl border-2 border-purple-500/40 text-center shadow-inner my-2">
                <div className="text-xs font-black text-purple-300 mb-2 uppercase tracking-wider">
                  🧩 لغز الرموز والمعجزات 🧩
                </div>
                <div className="text-4xl sm:text-5xl tracking-widest font-black select-none drop-shadow-lg py-1 animate-pulse">
                  {currentQ.symbols}
                </div>
              </div>
            )}

            {/* Main Question Text */}
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug text-center py-2">
              {currentQ.question}
            </h2>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((optionText, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrectOpt = optIdx === currentQ.correctIndex;
                const isDisabled = disabledOptions.includes(optIdx);

                let btnStyle = "bg-slate-700/60 hover:bg-slate-700 text-slate-100 border-slate-600";

                if (isAnswered) {
                  if (isCorrectOpt) {
                    btnStyle = "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-600/30";
                  } else if (isSelected) {
                    btnStyle = "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30";
                  } else {
                    btnStyle = "bg-slate-800 text-slate-500 border-slate-700 opacity-50";
                  }
                }

                if (isDisabled) {
                  btnStyle = "bg-slate-800/30 text-slate-600 border-slate-800 cursor-not-allowed opacity-30 line-through";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => !isDisabled && handleAnswer(optIdx)}
                    disabled={isAnswered || isDisabled}
                    className={`p-4 rounded-2xl border font-bold text-right text-sm sm:text-base transition-all duration-200 flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{optionText}</span>
                    {isAnswered && isCorrectOpt && <CheckCircle2 size={20} className="text-white shrink-0" />}
                    {isAnswered && isSelected && !isCorrectOpt && <XCircle size={20} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Post Answer Lesson & Explanation Card */}
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/80 border-2 border-emerald-500/50 p-5 rounded-2xl space-y-3 mt-4"
              >
                <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                  <Sparkles size={18} className="text-amber-400" />
                  <span>فائدة قرآنية وتفسير إيماني:</span>
                </div>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                  {currentQ.explanation}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg text-sm"
                  >
                    <span>{questionIndex + 1 < currentQuestions.length ? "السؤال التالي" : "عرض نتيجة المرحلة"}</span>
                    <ArrowLeft size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* VIEW 3: STAGE COMPLETE / RESULT VIEW */}
      {view === 'stage_complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto bg-slate-800 p-8 rounded-3xl border border-emerald-500/40 text-center space-y-6 shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 mx-auto bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center border-2 border-emerald-400/50 shadow-inner">
            <Trophy size={40} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {correctInStage >= 1 ? "أحسنت يا بطل القرآن! 🌟" : "محاولة جيدة، يمكنك التكرار! 💡"}
            </h2>
            <p className="text-slate-300 text-sm mt-1 font-medium">
              أتممت أسئلة المرحلة {selectedStage} بنجاح وحصلت على النقاط والأوسمة.
            </p>
          </div>

          {/* Stars & Score Summary */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-400 block font-bold">النقاط المكتسبة</span>
              <span className="text-2xl font-black text-amber-400">+{stageScore}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-bold">الإجابات الصحيحة</span>
              <span className="text-2xl font-black text-emerald-400">{correctInStage} / {currentQuestions.length}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => startStage(selectedStage)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <RefreshCw size={16} />
              <span>إعادة المرحلة</span>
            </button>

            <button
              onClick={handleAiRefresh}
              disabled={isGeneratingAI}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
            >
              <Sparkles size={16} />
              <span>{isGeneratingAI ? "جاري التوليد..." : "تحديث الأسئلة بأسئلة جديدة (AI)"}</span>
            </button>

            <button
              onClick={() => setView('stage_map')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
            >
              <Map size={16} />
              <span>خارطة المراحل</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* AI STATUS / OFFLINE NOTICE MODAL */}
      <AnimatePresence>
        {aiModalStatus && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${
                aiModalStatus.isOffline
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : aiModalStatus.isError
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {aiModalStatus.isOffline ? <WifiOff size={32} /> : aiModalStatus.isError ? <XCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>

              <div>
                <h3 className="text-xl font-black text-white mb-2">{aiModalStatus.title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  {aiModalStatus.message}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setAiModalStatus(null)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl w-full text-sm shadow-lg transition-all"
                >
                  فهمت ذلك، حسناً
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IslamicQuizGame;
