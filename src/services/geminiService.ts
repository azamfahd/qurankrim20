import { QuranResponse, UserSettings, Verse, ChatMessage } from '../types';
import { Capacitor } from '@capacitor/core';
import { QuranDataService } from './quranDataService';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { OfflineQuranService } from './offlineQuranService';

// Intelligent Arabic prompt caching system to reduce network latency and prevent API quota limits
class PromptCache {
  private static CACHE_KEY = 'anis_prompt_cache';

  static get(prompt: string, style?: string, model?: string): any | null {
    try {
      const normalized = `${this.normalize(prompt)}::${style || 'smart_adaptive'}::${model || 'default'}`;
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return null;
      const cache = JSON.parse(cacheStr);
      const cachedItem = cache[normalized];
      if (cachedItem && (Date.now() - cachedItem.timestamp < 10 * 24 * 60 * 60 * 1000)) { // 10 days cache
        // Strictly ignore and purge any fallback or offline records from prompt cache
        if (cachedItem.data?.isOfflineFallback || cachedItem.data?.isOfflineQuranMissing || cachedItem.data?.isOfflineLocalAnalysis) {
          delete cache[normalized];
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
          return null;
        }
        return cachedItem.data;
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }

  static set(prompt: string, data: any, style?: string, model?: string): void {
    try {
      // NEVER cache offline or fallback responses
      if (!data || data.isOfflineFallback || data.isOfflineQuranMissing || data.isOfflineLocalAnalysis) {
        return;
      }

      const normalized = `${this.normalize(prompt)}::${style || 'smart_adaptive'}::${model || 'default'}`;
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
  private model: string;
  private settings: UserSettings;

  constructor(settings: UserSettings) {
    this.settings = settings;
    const isLogged = !!settings.isLoggedIn;
    const smartDefaultModel = isLogged ? 'gemini-3.6-flash' : 'gemini-3.5-flash';
    this.model = settings.model || settings.geminiModel || smartDefaultModel;
  }

  public async getOfflineFallbackResponse(userMessage: string, username?: string): Promise<QuranResponse> {
    return await OfflineQuranService.analyzeQuestionOffline(userMessage, username);
  }

  private cleanAndParseJSON(rawText: string): any {
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

  private async generateDirectClientResponse(
    userMessage: string, 
    username?: string, 
    history?: ChatMessage[],
    style: string = 'smart_adaptive',
    apiKeyToUse?: string
  ): Promise<any> {
    const key = (apiKeyToUse || this.settings.apiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || "").trim();
    if (!key || key === "undefined" || key === "null") {
      throw new Error("NO_API_KEY_FOUND");
    }

    const ai = new GoogleGenAI({ apiKey: key });

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
        if (msg.type === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
        } else if (msg.type === 'ai' && msg.data) {
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
      if (m.includes('pro')) return 'gemini-3.1-pro-preview';
      if (m.includes('lite')) return 'gemini-3.1-flash-lite';
      if (m.includes('3.7')) return 'gemini-3.7-flash';
      return 'gemini-3.8-flash';
    };

    const requestedModel = normalizeModel(this.model);
    const candidateModels = Array.from(new Set([
      requestedModel,
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
      'gemini-3.7-flash'
    ]));

    let lastError: any = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const modelName = candidateModels[i];
      try {
        const modelConfig: any = {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: this.settings.creativityLevel ?? 0.5,
        };

        if (modelName.includes('pro')) {
          modelConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: modelConfig,
        });

        if (response && response.text) {
          return this.cleanAndParseJSON(response.text);
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        if (err?.status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
          await new Promise(r => setTimeout(r, 500));
          try {
            const retryConfig: any = {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: this.settings.creativityLevel ?? 0.5,
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
              return this.cleanAndParseJSON(retryRes.text);
            }
          } catch (retryErr) {
            // Proceed to next model silently
          }
        }
        console.info(`[GeminiService ClientFallback] Model ${modelName} temporary issue, switching to next candidate...`);
      }
    }

    throw lastError || new Error("Failed client generation");
  }

  async sendMessage(
    userMessage: string, 
    username?: string, 
    history?: ChatMessage[],
    onProgress?: (stage: 'thinking' | 'mapping' | 'verifying' | 'formatting') => void
  ): Promise<QuranResponse> {
    // 0. Offline Detection: If user is offline, analyze using local Quran service from downloaded Mushaf
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      if (onProgress) {
        onProgress('thinking');
        await new Promise(resolve => setTimeout(resolve, 250));
        onProgress('mapping');
        await new Promise(resolve => setTimeout(resolve, 250));
        onProgress('verifying');
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress('formatting');
      }
      return await OfflineQuranService.analyzeQuestionOffline(userMessage, username);
    }

    if (onProgress) onProgress('thinking');

    const style = this.settings.analysisStyle || 'smart_adaptive';

    // 1. Check intelligent local cache first (keyed by prompt + style + model)
    const cachedResponse = PromptCache.get(userMessage, style, this.model);
    if (cachedResponse) {
      if (onProgress) {
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress('mapping');
        await new Promise(resolve => setTimeout(resolve, 150));
        onProgress('formatting');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return {
        ...cachedResponse,
        analysisStyle: cachedResponse.analysisStyle || style
      };
    }

    let aiResult: any = null;
    let triedClientFallback = false;

    // 2. Call backend server proxy endpoint securely, but fallback to direct client-side calling if server is unreachable (such as on Netlify)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // If user entered their own custom key in settings, pass it securely via headers only
      if (this.settings.apiKey && this.settings.apiKey.trim().length > 0) {
        headers['x-user-gemini-key'] = this.settings.apiKey.trim();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const baseUrl = Capacitor.isNativePlatform() ? 'https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app' : '';
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          userMessage,
          history: (history || []).map(h => ({
            role: h.type === 'user' ? 'user' : 'model',
            content: h.content,
            data: h.data
          })),
          settings: {
            model: this.model,
            creativityLevel: this.settings.creativityLevel,
            analysisStyle: style
          },
          style,
          username
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[GeminiService] Backend returned status ${response.status}. Attempting direct client-side Gemini fallback.`);
        const clientKey = (this.settings.apiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || "").trim();
        if (clientKey && clientKey !== "undefined" && clientKey !== "null") {
          triedClientFallback = true;
          aiResult = await this.generateDirectClientResponse(userMessage, username, history, style, clientKey);
        } else {
          throw new Error("SERVER_UNAVAILABLE_AND_NO_CLIENT_KEY");
        }
      } else {
        const jsonResult = await response.json();
        if (!jsonResult.success || !jsonResult.data) {
          console.warn("[GeminiService] AI generation unsuccessful on backend. Attempting direct client-side Gemini fallback.");
          const clientKey = (this.settings.apiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || "").trim();
          if (clientKey && clientKey !== "undefined" && clientKey !== "null") {
            triedClientFallback = true;
            aiResult = await this.generateDirectClientResponse(userMessage, username, history, style, clientKey);
          } else {
            throw new Error("BACKEND_FAILED_AND_NO_CLIENT_KEY");
          }
        } else {
          aiResult = jsonResult.data;
        }
      }
    } catch (error: any) {
      console.warn("[GeminiService] Backend proxy call failed. Attempting direct client-side calling fallback.", error);
      const clientKey = (this.settings.apiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || "").trim();
      if (!triedClientFallback && clientKey && clientKey !== "undefined" && clientKey !== "null") {
        try {
          aiResult = await this.generateDirectClientResponse(userMessage, username, history, style, clientKey);
        } catch (clientErr) {
          console.error("[GeminiService] Both server call and client-side fallback failed:", clientErr);
          throw new Error("تعذر الاتصال بمحرك الذكاء الاصطناعي السحابي. يرجى التأكد من استقرار الاتصال بالإنترنت والمحاولة مجدداً.");
        }
      } else {
        throw new Error("تعذر الاتصال بمحرك الذكاء الاصطناعي السحابي. يرجى التأكد من استقرار الاتصال بالإنترنت والمحاولة مجدداً.");
      }
    }

    try {
      if (onProgress) onProgress('verifying');

      // 3. Verification Layer: Verify and retrieve verified Quran text
      const verifiedVerses: Verse[] = await Promise.all(
        (aiResult.verseMappings || []).map(async (mapping: any) => {
          try {
            const [arabicText, surahName] = await Promise.all([
              QuranDataService.fetchVerifiedVerse(mapping.surahNumber, mapping.ayahNumber),
              QuranDataService.fetchSurahName(mapping.surahNumber)
            ]);
            
            const finalArabicText = arabicText || mapping.arabicText || "عذراً، تعذر جلب نص الآية الكريمة.";
            
            return {
              text: finalArabicText,
              arabicText: finalArabicText,
              surah: surahName,
              surahName,
              number: mapping.ayahNumber,
              surahNumber: mapping.surahNumber,
              ayahNumber: mapping.ayahNumber,
              tafsir: mapping.tafsir,
              tadabbur: mapping.tadabbur,
            };
          } catch (e) {
            console.error(`Failed to verify or retrieve verse ${mapping.surahNumber}:${mapping.ayahNumber}`, e);
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
        summary: aiResult.summary,
        analysisStyle: style
      };

      // 4. Cache the verified response
      PromptCache.set(userMessage, finalResult, style, this.model);

      return finalResult;
    } catch (error: any) {
      console.warn("[GeminiService] Error formatting response:", error);
      throw error;
    }
  }
}
