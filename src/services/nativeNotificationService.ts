import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { AdhanAudioEngine } from './adhanService';
import { DhikrReminderService, DEFAULT_DHIKR_SETTINGS } from './dhikrReminderService';

export class NativeNotificationService {
  private static isInitialized = false;

  /**
   * Initializes native notification listeners for Android APK.
   * Runs when the app boots or resumes.
   */
  public static async initNativeListeners() {
    if (this.isInitialized || !Capacitor.isNativePlatform()) return;
    this.isInitialized = true;

    try {
      // 1. Listen when notification fires while app is open or backgrounded
      await LocalNotifications.addListener('localNotificationReceived', async (notification: LocalNotificationSchema) => {
        console.info('[NativeNotificationService] Local notification received:', notification);
        this.handleNotificationEvent(notification);
      });

      // 2. Listen when user clicks / taps notification in Android status bar
      await LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
        console.info('[NativeNotificationService] Notification tapped/actioned:', action);
        if (action.notification) {
          const extra = action.notification.extra;
          if (extra && extra.type === 'adhan') {
            // If the user tapped the Adhan notification, they typically want to dismiss/stop the sound.
            // The Android OS stops the native sound when tapped, so we ensure the app's audio engine is stopped too.
            AdhanAudioEngine.stop(true);
          } else {
            // For other notifications (like dhikr), handle normally or stop if needed
            if (extra && extra.type === 'dhikr') {
               DhikrReminderService.stopAudio();
            }
          }
        }
      });

      console.info('[NativeNotificationService] Native APK notification listeners initialized successfully.');
    } catch (err) {
      console.warn('[NativeNotificationService] Error setting up notification listeners:', err);
    }
  }

  /**
   * Handles incoming notification payload (Adhan or Dhikr) and triggers appropriate audio engine
   */
  private static handleNotificationEvent(notification: LocalNotificationSchema) {
    try {
      const extra = notification.extra;
      if (!extra) return;

      if (extra.type === 'adhan') {
        const muezzinId = extra.muezzinId || 'mishary';
        const prayerName = extra.prayerName || 'الصلاة';
        const volume = typeof extra.volume === 'number' ? extra.volume : 85;
        console.info(`[NativeNotificationService] Triggering Adhan audio for ${prayerName} (${muezzinId}) at volume ${volume}%`);
        
        AdhanAudioEngine.play(muezzinId, volume, undefined, undefined, prayerName);
      } else if (extra.type === 'dhikr') {
        console.info('[NativeNotificationService] Triggering Dhikr audio alert');
        const item = extra.dhikrItem;
        if (item) {
          DhikrReminderService.playDhikrAlert(item, {
            ...DEFAULT_DHIKR_SETTINGS,
            soundType: extra.soundType || 'voice_only',
            volume: extra.volume || 85,
            reciterId: extra.reciterId || 'mishary'
          });
        }
      }
    } catch (err) {
      console.warn('[NativeNotificationService] Failed to handle notification event:', err);
    }
  }

  /**
   * Helper to request permissions and ensure proper high-importance notification channel on Android
   */
  public static async setupAndroidChannels(muezzinId: string = 'mishary') {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return false;

      // Create unique channel ID per muezzin to ensure Android OS applies custom sound correctly
      const adhanChannelId = `adhan_channel_v3_${muezzinId}`;
      const soundFileName = `${muezzinId}.mp3`;

      try {
        await LocalNotifications.createChannel({
          id: adhanChannelId,
          name: `أذان الصلاة (${muezzinId})`,
          description: 'تنبيه بصوت الأذان المبارك بدخول وقت الصلاة',
          importance: 5, // IMPORTANCE_HIGH
          sound: soundFileName,
          visibility: 1, // VISIBILITY_PUBLIC
          vibration: true
        });
      } catch (e) {
        console.warn('Adhan channel creation notice:', e);
      }

      try {
        await LocalNotifications.createChannel({
          id: 'dhikr_channel_v3',
          name: 'تنبيهات الأذكار والتسبيح',
          description: 'تذكير بالصلاة على النبي ﷺ والاستغفار والأذكار',
          importance: 5,
          sound: 'mishary_salawat.mp3',
          visibility: 1,
          vibration: true
        });
      } catch (e) {
        console.warn('Dhikr channel creation notice:', e);
      }

      return true;
    } catch (err) {
      console.warn('[NativeNotificationService] Channel setup error:', err);
      return false;
    }
  }
}
