/**
 * Service to manage offline downloading and caching of Quranic recitation audio
 * using the browser's standard Cache Storage API.
 */

import { getQuranAudioUrl, getAyahLocationFromGlobal } from '../../utils/quranAudio';
import { ResilientDownloader } from '../../services/resilientDownloader';

export interface CacheProgress {
  total: number;
  completed: number;
  percentage: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  error?: string;
}

const CACHE_NAME = 'quran-audio-cache-v1';

export class AudioCacheService {
  /**
   * Check if a specific audio URL is cached
   */
  static async isUrlCached(url: string): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      return !!response;
    } catch (e) {
      console.warn('Cache check failed:', e);
      return false;
    }
  }

  /**
   * Cache a single audio URL into Cache Storage for offline playback with resilient validation
   */
  static async cacheAudioUrl(url: string): Promise<boolean> {
    try {
      if (!('caches' in window) || !url) return false;
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url);
      if (match) return true;

      const blob = await ResilientDownloader.fetchAudioBlob(url, { retries: 2, minBytes: 1500 });
      if (blob) {
        const response = new Response(blob, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': blob.size.toString()
          }
        });
        await cache.put(url, response);
        return true;
      }
    } catch (e) {
      console.warn('Failed to cache audio URL:', url, e);
    }
    return false;
  }

  /**
   * Cache audio for a verse automatically
   */
  static async cacheVerseAudio(reciterId: string, globalAyahNumber?: number, surahNumber?: number, ayahNumberInSurah?: number): Promise<boolean> {
    const url = getQuranAudioUrl(reciterId, globalAyahNumber, surahNumber, ayahNumberInSurah);
    if (!url) return false;
    return await this.cacheAudioUrl(url);
  }

  /**
   * Get the cached URL as an Object URL (Blob) if available, otherwise return original URL
   */
  static async getAudioSource(url: string): Promise<string> {
    try {
      if (!('caches' in window)) return url;
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Error reading from cache:', e);
    }
    return url;
  }

  /**
   * Check if all ayahs of a surah are downloaded for a given reciter
   */
  static async getSurahDownloadStatus(
    surahNumber: number,
    totalAyahs: number,
    reciterId: string,
    ayahs: any[]
  ): Promise<{ isDownloaded: boolean; downloadedCount: number }> {
    try {
      if (!('caches' in window) || !ayahs || ayahs.length === 0) {
        return { isDownloaded: false, downloadedCount: 0 };
      }

      const cache = await caches.open(CACHE_NAME);
      let downloadedCount = 0;

      for (const ayah of ayahs) {
        const url = getQuranAudioUrl(reciterId, ayah.number, surahNumber, ayah.numberInSurah);
        const match = await cache.match(url);
        if (match) {
          downloadedCount++;
        }
      }

      return {
        isDownloaded: downloadedCount === totalAyahs,
        downloadedCount
      };
    } catch (e) {
      console.error('Error getting surah download status:', e);
      return { isDownloaded: false, downloadedCount: 0 };
    }
  }

  /**
   * Download and cache all ayahs of a surah concurrently with retries & data validation
   */
  static async downloadSurah(
    surahNumber: number,
    reciterId: string,
    ayahs: any[],
    onProgress: (progress: CacheProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      if (!('caches' in window)) {
        throw new Error('متصفحك لا يدعم ميزة حفظ الملفات للاستخدام دون اتصال.');
      }

      const cache = await caches.open(CACHE_NAME);
      const total = ayahs.length;

      onProgress({
        total,
        completed: 0,
        percentage: 0,
        status: 'downloading'
      });

      const batchResult = await ResilientDownloader.runBatch(
        ayahs,
        async (ayah, index, batchSignal) => {
          if (batchSignal?.aborted || signal?.aborted) {
            throw new Error('Aborted');
          }

          const url = getQuranAudioUrl(reciterId, ayah.number, surahNumber, ayah.numberInSurah);
          const alreadyCached = await cache.match(url);
          if (alreadyCached) {
            return true;
          }

          const blob = await ResilientDownloader.fetchAudioBlob(url, {
            retries: 3,
            timeoutMs: 15000,
            minBytes: 1500,
            signal: batchSignal || signal
          });

          if (!blob) {
            console.error(`Failed to download ayah ${ayah.number} after retries:`, url);
            return false;
          }

          const response = new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': blob.size.toString()
            }
          });

          await cache.put(url, response);
          return true;
        },
        {
          concurrency: 3,
          signal,
          onProgress: (completed, totalCount, percentage) => {
            onProgress({
              total: totalCount,
              completed,
              percentage,
              status: 'downloading'
            });
          }
        }
      );

      const allSuccess = batchResult.succeeded === total;
      onProgress({
        total,
        completed: batchResult.succeeded,
        percentage: Math.round((batchResult.succeeded / total) * 100),
        status: allSuccess ? 'completed' : 'error',
        error: !allSuccess ? `تم تحميل ${batchResult.succeeded} من أصل ${total} آية. تعذر تحميل البقية بسبب جودة الاتصال.` : undefined
      });
    } catch (e: any) {
      if (e.name === 'AbortError' || signal?.aborted || e.message?.includes('aborted') || e.message === 'Aborted') {
        throw e;
      }
      console.error('Download surah failed:', e);
      onProgress({
        total: ayahs.length,
        completed: 0,
        percentage: 0,
        status: 'error',
        error: e.message || 'حدث خطأ أثناء تحميل السورة'
      });
    }
  }

  /**
   * Remove cached audio files for a surah and reciter to save space
   */
  static async deleteSurahCache(reciterId: string, ayahs: any[], surahNumber?: number): Promise<void> {
    try {
      if (!('caches' in window)) return;
      const cache = await caches.open(CACHE_NAME);
      for (const ayah of ayahs) {
        const sNum = surahNumber || (ayah.number ? getAyahLocationFromGlobal(ayah.number).surah : undefined);
        const url = getQuranAudioUrl(reciterId, ayah.number, sNum, ayah.numberInSurah);
        await cache.delete(url);
      }
    } catch (e) {
      console.error('Failed to delete surah cache:', e);
    }
  }

  /**
   * Get total cache size in Megabytes (MB)
   */
  static async getCacheSize(): Promise<number> {
    try {
      if (!('caches' in window)) return 0;
      if (!('StorageManager' in window) || !navigator.storage || !navigator.storage.estimate) {
        // Fallback calculation or return mock/0
        return 0;
      }
      const estimate = await navigator.storage.estimate();
      // This is overall storage used, not just our cache, but standard API
      // To get specific cache size, we would have to sum up response headers which is slow.
      // So let's approximate or return used bytes.
      return Number(((estimate.usage || 0) / (1024 * 1024)).toFixed(1));
    } catch (e) {
      return 0;
    }
  }

  /**
   * Clear all audio cache
   */
  static async clearAllCache(): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;
      return await caches.delete(CACHE_NAME);
    } catch (e) {
      return false;
    }
  }
}
