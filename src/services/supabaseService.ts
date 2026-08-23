import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ChatSession, UserSettings, Bookmark } from '../types';

// Use directly from import.meta.env for Vite production compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Lazy initialization of Supabase client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  // Check for availability
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    return null;
  }

  if (!supabaseInstance) {
    try {
      // Validate URL format before creating client
      const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      supabaseInstance = createClient(finalUrl, supabaseAnonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
};

// Exporting for backward compatibility
export const supabase = getSupabase();

export class SupabaseService {
  private static TABLE_SESSIONS = 'chat_sessions';
  private static TABLE_SETTINGS = 'user_settings';
  private static TABLE_BOOKMARKS = 'bookmarks';

  private static logError(context: string, error: any) {
    if (!error) return;
    const errMsg = error.message || String(error);
    const errCode = error.code || '';
    
    // PGRST116 is a "no rows returned" response for .single(), which is not an error we need to warn about
    if (errCode === 'PGRST116') return;

    if (
      errCode === '42P01' || 
      errMsg.includes('does not exist') || 
      errMsg.includes('JWT') ||
      errMsg.includes('API key') ||
      errMsg.includes('network') ||
      errMsg.includes('fetch')
    ) {
      console.warn(`[Supabase Safe Check] ${context} (This is normal if tables/auth are not yet configured in Supabase):`, errMsg);
    } else {
      console.warn(`[Supabase Service Warning] ${context}:`, error);
    }
  }

  static async signInWithGoogle() {
    const client = getSupabase();
    if (!client) throw new Error("Supabase client not initialized");
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const client = getSupabase();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  static onAuthStateChange(callback: (user: any) => void) {
    const client = getSupabase();
    if (!client) {
      // Trigger callback with null asynchronously to let guest mode load
      setTimeout(() => callback(null), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return client.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }

  static async saveSessions(userId: string, sessions: ChatSession[]): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      for (const session of sessions) {
        await client
          .from(this.TABLE_SESSIONS)
          .upsert({
            id: session.id,
            user_id: userId,
            date: session.date,
            preview: session.preview,
            messages: session.messages, // Pass object directly for JSONB compatibility
          });
      }
    } catch (error) {
      this.logError('saveSessions', error);
    }
  }

  static async loadSessions(userId: string): Promise<ChatSession[] | null> {
    if (!userId) return null;
    const client = getSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from(this.TABLE_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        date: item.date,
        preview: item.preview,
        messages: typeof item.messages === 'string' ? JSON.parse(item.messages) : item.messages,
      }));
    } catch (error) {
      this.logError('loadSessions', error);
      return null;
    }
  }

  static async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      const locationData = settings.location ? { ...settings.location } as any : {};
      if (settings.analysisStyle) {
        locationData.analysisStyle = settings.analysisStyle;
      }

      await client
        .from(this.TABLE_SETTINGS)
        .upsert({
          user_id: userId,
          username: settings.username,
          email: settings.email,
          model: settings.model,
          creativity_level: settings.creativityLevel,
          reciter: settings.reciter,
          api_key: settings.apiKey,
          bookmarks: settings.bookmarks || [],
          location: Object.keys(locationData).length > 0 ? locationData : null,
          last_updated: settings.lastUpdated || new Date().toISOString()
        });
    } catch (error) {
      this.logError('saveUserSettings', error);
    }
  }

  static async loadUserSettings(userId: string): Promise<Partial<UserSettings> | null> {
    if (!userId) return null;
    const client = getSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from(this.TABLE_SETTINGS)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;

      const locationObj = typeof data.location === 'string' ? JSON.parse(data.location) : (data.location || undefined);
      let analysisStyle = 'smart_adaptive';
      let realLocation = locationObj;

      if (locationObj && typeof locationObj === 'object' && 'analysisStyle' in locationObj) {
        analysisStyle = locationObj.analysisStyle;
        const { analysisStyle: _, ...rest } = locationObj;
        realLocation = Object.keys(rest).length > 0 ? rest : undefined;
      }

      return {
        username: data.username,
        email: data.email,
        model: data.model,
        creativityLevel: data.creativity_level,
        reciter: data.reciter || 'ar.faresabbad',
        apiKey: data.api_key,
        bookmarks: typeof data.bookmarks === 'string' ? JSON.parse(data.bookmarks) : (data.bookmarks || []),
        location: realLocation,
        analysisStyle: analysisStyle,
        lastUpdated: data.last_updated
      };
    } catch (error) {
      this.logError('loadUserSettings', error);
      return null;
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const client = getSupabase();
    if (!client) return;

    try {
      await client
        .from(this.TABLE_SESSIONS)
        .delete()
        .eq('id', sessionId);
    } catch (error) {
      this.logError('deleteSession', error);
    }
  }

  static async clearAllSessions(userId: string): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      await client
        .from(this.TABLE_SESSIONS)
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      this.logError('clearAllSessions', error);
    }
  }

  static async saveBookmark(userId: string, bookmark: Bookmark): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      await client
        .from(this.TABLE_BOOKMARKS)
        .upsert({
          id: bookmark.id,
          user_id: userId,
          verse: bookmark.verse,
          date_added: bookmark.dateAdded,
        });
    } catch (error) {
      this.logError('saveBookmark', error);
    }
  }

  static async getBookmarks(userId: string): Promise<Bookmark[]> {
    if (!userId) return [];
    const client = getSupabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from(this.TABLE_BOOKMARKS)
        .select('*')
        .eq('user_id', userId)
        .order('date_added', { ascending: false });

      if (error) throw error;

      return data.map(item => {
        let parsedVerse = item.verse;
        if (typeof item.verse === 'string') {
          try {
            parsedVerse = JSON.parse(item.verse);
          } catch (e) {
            console.error('Error parsing verse JSON:', e);
          }
        }
        
        return {
          id: item.id,
          verse: parsedVerse,
          dateAdded: item.date_added,
        };
      });
    } catch (error) {
      this.logError('getBookmarks', error);
      return [];
    }
  }

  static async deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      await client
        .from(this.TABLE_BOOKMARKS)
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', userId);
    } catch (error) {
      this.logError('deleteBookmark', error);
    }
  }

  static async migrateLocalGuestData(realUserId: string, localSessions: ChatSession[], localSettings: UserSettings): Promise<void> {
    if (!realUserId) return;

    const client = getSupabase();
    if (!client) return;

    try {
      // 1. Check if the logged-in user already has settings in Supabase
      const { data: existingSettings, error: err } = await client
        .from(this.TABLE_SETTINGS)
        .select('*')
        .eq('user_id', realUserId)
        .single();

      // If user doesn't have settings, we save the migrated settings
      if (err || !existingSettings) {
        await this.saveUserSettings(realUserId, {
          ...localSettings,
          username: localSettings.username === 'زائر مؤقت' ? 'مستخدم جديد' : localSettings.username,
          lastUpdated: new Date().toISOString()
        });
      } else if (localSettings.apiKey && !existingSettings.api_key) {
        // If logged-in user exists in DB but has no API key in DB, migrate the local custom API key
        await this.saveUserSettings(realUserId, {
          ...existingSettings,
          api_key: localSettings.apiKey,
          apiKey: localSettings.apiKey,
          lastUpdated: new Date().toISOString()
        });
      }

      // 2. Upload any local guest sessions to Supabase
      if (localSessions && localSessions.length > 0) {
        await this.saveSessions(realUserId, localSessions);
      }

      // 3. Upload any local bookmarks to Supabase
      if (localSettings.bookmarks && localSettings.bookmarks.length > 0) {
        for (const b of localSettings.bookmarks) {
          await this.saveBookmark(realUserId, b);
        }
      }
    } catch (error) {
      this.logError('migrateLocalGuestData', error);
    }
  }

  static async registerUser(userId: string, metadata: any, settings: UserSettings): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      const locationData = settings.location ? { ...settings.location } as any : {};
      if (settings.analysisStyle) {
        locationData.analysisStyle = settings.analysisStyle;
      }

      await client
        .from(this.TABLE_SETTINGS)
        .upsert({
          user_id: userId,
          username: settings.username || 'Guest',
          email: settings.email || '',
          model: settings.model || 'gemini-3.5-flash',
          creativity_level: settings.creativityLevel ?? 0.5,
          reciter: settings.reciter || 'ar.faresabbad',
          api_key: settings.apiKey || null,
          bookmarks: settings.bookmarks || [],
          location: Object.keys(locationData).length > 0 ? locationData : null,
          last_active: metadata.lastActive,
          user_agent: metadata.userAgent,
          language: metadata.language,
          is_installed: metadata.isInstalled,
          platform: metadata.platform,
          last_updated: new Date().toISOString()
        });
    } catch (error) {
      this.logError('registerUser', error);
    }
  }

  static async updateUserInstallStatus(userId: string, isInstalled: boolean): Promise<void> {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;

    try {
      await client
        .from(this.TABLE_SETTINGS)
        .update({
          is_installed: isInstalled,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      this.logError('updateUserInstallStatus', error);
    }
  }
}
