import { Capacitor } from '@capacitor/core';

export interface MediaMetadataInfo {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
}

export interface MediaSessionCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (details: MediaSessionActionDetails) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onStop?: () => void;
}

/**
 * Service to manage Background Audio Playback, Android MediaSession integration,
 * and Screen/Audio WakeLock to ensure audio continues seamlessly when the screen locks.
 */
export class MediaSessionService {
  private static wakeLockSentinel: any = null;
  private static keepAliveAudio: HTMLAudioElement | null = null;
  private static isPlaying = false;

  /**
   * Set up MediaSession metadata & action handlers for Android Lock Screen controls
   */
  public static updateMetadata(info: MediaMetadataInfo, callbacks?: MediaSessionCallbacks) {
    if (!('mediaSession' in navigator)) return;

    try {
      const defaultArtwork = info.artworkUrl || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=80&w=300&auto=format&fit=crop';
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: info.title || 'أنيس القلوب',
        artist: info.artist || 'القرآن الكريم والأذكار',
        album: info.album || 'أنيس القلوب - رفيقك القرآني',
        artwork: [
          { src: defaultArtwork, sizes: '96x96', type: 'image/png' },
          { src: defaultArtwork, sizes: '128x128', type: 'image/png' },
          { src: defaultArtwork, sizes: '192x192', type: 'image/png' },
          { src: defaultArtwork, sizes: '512x512', type: 'image/png' }
        ]
      });

      if (callbacks) {
        this.setActionHandlers(callbacks);
      }
    } catch (e) {
      console.warn('MediaSession metadata error:', e);
    }
  }

  /**
   * Register system lock screen media controls (Play, Pause, Seek, Next, Prev)
   */
  public static setActionHandlers(callbacks: MediaSessionCallbacks) {
    if (!('mediaSession' in navigator)) return;

    const actionMap: [MediaSessionAction, ((details: MediaSessionActionDetails) => void) | undefined][] = [
      ['play', callbacks.onPlay],
      ['pause', callbacks.onPause],
      ['stop', callbacks.onStop || callbacks.onPause],
      ['previoustrack', callbacks.onPrevious],
      ['nexttrack', callbacks.onNext],
      ['seekto', callbacks.onSeek]
    ];

    for (const [action, handler] of actionMap) {
      try {
        if (handler) {
          navigator.mediaSession.setActionHandler(action, handler);
        } else {
          navigator.mediaSession.setActionHandler(action, null);
        }
      } catch (e) {
        // Some actions might not be supported on all browser engines
      }
    }
  }

  /**
   * Update current playback position state in Android Lock Screen bar
   */
  public static updatePositionState(duration: number, currentTime: number, playbackRate = 1.0) {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    try {
      if (typeof duration === 'number' && duration > 0 && typeof currentTime === 'number' && currentTime >= 0) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: Math.max(0.5, Math.min(2.0, playbackRate)),
          position: Math.min(currentTime, duration)
        });
      }
    } catch (e) {
      // Ignore position state errors
    }
  }

  /**
   * Update playback state (playing / paused)
   */
  public static setPlaybackState(state: 'playing' | 'paused' | 'none') {
    this.isPlaying = state === 'playing';
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (e) {}

    if (state === 'playing') {
      this.requestWakeLock();
    } else {
      this.releaseWakeLock();
    }
  }

  /**
   * Request Screen & CPU Wake Lock to prevent Android from killing audio on lock screen
   */
  public static async requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch (e) {
      // Wake lock request failed or denied
    }

    // Secondary fallback: silent background audio ping to maintain WebView thread active
    this.startKeepAliveLoop();
  }

  /**
   * Release Wake Lock when audio finishes or stops
   */
  public static releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (e) {}

    this.stopKeepAliveLoop();
  }

  /**
   * Silent loop strategy to keep WebView audio context awake during locked screen
   */
  private static startKeepAliveLoop() {
    if (this.keepAliveAudio) return;
    try {
      // Minimal 0.1s silent WAV base64
      const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      const audio = new Audio(silentWav);
      audio.loop = true;
      audio.volume = 0.001; // Extremely quiet/silent
      audio.play().catch(() => {});
      this.keepAliveAudio = audio;
    } catch (e) {}
  }

  private static stopKeepAliveLoop() {
    if (this.keepAliveAudio) {
      try {
        this.keepAliveAudio.pause();
        this.keepAliveAudio = null;
      } catch (e) {}
    }
  }
}
