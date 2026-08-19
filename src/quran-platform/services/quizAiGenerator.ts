import { QuizQuestion, saveCustomQuestions, shuffleQuestionOptions, getStoredCustomQuestions } from '../data/islamicQuizData';
import { getRefreshedOfflineStageQuestions } from '../data/offlineQuizBank';

export interface GenerateQuestionsResult {
  success: boolean;
  isOffline?: boolean;
  newQuestionsCount?: number;
  message: string;
  questions?: QuizQuestion[];
  currentSet?: number;
  isReturningToBase?: boolean;
}

/**
 * دالة تحديث وتغيير أسئلة المرحلة محلياً وفورياً 100% (Offline Instant Refresh)
 * تقوم باختيار 10 أسئلة قرآنية ودينية جديدة بالكامل من بنك الأسئلة الشامل المحفوظ بالنظام
 * مع التبديل بين المجموعة 1 (الأساسية) والمجموعة 2 (الجديدة كلياً بدون أي تكرار)
 */
export function refreshStageQuestionsOffline(
  requestedStage: number = 1,
  currentLevel: number = 1,
  currentQuestions: QuizQuestion[] = []
): GenerateQuestionsResult {
  const currentIds = currentQuestions.map(q => q.id);
  const { questions: fresh10, currentSet, isReturningToBase } = getRefreshedOfflineStageQuestions(requestedStage, currentIds, currentLevel);
  
  // Save the 10 fresh questions in local storage for this stage
  saveCustomQuestions(fresh10, requestedStage);

  const message = isReturningToBase
    ? `تمت إعادة تعيين وتحديث أسئلة المرحلة ${requestedStage} إلى المجموعة الأساسية الأولى (الأسئلة من 1 إلى 10) بنجاح! 🔄`
    : `تم تحديث وتغيير كافة أسئلة المرحلة ${requestedStage} بـ 10 أسئلة جديدة ومختلفة بالكامل (الأسئلة من 11 إلى 20) بدون تكرار! 🌟`;

  return {
    success: true,
    isOffline: true,
    newQuestionsCount: fresh10.length,
    message,
    questions: fresh10,
    currentSet,
    isReturningToBase
  };
}

/**
 * دالة توليد وتحديث الأسئلة للمرحلة
 * تعتمد بالدرجة الأولى على بنك الأسئلة المحلي المحفوظ في النظام لضمان العمل أوفلاين وسرعة الاستجابة اللحظية
 */
export async function generateNewQuizQuestions(
  requestedStage: number = 1,
  count: number = 10,
  currentLevel: number = 1,
  currentQuestions: QuizQuestion[] = []
): Promise<GenerateQuestionsResult> {
  // Instant offline generation from rich local bank
  return refreshStageQuestionsOffline(requestedStage, currentLevel, currentQuestions);
}


