import Dexie, { Table } from 'dexie';
import { ChatSession, Bookmark, UserSettings } from '../types';

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  surahNumber?: number;
  ayahNumber?: number;
  createdAt: number;
  updatedAt: number;
}

export interface LocalTasbihItem {
  id: string;
  name: string;
  count: number;
  target: number;
  totalRounds: number;
  updatedAt: number;
}

export interface LocalCacheEntry {
  key: string;
  value: any;
  updatedAt: number;
  expiresAt?: number;
}

/**
 * Anis Al-Qulub Local IndexedDB database powered by Dexie.js
 * Provides robust Offline-First local database capabilities for PWA & APK.
 */
export class AnisLocalDatabase extends Dexie {
  sessions!: Table<ChatSession, string>;
  bookmarks!: Table<Bookmark, string>;
  userSettings!: Table<LocalCacheEntry, string>;
  notes!: Table<LocalNote, string>;
  tasbih!: Table<LocalTasbihItem, string>;
  offlineCache!: Table<LocalCacheEntry, string>;

  constructor() {
    super('AnisAlQulubLocalDB');
    this.version(1).stores({
      sessions: 'id, title, createdAt, updatedAt',
      bookmarks: 'id, surahNumber, ayahNumber, createdAt',
      userSettings: 'key, updatedAt',
      notes: 'id, surahNumber, ayahNumber, createdAt, updatedAt',
      tasbih: 'id, updatedAt',
      offlineCache: 'key, updatedAt, expiresAt'
    });
  }
}

export const localDb = new AnisLocalDatabase();

/**
 * High-level helper service for local database operations with automatic fallback
 */
export class LocalDatabaseService {
  private static isInitialized = false;

  /**
   * Initializes the database and migrates any legacy localStorage records seamlessly
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await localDb.open();
      await this.migrateLegacyLocalStorage();
      this.isInitialized = true;
    } catch (err) {
      console.warn('IndexedDB / Dexie initialization fallback to memory/localStorage:', err);
    }
  }

  /**
   * Migrate existing localStorage records to IndexedDB without data loss
   */
  private static async migrateLegacyLocalStorage(): Promise<void> {
    try {
      // 1. Migrate Chat Sessions
      const rawHistory = localStorage.getItem('anis_history');
      if (rawHistory) {
        const sessions: ChatSession[] = JSON.parse(rawHistory);
        if (Array.isArray(sessions) && sessions.length > 0) {
          const count = await localDb.sessions.count();
          if (count === 0) {
            await localDb.sessions.bulkPut(sessions);
          }
        }
      }

      // 2. Migrate Bookmarks
      const rawSettings = localStorage.getItem('anis_user_settings');
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings && Array.isArray(settings.bookmarks) && settings.bookmarks.length > 0) {
          const bookmarkCount = await localDb.bookmarks.count();
          if (bookmarkCount === 0) {
            await localDb.bookmarks.bulkPut(settings.bookmarks);
          }
        }
        // Save settings cache
        await localDb.userSettings.put({
          key: 'main_settings',
          value: settings,
          updatedAt: Date.now()
        });
      }
    } catch (e) {
      console.warn('Legacy migration notice:', e);
    }
  }

  // --- SESSIONS ---
  public static async getAllSessions(): Promise<ChatSession[]> {
    try {
      await this.init();
      const sessions = await localDb.sessions.toArray();
      if (sessions && sessions.length > 0) {
        return sessions.sort((a, b) => {
          const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : (typeof a.date === 'number' ? a.date : 0);
          const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : (typeof b.date === 'number' ? b.date : 0);
          return timeB - timeA;
        });
      }

      // Fallback to localStorage
      const fallback = localStorage.getItem('anis_history');
      return fallback ? JSON.parse(fallback) : [];
    } catch (e) {
      console.warn('Error reading sessions from IndexedDB:', e);
      const fallback = localStorage.getItem('anis_history');
      return fallback ? JSON.parse(fallback) : [];
    }
  }

  public static async saveSession(session: ChatSession): Promise<void> {
    const sessionWithTimestamps: ChatSession = {
      ...session,
      createdAt: session.createdAt || (typeof session.date === 'number' ? session.date : Date.now()),
      updatedAt: session.updatedAt || (typeof session.date === 'number' ? session.date : Date.now())
    };

    try {
      await this.init();
      await localDb.sessions.put(sessionWithTimestamps);
    } catch (e) {
      console.warn('IndexedDB saveSession error:', e);
    }

    // Always mirror to localStorage for redundancy
    try {
      const current = await this.getAllSessions();
      const existingIdx = current.findIndex(s => s.id === session.id);
      let updated: ChatSession[];
      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = sessionWithTimestamps;
      } else {
        updated = [sessionWithTimestamps, ...current];
      }
      localStorage.setItem('anis_history', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage backup error:', err);
    }
  }

  public static async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.init();
      await localDb.sessions.delete(sessionId);
    } catch (e) {
      console.warn('IndexedDB deleteSession error:', e);
    }

    try {
      const fallback = localStorage.getItem('anis_history');
      if (fallback) {
        const list: ChatSession[] = JSON.parse(fallback);
        const filtered = list.filter(s => s.id !== sessionId);
        localStorage.setItem('anis_history', JSON.stringify(filtered));
      }
    } catch (e) {}
  }

  public static async clearAllSessions(): Promise<void> {
    try {
      await this.init();
      await localDb.sessions.clear();
    } catch (e) {
      console.warn('IndexedDB clearAllSessions error:', e);
    }
    localStorage.removeItem('anis_history');
  }

  // --- BOOKMARKS ---
  public static async getAllBookmarks(): Promise<Bookmark[]> {
    try {
      await this.init();
      return await localDb.bookmarks.orderBy('createdAt').reverse().toArray();
    } catch (e) {
      console.warn('IndexedDB getAllBookmarks error:', e);
      return [];
    }
  }

  public static async saveBookmark(bookmark: Bookmark): Promise<void> {
    try {
      await this.init();
      await localDb.bookmarks.put(bookmark);
    } catch (e) {
      console.warn('IndexedDB saveBookmark error:', e);
    }
  }

  public static async deleteBookmark(bookmarkId: string): Promise<void> {
    try {
      await this.init();
      await localDb.bookmarks.delete(bookmarkId);
    } catch (e) {
      console.warn('IndexedDB deleteBookmark error:', e);
    }
  }

  // --- SETTINGS CACHE ---
  public static async getLocalSettings(): Promise<Partial<UserSettings> | null> {
    try {
      await this.init();
      const entry = await localDb.userSettings.get('main_settings');
      if (entry && entry.value) {
        return entry.value;
      }
    } catch (e) {
      console.warn('IndexedDB getLocalSettings error:', e);
    }

    try {
      const saved = localStorage.getItem('anis_user_settings');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  public static async saveLocalSettings(settings: UserSettings): Promise<void> {
    try {
      await this.init();
      await localDb.userSettings.put({
        key: 'main_settings',
        value: settings,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('IndexedDB saveLocalSettings error:', e);
    }

    try {
      localStorage.setItem('anis_user_settings', JSON.stringify(settings));
    } catch (e) {}
  }

  // --- GENERIC OFFLINE KEY-VALUE CACHE ---
  public static async setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      await this.init();
      const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
      await localDb.offlineCache.put({
        key,
        value,
        updatedAt: Date.now(),
        expiresAt
      });
    } catch (e) {
      console.warn('IndexedDB setCache error:', e);
    }
  }

  public static async getCache<T>(key: string): Promise<T | null> {
    try {
      await this.init();
      const item = await localDb.offlineCache.get(key);
      if (!item) return null;
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await localDb.offlineCache.delete(key);
        return null;
      }
      return item.value as T;
    } catch (e) {
      console.warn('IndexedDB getCache error:', e);
      return null;
    }
  }
}
