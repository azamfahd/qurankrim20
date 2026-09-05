import { Capacitor } from '@capacitor/core';

export class AudioPoolManager {
  private static pool: { audio: HTMLAudioElement; inUse: boolean; id: number }[] = [];
  private static MAX_POOL_SIZE = 3;

  private static init() {
    if (this.pool.length > 0) return;
    
    // Create a pool of reusable audio elements
    for (let i = 0; i < this.MAX_POOL_SIZE; i++) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous'; // Support external sources
      
      // Fix for some iOS devices to keep audio element alive
      audio.preload = 'none'; 
      
      this.pool.push({ audio, inUse: false, id: i });
    }
  }

  /**
   * Acquires a free audio element from the pool.
   * If all are in use, it forces a cleanup of the oldest one.
   */
  public static acquire(): HTMLAudioElement {
    this.init();
    
    // Find first free element
    let entry = this.pool.find(p => !p.inUse);
    
    if (!entry) {
      console.warn('AudioPoolManager: Pool exhausted. Re-using the oldest audio element.');
      // Hijack the first element
      entry = this.pool[0];
      this.forceClean(entry.audio);
    }

    entry.inUse = true;
    return entry.audio;
  }

  /**
   * Releases an audio element back to the pool, cleaning it up completely.
   */
  public static release(audio: HTMLAudioElement) {
    const entry = this.pool.find(p => p.audio === audio);
    if (!entry) {
      // If it's a rogue element not in our pool, just clean it
      this.forceClean(audio);
      return;
    }

    this.forceClean(entry.audio);
    entry.inUse = false;
  }

  /**
   * Safely plays a sound with automatic release on end or error.
   */
  public static async playManaged(
    url: string, 
    volume: number = 1
  ): Promise<{ audio: HTMLAudioElement; stop: () => void }> {
    const audio = this.acquire();
    audio.src = url;
    audio.volume = Math.max(0, Math.min(1, volume));

    return new Promise((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        if (!settled) {
          settled = true;
          this.release(audio);
        }
      };

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = (e) => {
        cleanup();
        reject(e);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            resolve({
              audio,
              stop: () => cleanup()
            });
          })
          .catch((err) => {
            cleanup();
            reject(err);
          });
      } else {
        resolve({
          audio,
          stop: () => cleanup()
        });
      }
    });
  }

  /**
   * Fully cleans an audio element, stripping memory and handlers.
   */
  private static forceClean(audio: HTMLAudioElement) {
    try {
      audio.pause();
      
      // Strip all basic event handlers
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.onloadeddata = null;
      audio.ontimeupdate = null;
      
      // Reset properties
      audio.currentTime = 0;
      audio.volume = 1;
      audio.loop = false;
      audio.playbackRate = 1;
      
      // Release memory
      audio.removeAttribute('src');
      audio.src = '';
      audio.load();
    } catch (err) {
      console.warn('Failed to clean audio element', err);
    }
  }
}
