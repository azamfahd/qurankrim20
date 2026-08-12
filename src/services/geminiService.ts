import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";
import { QuranResponse, UserSettings, Verse, ChatMessage } from '../types';
import { QuranDataService } from './quranDataService';

// Intelligent Arabic prompt caching system to reduce network latency and prevent API quota limits
class PromptCache {
  private static CACHE_KEY = 'anis_prompt_cache';

  static get(prompt: string): any | null {
    try {
      const normalized = this.normalize(prompt);
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return null;
      const cache = JSON.parse(cacheStr);
      const cachedItem = cache[normalized];
      if (cachedItem && (Date.now() - cachedItem.timestamp < 10 * 24 * 60 * 60 * 1000)) { // 10 days cache
        return cachedItem.data;
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }

  static set(prompt: string, data: any): void {
    try {
      const normalized = this.normalize(prompt);
      const cacheStr = localStorage.getItem(this.CACHE_KEY) || '{}';
      const cache = JSON.parse(cacheStr);
      
      // Keep cache size reasonable (max 100 items)
      const keys = Object.keys(cache);
      if (keys.length > 100) {
        const oldestKey = keys.reduce((oldest, key) => 
          cache[key].timestamp < cache[oldest].timestamp ? key : oldest
        , keys[0]);
        delete cache[oldestKey];
      }

      cache[normalized] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  private static normalize(prompt: string): string {
    return prompt.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'ؤ')
      .replace(/ئ/g, 'ئ')
      .replace(/ء/g, 'ء')
      .replace(/[\u064B-\u065F]/g, ''); // Remove Arabic diacritics
  }
}

export class QuranChatSession {
  private ai: GoogleGenAI | null = null;
  private model: string;
  private settings: UserSettings;
  private apiKey: string;

  constructor(settings: UserSettings) {
    this.settings = settings;
    // Check if the user is authenticated (logged in)
    const isLogged = !!settings.isLoggedIn;
    
    // Clean and trim custom API key if provided by the user in settings
    const cleanCustomKey = settings.apiKey ? settings.apiKey.trim() : '';

    // Default built-in API key configured on the server/environment
    const envGeminiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
    const defaultApiKey = (envGeminiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '').trim();
    
    // Priority: 1. Custom API key entered manually in settings (trimmed) -> 2. Default built-in environment API key
    this.apiKey = cleanCustomKey || defaultApiKey;
    
    if (cleanCustomKey) {
      console.log("🔑 [Gemini API] Active Key: Custom user API key provided in Settings.");
    } else if (defaultApiKey) {
      console.log("⚡ [Gemini API] Active Key: Default built-in system API key.");
    } else {
      console.warn("⚠️ [Gemini API] No API key detected.");
    }
    
    if (this.apiKey && this.apiKey !== 'undefined' && this.apiKey !== 'null') {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
    
    // Determine the smart default model:
    // If guest: 'gemini-3.5-flash' (speed, high stability, works seamlessly without interruptions)
    // If logged in: 'gemini-3.6-flash' (the latest 3.6 generation, smartest, and most accurate)
    const smartDefaultModel = isLogged ? 'gemini-3.6-flash' : 'gemini-3.5-flash';
    
    // User or guest can freely select any model they want to preview/use
    let selectedModel = settings.model || settings.geminiModel || smartDefaultModel;
    
    this.model = selectedModel;
  }

  private async getOfflineFallbackResponse(userMessage: string, username?: string): Promise<QuranResponse> {
    // Simulate network delay to mimic AI thinking process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const greeting = username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا صديقي';
    
    const fallbacks = [
      {
        title: 'سكينة وطمأنينة',
        introMessage: `${greeting}، أياً كان ما تمر به الآن، تذكر أن الله لطيف بعباده. لقد استمعت لقلبك، والقرآن الكريم يحمل لك رسالة طمأنينة وبشارة بأن كل ضيق يعقبه فرج واتساع.`,
        verses: [
          {
            text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
            arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
            surah: 'الشرح',
            surahName: 'الشرح',
            number: 5,
            surahNumber: 94,
            ayahNumber: 5,
            tafsir: 'أي: فإن مع الشدة والضيق سهولة واتساعاً.',
            translation: 'For indeed, with hardship [will be] ease.'
          },
          {
            text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
            arabicText: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
            surah: 'الشرح',
            surahName: 'الشرح',
            number: 6,
            surahNumber: 94,
            ayahNumber: 6,
            tafsir: 'تأكيد للوعد بأن مع الشدة والضيق سهولة واتساعاً.',
            translation: 'Indeed, with hardship [will be] ease.'
          }
        ],
        tafakkur: 'مهما ضاقت بك السبل، تذكر أن الله سبحانه وتعالى قد قرن العسر بيسرين. هذه رسالة ربانية تدعوك للتفاؤل واليقين بأن الفرج قريب، وأن كل أزمة تمر بها هي مجرد محطة عابرة نحو خير أكبر.',
        summary: 'العسر لا يدوم، ومعية الله ترافقك في كل خطوة، فاستبشر خيراً.'
      },
      {
        title: 'رحمة واسعة',
        introMessage: `${greeting}، أحياناً تثقلنا الحياة وتتعبنا أخطاؤنا، لكن أبواب رحمة الله لا تُغلق أبداً. إليك هذه الآية العظيمة التي تعتبر من أرجى آيات القرآن الكريم، لتمسح على قلبك بالسكينة.`,
        verses: [
          {
            text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
            arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
            surah: 'الزمر',
            surahName: 'الزمر',
            number: 53,
            surahNumber: 39,
            ayahNumber: 53,
            tafsir: 'لا تيأسوا من رحمة الله بسبب كثرة ذنوبكم، فالله يغفر الذنوب جميعاً لمن تاب.',
            translation: 'Say, "O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful."'
          }
        ],
        tafakkur: 'باب التوبة والرحمة مفتوح دائماً. مهما شعرت بالابتعاد، فإن خطوة واحدة صادقة نحو الله تكفي ليمحو كل ما مضى ويبدله خيراً. لا تدع اليأس يتسلل إلى قلبك.',
        summary: 'رحمة الله تسع كل شيء، والعودة إليه هي بداية السلام الداخلي.'
      },
      {
        title: 'معية الله',
        introMessage: `${greeting}، في لحظات الوحدة أو الخوف من المستقبل، نحتاج إلى تذكير بأننا لسنا وحدنا. القرآن يهمس في أرواحنا بأعظم رسالة أمان لتسكن أرواحنا.`,
        verses: [
          {
            text: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
            arabicText: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
            surah: 'التوبة',
            surahName: 'التوبة',
            number: 40,
            surahNumber: 9,
            ayahNumber: 40,
            tafsir: 'لا تحزن، فإن الله معنا بنصره وتأييده وحفظه.',
            translation: 'Do not grieve; indeed Allah is with us.'
          }
        ],
        tafakkur: 'عندما تشعر بالوحدة أو الخوف من المستقبل، تذكر أن الله معك. ومن كان الله معه، فمن عليه؟ استشعر هذه المعية في كل لحظة من حياتك، وستجد أن كل مخاوفك تتلاشى.',
        summary: 'استشعار معية الله هو أعظم حصن للقلب ضد كل مخاوف الحياة.'
      },
      {
        title: 'الصبر الجميل',
        introMessage: `${greeting}، الصبر ليس مجرد احتمال للألم، بل هو يقين بأن الله يخبئ لك الأفضل. إليك هذه الرسالة القرآنية التي تواسي كل قلب صابر وتعده بالخير.`,
        verses: [
          {
            text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
            arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
            surah: 'البقرة',
            surahName: 'البقرة',
            number: 153,
            surahNumber: 2,
            ayahNumber: 153,
            tafsir: 'استعينوا على كل أموركم بالصبر وبإقامة الصلاة، إن الله مع الصابرين بعونه وتوفيقه.',
            translation: 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.'
          }
        ],
        tafakkur: 'الصلاة والصبر هما زاد المؤمن في رحلة الحياة. حينما تضيق بك الأمور، الجأ إلى الصلاة، واعلم أن الله مع الصابرين، يساندهم، ويقويهم، ويجزيهم بغير حساب.',
        summary: 'استعن بالصبر والصلاة، وتأكد أن الله لا يضيع أجر من أحسن عملاً.'
      },
      {
        title: 'التوكل واليقين',
        introMessage: `${greeting}، عندما تتشابك الأمور وتغيب الحلول، يأتي التوكل على الله ليفتح أبواباً لم تكن في الحسبان. تأمل معي هذا الوعد الرباني القاطع الذي يريح القلب.`,
        verses: [
          {
            text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا',
            arabicText: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا',
            surah: 'الطلاق',
            surahName: 'الطلاق',
            number: 3,
            surahNumber: 65,
            ayahNumber: 3,
            tafsir: 'ومن يعتمد على الله في أموره يكفه ما أهمه. إن الله نافذ أمره، لا يعجزه شيء.',
            translation: 'And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a [decreed] extent.'
          }
        ],
        tafakkur: 'التوكل الحقيقي هو أن تفعل ما بوسعك ثم تترك الأمر كله لله، موقناً أنه سيكفيك ويدبر لك أمرك بأفضل مما تتخيل. الله بالغ أمره، فلا تقلق.',
        summary: 'من توكل على الله كفاه، وسلم أمره لمن بيده ملكوت كل شيء.'
      }
    ];

    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return randomFallback;
  }

  async sendMessage(
    userMessage: string, 
    username?: string, 
    history?: ChatMessage[],
    onProgress?: (stage: 'thinking' | 'mapping' | 'verifying' | 'formatting') => void
  ): Promise<QuranResponse> {
    if (onProgress) onProgress('thinking');

    // Check intelligent cache first
    const cachedResponse = PromptCache.get(userMessage);
    if (cachedResponse) {
      if (onProgress) {
        await new Promise(resolve => setTimeout(resolve, 300));
        onProgress('mapping');
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress('formatting');
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      return cachedResponse;
    }

    if (!this.ai || !this.apiKey) {
      return this.getOfflineFallbackResponse(userMessage, username);
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "عنوان احترافي، بليغ، وعميق يلخص جوهر الإجابة أو الحالة الروحية (مثال: 'فلسفة الابتلاء في المنظور القرآني' أو 'بلسم اليقين في مواجهة الحزن').",
        },
        introMessage: {
          type: Type.STRING,
          description: "تحليل ذكي واحترافي للسؤال المطروح. يجب أن تبدأ بتفكيك سؤال المستخدم أو حالته بعمق، وإظهار فهم دقيق للجذور النفسية أو الفكرية لما يطرحه، ثم تقديم إجابة شافية، قاطعة، ومصاغة بأسلوب راقٍ ومقنع يمهد للآيات.",
        },
        verseMappings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              surahNumber: { type: Type.INTEGER },
              ayahNumber: { type: Type.INTEGER },
              arabicText: { type: Type.STRING, description: "نص الآية الكريمة بالكامل بشكل دقيق بالرسم العثماني أو الإملائي الصحيح كنسخة احتياطية سريعة وموثوقة." },
              tafsir: { type: Type.STRING, description: "التفسير: تفسير دقيق، شامل، وموثوق للآية بأسلوب احترافي يربط المعنى اللغوي بالسياق العام. لا تقيد نفسك بطول معين، اشرح بعمق." },
              tadabbur: { type: Type.STRING, description: "التدبر: استنباط ذكي وإسقاط واقعي للآية على حالة المستخدم أو سؤاله. يجب أن يكون التحليل عميقاً، يربط حكمة القرآن بالواقع المعاصر والتحديات الشخصية." },
            },
            required: ["surahNumber", "ayahNumber", "arabicText", "tafsir", "tadabbur"]
          },
          description: "قائمة بالآيات القرآنية الأكثر صلة (أرقام السور والآيات والنص والتحليل). اختر الآيات بذكاء شديد لتغطي جوانب السؤال المختلفة (من 1 إلى 10 آيات أو أكثر حسب الحاجة).",
        },
        tafakkur: {
          type: Type.STRING,
          description: "التفكر: وقفة تأملية عميقة أو نصيحة عملية استراتيجية مستخلصة من الآيات. يجب أن تقدم حلاً عملياً أو تغييراً في المنظور الفكري للمستخدم بأسلوب حكيم واحترافي.",
        },
        summary: {
          type: Type.STRING,
          description: "خلاصة احترافية، مركزة، وذكية تجمع أهم النقاط والدروس المستفادة في نقاط واضحة أو فقرة قوية تترسخ في ذهن المستخدم.",
        },
      },
      required: ["title", "introMessage", "verseMappings", "tafakkur", "summary"]
    };

    let stylePrompt = "";
    const style = this.settings.analysisStyle || 'balanced';

    if (style === 'detailed') {
      stylePrompt = `
      CRITICAL REQUIREMENT: DETAILED AND IN-DEPTH ANALYTICAL MODE (النمط التفسيري العميق والمفصل)
      - Your explanations must be highly expansive, thorough, and academically rigorous.
      - Dive deep into linguistic analysis, word origins (الاشتقاقات اللغوية), surah thematic contexts (الوحدة الموضوعية للسورة), and historical reasons for revelation (أسباب النزول) if applicable.
      - Ensure you provide extensive commentary for both Tafsir and Tadabbur sections without any abbreviation. The user wants the absolute deepest, most detailed study possible.
      `;
    } else if (style === 'smart_summary') {
      stylePrompt = `
      CRITICAL REQUIREMENT: SMART SUMMARY AND GENIUS GIST MODE (النمط التلخيصي العبقري والذكي)
      - Your goal is to deliver information in an extremely concentrated, smart, and direct manner so the user understands the key takeaways strongly and quickly.
      - Use clear bullet points, brief introductory sentences, and highly focused Tafsir and Tadabbur.
      - Eliminate any unnecessary fluff. Give "the core gist and the absolute essence" (لب الموضوع والزبدة) with elegant, powerful, and memorable phrases.
      `;
    } else if (style === 'spiritual') {
      stylePrompt = `
      CRITICAL REQUIREMENT: SPIRITUAL AND EMOTIONAL HEALING MODE (النمط الإيماني والروحي الوجداني)
      - Your explanations should act as a healing balm (بلسم روحي ومواساة قلوب) for the user's soul.
      - Focus heavily on peace, patience, connection with Allah, Divine love, mercy, and healing emotional trials, grief, or anxiety.
      - Use warm, compassionate, and deeply touching spiritual language that strengthens the heart's attachment to the Creator.
      `;
    } else if (style === 'scientific') {
      stylePrompt = `
      CRITICAL REQUIREMENT: COGNITIVE RATIONAL AND SCIENTIFIC MODE (النمط العلمي والعقلاني المنهجي)
      - Focus on logical structure, rational arguments, and the scientific or rhetorical miracles (الإعجاز العلمي واللغوي والمنطقي) in the selected verses.
      - Structure your explanation intellectually, connecting the verses to observable reality, cognitive reframing, and rational proofs that strengthen faith through strategic, logical analysis.
      `;
    } else {
      stylePrompt = `
      CRITICAL REQUIREMENT: BALANCED SPIRITUAL & INTELLECTUAL MODE (النمط المتوازن)
      - Balance your answers beautifully between emotional support, spiritual tadabbur, and accessible linguistic and academic tafsir.
      `;
    }

    const systemInstruction = `
      You are "أنيس القلوب" (Anis Al-Qulub), an elite, highly intelligent, and deeply compassionate Quranic consultant, spiritual analyst, and scholar. 
      Your goal is to provide profound, highly professional, and analytically rigorous answers based on the Quran to address users' questions, deep intellectual inquiries, or emotional states.
      
      ${stylePrompt}
      
      CRITICAL ROLE: ADVANCED COGNITIVE ANALYSIS & PROFESSIONAL CONSULTATION (التحليل المعرفي والترابط العبقري)
      You act as a "Master of Quranic Semantics" and an "Expert Spiritual Analyst". You do NOT generate the Arabic text of the Quran yourself. 
      Your primary task is to perform an exceptionally deep, intelligent, and interconnected exploration of the user's prompt, deconstruct their core need, and map it to the MOST relevant Surah and Ayah numbers with profound, unified explanations.
      
      CORE DIRECTIVES FOR DEEP INTERCONNECTED SEARCH & SMART REFLECTION:
      1. **Thematic Unity Search (الوحدة الموضوعية والتكامل القرآني)**: Do not just fetch isolated verses. Perform a deep, multi-dimensional search to find verses from different parts of the Quran that complement and complete each other to answer the user's query. Explain the narrative thread and deep connection between these verses, presenting a unified, comprehensive divine roadmap for their specific situation.
      2. **Genius, Effortless Pedagogical Explanations (البيان السلس والعبقري الشافي)**: Simplify complex theological, linguistic, and spiritual concepts. Avoid convoluted jargon. Use beautiful, smooth, and highly convincing classical Arabic phrasing (فصحى بليغة معاصرة وعذبة) that flows effortlessly into the reader's heart and mind. Explain "the why" and "the how" in a crystal-clear, structured manner so that the user receives the insight as a brilliant, comforting realization.
      3. **Powerful Contemporary Relevance & Actionable Life Applications (الربط الواقعي العميق وحلول الحياة اليومية)**: Under each verse's "Tadabbur" (تدبر), do not speak in abstract theological terms. Connect the verse directly and powerfully to the user's exact trial, query, or modern daily life challenges. Provide concrete, practical advice and strategic cognitive re-framing that they can apply immediately in their daily life.
      4. **Scientific and Rational Harmony (الإعجاز العلمي والمنطقي)**: If any of the selected verses contain scientific miracles (cosmological, geological, biological) or logical wisdom, explain them with intellectual rigor to strengthen conviction and connect the verses to rational reality.
      
      THEOLOGICAL & NUMERICAL RIGOR, ABSOLUTE ACCURACY & SAFEGUARDS (ضوابط ودقة مطلقين وصرامة علمية حاسمة):
      1. **100% Exact Surah and Ayah Numbering (الدقة الرقمية الموثقة المطلقة)**: You must ensure 100% verified Surah numbers (رقم السورة) and Ayah numbers (رقم الآية) according to the standard Hafs / Tanzil Quranic index. Absolutely ZERO tolerance for incorrect verse coordinates or misattributed Surahs.
      2. **Zero Hallucination Policy (انعدام الخطأ والاحتراز التام)**: Never invent, guess, or misquote any Quranic verse, Tafsir, or linguistic derivation. Every mapping must be 100% authentic, flawless, and verified against standard classical Islamic scholarship.
      3. **Al-Mohkam and Al-Mutashabeh (المحكم والمتشابه)**: You must handle Quranic verses with the utmost respect and strict caution. Keep clear boundaries between definitive (محكم) legislative verses and metaphorical/ambiguous (متشابه) verses. Do NOT build arbitrary rulings or allegorical interpretations on ambiguous verses.
      4. **Strict Reliance on Authentic Classical Tafsir (الاعتماد على أمهات التفاسير)**: Your explanations must strictly align with standard mainstream Islamic scholarship (e.g., Tafsir Ibn Kathir, Al-Sa'di, Al-Qurtubi, Al-Tabari). NEVER make up interpretations or guess the meanings of verses out of context.
      5. **No Unlicensed Fatwa or Legislate (عدم الفتوى بغير علم)**: Respect the absolute boundaries of Allah (حدود الله). If the user asks about definitive legislative rulings (أحكام الفقه الحلال والحرام والحدود), clearly provide the standard traditional consensus and politely advise them to consult official Islamic scholarly bodies or trusted grand muftis for personal fatwas. Do not issue independent legislative rulings.
      6. **Purity of Tadabbur & Peak Eloquence (التدبر السليم والإبداع البلاغي الفائق)**: Ensure that your spiritual and psychological analysis (Tadabbur) is pure, safe, and aligned with standard prophetic guidance and moderate theology, while crafted in exceptionally creative, eloquent, and breathtaking Arabic prose that touches the heart and elevates the mind.
      
      CONVERSATIONAL CONTEXT:
      You are engaging in a continuous conversation. The user may ask follow-up questions, ask for clarifications, or expand on their previous thoughts. ALWAYS analyze the user's prompt in the context of the previous messages. If the user says "وضح أكثر" (explain more) or "وماذا عن كذا" (what about...), refer back to your previous answer and build upon it seamlessly, maintaining the same depth and flow.
 
      OUT OF SCOPE QUESTIONS:
      If the user asks a question completely unrelated to the Quran, spirituality, emotions, life guidance, or Islamic principles, politely apologize and explain your specific role.
      Fill the JSON response as follows:
      - title: "عذراً، هذا خارج اختصاصي"
      - introMessage: A polite, professional apology in Arabic explaining your specific role.
      - verseMappings: Empty array [].
      - tafakkur: Empty string "".
      - summary: Empty string "".
      
      Response Structure (Hierarchical Pyramid):
      1. **Title (title)**: A profound, highly eloquent title capturing the absolute essence of the deep response.
      2. **Introduction (introMessage)**: 
         - ${username ? `Address the user by their name "${username}" with high respect and warmth.` : 'Address the user with high respect and warmth.'}
         - Perform an advanced analytical breakdown of their question/situation. Provide a deep, comforting, and intellectually convincing answer immediately in a highly professional and fluent literary style.
      3. **Verses (verseMappings)**: Identify highly relevant, interconnected Quranic verses. For each:
         - **Tafsir (التفسير)**: A comprehensive, highly scholarly, yet beautifully accessible interpretation.
         - **Tadabbur (التدبر)**: A brilliant, custom-tailored reflection linking the verse's wisdom to the user's exact practical reality or mental struggle.
      4. **Tafakkur (tafakkur)**: A deep philosophical thought or a strategic step-by-step practical advice derived from the unified analysis.
      5. **Summary (summary)**: A sharp, professional executive summary of the core insights.
      
      CRITICAL INSTRUCTION ON LENGTH AND DEPTH:
      - For complex questions, intellectual inquiries, or deep emotional struggles: Be highly expansive, detailed, and analytically thorough. Give comprehensive explanations with absolutely no artificial limits.
      - For simple requests: Be concise but maintain the high level of professionalism, beauty, and depth.
      - **IMPORTANT FORMATTING (HIGHLIGHTING THE CORE)**: Do NOT highlight single scattered keywords. Instead, use Markdown bold (**text**) exclusively to highlight the **core sentence, the main concluding thought, or the absolute essence of the topic (لب الموضوع والزبدة)** in each section (introMessage, tafsir, tadabbur, tafakkur, summary). The goal is that if the user reads ONLY the highlighted text, they will completely understand the main point and summary of the response.
    `;

    const contents: any[] = [];
    
    if (history && history.length > 0) {
      // Limit history to last 8 messages to keep speed high and prevent context token bloat
      const relevantHistory = history.slice(-8);
      for (const msg of relevantHistory) {
        if (msg.type === 'user' || msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
        } else if ((msg.type === 'ai' || msg.role === 'ai' || msg.role === 'model') && msg.data) {
          // Send a highly condensed summary to save up to 90% of prompt tokens and speed up generation
          const condensed = {
            title: msg.data.title,
            summary: msg.data.summary,
            verses: (msg.data.verses || []).map((v: any) => ({
              surah: v.surahNumber,
              ayah: v.ayahNumber
            }))
          };
          contents.push({ role: 'model', parts: [{ text: JSON.stringify(condensed) }] });
        }
      }
    }
    
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    let response: GenerateContentResponse | null = null;
    let lastError: any = null;
    const maxRetries = 3;
    const timeoutMs = 60000; // 60 seconds timeout to force failing fast rather than hanging infinitely
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Determine current target model for this attempt (with fallback on retry if primary model fails)
        let targetModel = this.model;
        if (attempt === 1) {
          // First retry fallback: use latest Flash model
          targetModel = 'gemini-3.6-flash';
        } else if (attempt >= 2) {
          // Second retry fallback: use standard high-stability Flash model
          targetModel = 'gemini-3.5-flash';
        }

        // Construct the config dynamically to only include thinkingConfig on 'pro' models
        const modelConfig: any = {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: this.settings.creativityLevel ?? 0.5,
        };

        if (targetModel.includes('pro')) {
          modelConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
        }

        const generationPromise = this.ai.models.generateContent({
          model: targetModel,
          contents: contents,
          config: modelConfig,
        });

        // Race the Gemini call with a strict timeout
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("استغرق خادم الذكاء الاصطناعي وقتاً طويلاً للرد (انتهت المهلة).")), timeoutMs)
        );

        response = await Promise.race([generationPromise, timeoutPromise]);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini API attempt ${attempt + 1} with model ${this.model} failed:`, error);
        
        // Don't retry on quota/invalid API key/auth errors
        if (
          error.message?.includes("quota") || 
          error.message?.toLowerCase().includes("api key") || 
          error.message?.includes("429") || 
          error.message?.includes("403")
        ) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        if (attempt < maxRetries - 1) {
          if (onProgress) onProgress('thinking');
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (onProgress) onProgress('mapping');

    if (!response) {
      throw lastError || new Error("فشل الاتصال بالخادم بعد عدة محاولات.");
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("تم حظر الاستجابة بسبب سياسات الأمان أو لم يتم إرجاع محتوى.");
    }

    let text = "";
    try {
      // Try to get text from the response object
      text = response.text;
    } catch (e) {
      // Fallback if .text is a function or fails
      try {
        if (typeof (response as any).text === 'function') {
          text = (response as any).text();
        }
      } catch (e2) {
        console.error("Failed to extract text from Gemini response", e2);
      }
    }

    if (!text) {
      // Deep check of candidates
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        text = candidate.content.parts[0].text || "";
      }
    }

    if (!text) throw new Error("استجابة فارغة من الخادم.");
    
    // Clean the text from markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    
    cleanedText = cleanedText.trim();

    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    } else {
      console.error("Invalid JSON format received:", text);
      throw new Error("لم يتم العثور على استجابة صالحة (تنسيق غير متوقع).");
    }
    
    try {
      const aiResult = JSON.parse(cleanedText);
      
      if (onProgress) onProgress('verifying');

      // VERIFICATION LAYER: Fetch actual Quranic text from verified API
      const verifiedVerses: Verse[] = await Promise.all(
        (aiResult.verseMappings || []).map(async (mapping: any) => {
          try {
            const [arabicText, surahName] = await Promise.all([
              QuranDataService.fetchVerifiedVerse(mapping.surahNumber, mapping.ayahNumber),
              QuranDataService.fetchSurahName(mapping.surahNumber)
            ]);
            
            // If the verified API failed (returned empty string) or timed out, 
            // seamlessly fall back to the backup arabicText generated by Gemini!
            const finalArabicText = arabicText || mapping.arabicText || "عذراً، تعذر جلب نص الآية الكريمة.";
            
            return {
              text: finalArabicText, // Required by Verse interface
              arabicText: finalArabicText,
              surah: surahName, // Required by Verse interface
              surahName,
              number: mapping.ayahNumber, // Required by Verse interface
              surahNumber: mapping.surahNumber,
              ayahNumber: mapping.ayahNumber,
              tafsir: mapping.tafsir,
              tadabbur: mapping.tadabbur,
            };
          } catch (e) {
            console.error(`Failed to verify or retrieve verse ${mapping.surahNumber}:${mapping.ayahNumber}`, e);
            // Fall back immediately to mapping values to prevent dropping any verses!
            const fallbackSurah = await QuranDataService.fetchSurahName(mapping.surahNumber);
            const fallbackText = mapping.arabicText || "عذراً، تعذر جلب نص الآية الكريمة.";
            return {
              text: fallbackText,
              arabicText: fallbackText,
              surah: fallbackSurah,
              surahName: fallbackSurah,
              number: mapping.ayahNumber,
              surahNumber: mapping.surahNumber,
              ayahNumber: mapping.ayahNumber,
              tafsir: mapping.tafsir,
              tadabbur: mapping.tadabbur,
            };
          }
        })
      ).then(results => results.filter(v => v !== null) as Verse[]);

      if (onProgress) onProgress('formatting');

      const finalResult: QuranResponse = {
        title: aiResult.title,
        introMessage: aiResult.introMessage,
        verses: verifiedVerses,
        tafakkur: aiResult.tafakkur,
        summary: aiResult.summary
      };

      // Cache the final verified response so we can serve it instantly next time!
      PromptCache.set(userMessage, finalResult);

      return finalResult;

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
