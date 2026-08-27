import { SupabaseService, getSupabase } from './supabaseService';
import { ChatSession, UserSettings, Bookmark } from '../types';
import { LocalDatabaseService } from '../db/localDb';

export class SyncService {
  private static isGuest(userId: string): boolean {
    return !userId || userId.startsWith('guest_') || localStorage.getItem('anis_is_guest') === 'true';
  }

  static async saveSession(userId: string, session: ChatSession, settings: UserSettings): Promise<void> {
    // 1. Always save to local IndexedDB first (Instant & Offline-First)
    await LocalDatabaseService.saveSession(session);

    // 2. Sync to cloud (Supabase) if authenticated
    if (!userId || this.isGuest(userId)) return;
    try {
      await SupabaseService.saveSessions(userId, [session]);
    } catch (e) {
      console.warn('Background cloud sync failed (offline mode):', e);
    }
  }

  static async loadSessions(userId: string, settings: UserSettings): Promise<ChatSession[] | null> {
    // 1. Load from local IndexedDB first
    const localSessions = await LocalDatabaseService.getAllSessions();

    // 2. If authenticated, fetch cloud sessions and merge
    if (!userId || this.isGuest(userId)) {
      return localSessions.length > 0 ? localSessions : null;
    }

    try {
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
    // 1. Always save to local IndexedDB first
    await LocalDatabaseService.saveLocalSettings(settings);

    // 2. Cloud sync
    if (!userId || this.isGuest(userId)) return;
    try {
      await SupabaseService.saveUserSettings(userId, settings);
    } catch (e) {
      console.warn('Cloud saveSettings failed (offline mode):', e);
    }
  }

  static async loadSettings(userId: string, currentSettings: UserSettings): Promise<Partial<UserSettings> | null> {
    // 1. Load from local IndexedDB
    const localSettings = await LocalDatabaseService.getLocalSettings();

    // 2. Try loading from Cloud if logged in
    if (!userId || this.isGuest(userId)) {
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
    try {
      await SupabaseService.deleteSession(sessionId);
    } catch (e) {
      console.warn('Cloud deleteSession failed:', e);
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
    try {
      await SupabaseService.saveBookmark(userId, bookmark);
    } catch (e) {
      console.warn('Cloud saveBookmark failed:', e);
    }
  }

  static async deleteBookmark(userId: string, bookmarkId: string, settings: UserSettings): Promise<void> {
    await LocalDatabaseService.deleteBookmark(bookmarkId);
    if (!userId || this.isGuest(userId)) return;
    try {
      await SupabaseService.deleteBookmark(userId, bookmarkId);
    } catch (e) {
      console.warn('Cloud deleteBookmark failed:', e);
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

