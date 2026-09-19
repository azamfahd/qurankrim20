// Service to fetch Quran data from Alquran.cloud API or local Cache Storage (Fully Offline-First)
import { SURAHS_STATIC_LIST, JUZS_META_STATIC } from '../data/surahsData';

const API_BASE = 'https://api.alquran.cloud/v1';
const TEXT_CACHE_NAME = 'quran-text-api-v1';

export interface TextCacheProgress {
  total: number;
  completed: number;
  percentage: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  error?: string;
}

export class QuranDataService {
  // Static instant data for 0ms initial load
  private static surahsListCache: any[] | null = SURAHS_STATIC_LIST;
  private static pageCache: Record<number, any> = {};
  private static metaCache: any = { juzs: JUZS_META_STATIC };

  /**
   * Helper to perform a cached fetch
   */
  private static async cachedFetch(url: string): Promise<any> {
    try {
      // 1. Try to open the Cache Storage
      let cache: Cache | null = null;
      if ('caches' in window) {
        cache = await caches.open(TEXT_CACHE_NAME);
        // Look up in cache first for extreme offline-first performance
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          const data = await cachedResponse.json();
          return data;
        }
      }

      // 2. Fetch from Network if not in Cache
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      // Clone response and store in Cache Storage
      if (cache && res.status === 200) {
        await cache.put(url, res.clone());
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.warn(`Fetch failed for ${url}, attempting offline-only cache fallback:`, error);
      // Last-resort fallback to Cache in case network is dead and cache wasn't matched above
      if ('caches' in window) {
        const cache = await caches.open(TEXT_CACHE_NAME);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          return await cachedResponse.json();
        }
      }
      throw error;
    }
  }

  static async getSurahsList() {
    if (this.surahsListCache) return this.surahsListCache;
    
    try {
      const data = await this.cachedFetch(`${API_BASE}/surah`);
      if (data && data.code === 200) {
        this.surahsListCache = data.data;
        return data.data;
      }
      throw new Error('Failed to fetch surahs list');
    } catch (error) {
      console.error('Error fetching surahs list:', error);
      return [];
    }
  }

  static async getMeta() {
    if (this.metaCache) return this.metaCache;
    
    try {
      const data = await this.cachedFetch(`${API_BASE}/meta`);
      if (data && data.code === 200) {
        this.metaCache = data.data;
        return data.data;
      }
      throw new Error('Failed to fetch meta');
    } catch (error) {
      console.error('Error fetching meta:', error);
      return null;
    }
  }

  static async getPage(pageNumber: number) {
    if (this.pageCache[pageNumber]) return this.pageCache[pageNumber];
    
    try {
      const data = await this.cachedFetch(`${API_BASE}/page/${pageNumber}/quran-uthmani`);
      if (data && data.code === 200) {
        this.pageCache[pageNumber] = data.data;
        return data.data;
      }
      throw new Error(`Failed to fetch page ${pageNumber}`);
    } catch (error) {
      console.error(`Error fetching page ${pageNumber}:`, error);
      return null;
    }
  }

  static async getSurah(surahNumber: number) {
    try {
      const data = await this.cachedFetch(`${API_BASE}/surah/${surahNumber}/quran-uthmani`);
      if (data && data.code === 200) {
        return data.data;
      }
      throw new Error(`Failed to fetch surah ${surahNumber}`);
    } catch (error) {
      console.error(`Error fetching surah ${surahNumber}:`, error);
      return null;
    }
  }

  static async getSurahTranslation(surahNumber: number, language: string = 'en.asad') {
    try {
      const data = await this.cachedFetch(`${API_BASE}/surah/${surahNumber}/${language}`);
      if (data && data.code === 200) {
        return data.data;
      }
      throw new Error(`Failed to fetch surah translation ${surahNumber}`);
    } catch (error) {
      console.error(`Error fetching surah translation ${surahNumber}:`, error);
      return null;
    }
  }

  static async getTafsir(surahNumber: number, ayahNumberInSurah: number, tafsirId: string = 'ar.muyassar') {
    try {
      // Mapping for Quran.com specific rich tafsirs (Ibn Kathir, Al-Saadi, Al-Tabari, etc.)
      const QURAN_COM_TAFSIR_MAP: Record<string, number> = {
        'ar.saadi': 91,       // تفسير السعدي (تيسير الكريم الرحمن)
        'ar.ibnkathir': 14,   // تفسير ابن كثير (تفسير القرآن العظيم)
        'ar.tabari': 15,      // تفسير الطبري (جامع البيان)
        'ar.qurtubi_qc': 90,  // تفسير القرطبي
        'ar.baghawi_qc': 94,  // تفسير البغوي
        'ar.waseet_qc': 93    // التفسير الوسيط
      };

      if (QURAN_COM_TAFSIR_MAP[tafsirId]) {
        const resourceId = QURAN_COM_TAFSIR_MAP[tafsirId];
        const qcUrl = `https://api.quran.com/api/v4/tafsirs/${resourceId}/by_ayah/${surahNumber}:${ayahNumberInSurah}`;
        try {
          const qcData = await this.cachedFetch(qcUrl);
          if (qcData && qcData.tafsir && qcData.tafsir.text) {
            // Strip complex HTML tags while keeping line breaks clean
            const rawText = qcData.tafsir.text;
            const cleanText = rawText
              .replace(/<br\s*[\/]?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&nbsp;/g, ' ')
              .trim();

            return {
              number: ayahNumberInSurah,
              text: cleanText,
              rawHtml: rawText,
              numberInSurah: ayahNumberInSurah,
              surah: {
                number: surahNumber,
                name: SURAHS_STATIC_LIST.find(s => s.number === surahNumber)?.name || `سورة ${surahNumber}`
              },
              edition: {
                identifier: tafsirId,
                name: qcData.tafsir.resource_name || tafsirId
              }
            };
          }
        } catch (qcErr) {
          console.warn(`Quran.com tafsir fetch failed for ${tafsirId}, checking fallback...`, qcErr);
        }
      }

      // 1. Try checking the pre-cached whole-surah level data first for offline-first instant speed
      const surahData = await this.cachedFetch(`${API_BASE}/surah/${surahNumber}/${tafsirId}`);
      if (surahData && surahData.code === 200 && surahData.data) {
        const s = surahData.data;
        const ayahObj = s.ayahs?.find((a: any) => a.numberInSurah === ayahNumberInSurah) || s.ayahs?.[ayahNumberInSurah - 1];
        if (ayahObj) {
          return {
            number: ayahObj.number,
            text: ayahObj.text,
            numberInSurah: ayahObj.numberInSurah,
            juz: ayahObj.juz,
            manzil: ayahObj.manzil,
            page: ayahObj.page,
            ruku: ayahObj.ruku,
            hizbQuarter: ayahObj.hizbQuarter,
            sajda: ayahObj.sajda,
            surah: {
              number: s.number,
              name: s.name,
              englishName: s.englishName,
              englishNameTranslation: s.englishNameTranslation,
              revelationType: s.revelationType,
              numberOfAyahs: s.numberOfAyahs
            },
            edition: s.edition
          };
        }
      }

      // 2. Try fetching the individual ayah (for dynamic online fetch)
      try {
        const data = await this.cachedFetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumberInSurah}/${tafsirId}`);
        if (data && data.code === 200) {
          return data.data;
        }
      } catch (e) {
        console.warn(`Individual ayah fetch failed for ${surahNumber}:${ayahNumberInSurah}/${tafsirId}`);
      }

      // 3. Last fallback: Try Al-Muyassar pre-cached surah if specific tafsir is missing offline
      if (tafsirId !== 'ar.muyassar') {
        const fallbackSurah = await this.cachedFetch(`${API_BASE}/surah/${surahNumber}/ar.muyassar`);
        if (fallbackSurah && fallbackSurah.code === 200 && fallbackSurah.data) {
          const s = fallbackSurah.data;
          const ayahObj = s.ayahs?.find((a: any) => a.numberInSurah === ayahNumberInSurah) || s.ayahs?.[ayahNumberInSurah - 1];
          if (ayahObj) {
            return {
              number: ayahObj.number,
              text: `[التفسير الميسر]: ${ayahObj.text}`,
              numberInSurah: ayahObj.numberInSurah,
              surah: { number: s.number, name: s.name },
              edition: { identifier: 'ar.muyassar', name: 'التفسير الميسر (تلقائي)' }
            };
          }
        }
      }

      throw new Error('Failed to fetch tafsir from all available sources');
    } catch (error) {
      console.error('Error fetching tafsir:', error);
      return null;
    }
  }

  /**
   * Check if full Quran text & all Tafsirs are cached
   */
  static async checkFullCacheStatus(): Promise<{ isCached: boolean; count: number; total: number }> {
    try {
      if (!('caches' in window)) return { isCached: false, count: 0, total: 1518 };
      const cache = await caches.open(TEXT_CACHE_NAME);
      const keys = await cache.keys();
      
      const count = keys.filter(k => k.url.includes(API_BASE) || k.url.includes('api.quran.com')).length;
      const hasUthmani = keys.some(k => k.url.includes('/page/604/quran-uthmani') || k.url.includes('/quran/quran-uthmani'));
      const hasMuyassar = keys.some(k => k.url.includes('ar.muyassar'));
      const totalExpected = 1518;

      return {
        isCached: (hasUthmani && hasMuyassar) || count >= totalExpected - 50,
        count: Math.min(count, totalExpected),
        total: totalExpected
      };
    } catch (e) {
      return { isCached: false, count: 0, total: 1518 };
    }
  }

  /**
   * Helper to fetch JSON payload with retries and timeout
   */
  private static async fetchJsonWithRetry(url: string, signal?: AbortSignal, retries = 3, timeoutMs = 25000): Promise<any> {
    let lastError: any = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      if (signal?.aborted) throw new Error('Aborted');

      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), timeoutMs);
      const abortHandler = () => controller.abort();
      if (signal) signal.addEventListener('abort', abortHandler, { once: true });

      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
        clearTimeout(timerId);
        if (signal) signal.removeEventListener('abort', abortHandler);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json && (json.code === 200 || json.data)) {
          return json;
        }
        throw new Error(`Invalid JSON response`);
      } catch (err: any) {
        clearTimeout(timerId);
        if (signal) signal.removeEventListener('abort', abortHandler);
        if (err.name === 'AbortError' || signal?.aborted) throw err;
        lastError = err;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 600 * attempt));
        }
      }
    }
    throw lastError || new Error(`Failed to fetch ${url}`);
  }

  /**
   * Ultra-Fast Download and Cache for ALL Quran pages, surahs, translations, and all scholarly Tafsirs.
   * Uses whole-edition bulk downloads to achieve 100x speedup (only ~10 network requests instead of 1518 requests),
   * synthesizing and indexing all 604 pages and 114 surahs locally in memory into Cache Storage.
   */
  static async downloadAllQuranText(
    onProgress: (progress: TextCacheProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      if (!('caches' in window)) {
        throw new Error('متصفحك لا يدعم ميزات التخزين المؤقت للاستخدام دون اتصال.');
      }

      const total = 1518;
      let completed = 0;

      const notify = () => {
        const percentage = Math.min(100, Math.round((completed / total) * 100));
        onProgress({
          total,
          completed,
          percentage,
          status: 'downloading'
        });
      };

      notify();

      const cache = await caches.open(TEXT_CACHE_NAME);

      // --- STEP 1: Metadata & Surah List (2 fast requests) ---
      try {
        const [surahListRes, metaRes] = await Promise.all([
          this.fetchJsonWithRetry(`${API_BASE}/surah`, signal, 3, 10000).catch(() => null),
          this.fetchJsonWithRetry(`${API_BASE}/meta`, signal, 3, 10000).catch(() => null)
        ]);

        if (surahListRes) {
          this.surahsListCache = surahListRes.data;
          await cache.put(
            `${API_BASE}/surah`,
            new Response(JSON.stringify(surahListRes), { headers: { 'Content-Type': 'application/json' } })
          );
        }
        completed++;
        notify();

        if (metaRes) {
          this.metaCache = metaRes.data;
          await cache.put(
            `${API_BASE}/meta`,
            new Response(JSON.stringify(metaRes), { headers: { 'Content-Type': 'application/json' } })
          );
        }
        completed++;
        notify();
      } catch (err: any) {
        if (signal?.aborted) throw err;
      }

      // --- STEP 2: Full Quran Text (1 bulk request -> creates 114 Surahs + 604 Pages) ---
      const fullQuran = await this.fetchJsonWithRetry(`${API_BASE}/quran/quran-uthmani`, signal, 4, 35000);
      if (signal?.aborted) throw new Error('Aborted');

      if (fullQuran && fullQuran.data && Array.isArray(fullQuran.data.surahs)) {
        // Cache full edition URL
        await cache.put(
          `${API_BASE}/quran/quran-uthmani`,
          new Response(JSON.stringify(fullQuran), { headers: { 'Content-Type': 'application/json' } })
        );

        const pageMap: Record<number, any[]> = {};
        const surahsByNumber: Record<number, any> = {};

        // Process and cache all 114 Surahs
        for (const s of fullQuran.data.surahs) {
          if (signal?.aborted) throw new Error('Aborted');

          surahsByNumber[s.number] = {
            number: s.number,
            name: s.name,
            englishName: s.englishName,
            englishNameTranslation: s.englishNameTranslation,
            revelationType: s.revelationType,
            numberOfAyahs: s.ayahs?.length || s.numberOfAyahs || 0
          };

          const surahPayload = {
            code: 200,
            status: 'OK',
            data: s
          };

          await cache.put(
            `${API_BASE}/surah/${s.number}/quran-uthmani`,
            new Response(JSON.stringify(surahPayload), { headers: { 'Content-Type': 'application/json' } })
          );

          if (Array.isArray(s.ayahs)) {
            for (const a of s.ayahs) {
              const p = a.page;
              if (p) {
                if (!pageMap[p]) pageMap[p] = [];
                pageMap[p].push({
                  ...a,
                  surah: surahsByNumber[s.number]
                });
              }
            }
          }

          completed++;
        }
        notify();

        // Process and cache all 604 Pages
        for (let p = 1; p <= 604; p++) {
          if (signal?.aborted) throw new Error('Aborted');

          const pageAyahs = pageMap[p] || [];
          const pageSurahsObj: Record<string, any> = {};
          for (const a of pageAyahs) {
            if (a.surah) {
              pageSurahsObj[a.surah.number] = a.surah;
            }
          }

          const pageData = {
            number: p,
            ayahs: pageAyahs,
            surahs: pageSurahsObj,
            edition: fullQuran.data.edition || { identifier: 'quran-uthmani', language: 'ar', name: 'القرآن الكريم بالرسم العثماني' }
          };

          this.pageCache[p] = pageData;

          const pagePayload = {
            code: 200,
            status: 'OK',
            data: pageData
          };

          await cache.put(
            `${API_BASE}/page/${p}/quran-uthmani`,
            new Response(JSON.stringify(pagePayload), { headers: { 'Content-Type': 'application/json' } })
          );

          completed++;
          if (p % 50 === 0) notify();
        }
        notify();
      }

      // --- STEP 3: Complete Scholarly Tafsirs & Translation in Parallel Bulk Batches ---
      const TAFSIR_EDITIONS = [
        'ar.muyassar', // التفسير الميسر
        'ar.qurtubi',  // تفسير القرطبي
        'ar.baghawi',  // تفسير البغوي
        'ar.waseet',   // التفسير الوسيط
        'ar.jalalayn', // تفسير الجلالين
        'ar.miqbas',   // تنوير المقباس
        'en.asad'      // الترجمة الإنجليزية
      ];

      // Download and index tafsirs with concurrency 3 for maximum network throughput
      const downloadTafsirEdition = async (editionId: string) => {
        if (signal?.aborted) throw new Error('Aborted');
        try {
          const tafsirData = await this.fetchJsonWithRetry(`${API_BASE}/quran/${editionId}`, signal, 3, 30000);
          if (signal?.aborted) throw new Error('Aborted');

          if (tafsirData && tafsirData.data && Array.isArray(tafsirData.data.surahs)) {
            // Put full edition
            await cache.put(
              `${API_BASE}/quran/${editionId}`,
              new Response(JSON.stringify(tafsirData), { headers: { 'Content-Type': 'application/json' } })
            );

            // Synthesize and index all 114 surahs for this tafsir
            for (const s of tafsirData.data.surahs) {
              if (signal?.aborted) throw new Error('Aborted');
              const surahPayload = {
                code: 200,
                status: 'OK',
                data: s
              };
              await cache.put(
                `${API_BASE}/surah/${s.number}/${editionId}`,
                new Response(JSON.stringify(surahPayload), { headers: { 'Content-Type': 'application/json' } })
              );
              completed++;
            }
            notify();
          }
        } catch (tErr: any) {
          if (signal?.aborted) throw tErr;
          console.warn(`Bulk download warning for tafsir edition ${editionId}:`, tErr);
          // If a secondary tafsir fails, advance count so progress continues smoothly
          completed += 114;
          notify();
        }
      };

      // Process tafsirs in parallel batches of 2-3
      const BATCH_SIZE = 2;
      for (let i = 0; i < TAFSIR_EDITIONS.length; i += BATCH_SIZE) {
        if (signal?.aborted) throw new Error('Aborted');
        const batch = TAFSIR_EDITIONS.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(editionId => downloadTafsirEdition(editionId)));
      }

      onProgress({
        total,
        completed: total,
        percentage: 100,
        status: 'completed'
      });
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message === 'Aborted' || signal?.aborted || e.message?.includes('aborted')) throw e;
      console.error('Failed to download Quran text database:', e);
      onProgress({
        total: 1518,
        completed: 0,
        percentage: 0,
        status: 'error',
        error: e.message || 'حدث خطأ أثناء تحميل صفحات المصحف الشريف والتفاسير.'
      });
    }
  }

  /**
   * Delete Quran text cache
   */
  static async deleteTextCache(): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;
      this.surahsListCache = null;
      this.pageCache = {};
      this.metaCache = null;
      return await caches.delete(TEXT_CACHE_NAME);
    } catch (e) {
      return false;
    }
  }
}
