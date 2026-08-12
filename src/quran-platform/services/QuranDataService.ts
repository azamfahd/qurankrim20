// Service to fetch Quran data from Alquran.cloud API or local Cache Storage (Fully Offline-First)
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
  // Memory Cache for fast retrieval in-session
  private static surahsListCache: any[] | null = null;
  private static pageCache: Record<number, any> = {};
  private static metaCache: any = null;

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
      // 1. Try fetching the individual ayah first (for backwards compatibility / dynamic online fetch)
      try {
        const data = await this.cachedFetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumberInSurah}/${tafsirId}`);
        if (data && data.code === 200) {
          return data.data;
        }
      } catch (e) {
        console.warn(`Individual ayah fetch failed for ${surahNumber}:${ayahNumberInSurah}/${tafsirId}, attempting surah-level cache lookup...`);
      }

      // 2. Fall back to checking the pre-cached whole-surah level data
      // Pre-cached surahs can be resolved offline
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
      throw new Error('Failed to fetch tafsir from individual and surah-level sources');
    } catch (error) {
      console.error('Error fetching tafsir:', error);
      return null;
    }
  }

  /**
   * Check if full Quran text is cached
   */
  static async checkFullCacheStatus(): Promise<{ isCached: boolean; count: number; total: number }> {
    try {
      if (!('caches' in window)) return { isCached: false, count: 0, total: 1176 };
      const cache = await caches.open(TEXT_CACHE_NAME);
      const keys = await cache.keys();
      
      // We expect around:
      // - 1 (list) + 1 (meta) = 2
      // - 114 (surahs uthmani)
      // - 114 (translations en.asad)
      // - 604 (pages uthmani)
      // - 114 (tafsir ar.muyassar)
      // - 114 (tafsir ar.jalalayn)
      // - 114 (tafsir ar.ibnkathir)
      // Total = 2 + 114 + 114 + 604 + 114 + 114 + 114 = 1176 urls
      const totalExpected = 1176;
      const count = keys.filter(k => k.url.includes(API_BASE)).length;
      
      return {
        isCached: count >= totalExpected - 30, // Allowing a tiny margin of error
        count: Math.min(count, totalExpected),
        total: totalExpected
      };
    } catch (e) {
      return { isCached: false, count: 0, total: 1176 };
    }
  }

  /**
   * Download and Cache ALL Quran pages, surahs, translations, metadata, and Tafsirs for a complete offline reading experience.
   * Downloads concurrently in controlled chunks (concurrency of 15) to avoid browser rate limits.
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

      // 3. All 114 English Translations
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/en.asad`);
      }

      // 4. All 604 Pages (Uthmani Medina Layout)
      for (let i = 1; i <= 604; i++) {
        urlsToDownload.push(`${API_BASE}/page/${i}/quran-uthmani`);
      }

      // 5. All 114 Surahs Tafsir Muyassar (ar.muyassar)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.muyassar`);
      }

      // 6. All 114 Surahs Tafsir Jalalayn (ar.jalalayn)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.jalalayn`);
      }

      // 7. All 114 Surahs Tafsir Ibn Kathir (ar.ibnkathir)
      for (let i = 1; i <= 114; i++) {
        urlsToDownload.push(`${API_BASE}/surah/${i}/ar.ibnkathir`);
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
