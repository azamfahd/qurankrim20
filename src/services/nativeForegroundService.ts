import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NativeAudioMediaSessionOptions {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

export class NativeForegroundService {
  private static wakeLock: any = null;
  private static isAudioActive = false;

  /**
   * Initializes MediaSession API (Android & iOS Notification Center Media Player)
   * This displays proper play/pause controls in Android status bar & lock screen
   */
  public static registerMediaSession(options: NativeAudioMediaSessionOptions) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: options.title,
        artist: options.artist,
        album: options.album || 'أنيس القلوب - الرفيق القرآني',
        artwork: options.artworkUrl ? [
          { src: options.artworkUrl, sizes: '512x512', type: 'image/png' }
        ] : [
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      if (options.onPlay) {
        navigator.mediaSession.setActionHandler('play', () => {
          options.onPlay?.();
        });
      }

      if (options.onPause) {
        navigator.mediaSession.setActionHandler('pause', () => {
          options.onPause?.();
        });
      }

      if (options.onStop) {
        navigator.mediaSession.setActionHandler('stop', () => {
          options.onStop?.();
        });
      }

      navigator.mediaSession.playbackState = 'playing';
    } catch (err) {
      console.warn('[NativeForegroundService] MediaSession setup notice:', err);
    }
  }

  /**
   * Requests Screen & CPU WakeLock to prevent audio interruption when display turns off
   */
  public static async requestWakeLock(): Promise<boolean> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return false;

    try {
      if (!this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.info('[NativeForegroundService] Screen/CPU WakeLock active.');
        this.wakeLock.addEventListener('release', () => {
          console.info('[NativeForegroundService] WakeLock released.');
          this.wakeLock = null;
        });
      }
      return true;
    } catch (err) {
      console.warn('[NativeForegroundService] WakeLock request notice:', err);
      return false;
    }
  }

  /**
   * Releases active WakeLock when audio finishes
   */
  public static async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (e) {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }

  /**
   * Triggers a test native high-priority notification to verify channel audio
   */
  public static async triggerTestNativeAlarm(title: string, body: string, soundFileName: string = 'mishary.mp3'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return false;

      const channelId = 'test_native_alarm_channel';
      try {
        await LocalNotifications.createChannel({
          id: channelId,
          name: 'اختبار الصوت الجاري',
          description: 'قناة اختبار الأصوات للتطبيقات المستقلة',
          importance: 5,
          sound: soundFileName,
          visibility: 1,
          vibration: true
        });
      } catch (e) {
        console.warn('Channel test creation:', e);
      }

      await LocalNotifications.schedule({
        notifications: [{
          title: title,
          body: body,
          id: Date.now() % 100000,
          schedule: { at: new Date(Date.now() + 500) },
          channelId: channelId,
          sound: soundFileName,
          smallIcon: 'ic_stat_icon_config_sample'
        }]
      });

      return true;
    } catch (err) {
      console.error('[NativeForegroundService] Test alarm failed:', err);
      return false;
    }
  }
}
