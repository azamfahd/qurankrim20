import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { AdhanAudioEngine } from './adhanService';
import { DhikrReminderService, DEFAULT_DHIKR_SETTINGS } from './dhikrReminderService';

export class NativeNotificationService {
  private static isInitialized = false;

  public static readonly MUEZZIN_NAMES: Record<string, string> = {
    mishary: 'مشاري راشد العفاسي',
    al_mulla: 'علي أحمد ملا (الحرم المكي)',
    madina: 'المسجد النبوي الشريف',
    abdulbasit: 'عبد الباسط عبد الصمد',
    mansour: 'منصور السالمي',
    alghamdi: 'سعد الغامدي',
    qatami: 'ناصر القطامي',
    aqsa: 'المسجد الأقصى المبارك'
  };

  public static readonly RECITER_NAMES: Record<string, string> = {
    mishary: 'الشيخ مشاري راشد العفاسي',
    maher: 'الشيخ ماهر المعيقلي',
    alghamdi: 'الشيخ سعد الغامدي',
    abdulbasit: 'الشيخ عبد الباسط عبد الصمد',
    qatami: 'الشيخ ناصر القطامي',
    nufais: 'الشيخ أحمد النفيس',
    sudais: 'الشيخ عبد الرحمن السديس',
    husary: 'الشيخ محمود خليل الحصري',
    minshawi: 'الشيخ محمد صديق المنشاوي',
    random: 'قارئ عشوائي متنوع'
  };

  public static getActiveMuezzinId(): string {
    try {
      const adhanRaw = localStorage.getItem('anis_adhan_settings');
      if (adhanRaw) {
        const parsed = JSON.parse(adhanRaw);
        if (parsed?.muezzin) return parsed.muezzin;
      }
      const generalRaw = localStorage.getItem('anis_settings');
      if (generalRaw) {
        const parsed = JSON.parse(generalRaw);
        if (parsed?.adhanSettings?.muezzin) return parsed.adhanSettings.muezzin;
      }
    } catch {}
    return 'mishary';
  }

  public static getActiveReciterId(): string {
    try {
      const dhikrRaw = localStorage.getItem('anis_dhikr_reminder_settings');
      if (dhikrRaw) {
        const parsed = JSON.parse(dhikrRaw);
        if (parsed?.reciterId) return parsed.reciterId;
      }
    } catch {}
    return 'mishary';
  }

  public static normalizeCategoryKey(category?: string): string {
    if (!category) return 'general';
    const cat = category.toLowerCase();
    if (cat.includes('salawat') || cat.includes('prophet')) return 'salawat';
    if (cat.includes('istighfar')) return 'istighfar';
    if (cat.includes('baqiyat')) return 'baqiyat';
    if (cat.includes('hawqala')) return 'hawqala';
    if (cat.includes('tahsin')) return 'tahsin';
    return 'general';
  }

  public static getDhikrChannelId(category?: string, isSilent: boolean = false, reciterId?: string): string {
    if (isSilent) return 'dhikr_v5_silent';
    const effectiveReciter = reciterId || this.getActiveReciterId();
    const cleanCategory = this.normalizeCategoryKey(category);
    return `dhikr_v5_${effectiveReciter}_${cleanCategory}`;
  }

  public static getDhikrSound(category?: string, reciterId?: string): string {
    let rId = reciterId || this.getActiveReciterId() || 'mishary';
    if (rId === 'random') {
      const allReciters = ['mishary', 'maher', 'abdulbasit', 'husary', 'minshawi', 'alghamdi', 'qatami', 'sudais'];
      rId = allReciters[Math.floor(Math.random() * allReciters.length)];
    }
    const validReciters = ['mishary', 'maher', 'abdulbasit', 'husary', 'minshawi', 'alghamdi', 'qatami', 'sudais'];
    const effectiveReciter = validReciters.includes(rId) ? rId : 'mishary';

    const cleanCategory = this.normalizeCategoryKey(category);
    // On Android native raw resources, use exact filename without extension
    const soundSuffix = cleanCategory === 'general' ? 'salawat' : cleanCategory;
    return `${effectiveReciter}_${soundSuffix}.mp3`;
  }

  public static getAdhanChannelId(muezzinId?: string): string {
    const effectiveMuezzin = muezzinId || this.getActiveMuezzinId();
    return `adhan_v5_${effectiveMuezzin}`;
  }

  public static getAdhanSound(muezzinId?: string): string {
    const effectiveMuezzin = muezzinId || this.getActiveMuezzinId();
    return `${effectiveMuezzin}.mp3`;
  }

  public static getSilentChannelId(): string {
    return 'adhan_v5_silent';
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

      // Synchronize channels dynamically with user's saved preferences
      await this.syncChannelsWithActiveSettings();

      console.info('[NativeNotificationService] Native APK notification listeners & synchronized channels initialized successfully.');
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

      if (extra.type === 'adhan') {
        const prayerName = extra.prayerName || 'الصلاة';
        console.info(`[NativeNotificationService] Native Adhan notification displayed for ${prayerName}`);
      } else if (extra.type === 'dhikr' || extra.type === 'dhikr_fixed') {
        console.info('[NativeNotificationService] Native Dhikr notification displayed');
        const item = extra.dhikrItem;
        if (item) {
          DhikrReminderService.showDirectBanner(item, false);
        } else if (extra.type === 'dhikr_fixed') {
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
   * Dynamically synchronizes Android Notification Channels with the user's active choices
   * (Selected Muezzin for Adhan and Selected Reciter for Dhikr).
   * Deletes obsolete/inactive channels so phone settings (فئات الإشعارات) stay clean and 100% matched.
   */
  public static async syncChannelsWithActiveSettings(
    targetMuezzinId?: string,
    targetReciterId?: string
  ): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return false;

      const activeMuezzin = targetMuezzinId || this.getActiveMuezzinId();
      const activeReciter = targetReciterId || this.getActiveReciterId();

      const muezzinName = this.MUEZZIN_NAMES[activeMuezzin] || 'مشاري راشد العفاسي';
      const reciterName = this.RECITER_NAMES[activeReciter] || 'الشيخ مشاري راشد العفاسي';

      const activeAdhanChannelId = this.getAdhanChannelId(activeMuezzin);
      const silentAdhanChannelId = this.getSilentChannelId();
      const activeDhikrGeneralId = this.getDhikrChannelId(undefined, false, activeReciter);
      const silentDhikrChannelId = this.getDhikrChannelId(undefined, true);

      const recitersToSetup = activeReciter === 'random' 
        ? ['mishary', 'maher', 'abdulbasit', 'husary', 'minshawi', 'alghamdi', 'qatami', 'sudais']
        : [activeReciter];

      const activeDhikrCategoryIds: string[] = [];
      recitersToSetup.forEach(r => {
        activeDhikrCategoryIds.push(
          `dhikr_v5_${r}_salawat`,
          `dhikr_v5_${r}_istighfar`,
          `dhikr_v5_${r}_baqiyat`,
          `dhikr_v5_${r}_hawqala`,
          `dhikr_v5_${r}_tahsin`,
          `dhikr_v5_${r}_general`
        );
      });

      const allowedChannelIds = new Set<string>([
        activeAdhanChannelId,
        silentAdhanChannelId,
        activeDhikrGeneralId,
        silentDhikrChannelId,
        ...activeDhikrCategoryIds,
        'anis_foreground_prayer_tracker'
      ]);

      // 1. Clean up legacy channels and channels for inactive muezzins/reciters
      try {
        const listResult = await LocalNotifications.listChannels();
        const existingChannels = listResult?.channels || [];

        for (const ch of existingChannels) {
          // If channel is legacy (dhikr_channel_, adhan_channel_, _v3, _v4) or is for an inactive muezzin/reciter, delete it
          const isLegacy = ch.id.startsWith('dhikr_channel_') || 
                           ch.id.startsWith('adhan_channel_') || 
                           ch.id.includes('_v3') || 
                           ch.id.includes('_v4');
          const isInactiveAdhan = ch.id.startsWith('adhan_v5_') && !allowedChannelIds.has(ch.id);
          const isInactiveDhikr = ch.id.startsWith('dhikr_v5_') && !allowedChannelIds.has(ch.id);

          if (isLegacy || isInactiveAdhan || isInactiveDhikr) {
            try {
              await LocalNotifications.deleteChannel({ id: ch.id });
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Channel cleanup listing notice:', e);
      }

      // Also explicitly delete static legacy channel IDs in case listChannels omitted them
      const allMuezzinKeys = Object.keys(this.MUEZZIN_NAMES);
      for (const mId of allMuezzinKeys) {
        LocalNotifications.deleteChannel({ id: `adhan_channel_v4_${mId}` }).catch(() => {});
        LocalNotifications.deleteChannel({ id: `adhan_channel_v3_${mId}` }).catch(() => {});
        LocalNotifications.deleteChannel({ id: `adhan_channel_${mId}` }).catch(() => {});
        if (mId !== activeMuezzin) {
          LocalNotifications.deleteChannel({ id: `adhan_v5_${mId}` }).catch(() => {});
        }
      }

      // Clean up legacy dhikr channels across all reciters
      const allReciterKeys = ['mishary', 'maher', 'abdulbasit', 'husary', 'minshawi', 'alghamdi', 'qatami', 'sudais', 'random'];
      const categories = ['salawat', 'istighfar', 'baqiyat', 'hawqala', 'tahsin', 'general'];
      for (const rKey of allReciterKeys) {
        for (const cat of categories) {
          LocalNotifications.deleteChannel({ id: `dhikr_channel_${rKey}_${cat}` }).catch(() => {});
          LocalNotifications.deleteChannel({ id: `dhikr_channel_v4_${cat}` }).catch(() => {});
          if (!recitersToSetup.includes(rKey)) {
            LocalNotifications.deleteChannel({ id: `dhikr_v5_${rKey}_${cat}` }).catch(() => {});
          }
        }
      }
      LocalNotifications.deleteChannel({ id: 'dhikr_channel_silent' }).catch(() => {});
      LocalNotifications.deleteChannel({ id: 'dhikr_channel_v3' }).catch(() => {});
      LocalNotifications.deleteChannel({ id: 'dhikr_channel_v4_silent' }).catch(() => {});
      LocalNotifications.deleteChannel({ id: 'adhan_channel_silent' }).catch(() => {});

      // 2. Create Active Adhan Channel specifically matched to chosen Sheikh
      try {
        await LocalNotifications.createChannel({
          id: activeAdhanChannelId,
          name: `أذان الصلوات المفروضة (${muezzinName})`,
          description: `تنبيه صوتي بالأذان بصوت ${muezzinName} عند دخول وقت الصلاة (متوافق مع إعداداتك)`,
          importance: 5, // IMPORTANCE_HIGH (banner popup + sound)
          sound: `${activeMuezzin}.mp3`,
          visibility: 1, // VISIBILITY_PUBLIC (lockscreen)
          vibration: true,
          lights: true,
          lightColor: '#10B981'
        });
      } catch (e) {
        console.warn('Active adhan channel create error:', e);
      }

      // 2.1 Create Silent In-App Adhan Notification Channel
      try {
        await LocalNotifications.createChannel({
          id: silentAdhanChannelId,
          name: 'أذان الصلاة (أثناء فتح التطبيق)',
          description: 'إشعار مرئي بدون صوت إضافي عند فتح التطبيق وتشغيل الأذان داخلياً منعاً لتداخل الصوت',
          importance: 4,
          sound: undefined,
          visibility: 1,
          vibration: false,
          lights: true,
          lightColor: '#10B981'
        });
      } catch (e) {}

      // 3. Create Active Dhikr Channels matched to chosen Reciters
      for (const rId of recitersToSetup) {
        const rName = this.RECITER_NAMES[rId] || rId;
        const dhikrCategories = [
          {
            id: `dhikr_v5_${rId}_salawat`,
            name: `الصلاة على النبي ﷺ (${rName})`,
            description: `تنبيه صوتي بالصلاة على الحبيب المصطفى ﷺ بصوت ${rName}`,
            sound: this.getDhikrSound('prophet_salawat', rId)
          },
          {
            id: `dhikr_v5_${rId}_istighfar`,
            name: `الاستغفار والتوبة (${rName})`,
            description: `تنبيه صوتي بأذكار الاستغفار بصوت ${rName}`,
            sound: this.getDhikrSound('istighfar', rId)
          },
          {
            id: `dhikr_v5_${rId}_baqiyat`,
            name: `الباقيات الصالحات (${rName})`,
            description: `تنبيه صوتي بالتسبيح والتحميد والتكبير بصوت ${rName}`,
            sound: this.getDhikrSound('baqiyat', rId)
          },
          {
            id: `dhikr_v5_${rId}_hawqala`,
            name: `الحوقلة والتوكل (${rName})`,
            description: `تنبيه صوتي بالحوقلة بصوت ${rName}`,
            sound: this.getDhikrSound('hawqala', rId)
          },
          {
            id: `dhikr_v5_${rId}_tahsin`,
            name: `أدعية التحصين والحفظ (${rName})`,
            description: `تنبيه صوتي بأدعية التحصين بصوت ${rName}`,
            sound: this.getDhikrSound('tahsin', rId)
          },
          {
            id: `dhikr_v5_${rId}_general`,
            name: `أذكار وتسابيح المسلم (${rName})`,
            description: `تنبيهات الأذكار والتسبيح اليومية بصوت ${rName} وفق تخصيصك`,
            sound: this.getDhikrSound('general', rId)
          }
        ];

        for (const dc of dhikrCategories) {
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
          } catch (e) {}
        }
      }

      // Silent Dhikr Channel
      try {
        await LocalNotifications.createChannel({
          id: silentDhikrChannelId,
          name: 'أذكار المسلم (تنبيه مرئي هادئ بدون صوت)',
          description: 'تنبيه نصي مرئي فقط دون تشغيل نغمة أو صوت',
          importance: 3,
          visibility: 1,
          vibration: false
        });
      } catch (e) {}

      // 4. Register Interactive Notification Action Buttons
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
      } catch (e) {}

      return true;
    } catch (err) {
      console.warn('[NativeNotificationService] Dynamic channel setup error:', err);
      return false;
    }
  }

  /**
   * Backwards compatible method that calls dynamic channel synchronization
   */
  public static async setupAndroidChannels(muezzinId?: string): Promise<boolean> {
    return this.syncChannelsWithActiveSettings(muezzinId);
  }

  /**
   * Opens Android native notification / alarm settings directly if supported
   */
  public static async openSystemNotificationSettings(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      if (typeof (LocalNotifications as any).changeExactNotificationSetting === 'function') {
        await (LocalNotifications as any).changeExactNotificationSetting();
        return true;
      }
    } catch (e) {
      console.warn('Cannot open exact notification setting:', e);
    }
    return false;
  }
}

