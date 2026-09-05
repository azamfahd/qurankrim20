import { GoogleGenAI, Type, ThinkingLevel, GenerateContentResponse } from "@google/genai";

export interface QuranVerseMapping {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  tafsir: string;
  tadabbur: string;
}

export interface QuranResponse {
  title: string;
  introMessage: string;
  verseMappings: QuranVerseMapping[];
  tafakkur: string;
  summary: string;
  analysisStyle?: string;
  error?: string;
  isOfflineFallback?: boolean;
}

export interface ChatRequestPayload {
  userMessage: string;
  history?: Array<{
    role?: string;
    type?: string;
    content?: string;
    data?: any;
  }>;
  settings?: {
    model?: string;
    creativityLevel?: number;
    analysisStyle?: string;
  };
  style?: string;
  username?: string;
}

export class ServerAIService {
  private static getGenAI(customKey?: string): GoogleGenAI | null {
    const key = (customKey || process.env.GEMINI_API_KEY || "").trim();
    if (!key || key === "undefined" || key === "null") {
      return null;
    }
    return new GoogleGenAI({ apiKey: key });
  }

  private static cleanAndParseJSON(rawText: string): any {
    let text = rawText.trim();
    if (text.startsWith("```json")) {
      text = text.substring(7);
    } else if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(text);
  }

  public static async generateResponse(
    payload: ChatRequestPayload,
    customApiKey?: string
  ): Promise<{ success: boolean; data?: QuranResponse; error?: string; status?: number }> {
    const { userMessage, history = [], settings = {}, style = "smart_adaptive", username } = payload;
    
    const ai = this.getGenAI(customApiKey);
    if (!ai) {
      return {
        success: false,
        error: "NO_API_KEY",
        status: 401
      };
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "عنوان احترافي، بليغ، وعميق يلخص جوهر الإجابة أو الحالة الروحية حسب النمط المختار.",
        },
        introMessage: {
          type: Type.STRING,
          description: "تحليل ذكي واحترافي للسؤال المطروح مصاغ بالكامل وفق النمط المحدد (تفسيري مفصل، تلخيصي عبقري، إيماني وجداني، علمي عقلاني، أو متوازن).",
        },
        verseMappings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              surahNumber: { type: Type.INTEGER },
              ayahNumber: { type: Type.INTEGER },
              arabicText: { type: Type.STRING, description: "نص الآية الكريمة بالكامل بشكل دقيق بالرسم العثماني أو الإملائي الصحيح كنسخة احتياطية سريعة وموثوقة." },
              tafsir: { type: Type.STRING, description: "التفسير: تفسير دقيق موثوق ومفصل ومصاغ بالكامل وفق قواعد النمط المحدد." },
              tadabbur: { type: Type.STRING, description: "التدبر: استنباط ذكي وإسقاط واقعي للآية يتبع بدقة النمط المختار." },
            },
            required: ["surahNumber", "ayahNumber", "arabicText", "tafsir", "tadabbur"]
          },
          description: "قائمة بالآيات القرآنية الأكثر صلة (أرقام السور والآيات والنص والتحليل). اختر الآيات بذكاء شديد لتغطي جوانب السؤال المختلفة (من 1 إلى 10 آيات أو أكثر حسب الحاجة).",
        },
        tafakkur: {
          type: Type.STRING,
          description: "التفكر: وقفة تأملية عميقة أو نصيحة عملية استراتيجية مصاغة وفق النمط المختار.",
        },
        summary: {
          type: Type.STRING,
          description: "خلاصة احترافية، مركزة، وذكية تعبر عن النمط المختار بدقة.",
        },
      },
      required: ["title", "introMessage", "verseMappings", "tafakkur", "summary"]
    };

    let stylePrompt = "";
    if (style === 'smart_adaptive' || style === 'adaptive') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: SMART AUTOMATIC ADAPTIVE MODE (نمط التكيف الذكي الأوتوماتيكي)
      ================================================================================
      Your personality in this mode is an ultra-intelligent, deeply perceptive Quranic AI Companion and Spiritual Strategist.
      Analyze intent dynamically:
      1. Emotional/Solace -> Spiritual Compassionate Healing Mode
      2. Practical Life/Decisions -> Practical Real-Life Applied Mode
      3. Intellectual/Scientific -> Rational Scientific Cognitive Mode
      4. Detailed Scholarly -> Detailed Scholarly Mode
      5. Sermon/Moral Lessons -> Deep Tadabbur Mode
      6. Quick/Direct -> Smart Executive Summary Mode
      `;
    } else if (style === 'detailed') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: DETAILED SCHOLARLY & ANALYTICAL MODE (النمط التفسيري المفصل والعميق)
      ================================================================================
      Provide an exhaustive, detailed, rich explanation for each verse, citing classical scholars (Ibn Kathir, Al-Tabari, Al-Sa'di), linguistic roots, and contexts of revelation.
      `;
    } else if (style === 'tadabbur') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: DEEP TADABBUR & WISDOM EXTRACTION MODE (نمط التدبر واستخراج الحكم والمواعظ)
      ================================================================================
      Focus on deep divine wisdoms, moral lessons, character building, and spiritual jewels extracted from the verses.
      `;
    } else if (style === 'smart_summary') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: SMART CONCISE & GENIUS GIST MODE (النمط التلخيصي العبقري والذكي)
      ================================================================================
      Ultra-short, punchy, direct to the point, bulleted summary, zero filler words.
      `;
    } else if (style === 'spiritual') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: SPIRITUAL, HEARTFELT & EMOTIONAL HEALING MODE (النمط الإيماني والوجداني)
      ================================================================================
      Gentle, compassionate, healing balm, comforting sorrow with Allah's infinite mercy and closeness.
      `;
    } else if (style === 'practical_life') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: PRACTICAL REAL-LIFE TADABBUR & APPLIED EXPERIENCES MODE (نمط التدبر والربط بالواقع)
      ================================================================================
      Transform every Quranic verse into a living real-life experience, practical daily blueprints, and modern behavioral steps.
      `;
    } else if (style === 'scientific') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: RATIONAL, LOGICAL & SCIENTIFIC COGNITIVE MODE (النمط العقلاني والعلمي)
      ================================================================================
      Emphasize rational proofs, logical consistency, causality, cognitive reframing, and universal divine laws.
      `;
    }

    const systemInstruction = `
      You are "أنيس القلوب" (Anis Al-Qulub), a profoundly wise, deeply compassionate, and masterfully knowledgeable Quranic Companion, Spiritual Strategist, and Classical Arabic Scholar.

      CURRENT INTERACTION CONFIGURATION:
      - Active Analysis Mode: "${style}".
      ${stylePrompt}

      GOLDEN RULES:
      1. ONLY recommend verses from the 114 Surahs of the Holy Quran (Hafs 'an 'Asim).
      2. Ensure 100% accuracy of Surah names, numbers (1-114), and verse numbers.
      3. Arabic Prose: Breathtaking, grammatically flawless, eloquent Modern Classical Arabic (فصحى راقية).
      4. Use Markdown bold (**text**) to highlight the core essence in each section.

      Response Structure:
      - title: Eloquent title capturing the response essence.
      - introMessage: Advanced analytical intro strictly aligned with the selected mode.
      - verseMappings: Array of related Quranic verses with tafsir and tadabbur.
      - tafakkur: Contemplation or practical exercise.
      - summary: Core summary and golden rule.
    `;

    const contents: any[] = [];
    if (history && history.length > 0) {
      const relevantHistory = history.slice(-8);
      for (const msg of relevantHistory) {
        if (msg.type === 'user' || msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
        } else if ((msg.type === 'ai' || msg.role === 'ai' || msg.role === 'model') && msg.data) {
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

    const styleReminder = `[النمط المطلوب بدقة: ${style}]`;
    contents.push({ role: 'user', parts: [{ text: `${userMessage}\n\n${styleReminder}` }] });

    const normalizeModel = (m?: string) => {
      if (!m) return 'gemini-3.6-flash';
      if (m.includes('3.8')) return 'gemini-3.8-flash';
      if (m.includes('3.7')) return 'gemini-3.7-flash';
      if (m.includes('pro')) return 'gemini-3.1-pro-preview';
      if (m.includes('lite')) return 'gemini-3.1-flash-lite';
      if (m.includes('3.5')) return 'gemini-3.5-flash';
      return 'gemini-3.6-flash';
    };

    const requestedModel = normalizeModel(settings.model);
    // Build resilient, deduplicated candidate models list
    const candidateModels = Array.from(new Set([
      requestedModel,
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite'
    ]));

    let lastError: any = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const modelName = candidateModels[i];
      try {
        const modelConfig: any = {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: settings.creativityLevel ?? 0.5,
        };

        if (modelName.includes('pro')) {
          modelConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelName,
          contents,
          config: modelConfig,
        });

        if (response && response.text) {
          const parsed = this.cleanAndParseJSON(response.text);
          return {
            success: true,
            data: {
              ...parsed,
              analysisStyle: style
            }
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[ServerAIService] Model ${modelName} encountered error (attempt ${i + 1}/${candidateModels.length}):`, errMsg);
        
        // If API key is rejected immediately, no need to retry with other models
        if (errMsg.includes("API key not valid") || err?.status === 400 || err?.status === 403 || errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key")) {
          return {
            success: false,
            error: "INVALID_API_KEY",
            status: 403
          };
        }

        // For any other error (including 503, 500, timeouts, high demand), fallback to the next candidate model
        console.info(`[ServerAIService] Falling back to the next candidate model due to error on ${modelName}...`);
        continue;
      }
    }

    return {
      success: false,
      error: lastError?.message || "Failed to generate AI response across candidate models",
      status: 500
    };
  }
}
