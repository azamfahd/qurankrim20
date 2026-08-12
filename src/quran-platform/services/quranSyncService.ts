import { getSupabase } from '../../services/supabaseService';

export class QuranSyncService {
  /**
   * Check if user is currently logged in via Supabase Auth
   */
  static async isUserLoggedIn(): Promise<boolean> {
    try {
      const client = getSupabase();
      if (!client) return false;
      const { data: { user } } = await client.auth.getUser();
      return !!user;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the logged-in user's email/username if available
   */
  static async getUserProfile(): Promise<{ email: string; name: string } | null> {
    try {
      const client = getSupabase();
      if (!client) return null;
      const { data: { user } } = await client.auth.getUser();
      if (!user) return null;
      return {
        email: user.email || '',
        name: user.user_metadata?.username || user.email?.split('@')[0] || 'مستخدم أنيس'
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Push local Quran platform data (bookmarks, highlights, notes, stats, plans) to the Supabase Cloud.
   * Leverages the JSON 'location' column in the 'user_settings' table for seamless schema compatibility.
   */
  static async pushToCloud(): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return false;

      // 1. Gather all local storage keys
      const bookmarks = localStorage.getItem('quran_bookmarks') || '[]';
      const highlights = localStorage.getItem('quran_highlights') || '{}';
      const notes = localStorage.getItem('quran_notes') || '{}';
      const stats = localStorage.getItem('quran_stats') || '{}';
      const plans = localStorage.getItem('quran_memorize_plans') || '{}';

      const quranSyncData = {
        bookmarks,
        highlights,
        notes,
        stats,
        plans,
        syncedAt: new Date().toISOString()
      };

      // 2. Fetch existing settings row to not overwrite other location fields
      const { data: currentSettings } = await client
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let locationData: any = {};
      if (currentSettings && currentSettings.location) {
        locationData = typeof currentSettings.location === 'string'
          ? JSON.parse(currentSettings.location)
          : currentSettings.location;
      }

      // Attach quranSyncData to location
      locationData.quranSyncData = quranSyncData;

      // 3. Upsert settings row
      const { error } = await client
        .from('user_settings')
        .upsert({
          user_id: user.id,
          username: currentSettings?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'مستخدم',
          email: currentSettings?.email || user.email,
          location: locationData,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Failed to push Quran data to cloud:', e);
      return false;
    }
  }

  /**
   * Pull and merge Quran platform data from Supabase Cloud into browser local storage.
   */
  static async pullFromCloud(): Promise<{ success: boolean; dataMerged: boolean }> {
    const client = getSupabase();
    if (!client) return { success: false, dataMerged: false };

    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return { success: false, dataMerged: false };

      const { data: currentSettings, error } = await client
        .from('user_settings')
        .select('location')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!currentSettings || !currentSettings.location) {
        return { success: true, dataMerged: false };
      }

      const locationData = typeof currentSettings.location === 'string'
        ? JSON.parse(currentSettings.location)
        : currentSettings.location;

      const quranSyncData = locationData?.quranSyncData;
      if (!quranSyncData) {
        return { success: true, dataMerged: false };
      }

      // Merge or overwrite local storage intelligently

      // 1. Bookmarks merge
      if (quranSyncData.bookmarks) {
        const cloudBookmarks = JSON.parse(quranSyncData.bookmarks);
        const localBookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        const mergedBookmarks = [...localBookmarks];
        
        cloudBookmarks.forEach((cb: any) => {
          const exists = mergedBookmarks.some((lb: any) => 
            (lb.id && cb.id && lb.id === cb.id) || 
            (lb.surah === cb.surah && lb.ayah === cb.ayah) ||
            (lb.verse && cb.verse && lb.verse.number === cb.verse.number)
          );
          if (!exists) {
            mergedBookmarks.push(cb);
          }
        });
        localStorage.setItem('quran_bookmarks', JSON.stringify(mergedBookmarks));
      }

      // 2. Highlights merge (merge object keys)
      if (quranSyncData.highlights) {
        const cloudHighlights = JSON.parse(quranSyncData.highlights);
        const localHighlights = JSON.parse(localStorage.getItem('quran_highlights') || '{}');
        const mergedHighlights = { ...localHighlights, ...cloudHighlights };
        localStorage.setItem('quran_highlights', JSON.stringify(mergedHighlights));
      }

      // 3. Notes merge (merge object keys)
      if (quranSyncData.notes) {
        const cloudNotes = JSON.parse(quranSyncData.notes);
        const localNotes = JSON.parse(localStorage.getItem('quran_notes') || '{}');
        const mergedNotes = { ...localNotes, ...cloudNotes };
        localStorage.setItem('quran_notes', JSON.stringify(mergedNotes));
      }

      // 4. Stats merge (take maximum/highest stats to avoid losing progress)
      if (quranSyncData.stats) {
        const cloudStats = JSON.parse(quranSyncData.stats);
        const localStats = JSON.parse(localStorage.getItem('quran_stats') || '{"readAyahs":0,"readMinutes":0,"streakDays":0,"khatmas":0,"memorizedAyahs":0}');
        
        const mergedStats = {
          readAyahs: Math.max(localStats.readAyahs || 0, cloudStats.readAyahs || 0),
          readMinutes: Math.max(localStats.readMinutes || 0, cloudStats.readMinutes || 0),
          streakDays: Math.max(localStats.streakDays || 0, cloudStats.streakDays || 0),
          khatmas: Math.max(localStats.khatmas || 0, cloudStats.khatmas || 0),
          memorizedAyahs: Math.max(localStats.memorizedAyahs || 0, cloudStats.memorizedAyahs || 0),
          lastReadDate: localStats.lastReadDate || cloudStats.lastReadDate
        };
        localStorage.setItem('quran_stats', JSON.stringify(mergedStats));
      }

      // 5. Memorize plans merge
      if (quranSyncData.plans) {
        const cloudPlans = JSON.parse(quranSyncData.plans);
        const localPlans = JSON.parse(localStorage.getItem('quran_memorize_plans') || '{}');
        const mergedPlans = { ...localPlans, ...cloudPlans };
        localStorage.setItem('quran_memorize_plans', JSON.stringify(mergedPlans));
      }

      return { success: true, dataMerged: true };
    } catch (e) {
      console.error('Failed to pull Quran data from cloud:', e);
      return { success: false, dataMerged: false };
    }
  }
}
