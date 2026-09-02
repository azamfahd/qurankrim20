import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { requestDynamicPermission, PermissionService } from "./permissionService";
import { NativeNotificationService } from "./nativeNotificationService";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from 'adhan';
import { UserLocation, AdhanSettings } from '../types';

export interface MuezzinInfo {
  id: string;
  name: string;
  description: string;
  country: string;
  audioUrls: string[];
}

/**
 * Resolves an audio asset path correctly for all deployment environments
 * including production sub-paths (Vite base URL), Netlify, and Capacitor/APK
 */
export function resolveAudioPath(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${cleanPath}`;
}

export const MUEZZINS_LIST: MuezzinInfo[] = [
  {
    id: 'mishary',
    name: 'مشاري راشد العفاسي',
    description: 'أذان هادئ وخاشع ورخيم',
    country: 'الكويت',
    audioUrls: [
      '/audio/adhan/mishary.mp3',
      'https://cdn.aladhan.com/audio/adhans/a1.mp3'
    ]
  },
  {
    id: 'al_mulla',
    name: 'الشيخ علي أحمد ملا',
    description: 'أذان الحرم المكي الشريف التاريخي',
    country: 'مكة المكرمة',
    audioUrls: [
      '/audio/adhan/al_mulla.mp3',
      'https://cdn.aladhan.com/audio/adhans/a2.mp3'
    ]
  },
  {
    id: 'madina',
    name: 'أذان المسجد النبوي الشريف',
    description: 'نبرة المدينة المنورة العطرة الخاشعة',
    country: 'المدينة المنورة',
    audioUrls: [
      '/audio/adhan/madina.mp3',
      'https://cdn.aladhan.com/audio/adhans/a7.mp3'
    ]
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد',
    description: 'أذان مصري أصيل بنبرة تاريخية عذبة',
    country: 'مصر',
    audioUrls: [
      '/audio/adhan/abdulbasit.mp3',
      'https://cdn.aladhan.com/audio/adhans/a3.mp3'
    ]
  },
  {
    id: 'mansour',
    name: 'الشيخ منصور الزهراني',
    description: 'أذان حجازي عذب وبصوت ندي',
    country: 'السعودية',
    audioUrls: [
      '/audio/adhan/mansour.mp3',
      'https://cdn.aladhan.com/audio/adhans/a4.mp3'
    ]
  },
  {
    id: 'alghamdi',
    name: 'الشيخ سعد الغامدي',
    description: 'أذان نقي ومؤثر يريح القلوب',
    country: 'السعودية',
    audioUrls: [
      '/audio/adhan/alghamdi.mp3',
      'https://cdn.aladhan.com/audio/adhans/a5.mp3'
    ]
  },
  {
    id: 'qatami',
    name: 'الشيخ ناصر القطامي',
    description: 'أذان خاشع وعميق التأثير',
    country: 'الرياض',
    audioUrls: [
      '/audio/adhan/qatami.mp3',
      'https://cdn.aladhan.com/audio/adhans/a6.mp3'
    ]
  },
  {
    id: 'aqsa',
    name: 'أذان المسجد الأقصى المبارك',
    description: 'نداء القدس الشريف العريق',
    country: 'القدس الشريف',
    audioUrls: [
      '/audio/adhan/aqsa.mp3',
      'https://cdn.aladhan.com/audio/adhans/a8.mp3'
    ]
  }
];

const DB_NAME = 'anis_adhan_offline_storage_v1';
const STORE_NAME = 'muezzin_audio_blobs';
const ADHAN_RUNTIME_CACHE = 'anis-al-qulub-runtime-v5';

/**
 * Robust IndexedDB & Cache Storage Helper for 100% Offline Adhan Audio
 */
export class AdhanOfflineManager {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static activeDownloads: Map<string, Promise<{ success: boolean; error?: string }>> = new Map();

  private static getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is not supported'));
          return;
        }

        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  /**
   * Validate audio blob integrity (checks MIME type and minimum size to avoid caching HTML 404s)
   */
  public static isValidAudioBlob(blob: Blob): boolean {
    if (!blob) return false;
    if (blob.size < 50000) return false; // Minimum 50KB for valid adhan audio clip
    const type = (blob.type || '').toLowerCase();
    if (type.includes('html') || type.includes('text') || type.includes('xml')) {
      return false;
    }
    return true;
  }

  /**
   * Save audio blob into Cache API (Service Worker Cache) and IndexedDB
   */
  public static async saveMuezzinAudio(muezzinId: string, blob: Blob): Promise<boolean> {
    try {
      if (!this.isValidAudioBlob(blob)) {
        console.warn('Rejected saving invalid/corrupted audio blob for', muezzinId);
        return false;
      }

      // 1. Primary Save to Cache Storage (Cache API) for Service Worker offline serving
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(ADHAN_RUNTIME_CACHE);
          const response = new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': blob.size.toString(),
              'X-Cached-By': 'AnisAlQulub'
            }
          });
          const targetPath = resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`);
          await cache.put(targetPath, response.clone());
          await cache.put(`/audio/adhan/${muezzinId}.mp3`, response.clone());
          
          // Also cache remote CDN fallback URL for that muezzin if present
          const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId);
          if (muezzin && muezzin.audioUrls) {
            for (const u of muezzin.audioUrls) {
              await cache.put(u, response.clone()).catch(() => {});
            }
          }
        } catch (cacheErr) {
          console.warn('Cache API storage notice:', cacheErr);
        }
      }

      // 1.5. Native Platform Persistent Save
      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              if (reader.result) {
                const result = reader.result as string;
                resolve(result.split(',')[1] || result);
              } else {
                reject(new Error('Failed to read blob'));
              }
            };
            reader.onerror = reject;
          });
          await Filesystem.writeFile({
            path: `adhan_${muezzinId}.mp3`,
            data: base64Data,
            directory: Directory.Data
          });
        } catch (nativeErr) {
          console.warn('Native Filesystem storage notice:', nativeErr);
        }
      }

      // 2. Mirror into IndexedDB for persistent blob records
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const item = {
            id: muezzinId,
            blob,
            size: blob.size,
            type: blob.type || 'audio/mpeg',
            updatedAt: Date.now()
          };
          store.put(item);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(new Error('Transaction aborted'));
        });
      } catch (idbErr) {
        console.warn('IndexedDB mirror notice:', idbErr);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ADHAN_STORAGE_UPDATED', { detail: { muezzinId, size: blob.size } }));
      }

      return true;
    } catch (err) {
      console.error(`Failed to save muezzin ${muezzinId} offline:`, err);
      return false;
    }
  }

  /**
   * Check if a muezzin audio is downloaded locally with integrity verification
   */
  public static async isMuezzinDownloaded(muezzinId: string): Promise<{ downloaded: boolean; sizeBytes: number }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const stat = await Filesystem.stat({
          directory: Directory.Data,
          path: `adhan_${muezzinId}.mp3`
        });
        if (stat && stat.size > 50000) {
          return { downloaded: true, sizeBytes: stat.size };
        }
      } catch {
        // Fallback to web blob if not found in Native FS
      }
    }

    try {
      const blob = await this.getMuezzinBlob(muezzinId);
      if (blob && this.isValidAudioBlob(blob)) {
        return { downloaded: true, sizeBytes: blob.size };
      }
      return { downloaded: false, sizeBytes: 0 };
    } catch {
      return { downloaded: false, sizeBytes: 0 };
    }
  }

  /**
   * Retrieve Blob for offline playback directly from Cache API (Service Worker Cache) or IndexedDB
   */
  public static async getMuezzinBlob(muezzinId: string): Promise<Blob | null> {
    // 1. First check Cache API (Service Worker cache storage)
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(ADHAN_RUNTIME_CACHE);
        const targetPath = resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`);
        let cachedResp = await cache.match(targetPath);
        if (!cachedResp) {
          cachedResp = await cache.match(`/audio/adhan/${muezzinId}.mp3`);
        }
        if (!cachedResp) {
          const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId);
          if (muezzin && muezzin.audioUrls) {
            for (const u of muezzin.audioUrls) {
              cachedResp = await cache.match(u);
              if (cachedResp) break;
            }
          }
        }

        if (cachedResp) {
          const blob = await cachedResp.blob();
          if (this.isValidAudioBlob(blob)) {
            return blob;
          }
        }
      } catch (cacheErr) {
        console.warn('Cache API lookup notice:', cacheErr);
      }
    }

    // 2. Fallback to IndexedDB
    try {
      const db = await this.getDB();
      const item = await new Promise<any>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(muezzinId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (item && item.blob) {
        if (this.isValidAudioBlob(item.blob)) {
          // Re-sync into Cache API if missing in Cache
          if (typeof caches !== 'undefined') {
            caches.open(ADHAN_RUNTIME_CACHE).then(cache => {
              const resp = new Response(item.blob, { headers: { 'Content-Type': 'audio/mpeg' } });
              cache.put(resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`), resp);
            }).catch(() => {});
          }
          return item.blob;
        } else {
          console.warn(`Purging corrupted/small adhan cache for ${muezzinId} (${item.blob.size} bytes)`);
          this.deleteMuezzin(muezzinId).catch(() => {});
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get all downloaded muezzin IDs and total size
   */
  public static async getAllDownloadedStatus(): Promise<{ downloadedIds: string[]; totalSizeBytes: number }> {
    const validIdsSet = new Set<string>();
    let totalSize = 0;

    // Check Cache API
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(ADHAN_RUNTIME_CACHE);
        for (const m of MUEZZINS_LIST) {
          const res = await cache.match(resolveAudioPath(`/audio/adhan/${m.id}.mp3`)) || await cache.match(`/audio/adhan/${m.id}.mp3`);
          if (res) {
            const blob = await res.blob();
            if (this.isValidAudioBlob(blob)) {
              validIdsSet.add(m.id);
              totalSize += blob.size;
            }
          }
        }
      } catch {}
    }

    // Check IndexedDB
    try {
      const db = await this.getDB();
      const items = await new Promise<any[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      for (const it of items) {
        if (it && it.blob && this.isValidAudioBlob(it.blob)) {
          if (!validIdsSet.has(it.id)) {
            validIdsSet.add(it.id);
            totalSize += it.blob.size;
          }
        } else if (it && it.id) {
          this.deleteMuezzin(it.id).catch(() => {});
        }
      }
    } catch {}

    return { downloadedIds: Array.from(validIdsSet), totalSizeBytes: totalSize };
  }

  /**
   * Delete downloaded muezzin audio to free device space
   */
  public static async deleteMuezzin(muezzinId: string): Promise<boolean> {
    try {
      // 1. Delete from Cache API
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(ADHAN_RUNTIME_CACHE);
          await cache.delete(resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`));
          await cache.delete(`/audio/adhan/${muezzinId}.mp3`);
          const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId);
          if (muezzin && muezzin.audioUrls) {
            for (const u of muezzin.audioUrls) {
              await cache.delete(u).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('Cache deletion notice:', e);
        }
      }

      // 2. Delete from IndexedDB
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.delete(muezzinId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(new Error('Transaction aborted'));
        });
      } catch (idbErr) {
        console.warn('IndexedDB delete notice:', idbErr);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ADHAN_STORAGE_UPDATED', { detail: { muezzinId, deleted: true } }));
      }

      return true;
    } catch (err) {
      console.error(`Failed to delete muezzin ${muezzinId}:`, err);
      return false;
    }
  }

  /**
   * Download audio file with concurrency control, multiple CDNs fallback & integrity checks
   */
  public static async downloadMuezzinAudio(
    muezzinId: string,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Check if already downloaded with valid blob to prevent redundant downloading
    const existing = await this.isMuezzinDownloaded(muezzinId);
    if (existing.downloaded) {
      if (onProgress) onProgress(100);
      return { success: true };
    }

    if (this.activeDownloads.has(muezzinId)) {
      return this.activeDownloads.get(muezzinId)!;
    }

    const downloadTask = (async () => {
      const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId);
      if (!muezzin) {
        return { success: false, error: 'المؤذن غير موجود' };
      }

      const urls = muezzin.audioUrls.map(u => resolveAudioPath(u));
      let lastError = '';

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          if (onProgress) onProgress(20 + i * 10);
          
          const fetchController = new AbortController();
          const timeoutId = setTimeout(() => fetchController.abort(), 60000);
          
          if (signal) {
            signal.addEventListener('abort', () => fetchController.abort());
            if (signal.aborted) throw new Error('Aborted');
          }

          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache',
            signal: fetchController.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
            throw new Error('الرابط أعاد صفحة ويب وليس ملفاً صوتياً');
          }

          if (onProgress) onProgress(65);

          const blob = await response.blob();
          
          if (!this.isValidAudioBlob(blob)) {
            throw new Error('الملف المحمل غير صالح أو تالف');
          }

          if (onProgress) onProgress(85);

          const saved = await this.saveMuezzinAudio(muezzinId, blob);
          if (saved) {
            if (onProgress) onProgress(100);
            return { success: true };
          } else {
            throw new Error('فشل الحفظ في التخزين المحلي');
          }
        } catch (err: any) {
          if (err.name === 'AbortError' || signal?.aborted || err.message?.includes('aborted') || err.message === 'Aborted') {
            throw err;
          }
          console.warn(`Download attempt for ${muezzinId} from ${url} failed:`, err);
          lastError = err?.message || 'تعذر التحميل';
        }
      }

      return { success: false, error: lastError || 'تعذر تنزيل ملف الصوت. يرجى التحقق من اتصال الإنترنت.' };
    })();

    this.activeDownloads.set(muezzinId, downloadTask);

    try {
      const result = await downloadTask;
      return result;
    } finally {
      this.activeDownloads.delete(muezzinId);
    }
  }

  /**
   * Automatically downloads and caches all missing muezzins in the background without duplicating existing ones
   */
  public static async autoDownloadAllMuezzins(
    onProgress?: (muezzinId: string, percent: number, totalDone: number, totalCount: number) => void,
    signal?: AbortSignal
  ): Promise<{ success: boolean; totalDownloaded: number }> {
    try {
      const status = await this.getAllDownloadedStatus();
      const downloadedSet = new Set(status.downloadedIds);
      const totalCount = MUEZZINS_LIST.length;
      
      let completed = downloadedSet.size;

      if (downloadedSet.size === totalCount) {
        if (onProgress) onProgress(MUEZZINS_LIST[0].id, 100, totalCount, totalCount);
        return { success: true, totalDownloaded: totalCount };
      }

      for (const m of MUEZZINS_LIST) {
        if (signal?.aborted) {
          throw new Error('Aborted');
        }

        if (downloadedSet.has(m.id)) {
          if (onProgress) onProgress(m.id, 100, completed, totalCount);
          continue;
        }

        if (onProgress) onProgress(m.id, 15, completed, totalCount);
        
        const res = await this.downloadMuezzinAudio(m.id, (p) => {
          if (onProgress) onProgress(m.id, p, completed, totalCount);
        }, signal);

        if (res.success) {
          downloadedSet.add(m.id);
          completed = downloadedSet.size;
          if (onProgress) onProgress(m.id, 100, completed, totalCount);
        }
      }

      const finalStatus = await this.getAllDownloadedStatus();
      return { success: true, totalDownloaded: finalStatus.downloadedIds.length };
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message === 'Aborted' || signal?.aborted || e.message?.includes('aborted')) throw e;
      console.warn("autoDownloadAllMuezzins notice:", e);
      return { success: false, totalDownloaded: 0 };
    }
  }

  /**
   * Fast pre-check to verify if audio exists locally in IndexedDB, Cache, or Native Filesystem
   */
  public static async hasOfflineAudio(muezzinId: string): Promise<boolean> {
    const status = await this.isMuezzinDownloaded(muezzinId);
    return status.downloaded;
  }

  /**
   * Proactively pre-cache a single muezzin audio file into IndexedDB and Native FS
   */
  public static async preCacheMuezzin(muezzinId: string): Promise<boolean> {
    const isDownloaded = await this.hasOfflineAudio(muezzinId);
    if (isDownloaded) return true;

    // 1. Attempt pre-caching from bundled asset path first
    const localPath = resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`);
    try {
      const resp = await fetch(localPath, { cache: 'force-cache' });
      if (resp.ok) {
        const blob = await resp.blob();
        if (this.isValidAudioBlob(blob)) {
          return await this.saveMuezzinAudio(muezzinId, blob);
        }
      }
    } catch {}

    // 2. If bundled asset fetch is not available, download & pre-cache from remote audio URLs
    const downloadRes = await this.downloadMuezzinAudio(muezzinId);
    return downloadRes.success;
  }

  /**
   * Proactively pre-cache all selected muezzin audio files configured in settings into IndexedDB at startup
   */
  public static async preCacheSelectedMuezzins(settings?: AdhanSettings): Promise<void> {
    const muezzinIdsToCache = new Set<string>();

    if (settings) {
      if (settings.muezzin) muezzinIdsToCache.add(settings.muezzin);
      if ((settings as any).fajrMuezzin) muezzinIdsToCache.add((settings as any).fajrMuezzin);
      if ((settings as any).dhuhrMuezzin) muezzinIdsToCache.add((settings as any).dhuhrMuezzin);
      if ((settings as any).asrMuezzin) muezzinIdsToCache.add((settings as any).asrMuezzin);
      if ((settings as any).maghribMuezzin) muezzinIdsToCache.add((settings as any).maghribMuezzin);
      if ((settings as any).ishaMuezzin) muezzinIdsToCache.add((settings as any).ishaMuezzin);
    }

    muezzinIdsToCache.add('mishary');

    for (const muezzinId of muezzinIdsToCache) {
      await this.preCacheMuezzin(muezzinId).catch(err => {
        console.warn(`Pre-caching notice for ${muezzinId}:`, err);
      });
    }
  }

  /**
   * Seed all bundled local audio assets into IndexedDB & Cache storage on app initialization.
   * This guarantees 100% offline playback from local storage even before user triggers any manual download.
   */
  public static async seedLocalAssets(settings?: AdhanSettings): Promise<void> {
    try {
      await this.preCacheSelectedMuezzins(settings);
      for (const muezzin of MUEZZINS_LIST) {
        await this.preCacheMuezzin(muezzin.id).catch(() => {});
      }
    } catch (e) {
      console.warn("seedLocalAssets notice:", e);
    }
  }

  /**
   * Create an offline Object URL from stored Blob or Native FS path
   */
  public static async getOfflineBlobUrl(muezzinId: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.getUri({
          directory: Directory.Data,
          path: `adhan_${muezzinId}.mp3`
        });
        if (result && result.uri) {
          return Capacitor.convertFileSrc(result.uri);
        }
      } catch {}
    }

    const blob = await this.getMuezzinBlob(muezzinId);
    if (blob && this.isValidAudioBlob(blob)) {
      return URL.createObjectURL(blob);
    }
    return null;
  }
}

export function isTestOrPreview(prayerName: string | null | undefined): boolean {
  if (!prayerName) return false;
  const lower = prayerName.toLowerCase();
  return lower.includes('تجرب') || lower.includes('اختبار') || lower.includes('معاين') || lower.includes('preview') || lower.includes('test');
}

export interface AdhanEngineState {
  isPlaying: boolean;
  activeMuezzinId: string | null;
  activePrayerName: string | null;
  isLiveAdhan: boolean;
  isPreview: boolean;
}

export interface PrayerTimeInfo {
  name: string;
  key: keyof Pick<AdhanSettings, 'fajrEnabled' | 'dhuhrEnabled' | 'asrEnabled' | 'maghribEnabled' | 'ishaEnabled'>;
  time: Date;
  formattedTime: string;
  isCurrent: boolean;
  isNext: boolean;
}

export interface DayPrayerSchedule {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  currentPrayer: string | null;
  nextPrayer: string | null;
  nextPrayerTime: Date | null;
  prayersList: PrayerTimeInfo[];
}

const PRAYER_VERSES = [
  "۞ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا ۞",
  "۞ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ ۞",
  "۞ يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ۞",
  "۞ أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا ۞",
  "۞ وَأَقِمِ الصَّلَاةَ لِذِكْرِي ۞"
];

export class AdhanAudioEngine {
  private static currentAudio: HTMLAudioElement | null = null;
  private static activePlayingId: string | null = null;
  private static onStopCallback: (() => void) | null = null;
  private static activeObjectUrl: string | null = null;
  private static wakeLockSentinel: any = null;
  private static isSWListenerInitialized: boolean = false;
  private static isAudioUnlocked: boolean = false;
  private static sharedAudioContext: AudioContext | null = null;
  private static currentBufferSource: AudioBufferSourceNode | null = null;
  private static activeChimeNodes: { stop: () => void }[] = [];
  private static currentSessionId: number = 0;
  private static pendingAudioInstances: Set<HTMLAudioElement> = new Set();
  private static backgroundKeepAliveAudio: HTMLAudioElement | null = null;
  private static preAllocatedAdhanAudio: HTMLAudioElement | null = null;
  private static keepAliveOscillator: OscillatorNode | null = null;
  private static pendingArmedPlayback: { muezzinId: string; volume: number; prayerName: string } | null = null;
  private static subscribers: Set<(state: AdhanEngineState) => void> = new Set();
  private static activePrayerName: string | null = null;
  private static manuallyStoppedPrayers: Map<string, number> = new Map();
  private static lastPlaybackAttempt: { prayerName: string; timestamp: number; muezzinId: string } | null = null;

  public static get currentAdhanPrayer(): string | null {
    return this.activePrayerName;
  }

  public static getCurrentAdhanPrayer(): string | null {
    return this.activePrayerName;
  }

  public static isLiveAdhanPlaying(): boolean {
    return this.isPlaying() && !!this.activePrayerName && !isTestOrPreview(this.activePrayerName);
  }

  public static isPreviewPlaying(): boolean {
    return this.isPlaying() && !!this.activePrayerName && isTestOrPreview(this.activePrayerName);
  }

  public static getEngineState(): AdhanEngineState {
    const isPlaying = this.isPlaying();
    const isLiveAdhan = isPlaying && !!this.activePrayerName && !isTestOrPreview(this.activePrayerName);
    const isPreview = isPlaying && !!this.activePrayerName && isTestOrPreview(this.activePrayerName);
    return {
      isPlaying,
      activeMuezzinId: this.activePlayingId,
      activePrayerName: this.activePrayerName,
      isLiveAdhan,
      isPreview
    };
  }

  public static isPrayerManuallyStopped(prayerName: string): boolean {
    if (!prayerName) return false;
    const stoppedTime = this.manuallyStoppedPrayers.get(prayerName);
    if (!stoppedTime) return false;
    if (Date.now() - stoppedTime < 30 * 60 * 1000) {
      return true;
    }
    this.manuallyStoppedPrayers.delete(prayerName);
    return false;
  }

  public static clearManuallyStoppedPrayer(prayerName?: string): void {
    if (prayerName) {
      this.manuallyStoppedPrayers.delete(prayerName);
    } else {
      this.manuallyStoppedPrayers.clear();
    }
  }

  public static subscribe(callback: (state: AdhanEngineState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getEngineState());
    return () => this.subscribers.delete(callback);
  }

  private static emitState() {
    const state = this.getEngineState();
    this.subscribers.forEach(cb => {
      try { cb(state); } catch {}
    });
  }

  public static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.sharedAudioContext) {
        this.sharedAudioContext = new AudioCtx();
      }
      return this.sharedAudioContext;
    } catch {
      return null;
    }
  }

  public static unlockAudioContext(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isAudioUnlocked = true;
          }).catch(() => {});
        } else if (ctx.state === 'running') {
          this.isAudioUnlocked = true;
        }

        if (!this.keepAliveOscillator && ctx.state === 'running') {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.00001;
            osc.frequency.value = 440;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            this.keepAliveOscillator = osc;
          } catch {}
        }
      }

      if (!this.backgroundKeepAliveAudio) {
        this.backgroundKeepAliveAudio = new Audio();
        this.backgroundKeepAliveAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.backgroundKeepAliveAudio.volume = 0.001;
        this.backgroundKeepAliveAudio.loop = true;
        this.backgroundKeepAliveAudio.crossOrigin = 'anonymous';
        const playPromise = this.backgroundKeepAliveAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.isAudioUnlocked = true;
          }).catch(() => {});
        }
      } else if (this.backgroundKeepAliveAudio.paused) {
        this.backgroundKeepAliveAudio.play().catch(() => {});
      }

      if (!this.preAllocatedAdhanAudio) {
        this.preAllocatedAdhanAudio = new Audio();
        this.preAllocatedAdhanAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.preAllocatedAdhanAudio.volume = 0;
        this.preAllocatedAdhanAudio.crossOrigin = 'anonymous';
        this.preAllocatedAdhanAudio.play().catch(() => {});
      } else if (this.preAllocatedAdhanAudio.paused && this.preAllocatedAdhanAudio.src.includes('data:audio/wav')) {
        this.preAllocatedAdhanAudio.play().catch(() => {});
      }

      if (this.pendingArmedPlayback) {
        const armed = { ...this.pendingArmedPlayback };
        this.pendingArmedPlayback = null;
        this.play(armed.muezzinId, armed.volume, undefined, undefined, armed.prayerName);
      }

    } catch (e) {
      console.warn('Audio unlock notice:', e);
    }
  }

  public static setupInteractionAudioUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockAudioContext();
    };

    ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown', 'scroll', 'focus', 'pageshow', 'visibilitychange'].forEach(evt => {
      window.addEventListener(evt, unlockHandler, { passive: true });
    });
  }

  public static initServiceWorkerListeners() {
    if (this.isSWListenerInitialized) return;
    this.isSWListenerInitialized = true;

    this.setupInteractionAudioUnlock();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        
        if (event.data.type === 'STOP_ADHAN') {
          this.stop();
        } else if (event.data.type === 'PLAY_ADHAN' || event.data.type === 'TRIGGER_ADHAN_NOTIFICATION') {
          const prayerName = event.data.prayerName || 'الصلاة';
          let muezzinId = event.data.muezzinId;
          
          if (!muezzinId) {
            try {
              const savedAdhan = localStorage.getItem('anis_adhan_settings');
              if (savedAdhan) {
                const parsed = JSON.parse(savedAdhan);
                if (parsed.muezzin) muezzinId = parsed.muezzin;
              }
              if (!muezzinId) {
                const savedSettings = localStorage.getItem('anis_settings');
                if (savedSettings) {
                  const parsed = JSON.parse(savedSettings);
                  if (parsed.adhanSettings?.muezzin) muezzinId = parsed.adhanSettings.muezzin;
                }
              }
            } catch {}
          }
          muezzinId = muezzinId || 'mishary';
          
          if (this.isPlaying() && this.activePlayingId === muezzinId && this.activePrayerName === prayerName) {
            return;
          }

          this.unlockAudioContext();
          this.play(muezzinId, 90, undefined, undefined, prayerName);
        }
      });
    }
  }

  private static async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      }
    } catch (e) {
      console.warn("WakeLock notice:", e);
    }
  }

  private static releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (e) {}
  }

  private static setupMediaSession(muezzinName: string, prayerName: string = 'الصلاة', audio?: HTMLAudioElement) {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `🕌 أذان صلاة ${prayerName}`,
          artist: `المؤذن: ${muezzinName}`,
          album: 'أنيس القلوب - رفيقك القرآني',
          artwork: [
            { src: resolveAudioPath('/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
            { src: resolveAudioPath('/icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
            { src: resolveAudioPath('/app-icon.svg'), sizes: '512x512', type: 'image/svg+xml' }
          ]
        });

        navigator.mediaSession.playbackState = 'playing';

        const defaultActions: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
          ['play', () => {
            if (this.currentAudio && this.currentAudio.paused) {
              this.currentAudio.play().catch(() => {});
              navigator.mediaSession.playbackState = 'playing';
            }
          }],
          ['pause', () => {
            this.stop();
          }],
          ['stop', () => {
            this.stop();
          }],
          ['previoustrack', null],
          ['nexttrack', null],
          ['seekbackward', null],
          ['seekforward', null],
          ['seekto', null]
        ];

        defaultActions.forEach(([action, handler]) => {
          try {
            navigator.mediaSession.setActionHandler(action, handler);
          } catch {}
        });

        if (audio) {
          audio.ontimeupdate = () => {
            if ('setPositionState' in navigator.mediaSession && audio.duration && !isNaN(audio.duration)) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: audio.duration,
                  playbackRate: audio.playbackRate || 1.0,
                  position: audio.currentTime
                });
              } catch {}
            }
          };
        }
      } catch (e) {
        console.warn("MediaSession setup notice:", e);
      }
    }
  }

  public static async dispatchPrayerNotification(prayerName: string, muezzinName: string) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([600, 300, 600, 300, 1000, 500, 1000]);
      }
    } catch {}

    try {
      const permStatus = await PermissionService.checkPermission('notifications');
      
      if (permStatus === 'prompt') {
        requestDynamicPermission('notifications').catch(() => {});
      }

      if (permStatus === 'granted') {
        const iconPath = resolveAudioPath('/icons/icon-192.png');
        const randomVerse = PRAYER_VERSES[Math.floor(Math.random() * PRAYER_VERSES.length)];
        
        if (Capacitor.isNativePlatform()) {
          const effectiveMuezzinId = (MUEZZINS_LIST.find(m => m.name === muezzinName)?.id) || 'mishary';
          await NativeNotificationService.setupAndroidChannels(effectiveMuezzinId);
          const LocalNotifications = (await import('@capacitor/local-notifications')).LocalNotifications;
          await LocalNotifications.schedule({
            notifications: [{
              title: `🕌 حان الآن موعد أذان ${prayerName}`,
              body: `${randomVerse}\n\nالله أكبر، حان وقت صلاة ${prayerName} بصوت ${muezzinName}.`,
              id: Date.now() % 100000,
              schedule: { at: new Date(Date.now() + 100) },
              channelId: `adhan_channel_v3_${effectiveMuezzinId}`,
              sound: `${effectiveMuezzinId}.mp3`,
              smallIcon: 'ic_stat_icon_config_sample',
              extra: { type: 'adhan', muezzinId: effectiveMuezzinId, prayerName: prayerName }
            }]
          });
        } else if (typeof window !== 'undefined' && 'Notification' in window) {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(`🕌 حان الآن موعد أذان ${prayerName}`, {
              body: `${randomVerse}\n\nالله أكبر، حان وقت صلاة ${prayerName} بصوت ${muezzinName}.`,
              icon: iconPath,
              badge: iconPath,
              tag: `adhan-${prayerName}`,
              renotify: true,
              requireInteraction: true,
              vibrate: [600, 300, 600, 300, 1000, 500, 1000] as any,
              dir: 'rtl',
              lang: 'ar',
              actions: [
                { action: 'stop-adhan', title: 'إيقاف وإغلاق ❌' }
              ]
            } as any);
          } else {
            new Notification(`🕌 حان الآن موعد أذان ${prayerName}`, {
              body: `${randomVerse}\n\nالله أكبر، حان وقت صلاة ${prayerName} بصوت ${muezzinName}.`,
              icon: iconPath,
              dir: 'rtl'
            });
          }
        }
      }
    } catch (e) {
      console.warn("Could not dispatch notification:", e);
    }
  }

  public static async sync30DaysPrayerScheduleLocally(
    location: UserLocation | null | undefined, 
    methodName: string = 'MuslimWorldLeague',
    explicitMuezzinId?: string
  ) {
    try {
      let currentMuezzinId = explicitMuezzinId;
      if (!currentMuezzinId) {
        try {
          const savedAdhan = localStorage.getItem('anis_adhan_settings');
          if (savedAdhan) {
            const parsed = JSON.parse(savedAdhan);
            if (parsed.muezzin) currentMuezzinId = parsed.muezzin;
          }
          if (!currentMuezzinId) {
            const savedSettings = localStorage.getItem('anis_settings');
            if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              if (parsed.adhanSettings?.muezzin) currentMuezzinId = parsed.adhanSettings.muezzin;
            }
          }
        } catch {}
      }
      currentMuezzinId = currentMuezzinId || 'mishary';
      const soundFileName = `${currentMuezzinId}.mp3`;

      const schedule30Days = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const daySchedule = calculateAccuratePrayerTimes(location, d, methodName);
        schedule30Days.push(daySchedule);
      }

      if (Capacitor.isNativePlatform()) {
        try {
          await NativeNotificationService.setupAndroidChannels(currentMuezzinId);
          const channelId = `adhan_channel_v3_${currentMuezzinId}`;

          const pending = await LocalNotifications.getPending();
          if (pending && pending.notifications.length > 0) {
            const adhanIds = pending.notifications.filter(n => n.id < 1000);
            if (adhanIds.length > 0) {
              await LocalNotifications.cancel({ notifications: adhanIds });
            }
          }
          
          let idCounter = 1;
          const notifications = [];
          
          for (const day of schedule30Days) {
            const prayers = [
              { name: 'الفجر', time: new Date(day.fajr) },
              { name: 'الظهر', time: new Date(day.dhuhr) },
              { name: 'العصر', time: new Date(day.asr) },
              { name: 'المغرب', time: new Date(day.maghrib) },
              { name: 'العشاء', time: new Date(day.isha) }
            ];
            
            for (const prayer of prayers) {
              if (prayer.time.getTime() > Date.now()) {
                const prayerTimeFormatted = prayer.time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                notifications.push({
                  title: '🕌 حان الآن موعد أذان صلاة ' + prayer.name,
                  body: `الله أكبر، حي على الصلاة، حي على الفلاح (${prayerTimeFormatted})`,
                  largeBody: `حان الآن موعد أذان صلاة ${prayer.name} المبارك بتوقيتك المحلي (${prayerTimeFormatted}).\nالله أكبر، الله أكبر، أشهد أن لا إله إلا الله، حي على الصلاة، حي على الفلاح.\nتقبل الله طاعتكم وصالح أعمالكم.`,
                  summaryText: `أذان صلاة ${prayer.name}`,
                  id: idCounter++,
                  schedule: { at: prayer.time, allowWhileIdle: true },
                  sound: soundFileName,
                  channelId: channelId,
                  smallIcon: 'ic_stat_icon_config_sample',
                  actionTypeId: '',
                  extra: { type: 'adhan', muezzinId: currentMuezzinId, prayerName: prayer.name }
                });
              }
            }
          }
          
          if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications: notifications.slice(0, 60) });
          }
        } catch (e) {
          console.warn("Failed to schedule native notifications:", e);
        }
      }

      localStorage.setItem('anis_offline_prayer_schedules', JSON.stringify(schedule30Days));

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_PRAYER_SCHEDULE',
          data: schedule30Days,
          muezzinId: currentMuezzinId
        });

        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          try {
            await (reg as any).periodicSync.register('update-prayer-times', {
              minInterval: 12 * 60 * 60 * 1000
            });
          } catch (e) {
            console.info("Periodic Sync registration notice:", e);
          }
        }
      }
      return true;
    } catch (e) {
      console.warn("Error syncing 30 days prayer schedule:", e);
      return false;
    }
  }

  private static async playViaWebAudio(
    blobOrUrl: Blob | string,
    volume: number,
    muezzinName: string,
    prayerName: string,
    sessionId: number,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return { success: false, error: 'Web Audio API non-available' };
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      let arrayBuffer: ArrayBuffer;
      if (typeof blobOrUrl === 'string') {
        const resp = await fetch(blobOrUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        arrayBuffer = await resp.arrayBuffer();
      } else {
        arrayBuffer = await blobOrUrl.arrayBuffer();
      }

      if (sessionId !== this.currentSessionId) return { success: false, error: 'Session cancelled' };

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (sessionId !== this.currentSessionId) return { success: false, error: 'Session cancelled' };

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, volume / 100));

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.onended = () => {
        if (sessionId === this.currentSessionId) {
          this.stop(false);
          if (onEnd) onEnd();
        }
      };

      source.start(0);
      this.currentBufferSource = source;
      this.requestWakeLock();
      this.setupMediaSession(muezzinName, prayerName);

      if (onStart) onStart();
      return { success: true };
    } catch (err: any) {
      console.warn("Web Audio playback error:", err);
      return { success: false, error: err?.message || 'Web Audio decode failed' };
    }
  }

  private static async playHarmonicSpiritualChime(
    volume: number, 
    muezzinName: string, 
    prayerName: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return false;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const masterGain = ctx.createGain();
      masterGain.gain.value = Math.max(0, Math.min(1, volume / 100)) * 0.4;
      masterGain.connect(ctx.destination);

      const rootFreq = 216;
      const harmonics = [1, 1.5, 2, 2.5, 3];
      const now = ctx.currentTime;

      this.activeChimeNodes = [];

      harmonics.forEach((h, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(rootFreq * h, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3 / (index + 1), now + 1.5 + index * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 12 + index * 1.5);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 15);
        this.activeChimeNodes.push(osc);
      });

      this.requestWakeLock();
      this.setupMediaSession(muezzinName, prayerName);

      const startTime = ctx.currentTime;
      const durationMs = 15000;

      const timerId = setTimeout(() => {
        this.stop(false);
        if (onEnd) onEnd();
      }, (startTime - ctx.currentTime + 0.5) * 1000 + durationMs);

      if (onStart) onStart();
      return true;
    } catch (e) {
      console.warn("Harmonic chime error:", e);
      return false;
    }
  }

  private static async attemptAudioPlay(
    url: string,
    volume: number,
    muezzinName: string,
    prayerName: string,
    sessionId: number,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<{ success: boolean; audio: HTMLAudioElement | null; error?: string }> {
    return new Promise((resolve) => {
      if (sessionId !== this.currentSessionId) {
        resolve({ success: false, audio: null, error: 'Stale session' });
        return;
      }

      const audio = new Audio();
      this.pendingAudioInstances.add(audio);

      audio.volume = Math.max(0, Math.min(1, volume / 100));
      audio.crossOrigin = 'anonymous';

      let isSettled = false;

      const cleanup = () => {
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('stalled', onStalled);
        this.pendingAudioInstances.delete(audio);
      };

      const onPlaying = () => {
        if (isSettled) return;
        isSettled = true;
        if (sessionId !== this.currentSessionId) {
          try { 
            audio.pause(); 
            audio.src = '';
            audio.load();
          } catch {}
          cleanup();
          resolve({ success: false, audio: null, error: 'Session cancelled' });
          return;
        }

        this.currentAudio = audio;
        this.requestWakeLock();
        this.setupMediaSession(muezzinName, prayerName, audio);

        audio.addEventListener('ended', onEnded, { once: true });
        if (onStart) onStart();
        resolve({ success: true, audio });
      };

      const onEnded = () => {
        if (sessionId === this.currentSessionId) {
          this.stop(false);
          if (onEnd) onEnd();
        }
      };

      const onError = () => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve({ success: false, audio: null, error: 'Audio failed to load' });
        }
      };

      const onStalled = () => {
        setTimeout(() => {
          if (!isSettled && audio.readyState < 2) {
            isSettled = true;
            cleanup();
            resolve({ success: false, audio: null, error: 'Playback stalled' });
          }
        }, 3000);
      };

      audio.addEventListener('playing', onPlaying, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.addEventListener('stalled', onStalled);

      audio.src = url;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          onPlaying();
        }).catch((err) => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            resolve({ success: false, audio: null, error: err?.message || 'Play rejected' });
          }
        });
      }

      setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve({ success: false, audio: null, error: 'Connection timeout' });
        }
      }, 5000);
    });
  }

  /**
   * Main resilient Adhan playback orchestrator
   */
  public static async play(
    muezzinId: string = 'mishary',
    volume: number = 85,
    onEnd?: () => void,
    onStart?: () => void,
    prayerName: string = 'الصلاة'
  ): Promise<{ success: boolean; source: 'offline_cache' | 'web_audio' | 'online_stream' | 'fallback_synth'; error?: string }> {
    const parsedPrayerName = typeof prayerName === 'object' && prayerName !== null ? (prayerName as any).name || 'الصلاة' : (prayerName || 'الصلاة');
    const now = Date.now();

    const isTestAudio = isTestOrPreview(parsedPrayerName);

    // 1. PREVIEW VS LIVE ADHAN CONFLICT PROTECTION
    // If user attempts to play a PREVIEW while a LIVE automatic prayer adhan is playing, block preview to avoid interference.
    if (isTestAudio && this.isLiveAdhanPlaying()) {
      console.info(`[AdhanAudioEngine] Blocked preview because live adhan for "${this.activePrayerName}" is currently playing.`);
      return { success: false, source: 'offline_cache', error: `لا يمكن تشغيل المعاينة أثناء أذان صلاة ${this.activePrayerName} التلقائي.` };
    }

    // If a LIVE automatic adhan is starting while a PREVIEW is playing, stop preview immediately to give way.
    if (!isTestAudio && this.isPreviewPlaying()) {
      console.info(`[AdhanAudioEngine] Stopping audio preview to allow automatic live adhan for "${parsedPrayerName}" to play.`);
      this.stop(false);
    }

    // 2. MUEZZIN SWITCHING & DUPLICATE PLAYBACK CHECK:
    const isSameMuezzinPlaying = this.isPlaying() && this.activePlayingId === muezzinId && this.activePrayerName === parsedPrayerName;
    if (isSameMuezzinPlaying && !isTestAudio) {
      console.info(`[AdhanAudioEngine] Adhan for muezzin "${muezzinId}" and prayer "${parsedPrayerName}" is already playing.`);
      return { success: true, source: 'offline_cache' };
    }

    // 3. CHECK IF PRAYER WAS MANUALLY STOPPED BY USER
    if (!isTestAudio && this.isPrayerManuallyStopped(parsedPrayerName)) {
      console.info(`[AdhanAudioEngine] Adhan for prayer "${parsedPrayerName}" was manually stopped by user. Skipping auto-play.`);
      return { success: false, source: 'offline_cache', error: `تم إيقاف أذان صلاة ${parsedPrayerName} يدويًا بواسطة المستخدم.` };
    }

    if (isTestAudio) {
      this.clearManuallyStoppedPrayer(parsedPrayerName);
    }

    // Guard against rapid duplicate trigger of the exact same request within 3 seconds
    if (
      this.isPlaying() &&
      this.lastPlaybackAttempt &&
      this.lastPlaybackAttempt.prayerName === parsedPrayerName &&
      this.lastPlaybackAttempt.muezzinId === muezzinId &&
      now - this.lastPlaybackAttempt.timestamp < 3000
    ) {
      return { success: true, source: 'offline_cache' };
    }
    this.lastPlaybackAttempt = { prayerName: parsedPrayerName, muezzinId, timestamp: now };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('STOP_APP_AUDIO', { detail: { source: 'adhan' } }));
    }
    
    // Stop any previously playing audio cleanly to switch to the new muezzin immediately
    this.stop(false);
    
    this.currentSessionId++;
    const thisSession = this.currentSessionId;
    this.activePlayingId = muezzinId;
    this.activePrayerName = parsedPrayerName;
    this.emitState();

    this.initServiceWorkerListeners();
    this.unlockAudioContext();
    this.onStopCallback = onEnd || null;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([800, 400, 800, 400, 1500]);
      } catch {}
    }

    const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId) || MUEZZINS_LIST[0];

    // STRICT OFFLINE PRE-CHECK:
    const isOfflineAvailable = await AdhanOfflineManager.hasOfflineAudio(muezzin.id);

    if (isOfflineAvailable) {
      try {
        const offlineUrl = await AdhanOfflineManager.getOfflineBlobUrl(muezzin.id);
        if (offlineUrl) {
          this.activeObjectUrl = offlineUrl.startsWith('blob:') ? offlineUrl : null;
          
          const result = await this.attemptAudioPlay(
            offlineUrl,
            volume,
            muezzin.name,
            parsedPrayerName,
            thisSession,
            onStart,
            onEnd
          );

          if (thisSession !== this.currentSessionId) {
            if (result.audio) {
              try { 
                result.audio.pause(); 
                if (result.audio === this.preAllocatedAdhanAudio) {
                  result.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
                } else {
                  result.audio.src = ''; 
                }
              } catch {}
            }
            return { success: false, source: 'offline_cache' };
          }

          if (result.success && result.audio) {
            this.currentAudio = result.audio;
            this.activePlayingId = muezzin.id;
            this.emitState();
            return { success: true, source: 'offline_cache' };
          }
        }
      } catch (offlineErr) {
        console.warn('Offline blob check notice:', offlineErr);
      }

      if (thisSession !== this.currentSessionId) return { success: false, source: 'online_stream' };

      try {
        const offlineBlob = await AdhanOfflineManager.getMuezzinBlob(muezzin.id);
        if (offlineBlob && AdhanOfflineManager.isValidAudioBlob(offlineBlob)) {
          const webAudioRes = await this.playViaWebAudio(
            offlineBlob,
            volume,
            muezzin.name,
            parsedPrayerName,
            thisSession,
            onStart,
            onEnd
          );
          if (webAudioRes.success) {
            this.activePlayingId = muezzin.id;
            this.emitState();
            return { success: true, source: 'web_audio' };
          }
        }
      } catch {}
    }

    // Direct Local File & CDN Fallbacks
    const urls = muezzin.audioUrls.map(u => resolveAudioPath(u));
    for (let i = 0; i < urls.length; i++) {
      if (thisSession !== this.currentSessionId) return { success: false, source: 'online_stream' };
      const url = urls[i];
      try {
        const result = await this.attemptAudioPlay(
          url,
          volume,
          muezzin.name,
          parsedPrayerName,
          thisSession,
          onStart,
          onEnd
        );

        if (thisSession !== this.currentSessionId) {
          if (result.audio) {
            try { 
              result.audio.pause(); 
              if (result.audio === this.preAllocatedAdhanAudio) {
                result.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
              } else {
                result.audio.src = ''; 
              }
            } catch {}
          }
          return { success: false, source: 'online_stream' };
        }

        if (result.success && result.audio) {
          this.currentAudio = result.audio;
          this.activePlayingId = muezzin.id;
          this.emitState();
          return { success: true, source: 'online_stream' };
        }
      } catch (streamErr) {
        console.warn(`Stream attempt for ${muezzin.id} failed:`, streamErr);
      }
    }

    if (thisSession !== this.currentSessionId) return { success: false, source: 'fallback_synth' };

    // Web Audio Stream Fallback
    for (let i = 0; i < urls.length; i++) {
      if (thisSession !== this.currentSessionId) return { success: false, source: 'fallback_synth' };
      const webAudioRes = await this.playViaWebAudio(
        urls[i],
        volume,
        muezzin.name,
        parsedPrayerName,
        thisSession,
        onStart,
        onEnd
      );
      if (webAudioRes.success) {
        this.activePlayingId = muezzin.id;
        this.emitState();
        return { success: true, source: 'web_audio' };
      }
    }

    if (thisSession !== this.currentSessionId) return { success: false, source: 'fallback_synth' };

    // Harmonic Synthesized Sound Fallback
    const synthPlayed = await this.playHarmonicSpiritualChime(volume, muezzin.name, parsedPrayerName, onStart, onEnd);
    if (synthPlayed) {
      if (onStart) onStart();
      this.emitState();
      return { 
        success: true, 
        source: 'fallback_synth',
        error: 'تم تشغيل التنبيه الصوتي الاحتياطي لضمان رفع الأذان دون انقطاع.'
      };
    }

    this.pendingArmedPlayback = { muezzinId, volume, prayerName: parsedPrayerName };
    this.activePlayingId = null;
    this.emitState();

    return { 
      success: false, 
      source: 'fallback_synth', 
      error: 'يرجى لمس الشاشة لتفعيل صوت الأذان فوراً.' 
    };
  }

  public static stop(isUserManualStop: boolean = true) {
    if (isUserManualStop && this.activePrayerName) {
      this.manuallyStoppedPrayers.set(this.activePrayerName, Date.now());
    }
    this.releaseWakeLock();
    this.currentSessionId++;
    this.pendingArmedPlayback = null;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.ready.then(registration => {
          if (registration && typeof registration.getNotifications === 'function') {
            registration.getNotifications().then(notifications => {
              if (notifications && notifications.length > 0) {
                notifications.forEach(notification => {
                  if (notification.tag && (notification.tag.startsWith('adhan-') || notification.tag.startsWith('dhikr-'))) {
                    notification.close();
                  }
                });
              }
            });
          }
        });
      } catch (err) {
        console.warn('Error clearing notifications on stop:', err);
      }
    }

    if (this.currentBufferSource) {
      try {
        this.currentBufferSource.stop();
        this.currentBufferSource.disconnect();
      } catch {}
      this.currentBufferSource = null;
    }

    if (this.activeChimeNodes.length > 0) {
      this.activeChimeNodes.forEach(node => {
        try { node.stop(); } catch {}
      });
      this.activeChimeNodes = [];
    }

    this.pendingAudioInstances.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load();
      } catch {}
    });
    this.pendingAudioInstances.clear();

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch (e) {
        console.error("Error stopping audio:", e);
      }
      this.currentAudio = null;
    }

    if (this.activeObjectUrl) {
      try {
        URL.revokeObjectURL(this.activeObjectUrl);
      } catch {}
      this.activeObjectUrl = null;
    }

    this.activePlayingId = null;
    this.activePrayerName = null;
    this.emitState();

    if (this.onStopCallback) {
      this.onStopCallback();
      this.onStopCallback = null;
    }
  }

  public static isPlaying(): boolean {
    return (this.currentAudio !== null && !this.currentAudio.paused) || this.currentBufferSource !== null;
  }

  public static getActiveMuezzinId(): string | null {
    return this.activePlayingId;
  }

  public static setVolume(volumePercent: number) {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volumePercent / 100));
    }
  }
}

/**
 * Calculates prayer times accurately for a given location and date
 */
export function calculateAccuratePrayerTimes(
  location: UserLocation | null | undefined, 
  date: Date = new Date(),
  methodName: string = 'MuslimWorldLeague'
): DayPrayerSchedule {
  const latitude = location?.latitude ?? 21.4225;
  const longitude = location?.longitude ?? 39.8262;

  const coordinates = new Coordinates(latitude, longitude);
  
  let params = CalculationMethod.MuslimWorldLeague();
  if (methodName === 'UmmAlQura') {
    params = CalculationMethod.UmmAlQura();
  } else if (methodName === 'Egyptian') {
    params = CalculationMethod.Egyptian();
  } else if (methodName === 'Karachi') {
    params = CalculationMethod.Karachi();
  } else if (methodName === 'Dubai') {
    params = CalculationMethod.Dubai();
  } else if (methodName === 'MoonsightingCommittee') {
    params = CalculationMethod.MoonsightingCommittee();
  } else if (methodName === 'NorthAmerica') {
    params = CalculationMethod.NorthAmerica();
  }

  params.madhab = Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle;

  const times = new PrayerTimes(coordinates, date, params);

  const format = (d: Date) => {
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const currentPrayerName = times.currentPrayer();
  const nextPrayerName = times.nextPrayer();
  const nextTime = times.timeForPrayer(nextPrayerName);

  const prayerMap: Record<string, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
    none: 'لا يوجد'
  };

  const prayersList: PrayerTimeInfo[] = [
    {
      name: 'الفجر',
      key: 'fajrEnabled',
      time: times.fajr,
      formattedTime: format(times.fajr),
      isCurrent: currentPrayerName === 'fajr',
      isNext: nextPrayerName === 'fajr'
    },
    {
      name: 'الظهر',
      key: 'dhuhrEnabled',
      time: times.dhuhr,
      formattedTime: format(times.dhuhr),
      isCurrent: currentPrayerName === 'dhuhr',
      isNext: nextPrayerName === 'dhuhr'
    },
    {
      name: 'العصر',
      key: 'asrEnabled',
      time: times.asr,
      formattedTime: format(times.asr),
      isCurrent: currentPrayerName === 'asr',
      isNext: nextPrayerName === 'asr'
    },
    {
      name: 'المغرب',
      key: 'maghribEnabled',
      time: times.maghrib,
      formattedTime: format(times.maghrib),
      isCurrent: currentPrayerName === 'maghrib',
      isNext: nextPrayerName === 'maghrib'
    },
    {
      name: 'العشاء',
      key: 'ishaEnabled',
      time: times.isha,
      formattedTime: format(times.isha),
      isCurrent: currentPrayerName === 'isha',
      isNext: nextPrayerName === 'isha'
    }
  ];

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    currentPrayer: prayerMap[currentPrayerName] || null,
    nextPrayer: prayerMap[nextPrayerName] || null,
    nextPrayerTime: nextTime,
    prayersList
  };
}

if (typeof window !== 'undefined') {
  AdhanAudioEngine.setupInteractionAudioUnlock();

  window.addEventListener('STOP_APP_AUDIO', (e: any) => {
    if (e.detail?.source !== 'adhan') {
      AdhanAudioEngine.stop();
    }
  });
}
