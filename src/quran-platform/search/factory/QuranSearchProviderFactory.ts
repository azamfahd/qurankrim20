/**
 * Quran Search Provider Factory
 * Implements the Factory Pattern to determine the appropriate search provider.
 * Automatically selects IndexedDBQuranSearchProvider for PWA and
 * SQLiteQuranSearchProvider for native APK runtime.
 */

import { IQuranSearchProvider } from '../types';
import { IndexedDBQuranSearchProvider } from '../providers/IndexedDBQuranSearchProvider';
import { SQLiteQuranSearchProvider } from '../providers/SQLiteQuranSearchProvider';

export type SearchEnvironment = 'PWA' | 'APK';

export class QuranSearchProviderFactory {
  private static indexedDBInstance: IndexedDBQuranSearchProvider | null = null;
  private static sqliteInstance: SQLiteQuranSearchProvider | null = null;
  private static envOverride: SearchEnvironment | null = null;

  /**
   * Set manual environment override for testing or environment switching
   */
  static setEnvironmentOverride(env: SearchEnvironment | null) {
    this.envOverride = env;
  }

  /**
   * Detect current execution runtime environment
   */
  static detectEnvironment(): SearchEnvironment {
    if (this.envOverride) return this.envOverride;

    const win = typeof window !== 'undefined' ? (window as any) : {};

    // Check for Capacitor / Cordova / Native SQLite plugin availability
    const isCapacitorNative = win.Capacitor?.isNativePlatform?.() || false;
    const isCordovaNative = !!win.cordova && win.cordova?.platformId !== 'browser';
    const hasSQLitePlugin = !!win.sqlitePlugin || !!win.SQLite;

    if (isCapacitorNative || isCordovaNative || hasSQLitePlugin) {
      return 'APK';
    }

    return 'PWA';
  }

  /**
   * Get the singleton instance of the appropriate Quran Search Provider
   */
  static getProvider(): IQuranSearchProvider {
    const env = this.detectEnvironment();

    if (env === 'APK') {
      if (!this.sqliteInstance) {
        this.sqliteInstance = new SQLiteQuranSearchProvider();
      }
      return this.sqliteInstance;
    }

    if (!this.indexedDBInstance) {
      this.indexedDBInstance = new IndexedDBQuranSearchProvider();
    }
    return this.indexedDBInstance;
  }
}
