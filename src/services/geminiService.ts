import { QuranResponse, UserSettings, Verse, ChatMessage } from '../types';
import { Capacitor } from '@capacitor/core';
import { QuranDataService } from './quranDataService';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

// Intelligent Arabic prompt caching system to reduce network latency and prevent API quota limits
export function getPrioritizedGeminiKey(userCustomKey?: string): string {
  // 1. User's custom entered key in Settings (Highest Priority)
  if (userCustomKey && typeof userCustomKey === 'string' && userCustomKey.trim().length > 0 && userCustomKey !== 'undefined' && userCustomKey !== 'null') {
    return userCustomKey.trim();
  }
  // 2. Client environment key (e.g. VITE_GEMINI_API_KEY injected by Netlify or Vite build)
  const viteKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  if (viteKey && typeof viteKey === 'string' && viteKey.trim().length > 0 && viteKey !== 'undefined' && viteKey !== 'null') {
    return viteKey.trim();
  }
  // 3. Process environment key if available in build/runtime
  if (typeof process !== 'undefined' && process.env) {
    const pKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (pKey && typeof pKey === 'string' && pKey.trim().length > 0 && pKey !== 'undefined' && pKey !== 'null') {
      return pKey.trim();
    }
  }
  return '';
}

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
    const key = getPrioritizedGeminiKey(apiKeyToUse || this.settings.apiKey);
    if (!key) {
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
      if (m.includes('3.7')) return 'gemini-3.7-flash';
      if (m.includes('3.6')) return 'gemini-3.6-flash';
      if (m.includes('3.5')) return 'gemini-3.5-flash';
      if (m.includes('pro')) return 'gemini-3.1-pro-preview';
      if (m.includes('lite')) return 'gemini-3.1-flash-lite';
      return 'gemini-3.8-flash';
    };

    const requestedModel = normalizeModel(this.model);
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
    // 0. Online Requirement: The smart AI assistant requires an active internet connection to provide deep cloud analysis
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      throw new Error("يتطلب المساعد القرآني الذكي اتصالاً نشطاً بالإنترنت لتقديم الإجابة السحابية الدقيقة والمفصلة. يرجى الاتصال بالإنترنت والمحاولة مجدداً.");
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
    const prioritizedKey = getPrioritizedGeminiKey(this.settings.apiKey);

    // 2. Call backend server proxy endpoint securely, but fallback to direct client-side calling or Cloud Run proxy if server is unreachable (such as on Netlify)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // If user entered their own custom key in settings or we have a prioritized key, pass it securely via headers
      if (prioritizedKey) {
        headers['x-user-gemini-key'] = prioritizedKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const isCloudRunHost = typeof window !== 'undefined' && window.location.hostname.includes('.run.app');
      const baseUrl = (isLocalHost || isCloudRunHost) ? '' : 'https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app';

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
        if (prioritizedKey) {
          triedClientFallback = true;
          aiResult = await this.generateDirectClientResponse(userMessage, username, history, style, prioritizedKey);
        } else {
          throw new Error("SERVER_UNAVAILABLE_AND_NO_CLIENT_KEY");
        }
      } else {
        const jsonResult = await response.json();
        if (!jsonResult.success || !jsonResult.data) {
          console.warn("[GeminiService] AI generation unsuccessful on backend. Attempting direct client-side Gemini fallback.");
          if (prioritizedKey) {
            triedClientFallback = true;
            aiResult = await this.generateDirectClientResponse(userMessage, username, history, style, prioritizedKey);
          } else {
            throw new Error("BACKEND_FAILED_AND_NO_CLIENT_KEY");
          }
        } else {
          aiResult = jsonResult.data;
        }
      }
    } catch (error: any) {
      console.warn("[GeminiService] Primary backend proxy call failed. Attempting resilient direct client-side calling fallback.", error);
      if (!triedClientFallback && prioritizedKey) {
        try {
          aiResult = await this.generateDirectClientResponse(userMessage, username, history, style, prioritizedKey);
        } catch (clientErr) {
          console.error("[GeminiService] Direct client-side generation also encountered an error:", clientErr);
          throw new Error("تعذر الاتصال بمحرك الذكاء الاصطناعي السحابي. يرجى التأكد من صحة مفتاح API أو استقرار الاتصال بالإنترنت والمحاولة مجدداً.");
        }
      } else {
        // As a last cloud resort if on static host without client key, attempt direct Cloud Run server
        try {
          const fallbackHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (prioritizedKey) fallbackHeaders['x-user-gemini-key'] = prioritizedKey;
          const cloudRunRes = await fetch('https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app/api/ai/chat', {
            method: 'POST',
            headers: fallbackHeaders,
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
          const cloudRunJson = await cloudRunRes.json();
          if (cloudRunJson.success && cloudRunJson.data) {
            aiResult = cloudRunJson.data;
          } else {
            throw new Error(cloudRunJson.error || "Cloud run proxy failed");
          }
        } catch (cloudRunErr) {
          throw new Error("تعذر الاتصال بمحرك الذكاء الاصطناعي السحابي. يرجى التأكد من استقرار الاتصال بالإنترنت والمحاولة مجدداً.");
        }
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
