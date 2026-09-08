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
      Analyze the user's intent dynamically and adopt the exact matching tone and depth:
      1. Emotional/Solace -> Spiritual Compassionate Healing Mode
      2. Practical Life/Decisions -> Practical Real-Life Applied Mode
      3. Intellectual/Scientific -> Rational Scientific Cognitive Mode
      4. Detailed Scholarly -> Detailed Scholarly Mode
      5. Sermon/Moral Lessons -> Deep Tadabbur Mode
      6. Quick/Direct -> Smart Executive Summary Mode
      `;
    } else if (style === 'smart_summary') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: SMART CONCISE & GENIUS GIST MODE (النمط التلخيصي العبقري)
      ================================================================================
      Format your ENTIRE response to be extremely concise, brief, and direct to the point.
      - introMessage: Maximum 2-3 sentences providing a sharp, genius summary gist.
      - tafsir & tadabbur: Keep under 2-3 lines per verse, using bullet points and bold keywords.
      - tafakkur: A single actionable bullet point.
      - summary: A single powerful 1-sentence golden takeaway.
      Zero filler words or long intro paragraphs!
      `;
    } else if (style === 'detailed') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: DETAILED SCHOLARLY & ANALYTICAL MODE (النمط التفسيري المفصل والعميق)
      ================================================================================
      Provide an exhaustive, scholarly, rich explanation for each verse.
      - introMessage: In-depth scholarly analysis of the topic from a Quranic perspective.
      - tafsir: Detailed explanation citing classical mufassirin (Ibn Kathir, Al-Tabari, Al-Sa'di), linguistic roots (الأصول اللغوية والمعاني البلاغية), and contexts of revelation (أسباب النزول) if applicable.
      - tadabbur: Comprehensive analytical insights and scholarly reflections.
      - tafakkur: Methodical study step or research reflection.
      - summary: Comprehensive academic conclusion.
      `;
    } else if (style === 'tadabbur') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: DEEP TADABBUR & WISDOM EXTRACTION MODE (نمط التدبر والحكم والمواعظ)
      ================================================================================
      Focus intensely on divine wisdoms, moral lessons, character building, and spiritual jewels extracted from the verses.
      - introMessage: Deep spiritual opening drawing out hidden Quranic pearls of wisdom.
      - tafsir: Focus on the spiritual meanings and divine intentions behind the words.
      - tadabbur: Heartfelt contemplation on how these verses refine the soul, morals, and spiritual standing.
      - tafakkur: Soul reflection and spiritual exercise.
      - summary: Inspiring spiritual rule of life.
      `;
    } else if (style === 'practical_life') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: PRACTICAL REAL-LIFE APPLIED EXPERIENCES MODE (نمط الربط بالواقع والتجارب العملية)
      ================================================================================
      Connect every Quranic verse directly to practical daily life, real-world scenarios, relationships, and modern behavioral decisions.
      - introMessage: Direct practical framing connecting the user's situation to real-life Quranic guidance.
      - tafsir: Clear explanation of how the verse applies to daily human interactions and decisions.
      - tadabbur: Practical real-life action plan and realistic behavioral steps.
      - tafakkur: Practical daily challenge or practical habit to implement today.
      - summary: Practical actionable rule for daily living.
      `;
    } else if (style === 'spiritual') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: SPIRITUAL, HEARTFELT & EMOTIONAL HEALING MODE (النمط الإيماني والوجداني)
      ================================================================================
      Adopt a gentle, compassionate, deeply comforting, and soul-healing tone.
      - introMessage: Warm, empathetic, and comforting opening reassuring the heart with Allah's mercy, closeness, and love.
      - tafsir & tadabbur: Emphasize hope, solace, divine protection, and inner peace in times of hardship or reflection.
      - tafakkur: A soothing spiritual meditation or heartfelt dua/dhikr suggestion.
      - summary: Gentle comforting message of peace and divine reassurance.
      `;
    } else if (style === 'scientific') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: RATIONAL, LOGICAL & SCIENTIFIC COGNITIVE MODE (النمط العقلاني والعلمي)
      ================================================================================
      Emphasize rational proofs, logical consistency, causality, cognitive reframing, universal laws, and scientific/linguistic precision.
      - introMessage: Analytical, logical opening framing the topic through sound reasoning and universal principles.
      - tafsir: Precise linguistic breakdown, logical structure, and cognitive insights.
      - tadabbur: Cognitive reframing and logical alignment with divine laws.
      - tafakkur: Logical contemplation exercise.
      - summary: Rational principle based on divine wisdom and universal truth.
      `;
    } else if (style === 'balanced') {
      stylePrompt = `
      ================================================================================
      🚨 STRICT MANDATE: BALANCED SPIRITUAL & SIMPLIFIED ANALYTICAL MODE (النمط المتوازن)
      ================================================================================
      Provide a perfectly balanced response combining spiritual warmth, clear simplified explanation, and direct practical benefit.
      - introMessage: Balanced, welcoming intro touching on both understanding and emotion.
      - tafsir: Clear, accessible explanation without over-complication.
      - tadabbur: Balanced reflection on faith and practical life.
      - tafakkur: Balanced reflection step.
      - summary: Balanced golden rule.
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
      if (!m) return 'gemini-3.8-flash';
      if (m.includes('3.8')) return 'gemini-3.8-flash';
      if (m.includes('3.7')) return 'gemini-3.7-flash';
      if (m.includes('3.6')) return 'gemini-3.6-flash';
      if (m.includes('3.5')) return 'gemini-3.5-flash';
      if (m.includes('pro')) return 'gemini-3.1-pro-preview';
      if (m.includes('lite')) return 'gemini-3.1-flash-lite';
      return 'gemini-3.8-flash';
    };

    const requestedModel = normalizeModel(settings.model);
    // Build resilient, deduplicated candidate models list starting with the user's requested model
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
        
        // If API key is rejected immediately, no need to retry with other models
        if (errMsg.includes("API key not valid") || err?.status === 400 || err?.status === 403 || errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key")) {
          return {
            success: false,
            error: "INVALID_API_KEY",
            status: 403
          };
        }

        // Handle 503 high demand with a quick retry before moving to next candidate
        if (err?.status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
          await new Promise(r => setTimeout(r, 500));
          try {
            const retryConfig: any = {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: settings.creativityLevel ?? 0.5,
            };
            if (modelName.includes('pro')) {
              retryConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
            }
            const retryRes = await ai.models.generateContent({
              model: modelName,
              contents,
              config: retryConfig,
            });
            if (retryRes && retryRes.text) {
              const parsed = this.cleanAndParseJSON(retryRes.text);
              return {
                success: true,
                data: {
                  ...parsed,
                  analysisStyle: style
                }
              };
            }
          } catch (retryErr) {
            // Proceed to next model silently
          }
        }

        console.info(`[ServerAIService] Model ${modelName} temporary issue, seamlessly switching to next model...`);
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
