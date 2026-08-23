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
      
      // Expected items:
      // - 1 (list) + 1 (meta) = 2
      // - 114 (surahs uthmani)
      // - 604 (pages uthmani)
      // - 114 * 7 (all 7 complete offline surah tafsirs & translations: muyassar, qurtubi, baghawi, waseet, jalalayn, miqbas, en.asad) = 798
      // Total = 2 + 114 + 604 + 798 = 1518 urls
      const totalExpected = 1518;
      const count = keys.filter(k => k.url.includes(API_BASE) || k.url.includes('api.quran.com')).length;
      
      return {
        isCached: count >= totalExpected - 40, // Allowing a tiny margin of error
        count: Math.min(count, totalExpected),
        total: totalExpected
      };
    } catch (e) {
      return { isCached: false, count: 0, total: 1518 };
    }
  }

  /**
   * Download and Cache ALL Quran pages, surahs, translations, metadata, and all scholarly Tafsirs for a complete 100% offline reading experience.
   * Downloads concurrently in controlled chunks to avoid browser rate limits.
   */
  static async downloadAllQuranText(
    onProgress: (progress: TextCacheProgress) => void
  ): Promise<void> {
    try {
      if (!('caches' in window)) {
        throw new Error('متصفحك لا يدعم ميزات التخزين المؤقت للاستخدام دون اتصال.');
      }

      const urlsToDownload: string[] = [];
      
      // 1. Surah List & Meta
      urlsToDownload.push(`${API_BASE}/surah`);
      urlsToDownload.push(`${API_BASE}/meta`);

      // 2. All 114 Surahs (Uthmani)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/quran-uthmani`);
      }

      // 3. All 604 Pages (Uthmani Medina Layout)
      for (let i = 1; i <= 604; i++) {
        urlsToDownload.push(`${API_BASE}/page/${i}/quran-uthmani`);
      }

      // 4. All 114 Surahs Tafsir Muyassar (ar.muyassar)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.muyassar`);
      }

      // 5. All 114 Surahs Tafsir Al-Qurtubi (ar.qurtubi)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.qurtubi`);
      }

      // 6. All 114 Surahs Tafsir Al-Baghawi (ar.baghawi)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.baghawi`);
      }

      // 7. All 114 Surahs Tafsir Al-Waseet (ar.waseet)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.waseet`);
      }

      // 8. All 114 Surahs Tafsir Jalalayn (ar.jalalayn)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.jalalayn`);
      }

      // 9. All 114 Surahs Tanwir Al-Miqbas (ar.miqbas)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.miqbas`);
      }

      // 10. All 114 English Translations (en.asad)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/en.asad`);
      }

      const total = urlsToDownload.length;
      let completed = 0;

      onProgress({
        total,
        completed: 0,
        percentage: 0,
        status: 'downloading'
      });

      const cache = await caches.open(TEXT_CACHE_NAME);

      // Concurrency control to download in smaller batches to avoid rate limiting
      const CONCURRENCY = 5;
      const queue = [...urlsToDownload];
      
      const workers = Array(CONCURRENCY).fill(null).map(async () => {
        while (queue.length > 0) {
          const url = queue.shift();
          if (!url) break;

          try {
            // Check if already in cache
            const alreadyCached = await cache.match(url);
            if (alreadyCached) {
              completed++;
              onProgress({
                total,
                completed,
                percentage: Math.round((completed / total) * 100),
                status: 'downloading'
              });
              continue;
            }

            // Fetch and cache with up to 5 retries and longer backoff to respect rate-limiting
            let success = false;
            const retries = 5;
            let lastError: any = null;

            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                const response = await fetch(url);
                if (response.ok) {
                  await cache.put(url, response);
                  success = true;
                  break;
                } else {
                  lastError = new Error(`HTTP status ${response.status}`);
                }
              } catch (err) {
                lastError = err;
              }
              
              if (attempt < retries) {
                // Progressive backoff to let the API rate-limiter cool down
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            }

            if (!success) {
              console.error(`Failed to pre-cache ${url} after ${retries} attempts:`, lastError);
            } else {
              // Add a very small delay even on success to avoid bursting requests
              await new Promise(resolve => setTimeout(resolve, 80));
            }
          } catch (e) {
            console.error(`Unexpected error for ${url}:`, e);
          }

          completed++;
          onProgress({
            total,
            completed,
            percentage: Math.round((completed / total) * 100),
            status: 'downloading'
          });
        }
      });

      await Promise.all(workers);

      onProgress({
        total,
        completed: total,
        percentage: 100,
        status: 'completed'
      });
    } catch (e: any) {
      console.error('Failed to download Quran text database:', e);
      onProgress({
        total: 1176,
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
