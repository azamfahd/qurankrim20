import Dexie, { Table } from 'dexie';
import { ChatSession, Bookmark, UserSettings } from '../types';
import { Capacitor } from '@capacitor/core';

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

export interface PendingSyncItem {
  id: string;
  type: 'session' | 'bookmark' | 'settings' | 'delete_session' | 'delete_bookmark';
  payload: any;
  timestamp: number;
  userId?: string;
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
  syncQueue!: Table<PendingSyncItem, string>;

  constructor() {
    super('AnisAlQulubLocalDB');
    this.version(2).stores({
      sessions: 'id, title, createdAt, updatedAt',
      bookmarks: 'id, surahNumber, ayahNumber, createdAt',
      userSettings: 'key, updatedAt',
      notes: 'id, surahNumber, ayahNumber, createdAt, updatedAt',
      tasbih: 'id, updatedAt',
      offlineCache: 'key, updatedAt, expiresAt',
      syncQueue: 'id, type, timestamp, userId'
    });
  }
}

export const localDb = new AnisLocalDatabase();

/**
 * SQLite Local Bridge for native Capacitor APK environment
 * Uses native SQLite storage when available with automatic schema creation
 */
class SQLiteNativeBridge {
  private static db: any = null;
  private static isReady = false;

  public static async getDB(): Promise<any | null> {
    if (this.isReady && this.db) return this.db;

    if (Capacitor.isNativePlatform()) {
      try {
        const win = window as any;
        const sqlitePlugin = win.sqlitePlugin || win.SQLite;
        if (sqlitePlugin && typeof sqlitePlugin.openDatabase === 'function') {
          this.db = sqlitePlugin.openDatabase({
            name: 'anis_al_qulub.db',
            location: 'default',
            androidDatabaseProvider: 'system'
          });
          await this.initTables();
          this.isReady = true;
          return this.db;
        }
      } catch (e) {
        console.warn('Native SQLite openDatabase fallback to Dexie/IndexedDB:', e);
      }
    }
    return null;
  }

  private static async initTables(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            date INTEGER,
            preview TEXT,
            messages TEXT,
            created_at INTEGER,
            updated_at INTEGER
          )`
        );
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            surah_number INTEGER,
            ayah_number INTEGER,
            verse TEXT,
            date_added TEXT,
            created_at INTEGER
          )`
        );
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS user_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at INTEGER
          )`
        );
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            type TEXT,
            payload TEXT,
            timestamp INTEGER,
            user_id TEXT
          )`
        );
      }, (err: any) => {
        console.warn('SQLite init tables error:', err);
        resolve();
      }, () => {
        resolve();
      });
    });
  }

  public static async executeSql(query: string, params: any[] = []): Promise<any> {
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(query, params, (_: any, result: any) => {
          resolve(result);
        }, (_: any, err: any) => {
          console.warn('SQLite query error:', query, err);
          reject(err);
        });
      });
    });
  }
}

/**
 * High-level helper service for local database operations with automatic fallback,
 * SQLite native acceleration, and offline sync queue capabilities.
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
      await SQLiteNativeBridge.getDB();
      await this.migrateLegacyLocalStorage();
      this.isInitialized = true;
    } catch (err) {
      console.warn('IndexedDB / Dexie initialization fallback to memory/localStorage:', err);
      this.isInitialized = true;
    }
  }

  /**
   * Migrate existing localStorage records to IndexedDB/SQLite without data loss
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

      // Attempt native SQLite first if available
      try {
        const nativeResult = await SQLiteNativeBridge.executeSql(
          'SELECT * FROM sessions ORDER BY updated_at DESC'
        );
        if (nativeResult && nativeResult.rows && nativeResult.rows.length > 0) {
          const items: ChatSession[] = [];
          for (let i = 0; i < nativeResult.rows.length; i++) {
            const row = nativeResult.rows.item(i);
            items.push({
              id: row.id,
              date: row.date,
              preview: row.preview,
              messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
          if (items.length > 0) return items;
        }
      } catch (sqLiteErr) {
        // Fallback to IndexedDB
      }

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
      console.warn('Error reading sessions from local database:', e);
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

      // Mirror to SQLite if available
      try {
        await SQLiteNativeBridge.executeSql(
          'INSERT OR REPLACE INTO sessions (id, date, preview, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            sessionWithTimestamps.id,
            sessionWithTimestamps.date || Date.now(),
            sessionWithTimestamps.preview || '',
            JSON.stringify(sessionWithTimestamps.messages || []),
            sessionWithTimestamps.createdAt,
            sessionWithTimestamps.updatedAt
          ]
        );
      } catch (e) {}
    } catch (e) {
      console.warn('Local saveSession error:', e);
    }

    // Always mirror to localStorage for extra redundancy
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

      try {
        await SQLiteNativeBridge.executeSql('DELETE FROM sessions WHERE id = ?', [sessionId]);
      } catch (e) {}
    } catch (e) {
      console.warn('Local deleteSession error:', e);
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

      try {
        await SQLiteNativeBridge.executeSql('DELETE FROM sessions');
      } catch (e) {}
    } catch (e) {
      console.warn('Local clearAllSessions error:', e);
    }
    localStorage.removeItem('anis_history');
  }

  // --- BOOKMARKS ---
  public static async getAllBookmarks(): Promise<Bookmark[]> {
    try {
      await this.init();

      // Native SQLite check
      try {
        const res = await SQLiteNativeBridge.executeSql(
          'SELECT * FROM bookmarks ORDER BY created_at DESC'
        );
        if (res && res.rows && res.rows.length > 0) {
          const bms: Bookmark[] = [];
          for (let i = 0; i < res.rows.length; i++) {
            const row = res.rows.item(i);
            bms.push({
              id: row.id,
              verse: typeof row.verse === 'string' ? JSON.parse(row.verse) : row.verse,
              dateAdded: row.date_added
            });
          }
          if (bms.length > 0) return bms;
        }
      } catch (e) {}

      return await localDb.bookmarks.orderBy('createdAt').reverse().toArray();
    } catch (e) {
      console.warn('Local getAllBookmarks error:', e);
      return [];
    }
  }

  public static async saveBookmark(bookmark: Bookmark): Promise<void> {
    try {
      await this.init();
      await localDb.bookmarks.put(bookmark);

      try {
        await SQLiteNativeBridge.executeSql(
          'INSERT OR REPLACE INTO bookmarks (id, surah_number, ayah_number, verse, date_added, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            bookmark.id,
            bookmark.verse?.surahNumber || 0,
            bookmark.verse?.ayahNumber || 0,
            JSON.stringify(bookmark.verse || {}),
            bookmark.dateAdded || new Date().toISOString(),
            Date.now()
          ]
        );
      } catch (e) {}
    } catch (e) {
      console.warn('Local saveBookmark error:', e);
    }
  }

  public static async deleteBookmark(bookmarkId: string): Promise<void> {
    try {
      await this.init();
      await localDb.bookmarks.delete(bookmarkId);

      try {
        await SQLiteNativeBridge.executeSql('DELETE FROM bookmarks WHERE id = ?', [bookmarkId]);
      } catch (e) {}
    } catch (e) {
      console.warn('Local deleteBookmark error:', e);
    }
  }

  // --- SETTINGS CACHE ---
  public static async getLocalSettings(): Promise<Partial<UserSettings> | null> {
    try {
      await this.init();

      try {
        const res = await SQLiteNativeBridge.executeSql(
          'SELECT value FROM user_settings WHERE key = ?',
          ['main_settings']
        );
        if (res && res.rows && res.rows.length > 0) {
          const val = res.rows.item(0).value;
          if (val) return JSON.parse(val);
        }
      } catch (e) {}

      const entry = await localDb.userSettings.get('main_settings');
      if (entry && entry.value) {
        return entry.value;
      }
    } catch (e) {
      console.warn('Local getLocalSettings error:', e);
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

      try {
        await SQLiteNativeBridge.executeSql(
          'INSERT OR REPLACE INTO user_settings (key, value, updated_at) VALUES (?, ?, ?)',
          ['main_settings', JSON.stringify(settings), Date.now()]
        );
      } catch (e) {}
    } catch (e) {
      console.warn('Local saveLocalSettings error:', e);
    }

    try {
      localStorage.setItem('anis_user_settings', JSON.stringify(settings));
    } catch (e) {}
  }

  // --- SYNC QUEUE FOR OFFLINE MUTATIONS ---
  public static async enqueueSyncItem(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.init();
      const fullItem: PendingSyncItem = {
        ...item,
        id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now()
      };
      await localDb.syncQueue.put(fullItem);

      try {
        await SQLiteNativeBridge.executeSql(
          'INSERT OR REPLACE INTO sync_queue (id, type, payload, timestamp, user_id) VALUES (?, ?, ?, ?, ?)',
          [fullItem.id, fullItem.type, JSON.stringify(fullItem.payload), fullItem.timestamp, fullItem.userId || '']
        );
      } catch (e) {}
    } catch (e) {
      console.warn('enqueueSyncItem error:', e);
    }
  }

  public static async getPendingSyncItems(userId?: string): Promise<PendingSyncItem[]> {
    try {
      await this.init();
      const items = await localDb.syncQueue.toArray();
      if (userId) {
        return items.filter(i => !i.userId || i.userId === userId);
      }
      return items;
    } catch (e) {
      console.warn('getPendingSyncItems error:', e);
      return [];
    }
  }

  public static async removeSyncItem(id: string): Promise<void> {
    try {
      await this.init();
      await localDb.syncQueue.delete(id);

      try {
        await SQLiteNativeBridge.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
      } catch (e) {}
    } catch (e) {
      console.warn('removeSyncItem error:', e);
    }
  }

  public static async clearSyncQueue(): Promise<void> {
    try {
      await this.init();
      await localDb.syncQueue.clear();

      try {
        await SQLiteNativeBridge.executeSql('DELETE FROM sync_queue');
      } catch (e) {}
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
      console.warn('Local setCache error:', e);
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
      console.warn('Local getCache error:', e);
      return null;
    }
  }
}
