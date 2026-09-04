import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { AdhanAudioEngine } from './adhanService';
import { DhikrReminderService, DEFAULT_DHIKR_SETTINGS } from './dhikrReminderService';

export class NativeNotificationService {
  private static isInitialized = false;

  public static getDhikrChannelId(category?: string, isSilent: boolean = false): string {
    if (isSilent) return 'dhikr_channel_v4_silent';
    switch (category) {
      case 'prophet_salawat':
        return 'dhikr_channel_v4_salawat';
      case 'istighfar':
        return 'dhikr_channel_v4_istighfar';
      case 'baqiyat':
        return 'dhikr_channel_v4_baqiyat';
      case 'hawqala':
        return 'dhikr_channel_v4_hawqala';
      case 'tahsin':
        return 'dhikr_channel_v4_tahsin';
      default:
        return 'dhikr_channel_v4_general';
    }
  }

  public static getDhikrSound(category?: string): string {
    switch (category) {
      case 'prophet_salawat':
        return 'mishary_salawat.mp3';
      case 'istighfar':
        return 'mishary_istighfar.mp3';
      case 'baqiyat':
        return 'mishary_baqiyat.mp3';
      case 'hawqala':
        return 'mishary_hawqala.mp3';
      case 'tahsin':
        return 'mishary_tahsin.mp3';
      default:
        return 'mishary_salawat.mp3';
    }
  }

  public static getAdhanChannelId(muezzinId: string = 'mishary'): string {
    return `adhan_channel_v4_${muezzinId}`;
  }

  public static getAdhanSound(muezzinId: string = 'mishary'): string {
    return `${muezzinId}.mp3`;
  }

  public static getSilentChannelId(): string {
    return 'adhan_channel_v4_silent';
  }

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
            // CRITICAL FIX: Only stop adhan if user clicked the explicit "Stop Adhan" button!
            // Tapping the notification to open the app or view prayer MUST NOT stop the adhan.
            if (action.actionId === 'stop_adhan' || action.actionId === 'stop') {
              AdhanAudioEngine.stop(true);
            }
          } else if (extra && (extra.type === 'dhikr' || extra.type === 'dhikr_fixed')) {
            if (action.actionId === 'stop_dhikr' || action.actionId === 'stop') {
              DhikrReminderService.stopAudio();
            } else {
              // Tapping the notification displays the Dhikr card in the app
              const item = extra.dhikrItem;
              if (item) {
                DhikrReminderService.showDirectBanner(item, false);
              } else if (extra.type === 'dhikr_fixed') {
                const fixedItem = {
                  id: `fixed_${extra.category}`,
                  text: action.notification.largeBody?.split('\n\n')[1] || action.notification.body || 'تذكير بذكر الله',
                  category: extra.category,
                  categoryName: action.notification.title || 'أذكار المسلم',
                  virtue: action.notification.largeBody?.split('\n\n')[0] || '',
                  count: 1
                };
                DhikrReminderService.showDirectBanner(fixedItem as any, false);
              } else {
                DhikrReminderService.showDirectBanner();
              }
            }
          }
        }
      });

      // Setup initial channels and action types
      await this.setupAndroidChannels('mishary');

      console.info('[NativeNotificationService] Native APK notification listeners & channels initialized successfully.');
    } catch (err) {
      console.warn('[NativeNotificationService] Error setting up notification listeners:', err);
    }
  }

  /**
   * Handles incoming notification payload (Adhan or Dhikr)
   */
  private static handleNotificationEvent(notification: LocalNotificationSchema) {
    try {
      const extra = notification.extra;
      if (!extra) return;

      // Note: On native Android, the notification channel itself plays the raw audio file natively via Android system sound server.
      // We do not play HTML5 audio here to avoid duplicate/overlapping sound.
      if (extra.type === 'adhan') {
        const prayerName = extra.prayerName || 'الصلاة';
        console.info(`[NativeNotificationService] Native Adhan notification displayed for ${prayerName}`);
      } else if (extra.type === 'dhikr' || extra.type === 'dhikr_fixed') {
        console.info('[NativeNotificationService] Native Dhikr notification displayed');
        const item = extra.dhikrItem;
        if (item) {
          DhikrReminderService.showDirectBanner(item, false);
        } else if (extra.type === 'dhikr_fixed') {
          // It's a fixed reminder (Morning/Evening/Witr), let's construct a simple generic dhikr item
          // to show on the banner
          const fixedItem = {
            id: `fixed_${extra.category}`,
            text: notification.largeBody?.split('\n\n')[1] || notification.body || 'تذكير بذكر الله',
            category: extra.category,
            categoryName: notification.title || 'أذكار المسلم',
            virtue: notification.largeBody?.split('\n\n')[0] || '',
            count: 1
          };
          DhikrReminderService.showDirectBanner(fixedItem as any, false);
        }
      }
    } catch (err) {
      console.warn('[NativeNotificationService] Failed to handle notification event:', err);
    }
  }

  /**
   * Configures high-importance notification channels on Android with native audio resources
   */
  public static async setupAndroidChannels(muezzinId: string = 'mishary') {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return false;

      // Clean up legacy v3 channels if they exist to remove stale default sounds
      const legacyChannels = [
        'dhikr_channel_v3',
        'adhan_channel_v3_mishary',
        'adhan_channel_v3_al_mulla',
        'adhan_channel_v3_madina',
        'adhan_channel_v3_abdulbasit',
        'adhan_channel_v3_mansour',
        'adhan_channel_v3_alghamdi',
        'adhan_channel_v3_qatami',
        'adhan_channel_v3_aqsa'
      ];
      for (const chId of legacyChannels) {
        LocalNotifications.deleteChannel({ id: chId }).catch(() => {});
      }

      // 1. Create Adhan Channels for all supported muezzins
      const muezzins = [
        { id: 'mishary', name: 'مشاري راشد العفاسي' },
        { id: 'al_mulla', name: 'علي أحمد ملا (الحرم المكي)' },
        { id: 'madina', name: 'المسجد النبوي الشريف' },
        { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد' },
        { id: 'mansour', name: 'منصور السالمي' },
        { id: 'alghamdi', name: 'سعد الغامدي' },
        { id: 'qatami', name: 'ناصر القطامي' },
        { id: 'aqsa', name: 'المسجد الأقصى المبارك' }
      ];

      for (const m of muezzins) {
        try {
          await LocalNotifications.createChannel({
            id: `adhan_channel_v4_${m.id}`,
            name: `أذان الصلاة (${m.name})`,
            description: `تنبيه صوتي بالأذان بصوت ${m.name} عند دخول وقت الصلاة`,
            importance: 5, // IMPORTANCE_HIGH
            sound: `${m.id}.mp3`,
            visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
            vibration: true,
            lights: true,
            lightColor: '#10B981'
          });
        } catch (e) {
          console.warn(`Adhan channel creation notice for ${m.id}:`, e);
        }
      }

      // 1.1 Create Silent In-App Adhan Notification Channel
      // Used when app is already open and playing adhan smoothly to prevent audio conflict/ducking
      try {
        await LocalNotifications.createChannel({
          id: 'adhan_channel_v4_silent',
          name: 'أذان الصلاة (أثناء فتح التطبيق)',
          description: 'إشعار مرئي بدون صوت إضافي عند فتح التطبيق وتشغيل الأذان داخلياً منعاً لتقطع الصوت',
          importance: 4,
          sound: undefined,
          visibility: 1,
          vibration: false,
          lights: true,
          lightColor: '#10B981'
        });
      } catch (e) {
        console.warn('Adhan silent channel creation notice:', e);
      }

      // 1.2 Register Interactive Notification Action Buttons
      try {
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'ADHAN_ACTIONS',
              actions: [
                {
                  id: 'stop_adhan',
                  title: 'إيقاف الأذان ⏹️',
                  destructive: true
                },
                {
                  id: 'open_app',
                  title: 'فتح التطبيق 🕌',
                  foreground: true
                }
              ]
            },
            {
              id: 'DHIKR_ACTIONS',
              actions: [
                {
                  id: 'stop_dhikr',
                  title: 'إيقاف ⏹️',
                  destructive: true
                },
                {
                  id: 'open_app',
                  title: 'فتح التطبيق 📿',
                  foreground: true
                }
              ]
            }
          ]
        });
      } catch (e) {
        console.warn('Action types registration notice:', e);
      }

      // 2. Create Dhikr Channels for all categories with custom voice of Sheikh Mishary Alafasy
      const dhikrChannels = [
        {
          id: 'dhikr_channel_v4_salawat',
          name: 'أنيس القلوب | الصلاة على النبي ﷺ',
          description: 'تنبيه صوتي بالصلاة على الحبيب المصطفى ﷺ بصوت الشيخ مشاري العفاسي',
          sound: 'mishary_salawat.mp3'
        },
        {
          id: 'dhikr_channel_v4_istighfar',
          name: 'أنيس القلوب | الاستغفار والتوبة',
          description: 'تنبيه صوتي بأذكار الاستغفار بصوت الشيخ مشاري العفاسي',
          sound: 'mishary_istighfar.mp3'
        },
        {
          id: 'dhikr_channel_v4_baqiyat',
          name: 'أنيس القلوب | الباقيات الصالحات',
          description: 'تنبيه صوتي بالتسبيح والتحميد والتهليل والتكبير',
          sound: 'mishary_baqiyat.mp3'
        },
        {
          id: 'dhikr_channel_v4_hawqala',
          name: 'أنيس القلوب | الحوقلة والتوكل',
          description: 'تنبيه صوتي بلا حول ولا قوة إلا بالله العلي العظيم',
          sound: 'mishary_hawqala.mp3'
        },
        {
          id: 'dhikr_channel_v4_tahsin',
          name: 'أنيس القلوب | أدعية التحصين والحفظ',
          description: 'تنبيه صوتي بأدعية التحصين وحفظ النفس بصوت الشيخ مشاري العفاسي',
          sound: 'mishary_tahsin.mp3'
        },
        {
          id: 'dhikr_channel_v4_general',
          name: 'أنيس القلوب | أذكار المسلم اليومية',
          description: 'تنبيهات الأذكار والتسبيح اليومية بصوت الشيخ مشاري العفاسي',
          sound: 'mishary_salawat.mp3'
        }
      ];

      for (const dc of dhikrChannels) {
        try {
          await LocalNotifications.createChannel({
            id: dc.id,
            name: dc.name,
            description: dc.description,
            importance: 5,
            sound: dc.sound,
            visibility: 1,
            vibration: true,
            lights: true,
            lightColor: '#10B981'
          });
        } catch (e) {
          console.warn(`Dhikr channel creation notice for ${dc.id}:`, e);
        }
      }

      // Silent channel
      try {
        await LocalNotifications.createChannel({
          id: 'dhikr_channel_v4_silent',
          name: 'أنيس القلوب | تنبيهات هادئة (بدون صوت)',
          description: 'تنبيه نصي مرئي فقط دون تشغيل نغمة أو صوت',
          importance: 3,
          visibility: 1,
          vibration: false
        });
      } catch (e) {}

      return true;
    } catch (err) {
      console.warn('[NativeNotificationService] Channel setup error:', err);
      return false;
    }
  }
}
