import { requestDynamicPermission } from "./permissionService";
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
      'https://cdn.aladhan.com/audio/adhans/a1.mp3',
      'https://cdn.islamic.network/audio/adhans/1.mp3'
    ]
  },
  {
    id: 'al_mulla',
    name: 'الشيخ علي أحمد ملا',
    description: 'أذان الحرم المكي الشريف التاريخي',
    country: 'مكة المكرمة',
    audioUrls: [
      '/audio/adhan/al_mulla.mp3',
      'https://cdn.aladhan.com/audio/adhans/a2.mp3',
      'https://cdn.islamic.network/audio/adhans/2.mp3'
    ]
  },
  {
    id: 'madina',
    name: 'أذان المسجد النبوي الشريف',
    description: 'نبرة المدينة المنورة العطرة الخاشعة',
    country: 'المدينة المنورة',
    audioUrls: [
      '/audio/adhan/madina.mp3',
      'https://cdn.aladhan.com/audio/adhans/a7.mp3',
      'https://cdn.islamic.network/audio/adhans/7.mp3'
    ]
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد',
    description: 'أذان مصري أصيل بنبرة تاريخية عذبة',
    country: 'مصر',
    audioUrls: [
      '/audio/adhan/abdulbasit.mp3',
      'https://cdn.aladhan.com/audio/adhans/a3.mp3',
      'https://cdn.islamic.network/audio/adhans/3.mp3'
    ]
  },
  {
    id: 'mansour',
    name: 'الشيخ منصور الزهراني',
    description: 'أذان حجازي عذب وبصوت ندي',
    country: 'السعودية',
    audioUrls: [
      '/audio/adhan/mansour.mp3',
      'https://cdn.aladhan.com/audio/adhans/a4.mp3',
      'https://cdn.islamic.network/audio/adhans/4.mp3'
    ]
  },
  {
    id: 'alghamdi',
    name: 'الشيخ سعد الغامدي',
    description: 'أذان نقي ومؤثر يريح القلوب',
    country: 'السعودية',
    audioUrls: [
      '/audio/adhan/alghamdi.mp3',
      'https://cdn.aladhan.com/audio/adhans/a5.mp3',
      'https://cdn.islamic.network/audio/adhans/5.mp3'
    ]
  },
  {
    id: 'qatami',
    name: 'الشيخ ناصر القطامي',
    description: 'أذان خاشع وعميق التأثير',
    country: 'الرياض',
    audioUrls: [
      '/audio/adhan/qatami.mp3',
      'https://cdn.aladhan.com/audio/adhans/a6.mp3',
      'https://cdn.islamic.network/audio/adhans/6.mp3'
    ]
  },
  {
    id: 'aqsa',
    name: 'أذان المسجد الأقصى المبارك',
    description: 'نداء القدس الشريف العريق',
    country: 'القدس الشريف',
    audioUrls: [
      '/audio/adhan/aqsa.mp3',
      'https://cdn.aladhan.com/audio/adhans/a8.mp3',
      'https://cdn.islamic.network/audio/adhans/8.mp3'
    ]
  }
];

const DB_NAME = 'anis_adhan_offline_storage_v1';
const STORE_NAME = 'muezzin_audio_blobs';
const CACHE_NAME = 'anis-adhan-cache-v1';

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
   * Save audio blob into IndexedDB and Cache API
   */
  public static async saveMuezzinAudio(muezzinId: string, blob: Blob): Promise<boolean> {
    try {
      if (!this.isValidAudioBlob(blob)) {
        console.warn('Rejected saving invalid/corrupted audio blob for', muezzinId);
        return false;
      }

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

      // Also mirror into Cache Storage for service worker compatibility
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          const response = new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': blob.size.toString(),
              'X-Cached-By': 'AnisAlQulub'
            }
          });
          await cache.put(resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`), response);
        } catch (cacheErr) {
          console.warn('Cache API mirror notice (IndexedDB preserved):', cacheErr);
        }
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
   * Retrieve Blob for offline playback with auto-recovery from corrupted entries
   */
  public static async getMuezzinBlob(muezzinId: string): Promise<Blob | null> {
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
          return item.blob;
        } else {
          // Auto-clean corrupted entry
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
    try {
      const db = await this.getDB();
      const items = await new Promise<any[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      const validIds: string[] = [];
      let totalSize = 0;

      for (const it of items) {
        if (it && it.blob && this.isValidAudioBlob(it.blob)) {
          validIds.push(it.id);
          totalSize += it.blob.size;
        } else if (it && it.id) {
          this.deleteMuezzin(it.id).catch(() => {});
        }
      }

      return { downloadedIds: validIds, totalSizeBytes: totalSize };
    } catch {
      return { downloadedIds: [], totalSizeBytes: 0 };
    }
  }

  /**
   * Delete downloaded muezzin audio to free device space
   */
  public static async deleteMuezzin(muezzinId: string): Promise<boolean> {
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

      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.delete(resolveAudioPath(`/audio/adhan/${muezzinId}.mp3`));
        } catch (e) {
          console.warn('Cache deletion notice:', e);
        }
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

    // If a download for this muezzin is already in progress, reuse the existing promise
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
          const timeoutId = setTimeout(() => fetchController.abort(), 15000);
          
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
          // Already downloaded, count it and skip
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
   * Create an offline Object URL from stored Blob
   */
  public static async getOfflineBlobUrl(muezzinId: string): Promise<string | null> {
    const blob = await this.getMuezzinBlob(muezzinId);
    if (blob && this.isValidAudioBlob(blob)) {
      return URL.createObjectURL(blob);
    }
    return null;
  }
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
  private static currentSessionId: number = 0;
  private static pendingAudioInstances: Set<HTMLAudioElement> = new Set();
  private static backgroundKeepAliveAudio: HTMLAudioElement | null = null;
  private static keepAliveOscillator: OscillatorNode | null = null;
  private static pendingArmedPlayback: { muezzinId: string; volume: number; prayerName: string } | null = null;
  private static subscribers: Set<(state: { isPlaying: boolean; activeMuezzinId: string | null; activePrayerName: string | null }) => void> = new Set();
  private static activePrayerName: string | null = null;

  /**
   * Subscribe to audio engine playback state changes
   */
  public static subscribe(callback: (state: { isPlaying: boolean; activeMuezzinId: string | null; activePrayerName: string | null }) => void): () => void {
    this.subscribers.add(callback);
    callback({ isPlaying: this.isPlaying(), activeMuezzinId: this.activePlayingId, activePrayerName: this.activePrayerName });
    return () => this.subscribers.delete(callback);
  }

  private static emitState() {
    const state = { isPlaying: this.isPlaying(), activeMuezzinId: this.activePlayingId, activePrayerName: this.activePrayerName };
    this.subscribers.forEach(cb => {
      try { cb(state); } catch {}
    });
  }

  /**
   * Get or initialize shared AudioContext
   */
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

  /**
   * Unlocks browser audio playback context on first user interaction
   * to satisfy Autoplay Policies across Android, iOS Safari, PWA, and desktop
   */
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

        // Maintain inaudible background keep-alive oscillator to keep hardware pipeline active
        if (!this.keepAliveOscillator && ctx.state === 'running') {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.00001; // inaudible
            osc.frequency.value = 440;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            this.keepAliveOscillator = osc;
          } catch {}
        }
      }

      // Initialize continuous silent audio loop for mobile/PWA background persistence
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

      // If there was any pending armed prayer waiting for a tap, trigger it immediately
      if (this.pendingArmedPlayback) {
        const armed = { ...this.pendingArmedPlayback };
        this.pendingArmedPlayback = null;
        this.play(armed.muezzinId, armed.volume, undefined, undefined, armed.prayerName);
      }

    } catch (e) {
      console.warn('Audio unlock notice:', e);
    }
  }

  /**
   * Automatically listens for any user interaction (touch, click, scroll, keydown, focus)
   * to unlock the audio context for subsequent automated adhan playback
   */
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

    // Ensure audio unlock listener is active
    this.setupInteractionAudioUnlock();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        
        if (event.data.type === 'STOP_ADHAN') {
          this.stop();
        } else if (event.data.type === 'PLAY_ADHAN' || event.data.type === 'TRIGGER_ADHAN_NOTIFICATION') {
          const prayerName = event.data.prayerName || 'الصلاة';
          const muezzinId = event.data.muezzinId || 'mishary';
          
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
            // الضغط على زر الإيقاف المؤقت يقوم بإيقاف الأذان وإغلاق الإشعار تماماً
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

  /**
   * Dispatches a high-priority system and PWA notification for Adhan with fallback to physical vibration
   */
  public static async dispatchPrayerNotification(prayerName: string, muezzinName: string) {
    // 1. Trigger physical vibration pattern (works without notifications permission on mobile)
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([600, 300, 600, 300, 1000, 500, 1000]);
      }
    } catch {}

    // 2. Try Notification API if available & permission granted or requestable
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          // Request dynamically via modal
          requestDynamicPermission('notifications').catch(() => {});
        }

        if (Notification.permission === 'granted') {
          const iconPath = resolveAudioPath('/icons/icon-192.png');
          const randomVerse = PRAYER_VERSES[Math.floor(Math.random() * PRAYER_VERSES.length)];
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
      } catch (e) {
        console.warn("Could not dispatch notification:", e);
      }
    }
  }

  /**
   * Pre-calculates 30 days of prayer schedules and syncs with SW for 100% offline accuracy
   */
  public static async sync30DaysPrayerScheduleLocally(
    location: UserLocation | null | undefined, 
    methodName: string = 'MuslimWorldLeague'
  ) {
    try {
      const schedule30Days = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const daySchedule = calculateAccuratePrayerTimes(location, d, methodName);
        schedule30Days.push(daySchedule);
      }

      localStorage.setItem('anis_offline_prayer_schedules', JSON.stringify(schedule30Days));

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_PRAYER_SCHEDULE',
          data: schedule30Days
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

  /**
   * Play audio bytes directly through Web Audio API BufferSourceNode
   * This bypasses HTML5 audio autoplay restrictions when AudioContext is unlocked
   */
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
      if (!ctx) return { success: false, error: 'No AudioContext' };
      
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      let arrayBuffer: ArrayBuffer;
      if (typeof blobOrUrl === 'string') {
        const resp = await fetch(blobOrUrl);
        arrayBuffer = await resp.arrayBuffer();
      } else {
        arrayBuffer = await blobOrUrl.arrayBuffer();
      }

      if (sessionId !== this.currentSessionId) return { success: false, error: 'Session aborted' };

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (sessionId !== this.currentSessionId) return { success: false, error: 'Session aborted' };

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume / 100)), ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      this.currentBufferSource = source;
      this.setupMediaSession(muezzinName, prayerName);
      this.requestWakeLock();
      this.emitState();
      if (onStart) onStart();

      source.onended = () => {
        if (sessionId === this.currentSessionId) {
          this.stop();
          if (onEnd) onEnd();
        }
      };

      source.start(0);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'WebAudio decode error' };
    }
  }

  /**
   * Synthesize an offline harmonic adhan chime tone if all network & storage fails
   */
  private static playSynthesizedChime(volume: number = 80, onEnd?: () => void) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return false;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.min(1, volume / 100) * 0.7, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Harmonized spiritual Adhan tones (Allahu Akbar pattern)
      const notes = [
        { f: 293.66, d: 0.8 }, // D4
        { f: 349.23, d: 0.8 }, // F4
        { f: 440.00, d: 1.4 }, // A4
        { f: 392.00, d: 1.0 }, // G4
        { f: 349.23, d: 1.2 }, // F4
        { f: 293.66, d: 2.0 }  // D4
      ];

      let startTime = ctx.currentTime + 0.05;

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.8, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.d);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + note.d);
        startTime += note.d * 0.85;
      });

      setTimeout(() => {
        if (onEnd) onEnd();
      }, (startTime - ctx.currentTime + 0.5) * 1000);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to create, configure, and attempt to play an HTMLAudioElement with error handling and session matching
   */
  private static attemptAudioPlay(
    sourceUrl: string,
    volume: number,
    muezzinName: string,
    prayerName: string,
    sessionId: number,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<{ success: boolean; audio: HTMLAudioElement | null; error?: string }> {
    return new Promise((resolve) => {
      if (sessionId !== this.currentSessionId) {
        resolve({ success: false, audio: null, error: 'Session aborted' });
        return;
      }

      let isSettled = false;
      const audio = new Audio();
      this.pendingAudioInstances.add(audio);

      audio.preload = 'auto';
      audio.src = sourceUrl;
      audio.volume = Math.max(0, Math.min(1, volume / 100));

      const cleanup = () => {
        this.pendingAudioInstances.delete(audio);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('stalled', onStalled);
      };

      const onPlaying = () => {
        if (!isSettled) {
          isSettled = true;
          cleanup();

          if (sessionId !== this.currentSessionId) {
            try {
              audio.pause();
              audio.currentTime = 0;
              audio.src = '';
            } catch {}
            resolve({ success: false, audio: null, error: 'Session outdated' });
            return;
          }

          this.currentAudio = audio;
          this.setupMediaSession(muezzinName, prayerName, audio);
          this.requestWakeLock();
          this.emitState();
          if (onStart) onStart();

          audio.onended = () => {
            if (sessionId === this.currentSessionId) {
              this.stop();
              if (onEnd) onEnd();
            }
          };

          resolve({ success: true, audio });
        }
      };

      const onError = (e: Event) => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          const target = e.target as HTMLAudioElement;
          const mediaError = target?.error;
          const errorMsg = mediaError ? `Code ${mediaError.code}: ${mediaError.message || 'Media Error'}` : 'Audio load error';
          resolve({ success: false, audio: null, error: errorMsg });
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

      // Safety timeout: 4 seconds
      setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve({ success: false, audio: null, error: 'Connection timeout' });
        }
      }, 4000);
    });
  }

  /**
   * Main resilient Adhan playback orchestrator with 5-Tier Fallback:
   * 1. Offline Cache Blob (HTML5 Audio)
   * 2. Web Audio Direct Buffer Source (Bypasses mobile autoplay restrictions)
   * 3. Local/CDN URL Stream (HTML5 Audio)
   * 4. Web Audio URL Buffer Stream
   * 5. Harmonic Synthesized Spiritual Adhan (Web Audio)
   */
  public static async play(
    muezzinId: string = 'mishary',
    volume: number = 85,
    onEnd?: () => void,
    onStart?: () => void,
    prayerName: string = 'الصلاة'
  ): Promise<{ success: boolean; source: 'offline_cache' | 'web_audio' | 'online_stream' | 'fallback_synth'; error?: string }> {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('STOP_APP_AUDIO', { detail: { source: 'adhan' } }));
    }
    this.stop();
    
    this.currentSessionId++;
    const thisSession = this.currentSessionId;
    this.activePlayingId = muezzinId;
    this.activePrayerName = prayerName;
    this.emitState();

    this.initServiceWorkerListeners();
    this.unlockAudioContext();
    this.onStopCallback = onEnd || null;

    // Trigger physical vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([800, 400, 800, 400, 1500]);
      } catch {}
    }

    const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId) || MUEZZINS_LIST[0];

    // Priority 1: Offline cached audio blob (HTML5 Audio)
    let offlineBlob: Blob | null = null;
    try {
      offlineBlob = await AdhanOfflineManager.getMuezzinBlob(muezzin.id);
      if (offlineBlob && AdhanOfflineManager.isValidAudioBlob(offlineBlob)) {
        const offlineUrl = URL.createObjectURL(offlineBlob);
        this.activeObjectUrl = offlineUrl;
        
        const result = await this.attemptAudioPlay(
          offlineUrl,
          volume,
          muezzin.name,
          prayerName,
          thisSession,
          onStart,
          onEnd
        );

        if (thisSession !== this.currentSessionId) {
          if (result.audio) {
            try { result.audio.pause(); result.audio.src = ''; } catch {}
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

    // Priority 2: Web Audio Direct Buffer Source from Offline Blob (Bypasses HTMLAudio element autoplay blocks)
    if (offlineBlob && AdhanOfflineManager.isValidAudioBlob(offlineBlob)) {
      const webAudioRes = await this.playViaWebAudio(
        offlineBlob,
        volume,
        muezzin.name,
        prayerName,
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

    // Priority 3: Direct Local File & CDN Fallbacks
    const urls = muezzin.audioUrls.map(u => resolveAudioPath(u));
    for (let i = 0; i < urls.length; i++) {
      if (thisSession !== this.currentSessionId) return { success: false, source: 'online_stream' };
      const url = urls[i];
      try {
        const result = await this.attemptAudioPlay(
          url,
          volume,
          muezzin.name,
          prayerName,
          thisSession,
          onStart,
          onEnd
        );

        if (thisSession !== this.currentSessionId) {
          if (result.audio) {
            try { result.audio.pause(); result.audio.src = ''; } catch {}
          }
          return { success: false, source: 'online_stream' };
        }

        if (result.success && result.audio) {
          this.currentAudio = result.audio;
          this.activePlayingId = muezzin.id;
          this.emitState();

          AdhanOfflineManager.downloadMuezzinAudio(muezzin.id).catch(() => {});
          return { success: true, source: 'online_stream' };
        }
      } catch (err) {
        console.warn(`Failed attempt from ${url}:`, err);
      }
    }

    if (thisSession !== this.currentSessionId) return { success: false, source: 'fallback_synth' };

    // Priority 4: Web Audio Direct Buffer from URL
    if (urls.length > 0) {
      const webAudioStreamRes = await this.playViaWebAudio(
        urls[0],
        volume,
        muezzin.name,
        prayerName,
        thisSession,
        onStart,
        onEnd
      );
      if (webAudioStreamRes.success) {
        this.activePlayingId = muezzin.id;
        this.emitState();
        return { success: true, source: 'web_audio' };
      }
    }

    // Priority 5: Synthesized Harmonic Tone Fallback
    const synthPlayed = this.playSynthesizedChime(volume, onEnd);
    if (synthPlayed) {
      if (onStart) onStart();
      this.emitState();
      return { 
        success: true, 
        source: 'fallback_synth',
        error: 'تم تشغيل التنبيه الصوتي الاحتياطي لضمان رفع الأذان دون انقطاع.'
      };
    }

    // If completely blocked by browser policies until touch, arm instant trigger
    this.pendingArmedPlayback = { muezzinId, volume, prayerName };
    this.activePlayingId = null;
    this.emitState();

    return { 
      success: false, 
      source: 'fallback_synth', 
      error: 'يرجى لمس الشاشة لتفعيل صوت الأذان فوراً.' 
    };
  }

  public static stop() {
    this.releaseWakeLock();
    this.currentSessionId++;
    this.pendingArmedPlayback = null;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    // تنظيف كل إشعارات النظام النشطة للأذان والتنبيهات من شريط الإشعارات فور الإيقاف
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

    // Stop Web Audio BufferSource if active
    if (this.currentBufferSource) {
      try {
        this.currentBufferSource.stop();
        this.currentBufferSource.disconnect();
      } catch {}
      this.currentBufferSource = null;
    }

    // Force stop all pending or stalled audio instances
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
  const latitude = location?.latitude ?? 21.4225; // Default: Makkah Al-Mukarramah
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

  // Adjustments
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

// Auto-register touch/click interaction audio unlock for all browsers & webviews
if (typeof window !== 'undefined') {
  AdhanAudioEngine.setupInteractionAudioUnlock();

  window.addEventListener('STOP_APP_AUDIO', (e: any) => {
    if (e.detail?.source !== 'adhan') {
      AdhanAudioEngine.stop();
    }
  });
}

