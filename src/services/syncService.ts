import { SupabaseService, getSupabase } from './supabaseService';
import { ChatSession, UserSettings, Bookmark } from '../types';
import { LocalDatabaseService } from '../db/localDb';

export class SyncService {
  private static isSyncing = false;
  private static syncListenerInitialized = false;

  private static isGuest(userId: string): boolean {
    return !userId || userId.startsWith('guest_') || localStorage.getItem('anis_is_guest') === 'true';
  }

  /**
   * Initializes automatic sync listeners on network recovery and app visibility change
   */
  public static initAutoSync(getUserId: () => string | undefined, getSettings: () => UserSettings): void {
    if (this.syncListenerInitialized) return;
    this.syncListenerInitialized = true;

    // 1. Listen for browser/app online event
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored. Triggering auto-sync with Supabase...');
      const uid = getUserId();
      if (uid && !this.isGuest(uid)) {
        this.processSyncQueue(uid, getSettings());
      }
    });

    // 2. Also attempt sync when app becomes visible / active
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        const uid = getUserId();
        if (uid && !this.isGuest(uid)) {
          this.processSyncQueue(uid, getSettings());
        }
      }
    });
  }

  /**
   * Process all pending mutations created while offline
   */
  public static async processSyncQueue(userId: string, settings: UserSettings): Promise<void> {
    if (this.isSyncing || !navigator.onLine || !userId || this.isGuest(userId)) return;
    const client = getSupabase();
    if (!client) return;

    try {
      this.isSyncing = true;
      const pendingItems = await LocalDatabaseService.getPendingSyncItems(userId);
      if (pendingItems.length === 0) return;

      for (const item of pendingItems) {
        try {
          switch (item.type) {
            case 'session':
              await SupabaseService.saveSessions(userId, [item.payload]);
              await LocalDatabaseService.removeSyncItem(item.id);
              break;
            case 'delete_session':
              await SupabaseService.deleteSession(item.payload.sessionId);
              await LocalDatabaseService.removeSyncItem(item.id);
              break;
            case 'bookmark':
              await SupabaseService.saveBookmark(userId, item.payload);
              await LocalDatabaseService.removeSyncItem(item.id);
              break;
            case 'delete_bookmark':
              await SupabaseService.deleteBookmark(userId, item.payload.bookmarkId);
              await LocalDatabaseService.removeSyncItem(item.id);
              break;
            case 'settings':
              await SupabaseService.saveUserSettings(userId, item.payload);
              await LocalDatabaseService.removeSyncItem(item.id);
              break;
          }
        } catch (itemErr) {
          console.warn('Sync queue item process error:', itemErr);
          break; // Stop loop on network error to retry later
        }
      }
    } catch (e) {
      console.warn('processSyncQueue error:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  static async saveSession(userId: string, session: ChatSession, settings: UserSettings): Promise<void> {
    // 1. Always save to local database first (Instant & Offline-First)
    await LocalDatabaseService.saveSession(session);

    // 2. If offline or guest, enqueue for later sync
    if (!userId || this.isGuest(userId)) return;

    if (!navigator.onLine) {
      await LocalDatabaseService.enqueueSyncItem({
        type: 'session',
        payload: session,
        userId
      });
      return;
    }

    try {
      await SupabaseService.saveSessions(userId, [session]);
    } catch (e) {
      console.warn('Background cloud sync failed, queuing for offline retry:', e);
      await LocalDatabaseService.enqueueSyncItem({
        type: 'session',
        payload: session,
        userId
      });
    }
  }

  static async loadSessions(userId: string, settings: UserSettings): Promise<ChatSession[] | null> {
    // 1. Load from local database first
    const localSessions = await LocalDatabaseService.getAllSessions();

    // 2. If authenticated & online, fetch cloud sessions and merge
    if (!userId || this.isGuest(userId)) {
      return localSessions.length > 0 ? localSessions : null;
    }

    if (!navigator.onLine) {
      return localSessions.length > 0 ? localSessions : null;
    }

    try {
      // First process any pending sync items
      await this.processSyncQueue(userId, settings);

      const cloudSessions = await SupabaseService.loadSessions(userId);
      if (cloudSessions && cloudSessions.length > 0) {
        // Merge & update local DB
        for (const session of cloudSessions) {
          await LocalDatabaseService.saveSession(session);
        }
        return await LocalDatabaseService.getAllSessions();
      }
    } catch (e) {
      console.warn('Cloud loadSessions failed, using local database:', e);
    }

    return localSessions.length > 0 ? localSessions : null;
  }

  static async saveSettings(userId: string, settings: UserSettings): Promise<void> {
    // 1. Always save to local database first
    await LocalDatabaseService.saveLocalSettings(settings);

    // 2. Cloud sync
    if (!userId || this.isGuest(userId)) return;

    if (!navigator.onLine) {
      await LocalDatabaseService.enqueueSyncItem({
        type: 'settings',
        payload: settings,
        userId
      });
      return;
    }

    try {
      await SupabaseService.saveUserSettings(userId, settings);
    } catch (e) {
      console.warn('Cloud saveSettings failed, queuing for offline retry:', e);
      await LocalDatabaseService.enqueueSyncItem({
        type: 'settings',
        payload: settings,
        userId
      });
    }
  }

  static async loadSettings(userId: string, currentSettings: UserSettings): Promise<Partial<UserSettings> | null> {
    // 1. Load from local database
    const localSettings = await LocalDatabaseService.getLocalSettings();

    // 2. Try loading from Cloud if logged in and online
    if (!userId || this.isGuest(userId) || !navigator.onLine) {
      return localSettings;
    }

    try {
      let loadedSettings: Partial<UserSettings> | null = await SupabaseService.loadUserSettings(userId);
      
      try {
        const bookmarks = await SupabaseService.getBookmarks(userId);
        if (bookmarks && bookmarks.length > 0) {
          loadedSettings = {
            ...(loadedSettings || {}),
            bookmarks: bookmarks
          };
          for (const b of bookmarks) {
            await LocalDatabaseService.saveBookmark(b);
          }
        }
      } catch (e) {
        console.warn('Error fetching separate bookmarks from cloud:', e);
      }

      if (loadedSettings) {
        const merged = { ...(localSettings || {}), ...loadedSettings };
        delete merged.isLoggedIn;
        delete merged.uid;
        await LocalDatabaseService.saveLocalSettings({ ...currentSettings, ...merged, isLoggedIn: true, uid: userId });
        return merged;
      }
    } catch (e) {
      console.warn('Cloud loadSettings failed, using local database:', e);
    }

    return localSettings;
  }

  static async deleteSession(userId: string, sessionId: string, settings: UserSettings): Promise<void> {
    await LocalDatabaseService.deleteSession(sessionId);
    if (!userId || this.isGuest(userId)) return;

    if (!navigator.onLine) {
      await LocalDatabaseService.enqueueSyncItem({
        type: 'delete_session',
        payload: { sessionId },
        userId
      });
      return;
    }

    try {
      await SupabaseService.deleteSession(sessionId);
    } catch (e) {
      console.warn('Cloud deleteSession failed, queuing for retry:', e);
      await LocalDatabaseService.enqueueSyncItem({
        type: 'delete_session',
        payload: { sessionId },
        userId
      });
    }
  }

  static async clearAllSessions(userId: string, sessions: ChatSession[], settings: UserSettings): Promise<void> {
    await LocalDatabaseService.clearAllSessions();
    if (!userId || this.isGuest(userId)) return;
    try {
      await SupabaseService.clearAllSessions(userId);
    } catch (e) {
      console.warn('Cloud clearAllSessions failed:', e);
    }
  }

  static async saveBookmark(userId: string, bookmark: Bookmark, settings: UserSettings): Promise<void> {
    await LocalDatabaseService.saveBookmark(bookmark);
    if (!userId || this.isGuest(userId)) return;

    if (!navigator.onLine) {
      await LocalDatabaseService.enqueueSyncItem({
        type: 'bookmark',
        payload: bookmark,
        userId
      });
      return;
    }

    try {
      await SupabaseService.saveBookmark(userId, bookmark);
    } catch (e) {
      console.warn('Cloud saveBookmark failed, queuing for retry:', e);
      await LocalDatabaseService.enqueueSyncItem({
        type: 'bookmark',
        payload: bookmark,
        userId
      });
    }
  }

  static async deleteBookmark(userId: string, bookmarkId: string, settings: UserSettings): Promise<void> {
    await LocalDatabaseService.deleteBookmark(bookmarkId);
    if (!userId || this.isGuest(userId)) return;

    if (!navigator.onLine) {
      await LocalDatabaseService.enqueueSyncItem({
        type: 'delete_bookmark',
        payload: { bookmarkId },
        userId
      });
      return;
    }

    try {
      await SupabaseService.deleteBookmark(userId, bookmarkId);
    } catch (e) {
      console.warn('Cloud deleteBookmark failed, queuing for retry:', e);
      await LocalDatabaseService.enqueueSyncItem({
        type: 'delete_bookmark',
        payload: { bookmarkId },
        userId
      });
    }
  }

  static async registerUser(userId: string, metadata: any, settings: UserSettings): Promise<void> {
    if (!userId) return;
    try {
      await SupabaseService.registerUser(userId, metadata, settings);
    } catch (e) {
      console.warn('Cloud registerUser failed:', e);
    }
  }

  static async updateUserInstallStatus(userId: string, isInstalled: boolean): Promise<void> {
    if (!userId) return;
    try {
      await SupabaseService.updateUserInstallStatus(userId, isInstalled);
    } catch (e) {
      console.warn('Cloud updateUserInstallStatus failed:', e);
    }
  }
}
