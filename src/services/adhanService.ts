import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from 'adhan';
import { UserLocation, AdhanSettings } from '../types';

export interface MuezzinInfo {
  id: string;
  name: string;
  description: string;
  country: string;
  audioUrls: string[];
}

export const MUEZZINS_LIST: MuezzinInfo[] = [
  {
    id: 'mishary',
    name: 'مشاري راشد العفاسي',
    description: 'أذان هادئ وخاشع ورخيم',
    country: 'الكويت',
    audioUrls: [
      '/audio/adhan/mishary.mp3',
      '/api/adhan/stream/mishary',
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
      '/api/adhan/stream/al_mulla',
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
      '/api/adhan/stream/madina',
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
      '/api/adhan/stream/abdulbasit',
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
      '/api/adhan/stream/mansour',
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
      '/api/adhan/stream/alghamdi',
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
      '/api/adhan/stream/qatami',
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
      '/api/adhan/stream/aqsa',
      'https://cdn.aladhan.com/audio/adhans/a8.mp3'
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
   * Save audio blob into IndexedDB and Cache API
   */
  public static async saveMuezzinAudio(muezzinId: string, blob: Blob): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const item = {
          id: muezzinId,
          blob,
          size: blob.size,
          type: blob.type || 'audio/mp3',
          updatedAt: Date.now()
        };
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Also mirror into Cache Storage if available
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          const response = new Response(blob, {
            headers: {
              'Content-Type': blob.type || 'audio/mp3',
              'Content-Length': blob.size.toString(),
              'X-Cached-By': 'AnisAlQulub'
            }
          });
          await cache.put(`/offline-audio/adhan/${muezzinId}.mp3`, response);
        } catch (cacheErr) {
          console.warn('Cache API mirror failed, IndexedDB preserved:', cacheErr);
        }
      }

      return true;
    } catch (err) {
      console.error(`Failed to save muezzin ${muezzinId} offline:`, err);
      return false;
    }
  }

  /**
   * Check if a muezzin audio is downloaded locally
   */
  public static async isMuezzinDownloaded(muezzinId: string): Promise<{ downloaded: boolean; sizeBytes: number }> {
    try {
      const db = await this.getDB();
      return await new Promise<{ downloaded: boolean; sizeBytes: number }>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(muezzinId);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve({ downloaded: true, sizeBytes: req.result.size || req.result.blob.size || 0 });
          } else {
            resolve({ downloaded: false, sizeBytes: 0 });
          }
        };
        req.onerror = () => resolve({ downloaded: false, sizeBytes: 0 });
      });
    } catch {
      return { downloaded: false, sizeBytes: 0 };
    }
  }

  /**
   * Retrieve Blob for offline playback
   */
  public static async getMuezzinBlob(muezzinId: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(muezzinId);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
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
      return await new Promise<{ downloadedIds: string[]; totalSizeBytes: number }>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          const ids = items.map((it: any) => it.id);
          const totalSize = items.reduce((acc: number, it: any) => acc + (it.size || it.blob?.size || 0), 0);
          resolve({ downloadedIds: ids, totalSizeBytes: totalSize });
        };
        req.onerror = () => resolve({ downloadedIds: [], totalSizeBytes: 0 });
      });
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
        const req = store.delete(muezzinId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.delete(`/offline-audio/adhan/${muezzinId}.mp3`);
        } catch (e) {
          console.warn('Cache deletion ignored:', e);
        }
      }

      return true;
    } catch (err) {
      console.error(`Failed to delete muezzin ${muezzinId}:`, err);
      return false;
    }
  }

  /**
   * Download audio file with progressive fallback across multiple CDNs
   */
  public static async downloadMuezzinAudio(
    muezzinId: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId);
    if (!muezzin) {
      return { success: false, error: 'المؤذن غير موجود' };
    }

    const urls = muezzin.audioUrls;
    let lastError = '';

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        if (onProgress) onProgress(15 + i * 10);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-cache'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (onProgress) onProgress(65);

        const blob = await response.blob();
        if (blob.size < 5000) {
          throw new Error('الملف المحمل غير صالح أو صغير جداً');
        }

        if (onProgress) onProgress(90);

        const saved = await this.saveMuezzinAudio(muezzinId, blob);
        if (saved) {
          if (onProgress) onProgress(100);
          return { success: true };
        } else {
          throw new Error('فشل الحفظ في التخزين المحلي');
        }
      } catch (err: any) {
        console.warn(`Download attempt from ${url} failed:`, err);
        lastError = err?.message || 'تعذر التحميل';
      }
    }

    return { success: false, error: lastError || 'تعذر تنزيل ملف الصوت' };
  }

  /**
   * Create an offline Object URL from stored Blob
   */
  public static async getOfflineBlobUrl(muezzinId: string): Promise<string | null> {
    const blob = await this.getMuezzinBlob(muezzinId);
    if (blob) {
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

export class AdhanAudioEngine {
  private static currentAudio: HTMLAudioElement | null = null;
  private static activePlayingId: string | null = null;
  private static onStopCallback: (() => void) | null = null;
  private static activeObjectUrl: string | null = null;
  private static wakeLockSentinel: any = null;
  private static isSWListenerInitialized: boolean = false;

  public static initServiceWorkerListeners() {
    if (this.isSWListenerInitialized) return;
    this.isSWListenerInitialized = true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        
        if (event.data.type === 'STOP_ADHAN') {
          this.stop();
        } else if (event.data.type === 'PLAY_ADHAN' || event.data.type === 'TRIGGER_ADHAN_NOTIFICATION') {
          const prayerName = event.data.prayerName || 'الصلاة';
          const muezzinId = event.data.muezzinId || 'mishary';
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
      console.warn("WakeLock error (safe to ignore):", e);
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
          title: `أذان صلاة ${prayerName}`,
          artist: `المؤذن: ${muezzinName}`,
          album: 'أنيس القلوب - رفيقك القرآني',
          artwork: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/app-icon.svg', sizes: '512x512', type: 'image/svg+xml' }
          ]
        });

        navigator.mediaSession.playbackState = 'playing';

        const defaultActions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
          ['play', () => {
            if (this.currentAudio && this.currentAudio.paused) {
              this.currentAudio.play().catch(() => {});
              navigator.mediaSession.playbackState = 'playing';
            }
          }],
          ['pause', () => {
            if (this.currentAudio && !this.currentAudio.paused) {
              this.currentAudio.pause();
              navigator.mediaSession.playbackState = 'paused';
            }
          }],
          ['stop', () => {
            this.stop();
          }],
          ['seekto', (details) => {
            if (this.currentAudio && details.seekTime !== undefined) {
              this.currentAudio.currentTime = details.seekTime;
            }
          }],
          ['seekbackward', (details) => {
            if (this.currentAudio) {
              const skipTime = details.seekOffset || 10;
              this.currentAudio.currentTime = Math.max(this.currentAudio.currentTime - skipTime, 0);
            }
          }],
          ['seekforward', (details) => {
            if (this.currentAudio) {
              const skipTime = details.seekOffset || 10;
              this.currentAudio.currentTime = Math.min(this.currentAudio.currentTime + skipTime, this.currentAudio.duration || 300);
            }
          }]
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
        console.warn("MediaSession setup error:", e);
      }
    }
  }

  /**
   * Dispatches a high-priority system and PWA notification for Adhan
   */
  public static async dispatchPrayerNotification(prayerName: string, muezzinName: string) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(`حان الآن موعد أذان ${prayerName}`, {
            body: `الله أكبر، حان وقت صلاة ${prayerName} بصوت ${muezzinName}.`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `adhan-${prayerName}`,
            renotify: true,
            requireInteraction: true,
            vibrate: [500, 250, 500, 250, 1000] as any,
            dir: 'rtl',
            lang: 'ar',
            actions: [
              { action: 'stop-adhan', title: 'إيقاف الأذان' },
              { action: 'open-app', title: 'فتح التطبيق' }
            ]
          } as any);
        } else {
          new Notification(`حان الآن موعد أذان ${prayerName}`, {
            body: `الله أكبر، حان وقت صلاة ${prayerName} بصوت ${muezzinName}.`,
            icon: '/icons/icon-192.png',
            dir: 'rtl'
          });
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

      // Save to LocalStorage
      localStorage.setItem('anis_offline_prayer_schedules', JSON.stringify(schedule30Days));

      // Post to Service Worker for background notifications
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_PRAYER_SCHEDULE',
          data: schedule30Days
        });

        // Register Periodic Background Sync if supported
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          try {
            await (reg as any).periodicSync.register('update-prayer-times', {
              minInterval: 12 * 60 * 60 * 1000 // Every 12 hours
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
   * Synthesize an offline spiritual chime if all network & storage fails
   */
  private static playSynthesizedChime(volume: number = 80, onEnd?: () => void) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.min(1, volume / 100) * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      let startTime = ctx.currentTime + 0.1;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.4);
        
        gain.gain.setValueAtTime(0, startTime + idx * 0.4);
        gain.gain.linearRampToValueAtTime(0.6, startTime + idx * 0.4 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.4 + 1.8);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + idx * 0.4);
        osc.stop(startTime + idx * 0.4 + 2.0);
      });

      setTimeout(() => {
        try { ctx.close(); } catch {}
        if (onEnd) onEnd();
      }, (notes.length * 0.4 + 2.2) * 1000);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Plays adhan with Offline-First priority:
   * 1. Check IndexedDB / Local Cache Storage -> Instant 100% offline playback
   * 2. If not downloaded & online -> Stream from CDN & auto-cache in background
   * 3. Fallback synth chime if completely offline and un-cached
   */
  public static async play(
    muezzinId: string, 
    volume: number = 85, 
    onEnd?: () => void,
    onStart?: () => void,
    prayerName?: string
  ): Promise<{ success: boolean; source: 'offline_cache' | 'online_stream' | 'fallback_synth' }> {
    this.stop();
    this.initServiceWorkerListeners();

    const muezzin = MUEZZINS_LIST.find(m => m.id === muezzinId) || MUEZZINS_LIST[0];

    // Priority 1: Check Local Offline Storage
    try {
      const offlineUrl = await AdhanOfflineManager.getOfflineBlobUrl(muezzin.id);
      if (offlineUrl) {
        this.activeObjectUrl = offlineUrl;
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = offlineUrl;
        audio.volume = Math.max(0, Math.min(1, volume / 100));

        // Setup Android Media Session & Wakelock
        this.setupMediaSession(muezzin.name, prayerName, audio);
        this.requestWakeLock();

        await audio.play();
        this.currentAudio = audio;
        this.activePlayingId = muezzin.id;
        if (onStart) onStart();

        audio.onended = () => {
          this.stop();
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          this.stop();
          if (onEnd) onEnd();
        };

        return { success: true, source: 'offline_cache' };
      }
    } catch (offlineErr) {
      console.warn('Offline blob playback failed, falling back to online streaming:', offlineErr);
    }

    // Priority 2: Direct Local File / Online Fallback & Background Auto-Cache
    const urls = muezzin.audioUrls;
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        if (url.startsWith('http')) {
          audio.crossOrigin = 'anonymous';
        }
        audio.src = url;
        audio.volume = Math.max(0, Math.min(1, volume / 100));

        // Setup Android Media Session & Wakelock
        this.setupMediaSession(muezzin.name, prayerName, audio);
        this.requestWakeLock();

        await audio.play();
        this.currentAudio = audio;
        this.activePlayingId = muezzin.id;
        if (onStart) onStart();

        audio.onended = () => {
          this.stop();
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          this.stop();
          if (onEnd) onEnd();
        };

        // Background auto-cache for instant future offline playback
        AdhanOfflineManager.downloadMuezzinAudio(muezzin.id).catch(() => {});

        return { success: true, source: 'online_stream' };
      } catch (err) {
        console.warn(`Failed to play adhan from ${url}:`, err);
      }
    }

    // Priority 3: Synthesized Tone Fallback
    const synthPlayed = this.playSynthesizedChime(volume, onEnd);
    if (synthPlayed) {
      if (onStart) onStart();
      return { success: true, source: 'fallback_synth' };
    }

    return { success: false, source: 'fallback_synth' };
  }

  public static stop() {
    this.releaseWakeLock();

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
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
    if (this.onStopCallback) {
      this.onStopCallback();
      this.onStopCallback = null;
    }
  }

  public static isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
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
