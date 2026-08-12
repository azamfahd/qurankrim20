import { GoogleGenAI, Type } from '@google/genai';
import { QuizQuestion, saveCustomQuestions } from '../data/islamicQuizData';

export interface GenerateQuestionsResult {
  success: boolean;
  isOffline?: boolean;
  newQuestionsCount?: number;
  message: string;
  questions?: QuizQuestion[];
}

export async function generateNewQuizQuestions(
  requestedStage: number = 1,
  count: number = 6
): Promise<GenerateQuestionsResult> {
  // 1. Check Internet Connection
  if (!navigator.onLine) {
    return {
      success: false,
      isOffline: true,
      message: 'أنت غير متصل بالإنترنت حالياً. تعمل جميع الأسئلة والمراحل الحالية بدون إنترنت بكل سلاسة، ولتحديث الأسئلة بأسئلة جديدة يُرجى الاتصال بالإنترنت.'
    };
  }

  // 2. Get API key
  const envGeminiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
  const apiKey = (envGeminiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    return {
      success: false,
      message: 'تعذر الاتصال بـ الذكاء الاصطناعي لعدم توفر مفتاح الخدمة حالياً.'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `أنت عالم ومختص في علوم القرآن الكريم والتفسير والسيرة النبوية والشريعة الإسلامية.
المطلوب توليد ${count} أسئلة دينية قرآنية حديثة ومتنوعة ومبتكرة للمرحلة ${requestedStage}.
تأكد من تنوع الأسئلة:
1. أسئلة قرآنية (آيات، سور، أسباب نزول، تفسير).
2. أسئلة قصص الأنبياء والغزوات والسيرة.
3. أسئلة لغز الرموز والإيموجي (مثال: رموز المعجزة مثل 🌊⚡👑 لإلغاز المعجزات).
4. أسئلة فقه وشريعة وأخلاق.

شروط هامة جداً:
- التدرج في الصعوبة بحسب المرحلة ${requestedStage} (المراحل 1-3 سهلة، 4-7 متوسطة، 8-10 متقدمة وخبرة).
- كل سؤال يتكون من:
  - question: النص العربي الصريح للقصة أو السؤال.
  - symbols: رموز إيموجي ممثلة للغز في حال كان السؤال عن معجزة أو لغز رمزي (اختياري).
  - options: 4 خيارات عربية دقيقة.
  - correctIndex: رقم الخيار الصحيح (0 أو 1 أو 2 أو 3).
  - category: 'quran' | 'stories' | 'symbols' | 'sharia' | 'history'
  - categoryLabel: تسمية الفئة بالعربية (مثلاً "علوم القرآن" أو "لغز المعجزات 🧩" أو "قصص الأنبياء")
  - explanation: فائدة قرآنية وإيمانية وتفسير مختصر وموثق للإجابة الصحيحة.
  - hint: تلميح بسيط يساعد اللاعب.

أرجع النتيجة بصيغة JSON حصراً بهذا التنسيق:
[
  {
    "id": "gen_${Date.now()}_1",
    "stage": ${requestedStage},
    "difficulty": "medium",
    "category": "quran",
    "categoryLabel": "علوم القرآن",
    "question": "السؤال هنا...",
    "symbols": "🌊⚡👑",
    "options": ["الخيار 1", "الخيار 2", "الخيار 3", "الخيار 4"],
    "correctIndex": 0,
    "explanation": "الشرح والتفسير هنا...",
    "hint": "تلميح..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'قائمة بأسئلة قرآنية ودينية حديثة',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              stage: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              category: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              question: { type: Type.STRING },
              symbols: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctIndex: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctIndex', 'explanation', 'category', 'categoryLabel']
          }
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error('لم يتم استلام استجابة من الذكاء الاصطناعي.');
    }

    const generatedArray = JSON.parse(textResult) as QuizQuestion[];

    // Ensure IDs and stages
    const formattedQuestions: QuizQuestion[] = generatedArray.map((q, idx) => ({
      ...q,
      id: q.id || `gen_${Date.now()}_${idx}`,
      stage: requestedStage,
      difficulty: requestedStage <= 3 ? 'easy' : requestedStage <= 7 ? 'medium' : 'hard'
    }));

    // Save to local storage for permanent offline use
    saveCustomQuestions(formattedQuestions);

    return {
      success: true,
      newQuestionsCount: formattedQuestions.length,
      message: `تم توليد وإضافة ${formattedQuestions.length} سؤالاً قرآنياً جديداً بنجاح! تم حفظها لتلعب بها بدون إنترنت.`,
      questions: formattedQuestions
    };

  } catch (error: any) {
    console.error('Error generating AI quiz questions:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء توليد الأسئلة عبر الذكاء الاصطناعي. يرجى التأكد من الاتصال والمحاولة لاحقاً.'
    };
  }
}
