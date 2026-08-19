import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Flame, Heart, RefreshCw, Sparkles, CheckCircle2, XCircle, 
  HelpCircle, Zap, Shield, Award, ArrowRight, ArrowLeft, WifiOff, Map, 
  BookOpen, Compass, Lightbulb, Share2, Layers, Check, ChevronLeft, Lock, ArrowUpRight, RotateCcw,
  Copy, AlertTriangle, FileText
} from 'lucide-react';
import { 
  QuizQuestion, QuizStage, QUIZ_STAGES, getAllQuestions, 
  getStoredUserProgress, saveUserQuizProgress, UserQuizProgress, shuffleQuestionOptions, saveCustomQuestions,
  resetAllQuizProgress
} from '../data/islamicQuizData';
import { getLevelTheme } from '../data/levelThemes';
import { refreshStageQuestionsOffline, generateNewQuizQuestions } from '../services/quizAiGenerator';
import { getRefreshedOfflineStageQuestions, getStoredStageSetNumber, getStageQuestionSet } from '../data/offlineQuizBank';
import { playGameSound } from '../../utils/gameAudio';

interface IslamicQuizGameProps {
  onBackToHub?: () => void;
}

export const IslamicQuizGame: React.FC<IslamicQuizGameProps> = ({ onBackToHub }) => {
  // Game progress and saved state
  const [userProgress, setUserProgress] = useState<UserQuizProgress>(getStoredUserProgress);
  const [allQuestionsList, setAllQuestionsList] = useState<QuizQuestion[]>(getAllQuestions);
  const [stageSetsRevision, setStageSetsRevision] = useState<number>(0);
  
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

  // Evaluation Certificate & Reset Modals
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [copiedCertText, setCopiedCertText] = useState<boolean>(false);

  // AI Refresh & Level Upgrade modal state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [showLevelUpgradeConfirm, setShowLevelUpgradeConfirm] = useState<boolean>(false);
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

  // Load questions when stage changes & shuffle options dynamically
  const startStage = (stageId: number, customQuestionsSet?: QuizQuestion[]) => {
    setSelectedStage(stageId);
    
    let selectedSet: QuizQuestion[] = [];

    if (customQuestionsSet && customQuestionsSet.length > 0) {
      selectedSet = customQuestionsSet;
    } else {
      // Fetch latest questions state based on active stage set
      const currentSetNum = getStoredStageSetNumber(stageId);
      const lvl = userProgress.currentLevel || 1;
      const setQuestions = getStageQuestionSet(stageId, currentSetNum, lvl);
      saveCustomQuestions(setQuestions, stageId);
      setAllQuestionsList(getAllQuestions());
      selectedSet = setQuestions;
    }

    // Shuffle questions and dynamically shuffle each question's option order
    selectedSet = selectedSet
      .map(q => shuffleQuestionOptions(q))
      .sort(() => Math.random() - 0.5);

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

      // Save user score progress with totalCorrect
      const newProgress: UserQuizProgress = {
        ...userProgress,
        totalScore: userProgress.totalScore + points,
        totalCorrect: (userProgress.totalCorrect || 0) + 1,
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

      // Save user error count
      const newProgress: UserQuizProgress = {
        ...userProgress,
        totalWrong: (userProgress.totalWrong || 0) + 1
      };
      setUserProgress(newProgress);
      saveUserQuizProgress(newProgress);

      if (newHearts <= 0) {
        // Lost hearts in stage
        setTimeout(() => {
          setView('stage_complete');
        }, 1500);
      }
    }
  };

  // Reset entire game progress, lock all stages except stage 1, and restart
  const handleResetGame = () => {
    const fresh = resetAllQuizProgress();
    setUserProgress(fresh);
    setAllQuestionsList(getAllQuestions());
    setStageSetsRevision(prev => prev + 1);
    setSelectedStage(1);
    setStreak(0);
    setStageScore(0);
    setCorrectInStage(0);
    setShowResetConfirmModal(false);
    setView('stage_map');
    playGameSound('start');
    setAiModalStatus({
      show: true,
      isError: false,
      title: '🔄 تمت إعادة ضبط اللعبة بالكامل!',
      message: 'تم إغلاق كافة المراحل وقفلها والعودة للمرحلة الأولى، وتصفير النقاط وسجل الأخطاء بنجاح. يمكنك الآن البدء من جديد!'
    });
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
    
    // Unlock next stage up to 10 stages
    const updatedUnlocked = nextStageId <= 10 
      ? Array.from(new Set([...userProgress.unlockedStages, nextStageId]))
      : userProgress.unlockedStages;

    const updatedCompletedStages = Array.from(new Set([...(userProgress.completedStages || []), selectedStage]));

    const updatedProgress: UserQuizProgress = {
      ...userProgress,
      stars: userProgress.stars + starsEarned,
      unlockedStages: updatedUnlocked,
      completedStages: updatedCompletedStages,
      highScore: Math.max(userProgress.highScore, stageScore)
    };

    setUserProgress(updatedProgress);
    saveUserQuizProgress(updatedProgress);
    setView('stage_complete');
  };

  // 50:50 Elimination Lifeline (Limited to 1 per stage)
  const handleFiftyFifty = () => {
    if (usedFiftyFifty || isAnswered || !currentQ) return;
    const wrongIndices = currentQ.options
      .map((_, idx) => idx)
      .filter(idx => idx !== currentQ.correctIndex);
    
    // Pick 2 wrong indices to disable
    const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setDisabledOptions(shuffledWrong);
    setUsedFiftyFifty(true);
    playGameSound('start');
  };

  // Hint Lifeline (Limited to 1 per stage)
  const handleUseHint = () => {
    if (usedHint || !currentQ?.hint || isAnswered) return;
    setShowHint(true);
    setUsedHint(true);
    playGameSound('start');
  };

  // Gated AI Refresh & Level Advancement handler
  const handleLevelAdvanceOrRefresh = () => {
    const unlockedCount = userProgress.unlockedStages.length;

    // Check condition: Must have unlocked all 10 stages of the current level first!
    if (unlockedCount < 10) {
      setAiModalStatus({
        show: true,
        isError: true,
        title: '🔒 الترقية مقفلة حالياً!',
        message: `عليك أولاً فتح وإكمال جميع مراحل المستوى الحالي (10 مراحل كاملة) لتتمكن من تحديث الأسئلة والتأهل للمستوى التالي الأشد ذكاءً وصعوبة! (المراحل المفتوحة حالياً: ${unlockedCount} من 10).`
      });
      return;
    }

    // If all 10 stages are unlocked, show prompt to advance to the next level!
    setShowLevelUpgradeConfirm(true);
  };

  // Confirm Level Upgrade
  const confirmLevelUpgrade = async () => {
    setShowLevelUpgradeConfirm(false);
    setIsGeneratingAI(true);

    const nextLevel = (userProgress.currentLevel || 1) + 1;

    // Update progress for new level: reset unlocked stages to stage 1 only
    const newLevelProgress: UserQuizProgress = {
      ...userProgress,
      currentLevel: nextLevel,
      unlockedStages: [1]
    };

    setUserProgress(newLevelProgress);
    saveUserQuizProgress(newLevelProgress);

    // Generate fresh harder questions for stage 1 of the new level
    const result = await generateNewQuizQuestions(1, 10, nextLevel);
    setIsGeneratingAI(false);

    const updatedAll = getAllQuestions();
    setAllQuestionsList(updatedAll);

    // Automatically load stage 1 of the new level
    startStage(1);

    setAiModalStatus({
      show: true,
      isError: false,
      title: `🎉 مبروك الترقية للمستوى ${nextLevel}!`,
      message: `تمت الترقية بنجاح إلى المستوى ${nextLevel}! أُغلقت جميع المراحل وبدأت الرحلة من جديد بالمرحلة الأولى بأسئلة قرآنية جديدة أكثر ذكاءً وتحدياً وصعوبة!`
    });
  };

  // Restart Current Level with fresh new questions (at the same level difficulty)
  const restartCurrentLevelWithNewQuestions = async () => {
    setShowLevelUpgradeConfirm(false);
    setIsGeneratingAI(true);

    const level = userProgress.currentLevel || 1;

    // Reset unlocked stages back to stage 1 only for the SAME level
    const sameLevelProgress: UserQuizProgress = {
      ...userProgress,
      unlockedStages: [1]
    };

    setUserProgress(sameLevelProgress);
    saveUserQuizProgress(sameLevelProgress);

    // Generate fresh new questions for stage 1 at the CURRENT level difficulty
    const result = await generateNewQuizQuestions(1, 10, level);
    setIsGeneratingAI(false);

    const updatedAll = getAllQuestions();
    setAllQuestionsList(updatedAll);

    // Automatically load stage 1
    startStage(1);

    setAiModalStatus({
      show: true,
      isError: false,
      title: `🔄 تم إعادة إغلاق وبدء المستوى ${level}!`,
      message: `تم إعادة خوض المستوى ${level} بأسئلة قرآنية ودينية جديدة ومناسبة لنفس درجة الصعوبة من البداية!`
    });
  };

  // Stage-specific refresh handler (refreshes all 10 questions for a specific stage - ONLY IF COMPLETED)
  const handleRefreshSpecificStage = (stageId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Condition check: Has the user completed all 10 questions of this stage?
    const isStageCompleted = 
      (userProgress.completedStages || []).includes(stageId) ||
      userProgress.unlockedStages.includes(stageId + 1) ||
      (stageId === 10 && userProgress.unlockedStages.length >= 10);

    if (!isStageCompleted) {
      setAiModalStatus({
        show: true,
        isError: true,
        title: '🔒 زر التحديث غير متاح بعد!',
        message: `شرط تحديث وتغيير الأسئلة هو إكمال الـ 10 أسئلة للمرحلة ${stageId} بالكامل أولاً. أتمم المرحلة ثم اضغط تحديث للحصول على 10 أسئلة جديدة غير مكررة والبدء من جديد!`
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiModalStatus(null);

    const level = userProgress.currentLevel || 1;
    // Instant offline refresh from the local system bank (alternates between Set 1 and Set 2)
    const result = refreshStageQuestionsOffline(stageId, level, currentQuestions);
    setIsGeneratingAI(false);

    if (result.success && result.questions) {
      const updatedAll = getAllQuestions();
      setAllQuestionsList(updatedAll);
      setStageSetsRevision(prev => prev + 1);

      // Start the stage immediately with the selected set
      startStage(stageId, result.questions);

      if (result.isReturningToBase) {
        setAiModalStatus({
          show: true,
          isError: false,
          title: `🔄 تمت العودة للأسئلة الأساسية (1 إلى 10)!`,
          message: `تمت إعادة تعيين وتحديث أسئلة المرحلة ${stageId} بالكامل إلى المجموعة الأساسية الأولى (الأسئلة من 1 إلى 10) بنجاح والبدء من جديد!`
        });
      } else {
        setAiModalStatus({
          show: true,
          isError: false,
          title: `🌟 تم التحديث إلى الأسئلة الجديدة (11 إلى 20)!`,
          message: `تم تغيير وتحديث كافة أسئلة المرحلة ${stageId} بالكامل إلى 10 أسئلة جديدة ومختلفة تماماً (الأسئلة من 11 إلى 20) بدون أي تكرار مع الأسئلة السابقة لتعزيز ثقافتك ومعرفتك الدينية والبدء من جديد!`
        });
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

  // Derive active Level Theme dynamically!
  const currentLevelNumber = userProgress.currentLevel || 1;
  const currentTheme = getLevelTheme(currentLevelNumber);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 dir-rtl p-3 sm:p-6 rounded-3xl font-sans relative overflow-hidden transition-colors duration-700">
      {/* Background Subtle Gradient Blobs themed by Level */}
      <div className={`absolute top-0 right-0 w-96 h-96 ${currentTheme.glowTopRight} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute bottom-0 left-0 w-96 h-96 ${currentTheme.glowBottomLeft} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />

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
            <h1 className={`text-lg sm:text-xl font-black bg-gradient-to-r ${currentTheme.accentGradient} bg-clip-text text-transparent flex items-center gap-2`}>
              <span>فرسان القرآن والعلوم الإسلامية</span>
              <Trophy size={18} className="text-amber-400 shrink-0" />
            </h1>
            <p className="text-xs text-slate-400 font-bold hidden sm:block">تحدي المعرفة والألغاز القرآنية للأطفال والكبار</p>
          </div>
        </div>

        {/* Stats Pill Badges with Dynamic Level Theme Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm font-bold">
          <div className={`${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all`}>
            <Award size={15} />
            <span>المستوى {currentLevelNumber} ({currentTheme.levelIcon})</span>
          </div>

          <button
            onClick={() => setShowCertificateModal(true)}
            className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-200 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all text-xs font-bold"
            title="عرض وثيقة وشهادة التقييم ومعدل الإجابات الصحيحة والأخطاء"
          >
            <Award size={15} className="text-amber-400" />
            <span>الشهادة والتقييم 📜</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-black border border-emerald-500/30">
              {(userProgress.totalCorrect || 0)} صح ✅
            </span>
            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.5 rounded font-black border border-rose-500/30">
              {(userProgress.totalWrong || 0)} خطأ ❌
            </span>
          </button>

          <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Trophy size={15} className="text-amber-400" />
            <span>{userProgress.totalScore} نقطة</span>
          </div>

          <div className="bg-orange-500/20 text-orange-300 border border-orange-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Flame size={15} className="text-orange-400" />
            <span>{streak} متتالي</span>
          </div>

          <div className="bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Star size={15} className="text-teal-400" />
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
          <div className={`text-center space-y-3 p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-500 ${currentTheme.mapHeaderBg} ${currentTheme.mapHeaderBorder}`}>
            
            {/* Level Specific Theme Banner Ribbon */}
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black border shadow-md ${currentTheme.badgeBg} ${currentTheme.badgeText} ${currentTheme.badgeBorder}`}>
                <Sparkles size={14} />
                <span>{currentTheme.badgeTitle}</span>
              </span>
              <span className="bg-slate-900/60 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                {currentTheme.themeBannerTag}
              </span>
            </div>

            <div className={`inline-flex p-3 rounded-2xl ${currentTheme.iconBg} mb-1 border shadow-lg`}>
              <Compass size={34} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">{currentTheme.title}</h2>
            <p className="text-slate-200 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
              {currentTheme.subtitle}
            </p>

            {/* Stage completion progress bar */}
            <div className="max-w-md mx-auto bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-xs font-bold space-y-1.5 shadow-inner">
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>المراحل المفتوحة بالمستوى الحالي:</span>
                <span className="text-amber-300 font-black">{userProgress.unlockedStages.length} / 10 مراحل</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
                <div 
                  className={`bg-gradient-to-r ${currentTheme.progressBarColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${(userProgress.unlockedStages.length / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Sleek, Compact Action Toolbar for Level Controls (3 Balanced Cards) */}
            <div className="pt-2 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1. الشهادة والدرجات (Score & Evaluation Card) */}
              <button
                onClick={() => setShowCertificateModal(true)}
                className="bg-slate-900/90 hover:bg-amber-950/40 border border-amber-500/40 hover:border-amber-400/80 p-2.5 rounded-xl text-right shadow-sm transition-all group flex items-center justify-between gap-2"
                title="عرض بطاقة الشهادة وتقييم الدرجات والإحصائيات"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <Award size={16} />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-xs font-black text-amber-300 leading-tight whitespace-nowrap">الشهادة والدرجات 📜</div>
                    <div className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                      <span className="text-emerald-400 font-black">✅ {userProgress.totalCorrect || 0} صح</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-rose-400 font-black">❌ {userProgress.totalWrong || 0} خطأ</span>
                    </div>
                  </div>
                </div>
                <ChevronLeft size={14} className="text-amber-400/70 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* 2. تحديث المستوى / الترقية (Level Refresh & Upgrade) */}
              <button
                onClick={handleLevelAdvanceOrRefresh}
                disabled={isGeneratingAI}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all shadow-sm group ${
                  userProgress.unlockedStages.length >= 10
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:scale-[1.02] text-slate-950 border-amber-400 shadow-amber-500/20'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:bg-slate-800/90'
                }`}
                title={userProgress.unlockedStages.length >= 10 ? `تحديث الأسئلة والترقية للمستوى ${currentLevelNumber + 1}` : 'يتطلب فتح جميع الـ 10 مراحل'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    userProgress.unlockedStages.length >= 10 
                      ? 'bg-slate-950/20 text-slate-950' 
                      : 'bg-slate-800 text-amber-400/80'
                  }`}>
                    {userProgress.unlockedStages.length >= 10 ? (
                      <Sparkles size={16} className="animate-spin" />
                    ) : (
                      <Lock size={15} />
                    )}
                  </div>
                  <div className="min-w-0 text-right leading-tight">
                    {userProgress.unlockedStages.length >= 10 ? (
                      <>
                        <div className="text-xs font-black text-slate-950 whitespace-nowrap">تحديث المستوى {currentLevelNumber + 1} 🚀</div>
                        <div className="text-[10px] text-slate-900/80 font-bold whitespace-nowrap">ترقية ومجموعة جديدة</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-slate-300 whitespace-nowrap">تحديث المستوى 🚀</div>
                        <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">مُقفل (أكمل 10 مراحل)</div>
                      </>
                    )}
                  </div>
                </div>
                {userProgress.unlockedStages.length >= 10 && (
                  <ChevronLeft size={14} className="text-slate-950 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                )}
              </button>

              {/* 3. إعادة ضبط اللعبة (Game Reset Button) */}
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="bg-slate-900/90 hover:bg-rose-950/40 hover:border-rose-500/50 border border-slate-700/80 p-2.5 rounded-xl text-right shadow-sm transition-all group flex items-center justify-between gap-2"
                title="إعادة ضبط اللعبة وإغلاق كافة المراحل للبدء من جديد"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:rotate-180 transition-transform duration-500 shrink-0">
                    <RotateCcw size={15} />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-xs font-black text-slate-200 group-hover:text-rose-300 transition-colors whitespace-nowrap">
                      إعادة الضبط 🔄
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      قفل المراحل للبدء مجدداً
                    </div>
                  </div>
                </div>
                <Lock size={13} className="text-slate-600 group-hover:text-rose-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Stages Grid with Dynamic Level Theme Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUIZ_STAGES.map((stg) => {
              const isUnlocked = stg.unlockedByDefault || userProgress.unlockedStages.includes(stg.id);
              const questionsInStage = allQuestionsList.filter(q => q.stage === stg.id);

              return (
                <motion.div
                  key={stg.id}
                  whileHover={isUnlocked ? { scale: 1.02 } : {}}
                  className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between shadow-xl ${
                    isUnlocked
                      ? `${currentTheme.cardBg} ${currentTheme.cardBorder} ${currentTheme.cardBorderHover} ${currentTheme.cardGlow} cursor-pointer`
                      : 'bg-slate-800/40 border-slate-700/50 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => isUnlocked && startStage(stg.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl p-2.5 rounded-2xl border shadow-sm ${currentTheme.iconBg}`}>{stg.icon}</span>
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${currentTheme.stageBadgeBg} ${currentTheme.stageBadgeText} ${currentTheme.stageBadgeBorder}`}>
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

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700/50 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold hidden sm:inline">
                        {questionsInStage.length} أسئلة
                      </span>
                      {(() => {
                        const setNum = getStoredStageSetNumber(stg.id);
                        return setNum === 2 ? (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] px-2 py-0.5 rounded-md font-black flex items-center gap-1">
                            <Sparkles size={10} className="text-amber-300" />
                            <span>المحدثة (11-20) 🌟</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <span>الأساسية (1-10) 🌱</span>
                          </span>
                        );
                      })()}
                    </div>

                    {isUnlocked ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {(() => {
                          const isStageDone = (userProgress.completedStages || []).includes(stg.id) || 
                            userProgress.unlockedStages.includes(stg.id + 1) || 
                            (stg.id === 10 && userProgress.unlockedStages.length >= 10);
                          const setNum = getStoredStageSetNumber(stg.id);

                          return (
                            <button
                              onClick={(e) => handleRefreshSpecificStage(stg.id, e)}
                              title={
                                !isStageDone
                                  ? "يتطلب إكمال الـ 10 أسئلة أولاً لتحديث المرحلة"
                                  : setNum === 1
                                  ? "تحديث وتغيير إلى الأسئلة الجديدة المحدثة (من 11 إلى 20)"
                                  : "العودة للأسئلة الأساسية الأولى (من 1 إلى 10)"
                              }
                              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-bold ${
                                !isStageDone
                                  ? "bg-slate-900/60 text-slate-500 border-slate-700/60 hover:bg-slate-800/60"
                                  : setNum === 1
                                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm"
                                  : "bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 text-purple-200 border-purple-400/60 shadow-sm shadow-purple-500/20"
                              }`}
                            >
                              <RefreshCw size={12} className={isGeneratingAI ? "animate-spin" : setNum === 1 ? "text-amber-400" : "text-purple-300"} />
                              <span>{setNum === 1 ? "تحديث (11-20) 🌟" : "الأساسية (1-10) 🔄"}</span>
                              {!isStageDone && <Lock size={10} className="text-slate-400 mr-0.5" />}
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => startStage(stg.id)}
                          className={`font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md transition-all ${currentTheme.startButtonBg}`}
                        >
                          <span>ابدأ المرحلة</span>
                          <ChevronLeft size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-500/30 w-full justify-center">
                        <Lock size={12} />
                        <span>يتطلب إتمام المرحلة السابقة</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* VIEW 2: ACTIVE QUIZ GAMEPLAY WITH THEMED CARD */}
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
                <span>المرحلة {selectedStage} (المستوى {currentLevelNumber} {currentTheme.levelIcon})</span>
                {(() => {
                  const setNum = getStoredStageSetNumber(selectedStage);
                  return setNum === 2 ? (
                    <span className="text-indigo-300 font-black">سؤال {questionIndex + 11} من 20 🌟</span>
                  ) : (
                    <span className="text-emerald-300 font-bold">سؤال {questionIndex + 1} من 10 🌱</span>
                  );
                })()}
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-600">
                <div
                  className={`bg-gradient-to-r ${currentTheme.progressBarColor} h-full rounded-full transition-all duration-500`}
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
            className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 ${currentTheme.questionCardBg} ${currentTheme.questionCardBorder}`}
          >
            {/* Category Badge & Lifelines */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${currentTheme.stageBadgeBg} ${currentTheme.stageBadgeText} ${currentTheme.stageBadgeBorder}`}>
                  <BookOpen size={14} />
                  <span>{currentQ.categoryLabel}</span>
                </span>
                {(() => {
                  const setNum = getStoredStageSetNumber(selectedStage);
                  return setNum === 2 ? (
                    <span className="bg-indigo-500/25 text-indigo-200 border border-indigo-500/50 text-xs px-2.5 py-1 rounded-xl font-black flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-300" />
                      <span>المجموعة 2 (الأسئلة 11 - 20) 🌟</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                      <span>المجموعة 1 (الأسئلة 1 - 10) 🌱</span>
                    </span>
                  );
                })()}
              </div>

              {/* Lifeline Buttons & Refresh */}
              <div className="flex items-center gap-2">
                {(() => {
                  const setNum = getStoredStageSetNumber(selectedStage);
                  return (
                    <button
                      onClick={() => handleRefreshSpecificStage(selectedStage)}
                      disabled={isGeneratingAI}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-sm ${
                        setNum === 1
                          ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50"
                          : "bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white border-purple-400/50 shadow-purple-500/20"
                      }`}
                      title={setNum === 1 ? "تحديث وتغيير للأسئلة المحدثة الجديدة (11 إلى 20)" : "العودة للأسئلة الأساسية الأولى (1 إلى 10)"}
                    >
                      <RefreshCw size={13} className={isGeneratingAI ? "animate-spin" : setNum === 1 ? "text-amber-400" : "text-purple-300"} />
                      <span className="hidden sm:inline">{setNum === 1 ? "تحديث (11-20) 🌟" : "الأساسية (1-10) 🔄"}</span>
                    </button>
                  );
                })()}

                <button
                  onClick={handleUseHint}
                  disabled={usedHint || showHint || !currentQ.hint || isAnswered}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-sm ${
                    usedHint
                      ? "bg-slate-800/80 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed"
                      : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 hover:scale-105 active:scale-95"
                  }`}
                  title={usedHint ? "تم استخدام التلميح الوحيد المتاح لهذه المرحلة (1 تلميح لكل مرحلة)" : "تلميح مساعد (1 فقط لكل مرحلة)"}
                >
                  <Lightbulb size={14} className={usedHint ? "text-slate-500" : "text-amber-400"} />
                  <span>تلميح</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border ${
                    usedHint ? "bg-slate-700 text-slate-500 border-slate-600" : "bg-amber-400/20 text-amber-300 border-amber-400/30"
                  }`}>
                    {usedHint ? "0/1" : "1/1"}
                  </span>
                </button>

                <button
                  onClick={handleFiftyFifty}
                  disabled={usedFiftyFifty || isAnswered}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-sm ${
                    usedFiftyFifty
                      ? "bg-slate-800/80 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed"
                      : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40 hover:scale-105 active:scale-95"
                  }`}
                  title={usedFiftyFifty ? "تم استخدام وسيلة الإخفاء المتاحة لهذه المرحلة (1 إخفاء لكل مرحلة)" : "إخفاء خيارين خاطئين (1 فقط لكل مرحلة)"}
                >
                  <Zap size={14} className={usedFiftyFifty ? "text-slate-500" : "text-purple-400"} />
                  <span>إخفاء 50:50</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border ${
                    usedFiftyFifty ? "bg-slate-700 text-slate-500 border-slate-600" : "bg-purple-400/20 text-purple-300 border-purple-400/30"
                  }`}>
                    {usedFiftyFifty ? "0/1" : "1/1"}
                  </span>
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
              أتممت أسئلة المرحلة {selectedStage} (المستوى {userProgress.currentLevel || 1}) بنجاح!
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center pt-2">
            {/* Next Stage button if unlocked */}
            {selectedStage < 10 && userProgress.unlockedStages.includes(selectedStage + 1) && (
              <button
                onClick={() => startStage(selectedStage + 1)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg"
              >
                <span>المرحلة التالية ({selectedStage + 1})</span>
                <ArrowLeft size={16} />
              </button>
            )}

            {/* Level Upgrade Button when completing Stage 10 */}
            {selectedStage === 10 && (
              <button
                onClick={handleLevelAdvanceOrRefresh}
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-xl"
              >
                <Trophy size={16} />
                <span>🏆 الترقية إلى المستوى {(userProgress.currentLevel || 1) + 1} 🚀</span>
              </button>
            )}

            {/* Replay with same questions */}
            <button
              onClick={() => startStage(selectedStage)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <RotateCcw size={16} />
              <span>إعادة نفس الأسئلة</span>
            </button>

            {/* Optional Refresh: Change all 10 questions to 10 brand new questions or return to base */}
            {(() => {
              const currentSet = getStoredStageSetNumber(selectedStage);
              return currentSet === 1 ? (
                <button
                  onClick={() => handleRefreshSpecificStage(selectedStage)}
                  disabled={isGeneratingAI}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
                  title="تغيير كافة أسئلة المرحلة بـ 10 أسئلة جديدة غير مكررة (من 11 إلى 20)"
                >
                  <RefreshCw size={16} className={isGeneratingAI ? "animate-spin" : ""} />
                  <span>تحديث لـ 10 أسئلة جديدة كلياً 🌟 (الأسئلة 11 - 20)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRefreshSpecificStage(selectedStage)}
                  disabled={isGeneratingAI}
                  className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-indigo-500/25 border border-purple-400/50"
                  title="إعادة تعيين وتحديث أسئلة المرحلة إلى المجموعة الأساسية الأولى (من 1 إلى 10)"
                >
                  <RotateCcw size={16} className={isGeneratingAI ? "animate-spin" : ""} />
                  <span>العودة للأسئلة الأساسية 🔄 (الأسئلة 1 - 10)</span>
                </button>
              );
            })()}

            {/* Stage Map */}
            <button
              onClick={() => setView('stage_map')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
            >
              <Map size={16} />
              <span>خارطة المراحل</span>
            </button>
          </div>

          {/* Current Set indicator footer note */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/60">
              {getStoredStageSetNumber(selectedStage) === 2 ? (
                <>
                  <Sparkles size={12} className="text-amber-300" />
                  <span className="text-indigo-200 font-bold">أنت تلعب حالياً في المجموعة 2 المحدثة (الأسئلة من 11 إلى 20) 🌟</span>
                </>
              ) : (
                <>
                  <BookOpen size={12} className="text-emerald-400" />
                  <span className="text-emerald-300 font-bold">أنت تلعب حالياً في المجموعة 1 الأساسية (الأسئلة من 1 إلى 10) 🌱</span>
                </>
              )}
            </span>
          </div>
        </motion.div>
      )}

      {/* LEVEL UPGRADE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLevelUpgradeConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 border-2 border-amber-500/50 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl"
            >
              <div className="w-16 h-16 mx-auto bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white mb-2">🏆 تهانينا لختم المستوى {userProgress.currentLevel || 1}!</h3>
                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  لقد أتممت بنجاح فتح وإتمام جميع المراحل الـ 10 للمستوى الحالي! اختر ما يناسبك الآن:
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {/* Option A: Upgrade to Next Level (Harder Questions) */}
                <button
                  onClick={confirmLevelUpgrade}
                  className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-between gap-2 border border-amber-300/40"
                >
                  <div className="flex items-center gap-2 text-right">
                    <Sparkles size={18} className="shrink-0" />
                    <div>
                      <div className="font-black">الترقية للمستوى {(userProgress.currentLevel || 1) + 1} 🚀</div>
                      <div className="text-[10px] opacity-90 font-medium">إغلاق المراحل وبدء مستوى جديد بأسئلة أصعب وأكثر ذكاءً</div>
                    </div>
                  </div>
                  <ChevronLeft size={16} />
                </button>

                {/* Option B: Restart Current Level with Fresh Questions (Same Difficulty) */}
                <button
                  onClick={restartCurrentLevelWithNewQuestions}
                  className="bg-slate-700/90 hover:bg-slate-700 text-slate-100 font-black px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-between gap-2 border border-slate-600/60"
                >
                  <div className="flex items-center gap-2 text-right">
                    <RefreshCw size={18} className="shrink-0 text-emerald-400" />
                    <div>
                      <div className="font-black text-emerald-300">إعادة المستوى {userProgress.currentLevel || 1} بأسئلة جديدة 🔄</div>
                      <div className="text-[10px] text-slate-300 font-medium">إعادة خوض المستوى بأسئلة مختلفة بنفس درجة الصعوبة المناسبة</div>
                    </div>
                  </div>
                  <ChevronLeft size={16} />
                </button>

                {/* Option C: Cancel & stay */}
                <button
                  onClick={() => setShowLevelUpgradeConfirm(false)}
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 font-bold px-4 py-2 rounded-xl text-xs transition-all border border-slate-700"
                >
                  إلغاء والبقاء في الخارطة الحالية
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CERTIFICATE & EVALUATION MODAL */}
      <AnimatePresence>
        {showCertificateModal && (() => {
          const totalCorrect = userProgress.totalCorrect || 0;
          const totalWrong = userProgress.totalWrong || 0;
          const totalAnswered = totalCorrect + totalWrong;
          const accuracyRate = totalAnswered > 0 
            ? Math.round((totalCorrect / totalAnswered) * 100) 
            : ((userProgress.completedQuestions?.length || 0) > 0 ? 100 : 0);

          let honorTitle = 'طالب علم في مرحلة التأسيس 🌱';
          let honorSubtitle = 'سعي مبارك في التزود من علوم القرآن الكريم والسنة النبوية';
          let gradeBadge = 'بداية طيبة';
          let gradeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/40';

          if (accuracyRate >= 90 && totalAnswered >= 3) {
            honorTitle = 'حافظ متقن وخبير قرآني 🌟';
            honorSubtitle = 'مرتبة الشرف الأولى والإتقان التام في المعرفة القرآنية';
            gradeBadge = 'امتياز مع مرتبة الشرف 🏆';
            gradeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
          } else if (accuracyRate >= 80 && totalAnswered >= 3) {
            honorTitle = 'باحث قرآني متميز 📜';
            honorSubtitle = 'مرتبة التفوق والذكاء المعرفي القرآني الرفيع';
            gradeBadge = 'جيد جداً مرتفع 🌟';
            gradeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
          } else if (accuracyRate >= 65) {
            honorTitle = 'طالب علم مجتهد 📖';
            honorSubtitle = 'مرتبة الجيد جداً ومواظبة مشكورة في طلب العلم';
            gradeBadge = 'جيد جداً 💎';
            gradeColor = 'bg-teal-500/20 text-teal-300 border-teal-500/50';
          } else if (accuracyRate >= 50) {
            honorTitle = 'مُتعلِّم ومثابر 🌿';
            honorSubtitle = 'مرتبة الجيد، وبالتكرار والمراجعة يرسخ العلم في الصدور';
            gradeBadge = 'جيد 👍';
            gradeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/50';
          }

          const handleCopyCertificate = () => {
            const certText = `📜 شهادة تقييم وإتقان قرآني - أنيس القلوب 📜
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 اللقب الشرفي: ${honorTitle}
🎖️ التقدير العام: ${gradeBadge}
📊 نسبة الإتقان والدقة: ${accuracyRate}%
✅ الإجابات الصحيحة: ${totalCorrect} إجابة
❌ عدد الأخطاء: ${totalWrong} أخطاء
🏆 إجمالي النقاط: ${userProgress.totalScore} نقطة
⭐ النجوم المكتسبة: ${userProgress.stars} نجوم
🔥 أطول سلسلة صحيحة: ${userProgress.streak} إجابات متتالية
📚 المستوى الحالي: المستوى ${currentLevelNumber} (${currentTheme.title})
🔓 المراحل المفتوحة: ${userProgress.unlockedStages.length} / 10 مراحل
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾`;
            navigator.clipboard.writeText(certText);
            setCopiedCertText(true);
            setTimeout(() => setCopiedCertText(false), 2500);
          };

          return (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border-2 border-amber-500/60 p-5 sm:p-7 rounded-3xl max-w-lg w-full text-center space-y-4 shadow-2xl relative overflow-hidden my-auto"
              >
                {/* Certificate Ornamental Background Accents */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute inset-2 border border-amber-500/20 rounded-2xl pointer-events-none" />

                {/* Islamic Basmala & Title */}
                <div className="space-y-1 relative z-10">
                  <div className="text-amber-400 font-serif text-sm tracking-wide opacity-90">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/40">
                    <Sparkles size={12} />
                    <span>وثيقة تقييم وإتقان المستوى القرآني</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white pt-1">
                    {honorTitle}
                  </h3>
                  <p className="text-slate-300 text-xs font-medium">
                    {honorSubtitle}
                  </p>
                </div>

                {/* Grade & Accuracy Badge */}
                <div className="flex items-center justify-center gap-2.5 relative z-10">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border shadow-sm ${gradeColor}`}>
                    {gradeBadge}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-800/90 text-slate-200 border border-slate-700 shadow-sm">
                    معدل الدقة: <strong className="text-amber-300">{accuracyRate}%</strong>
                  </span>
                </div>

                {/* Performance Stats Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-right relative z-10 pt-1">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-2xl text-center shadow-inner">
                    <div className="text-[10px] text-emerald-300 font-bold mb-0.5">الإجابات الصحيحة</div>
                    <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle2 size={16} />
                      <span>{totalCorrect}</span>
                    </div>
                  </div>

                  <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-2xl text-center shadow-inner">
                    <div className="text-[10px] text-rose-300 font-bold mb-0.5">عدد الأخطاء</div>
                    <div className="text-lg font-black text-rose-400 flex items-center justify-center gap-1">
                      <XCircle size={16} />
                      <span>{totalWrong}</span>
                    </div>
                  </div>

                  <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-2xl text-center shadow-inner">
                    <div className="text-[10px] text-amber-300 font-bold mb-0.5">إجمالي النقاط</div>
                    <div className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                      <Trophy size={16} />
                      <span>{userProgress.totalScore}</span>
                    </div>
                  </div>

                  <div className="bg-teal-950/40 border border-teal-500/30 p-2.5 rounded-2xl text-center shadow-inner">
                    <div className="text-[10px] text-teal-300 font-bold mb-0.5">النجوم المكتسبة</div>
                    <div className="text-base font-black text-teal-300 flex items-center justify-center gap-1">
                      <Star size={15} />
                      <span>{userProgress.stars} نجوم</span>
                    </div>
                  </div>

                  <div className="bg-orange-950/40 border border-orange-500/30 p-2.5 rounded-2xl text-center shadow-inner">
                    <div className="text-[10px] text-orange-300 font-bold mb-0.5">أطول تتابع صح</div>
                    <div className="text-base font-black text-orange-400 flex items-center justify-center gap-1">
                      <Flame size={15} />
                      <span>{userProgress.streak} إجابات</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-2xl text-center shadow-inner">
                    <div className="text-[10px] text-indigo-300 font-bold mb-0.5">المراحل المفتوحة</div>
                    <div className="text-base font-black text-indigo-300 flex items-center justify-center gap-1">
                      <Map size={15} />
                      <span>{userProgress.unlockedStages.length} / 10</span>
                    </div>
                  </div>
                </div>

                {/* Quranic Verse Footer */}
                <div className="bg-slate-900/90 border border-amber-500/20 p-2.5 rounded-2xl relative z-10 text-center">
                  <div className="text-xs text-amber-200/90 font-serif leading-relaxed">
                    ﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {totalWrong === 0 && totalCorrect > 0
                      ? 'ما شاء الله! إجابات مثالية بدون أي أخطاء، زادك الله علماً وهدى.'
                      : 'تكرار المراحل ومراجعة الأخطاء سبيلك لترسيخ العلم وإتقان حفظ الآيات.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2 relative z-10">
                  <button
                    onClick={handleCopyCertificate}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 border border-amber-300/40"
                  >
                    {copiedCertText ? (
                      <>
                        <Check size={16} className="text-emerald-950" />
                        <span>تم نسخ الشهادة بنجاح! 📋</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>نسخ ومشاركة الشهادة 📋</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCertificateModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs transition-all border border-slate-700"
                  >
                    إغلاق البطاقة
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* RESET GAME CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border-2 border-rose-500/50 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-16 h-16 mx-auto bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white mb-1.5">⚠️ تأكيد إعادة ضبط اللعبة بالكامل</h3>
                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  هل أنت متأكد من رغبتك في إعادة ضبط اللعبة؟ سيتم تطبيق ما يلي:
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-right text-xs space-y-1.5 text-slate-300 font-medium">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <Lock size={14} className="shrink-0" />
                  <span>إغلاق وقفل كافة المراحل من 2 إلى 10</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="text-amber-400 shrink-0" />
                  <span>تصفير النقاط والنجوم وسلسلة الإجابات المتتالية</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle size={14} className="text-rose-400 shrink-0" />
                  <span>تصفير سجل الأخطاء والإجابات الصحيحة</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-emerald-400 shrink-0" />
                  <span>البدء من المرحلة الأولى من جديد</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleResetGame}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 border border-rose-400/30"
                >
                  <RotateCcw size={16} />
                  <span>نعم، أعد ضبط اللعبة وابدأ من جديد 🔄</span>
                </button>

                <button
                  onClick={() => setShowResetConfirmModal(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-700"
                >
                  إلغاء والتراجع ↩️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
