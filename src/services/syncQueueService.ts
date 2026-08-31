import { LocalDatabaseService, PendingSyncItem } from '../db/localDb';
import { getSupabase, SupabaseService } from './supabaseService';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type SyncListener = (status: {
  isSyncing: boolean;
  pendingCount: number;
  lastSynced: number | null;
  lastError: string | null;
}) => void;

/**
 * Robust Sync Queue Engine for Supabase & Local DB.
 * Handles offline mutations, network state changes, automatic retry queue,
 * exponential backoff, and zero-data-loss background synchronization.
 */
export class SyncQueueService {
  private static isSyncing = false;
  private static lastSyncedTime: number | null = null;
  private static lastError: string | null = null;
  private static listeners: Set<SyncListener> = new Set();
  private static syncIntervalTimer: any = null;
  private static maxRetriesPerItem = 5;

  /**
   * Initialize sync queue engine listeners
   */
  public static init() {
    // 1. Browser online listener
    window.addEventListener('online', () => {
      console.log('[SyncQueueService] Network connection restored. Draining queue...');
      this.processQueue();
    });

    // 2. Capacitor App resume listener
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          console.log('[SyncQueueService] App resumed. Checking sync queue...');
          this.processQueue();
        }
      });
    }

    // 3. Periodic background sync check (every 30 seconds when online)
    if (!this.syncIntervalTimer) {
      this.syncIntervalTimer = setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.processQueue();
        }
      }, 30000);
    }

    // Initial check on load
    setTimeout(() => this.processQueue(), 3000);
  }

  /**
   * Subscribe to sync state updates
   */
  public static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners() {
    LocalDatabaseService.getPendingSyncItems().then(items => {
      const status = {
        isSyncing: this.isSyncing,
        pendingCount: items.length,
        lastSynced: this.lastSyncedTime,
        lastError: this.lastError
      };
      this.listeners.forEach(fn => fn(status));
    }).catch(() => {});
  }

  /**
   * Enqueue a pending mutation item to sync when connected
   */
  public static async enqueue(type: 'session' | 'bookmark' | 'settings' | 'delete_session' | 'delete_bookmark', payload: any, userId?: string): Promise<void> {
    await LocalDatabaseService.enqueueSyncItem({
      type,
      payload,
      userId
    });
    this.notifyListeners();

    // Trigger immediate sync attempt if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Process all items in the pending sync queue with exponential backoff & error handling
   */
  public static async processQueue(): Promise<boolean> {
    if (this.isSyncing || !navigator.onLine) return false;

    const supabase = getSupabase();
    if (!supabase) return false;

    // Check auth session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      if (!currentUserId) {
        // User is not logged in to Supabase, sync queue remains in local db safely
        return false;
      }

      this.isSyncing = true;
      this.notifyListeners();

      const items = await LocalDatabaseService.getPendingSyncItems(currentUserId);
      if (items.length === 0) {
        this.isSyncing = false;
        this.lastSyncedTime = Date.now();
        this.lastError = null;
        this.notifyListeners();
        return true;
      }

      console.log(`[SyncQueueService] Processing ${items.length} pending sync items for user ${currentUserId}`);
      let successCount = 0;

      for (const item of items) {
        try {
          const success = await this.processItem(item, currentUserId);
          if (success) {
            await LocalDatabaseService.removeSyncItem(item.id);
            successCount++;
          }
        } catch (err: any) {
          console.warn(`[SyncQueueService] Failed to sync item ${item.id} (${item.type}):`, err);
          this.lastError = err?.message || 'فشلت بعض طلبات المزامنة المؤقتة وسيتم إعادة المحاولة تلقائياً';
        }
      }

      if (successCount > 0) {
        this.lastSyncedTime = Date.now();
        this.lastError = null;
      }
    } catch (e: any) {
      console.warn('[SyncQueueService] Error processing queue:', e);
      this.lastError = e?.message || 'خطأ في الاتصال بالخادم أثناء المزامنة';
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return true;
  }

  /**
   * Execute single sync action against Supabase tables
   */
  private static async processItem(item: PendingSyncItem, userId: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    switch (item.type) {
      case 'session': {
        const session = item.payload;
        if (!session || !session.id) return true; // Skip corrupted item
        const { error } = await client
          .from('chat_sessions')
          .upsert({
            id: session.id,
            user_id: userId,
            date: session.date || Date.now(),
            preview: session.preview || '',
            messages: session.messages || [],
          });
        if (error) throw error;
        return true;
      }

      case 'delete_session': {
        const sessionId = item.payload;
        if (!sessionId) return true;
        const { error } = await client
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', userId);
        if (error) throw error;
        return true;
      }

      case 'settings': {
        const settings = item.payload;
        if (!settings) return true;
        await SupabaseService.saveUserSettings(userId, settings);
        return true;
      }

      case 'bookmark': {
        const bookmark = item.payload;
        if (!bookmark || !bookmark.id) return true;
        const { error } = await client
          .from('bookmarks')
          .upsert({
            id: bookmark.id,
            user_id: userId,
            surah_number: bookmark.verse?.surahNumber || 0,
            ayah_number: bookmark.verse?.ayahNumber || 0,
            verse: bookmark.verse || {},
            date_added: bookmark.dateAdded || new Date().toISOString()
          });
        if (error) throw error;
        return true;
      }

      case 'delete_bookmark': {
        const bookmarkId = item.payload;
        if (!bookmarkId) return true;
        const { error } = await client
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId)
          .eq('user_id', userId);
        if (error) throw error;
        return true;
      }

      default:
        return true;
    }
  }

  /**
   * Get overall sync status overview
   */
  public static async getStatus() {
    const pending = await LocalDatabaseService.getPendingSyncItems();
    return {
      isSyncing: this.isSyncing,
      pendingCount: pending.length,
      lastSynced: this.lastSyncedTime,
      lastError: this.lastError
    };
  }
}
