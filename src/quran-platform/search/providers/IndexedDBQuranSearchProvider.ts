/**
 * IndexedDB Quran Search Provider (PWA Implementation)
 * Provides offline-first, high-performance search using Browser IndexedDB.
 * Implements IQuranSearchProvider.
 */

import {
  IQuranSearchProvider,
  SearchOptions,
  SurahSearchResult,
  AyahSearchResult,
  PageSearchResult,
  JuzSearchResult,
  HizbSearchResult,
  RubSearchResult,
  UnifiedSearchResult,
  SearchSuggestion
} from '../types';
import { ArabicNormalizer } from '../utils/ArabicNormalizer';
import { QuranDataService } from '../../services/QuranDataService';
import { getCleanSurahName } from '../../components/AyahMarker';

const DB_NAME = 'quran_search_db_v1';
const DB_VERSION = 1;

export class IndexedDBQuranSearchProvider implements IQuranSearchProvider {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private memoryAyahCache: AyahSearchResult[] = [];
  private memorySurahCache: SurahSearchResult[] = [];

  getProviderName(): 'IndexedDB' | 'SQLite' {
    return 'IndexedDB';
  }

  /**
   * Initialize IndexedDB database connection and schema
   */
  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB is not supported in this browser environment.');
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (e) => {
        console.error('Failed to open IndexedDB for Quran Search:', e);
        reject(e);
      };

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // 1. Surahs Store
        if (!db.objectStoreNames.contains('surahs')) {
          const surahStore = db.createObjectStore('surahs', { keyPath: 'number' });
          surahStore.createIndex('cleanName', 'cleanName', { unique: false });
        }

        // 2. Ayahs Store
        if (!db.objectStoreNames.contains('ayahs')) {
          const ayahStore = db.createObjectStore('ayahs', { keyPath: 'ayahNumberInQuran' });
          ayahStore.createIndex('surahNumber', 'surahNumber', { unique: false });
          ayahStore.createIndex('page', 'page', { unique: false });
          ayahStore.createIndex('juz', 'juz', { unique: false });
          ayahStore.createIndex('hizb', 'hizb', { unique: false });
          ayahStore.createIndex('rub', 'rub', { unique: false });
          ayahStore.createIndex('cleanText', 'cleanText', { unique: false });
        }

        // 3. Pages Store
        if (!db.objectStoreNames.contains('pages')) {
          db.createObjectStore('pages', { keyPath: 'pageNumber' });
        }

        // 4. Juzs Store
        if (!db.objectStoreNames.contains('juzs')) {
          db.createObjectStore('juzs', { keyPath: 'juzNumber' });
        }

        // 5. Hizbs Store
        if (!db.objectStoreNames.contains('hizbs')) {
          db.createObjectStore('hizbs', { keyPath: 'hizbNumber' });
        }

        // 6. Rubs Store
        if (!db.objectStoreNames.contains('rubs')) {
          db.createObjectStore('rubs', { keyPath: 'rubNumber' });
        }

        // 7. Search Cache Store
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        await this.ensureDataPopulated();
        resolve();
      };
    });
  }

  async isDataReady(): Promise<boolean> {
    if (!this.db) return false;
    try {
      const tx = this.db.transaction(['surahs'], 'readonly');
      const store = tx.objectStore('surahs');
      return new Promise((resolve) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result >= 114);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  /**
   * Seed IndexedDB with Surahs list, pages, juzs, and initial ayahs if empty
   */
  private async ensureDataPopulated(): Promise<void> {
    if (!this.db) return;

    const isReady = await this.isDataReady();
    if (isReady && this.memorySurahCache.length === 114) return;

    try {
      const surahsData = await QuranDataService.getSurahsList();
      if (!surahsData || surahsData.length === 0) return;

      const tx = this.db.transaction(['surahs', 'pages', 'juzs', 'hizbs', 'rubs'], 'readwrite');
      const surahStore = tx.objectStore('surahs');
      const pageStore = tx.objectStore('pages');
      const juzStore = tx.objectStore('juzs');
      const hizbStore = tx.objectStore('hizbs');
      const rubStore = tx.objectStore('rubs');

      const SURAH_START_PAGES = [
        1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
        221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
        322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
        411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
        477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
        520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
        551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
        570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
        586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
        595, 595, 596, 596, 597, 597, 598, 598, 599, 600,
        600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
        603, 604, 604, 604
      ];

      const surahResults: SurahSearchResult[] = [];

      for (const s of surahsData) {
        const item: SurahSearchResult = {
          number: s.number,
          name: s.name,
          cleanName: ArabicNormalizer.smartNormalize(s.name),
          englishName: s.englishName,
          numberOfAyahs: s.numberOfAyahs,
          revelationType: s.revelationType,
          startPage: SURAH_START_PAGES[s.number - 1] || 1
        };
        surahStore.put(item);
        surahResults.push(item);
      }

      this.memorySurahCache = surahResults;

      // Populate 604 Pages metadata
      for (let p = 1; p <= 604; p++) {
        const surahIdx = SURAH_START_PAGES.findIndex((sp, idx) => {
          const nextSp = SURAH_START_PAGES[idx + 1] || 605;
          return p >= sp && p < nextSp;
        });

        const surahNum = surahIdx !== -1 ? surahIdx + 1 : 1;
        const surahObj = surahsData.find((s: any) => s.number === surahNum);

        pageStore.put({
          pageNumber: p,
          startSurahName: surahObj ? surahObj.name : `سورة ${surahNum}`,
          startAyahNumber: 1,
          juzNumber: Math.min(30, Math.ceil(p / 20.2))
        } as PageSearchResult);
      }

      // Populate 30 Juz metadata
      for (let j = 1; j <= 30; j++) {
        const startPage = Math.min(604, Math.max(1, Math.round((j - 1) * 20.1 + 1)));
        const surahIdx = SURAH_START_PAGES.findIndex((sp, idx) => {
          const nextSp = SURAH_START_PAGES[idx + 1] || 605;
          return startPage >= sp && startPage < nextSp;
        });
        const surahNum = surahIdx !== -1 ? surahIdx + 1 : 1;
        const surahObj = surahsData.find((s: any) => s.number === surahNum);

        juzStore.put({
          juzNumber: j,
          startSurahName: surahObj ? surahObj.name : `سورة ${surahNum}`,
          startAyahNumber: 1,
          startPage: startPage
        } as JuzSearchResult);
      }

      // Populate 60 Hizbs metadata
      for (let h = 1; h <= 60; h++) {
        const startPage = Math.min(604, Math.max(1, Math.round((h - 1) * 10.05 + 1)));
        const surahIdx = SURAH_START_PAGES.findIndex((sp, idx) => {
          const nextSp = SURAH_START_PAGES[idx + 1] || 605;
          return startPage >= sp && startPage < nextSp;
        });
        const surahNum = surahIdx !== -1 ? surahIdx + 1 : 1;
        const surahObj = surahsData.find((s: any) => s.number === surahNum);

        hizbStore.put({
          hizbNumber: h,
          startSurahName: surahObj ? surahObj.name : `سورة ${surahNum}`,
          startAyahNumber: 1,
          startPage: startPage
        } as HizbSearchResult);
      }

      // Populate 240 Rubs metadata
      for (let r = 1; r <= 240; r++) {
        const startPage = Math.min(604, Math.max(1, Math.round((r - 1) * 2.51 + 1)));
        const surahIdx = SURAH_START_PAGES.findIndex((sp, idx) => {
          const nextSp = SURAH_START_PAGES[idx + 1] || 605;
          return startPage >= sp && startPage < nextSp;
        });
        const surahNum = surahIdx !== -1 ? surahIdx + 1 : 1;
        const surahObj = surahsData.find((s: any) => s.number === surahNum);

        rubStore.put({
          rubNumber: r,
          startSurahName: surahObj ? surahObj.name : `سورة ${surahNum}`,
          startAyahNumber: 1,
          startPage: startPage
        } as RubSearchResult);
      }
    } catch (e) {
      console.error('Error seeding IndexedDB Quran metadata:', e);
    }
  }

  /**
   * Search Surahs by name, number, or translation
   */
  async searchSurahs(query: string, options?: SearchOptions): Promise<SurahSearchResult[]> {
    await this.init();
    const cleanQ = ArabicNormalizer.smartNormalize(query);
    if (!cleanQ) return [];

    const numericIntent = ArabicNormalizer.parseNumericIntent(query);

    if (this.memorySurahCache.length > 0) {
      return this.memorySurahCache.filter((s) => {
        if (numericIntent.number && numericIntent.type === 'surah') {
          return s.number === numericIntent.number;
        }
        return (
          s.cleanName.includes(cleanQ) ||
          s.number.toString() === cleanQ ||
          s.englishName.toLowerCase().includes(cleanQ)
        );
      });
    }

    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['surahs'], 'readonly');
      const store = tx.objectStore('surahs');
      const req = store.getAll();

      req.onsuccess = () => {
        const all: SurahSearchResult[] = req.result || [];
        this.memorySurahCache = all;
        const filtered = all.filter((s) => {
          if (numericIntent.number && numericIntent.type === 'surah') {
            return s.number === numericIntent.number;
          }
          return (
            s.cleanName.includes(cleanQ) ||
            s.number.toString() === cleanQ ||
            s.englishName.toLowerCase().includes(cleanQ)
          );
        });
        resolve(filtered);
      };

      req.onerror = () => resolve([]);
    });
  }

  /**
   * Search Ayahs by text, keywords, or location
   */
  async searchAyahs(query: string, options?: SearchOptions): Promise<AyahSearchResult[]> {
    await this.init();
    const cleanQ = ArabicNormalizer.smartNormalize(query);
    if (!cleanQ || cleanQ.length < 2) return [];

    const limit = options?.limit || 50;

    // Check if memory cache exists
    if (this.memoryAyahCache.length > 0) {
      return this.filterAyahsInMemory(cleanQ, options);
    }

    // Attempt to load from IndexedDB or API Cache Storage
    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['ayahs'], 'readonly');
      const store = tx.objectStore('ayahs');
      const req = store.getAll();

      req.onsuccess = async () => {
        let items: AyahSearchResult[] = req.result || [];

        // If IndexedDB ayahs table is empty, try loading cached surahs from QuranDataService
        if (items.length === 0) {
          items = await this.populateAyahsFromCacheService();
        }

        this.memoryAyahCache = items;
        resolve(this.filterAyahsInMemory(cleanQ, options));
      };

      req.onerror = () => resolve([]);
    });
  }

  private filterAyahsInMemory(cleanQ: string, options?: SearchOptions): AyahSearchResult[] {
    const limit = options?.limit || 50;
    const matchType = options?.matchType || 'smart';
    const surahFilter = options?.surahNumber;

    const results: AyahSearchResult[] = [];

    for (const a of this.memoryAyahCache) {
      if (surahFilter && a.surahNumber !== surahFilter) continue;

      let isMatch = false;

      if (matchType === 'exact') {
        isMatch = a.cleanText === cleanQ;
      } else if (matchType === 'partial') {
        isMatch = a.cleanText.includes(cleanQ);
      } else {
        // Smart match: check exact substring or words match
        isMatch = a.cleanText.includes(cleanQ);
      }

      if (isMatch) {
        results.push(a);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  private async populateAyahsFromCacheService(): Promise<AyahSearchResult[]> {
    const ayahsList: AyahSearchResult[] = [];
    try {
      // Fetch surahs list to iterate
      const surahsData = await QuranDataService.getSurahsList();
      if (!surahsData) return [];

      let overallAyahCount = 1;

      // Seed first 10 popular surahs or cached surahs for fast initialization
      for (const s of surahsData) {
        const surahObj = await QuranDataService.getSurah(s.number);
        if (surahObj && surahObj.ayahs) {
          for (const a of surahObj.ayahs) {
            const item: AyahSearchResult = {
              surahNumber: s.number,
              surahName: s.name,
              ayahNumberInSurah: a.numberInSurah,
              ayahNumberInQuran: a.number || overallAyahCount,
              text: a.text,
              cleanText: ArabicNormalizer.smartNormalize(a.text),
              page: a.page || 1,
              juz: a.juz || 1,
              hizb: a.hizbQuarter ? Math.ceil(a.hizbQuarter / 4) : 1,
              rub: a.hizbQuarter || 1
            };
            ayahsList.push(item);
            overallAyahCount++;
          }
        }
      }

      // Store in IndexedDB in background
      if (this.db && ayahsList.length > 0) {
        const tx = this.db.transaction(['ayahs'], 'readwrite');
        const store = tx.objectStore('ayahs');
        for (const item of ayahsList) {
          store.put(item);
        }
      }
    } catch (e) {
      console.warn('Could not pre-populate all ayahs into IndexedDB:', e);
    }
    return ayahsList;
  }

  async searchPages(pageNumber: number): Promise<PageSearchResult[]> {
    await this.init();
    if (pageNumber < 1 || pageNumber > 604) return [];

    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['pages'], 'readonly');
      const store = tx.objectStore('pages');
      const req = store.get(pageNumber);

      req.onsuccess = () => {
        if (req.result) resolve([req.result]);
        else resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  }

  async searchJuz(juzNumber: number): Promise<JuzSearchResult[]> {
    await this.init();
    if (juzNumber < 1 || juzNumber > 30) return [];

    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['juzs'], 'readonly');
      const store = tx.objectStore('juzs');
      const req = store.get(juzNumber);

      req.onsuccess = () => {
        if (req.result) resolve([req.result]);
        else resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  }

  async searchHizb(hizbNumber: number): Promise<HizbSearchResult[]> {
    await this.init();
    if (hizbNumber < 1 || hizbNumber > 60) return [];

    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['hizbs'], 'readonly');
      const store = tx.objectStore('hizbs');
      const req = store.get(hizbNumber);

      req.onsuccess = () => {
        if (req.result) resolve([req.result]);
        else resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  }

  async searchRub(rubNumber: number): Promise<RubSearchResult[]> {
    await this.init();
    if (rubNumber < 1 || rubNumber > 240) return [];

    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['rubs'], 'readonly');
      const store = tx.objectStore('rubs');
      const req = store.get(rubNumber);

      req.onsuccess = () => {
        if (req.result) resolve([req.result]);
        else resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  }

  async searchByKeywords(query: string, options?: SearchOptions): Promise<AyahSearchResult[]> {
    return this.searchAyahs(query, { ...options, matchType: 'smart' });
  }

  async searchExact(query: string, options?: SearchOptions): Promise<AyahSearchResult[]> {
    return this.searchAyahs(query, { ...options, matchType: 'exact' });
  }

  async searchPartial(query: string, options?: SearchOptions): Promise<AyahSearchResult[]> {
    return this.searchAyahs(query, { ...options, matchType: 'partial' });
  }

  /**
   * Unified search across all scopes (Surahs, Ayahs, Pages, Juz, Hizb, Rub)
   */
  async searchUnified(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const startTime = performance.now();
    await this.init();

    const cleanQ = ArabicNormalizer.smartNormalize(query);
    const numericIntent = ArabicNormalizer.parseNumericIntent(query);

    const [surahs, ayahs] = await Promise.all([
      this.searchSurahs(query, options),
      this.searchAyahs(query, options)
    ]);

    let pages: PageSearchResult[] = [];
    let juzs: JuzSearchResult[] = [];
    let hizbs: HizbSearchResult[] = [];
    let rubs: RubSearchResult[] = [];

    if (numericIntent.number) {
      if (numericIntent.type === 'page' || (numericIntent.number >= 1 && numericIntent.number <= 604)) {
        pages = await this.searchPages(numericIntent.number);
      }
      if (numericIntent.type === 'juz' || (numericIntent.number >= 1 && numericIntent.number <= 30)) {
        juzs = await this.searchJuz(numericIntent.number);
      }
      if (numericIntent.type === 'hizb' || (numericIntent.number >= 1 && numericIntent.number <= 60)) {
        hizbs = await this.searchHizb(numericIntent.number);
      }
      if (numericIntent.type === 'rub' || (numericIntent.number >= 1 && numericIntent.number <= 240)) {
        rubs = await this.searchRub(numericIntent.number);
      }
    }

    const totalMatches =
      surahs.length + ayahs.length + pages.length + juzs.length + hizbs.length + rubs.length;

    const endTime = performance.now();

    return {
      query,
      cleanQuery: cleanQ,
      totalMatches,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      providerType: 'IndexedDB',
      surahs,
      ayahs,
      pages,
      juzs,
      hizbs,
      rubs
    };
  }

  /**
   * Auto-suggestions for instant search typing
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    await this.init();
    const cleanQ = ArabicNormalizer.smartNormalize(query);
    if (!cleanQ) return [];

    const suggestions: SearchSuggestion[] = [];
    const numericIntent = ArabicNormalizer.parseNumericIntent(query);

    if (numericIntent.number) {
      if (numericIntent.number >= 1 && numericIntent.number <= 114) {
        const surah = this.memorySurahCache.find((s) => s.number === numericIntent.number);
        if (surah) {
          suggestions.push({
            text: `سورة ${getCleanSurahName(surah.name)}`,
            category: 'سورة',
            targetSurah: surah.number
          });
        }
      }
      if (numericIntent.number >= 1 && numericIntent.number <= 604) {
        suggestions.push({
          text: `الانتقال إلى صفحة ${numericIntent.number}`,
          category: 'صفحة',
          targetPage: numericIntent.number
        });
      }
      if (numericIntent.number >= 1 && numericIntent.number <= 30) {
        suggestions.push({
          text: `الجزء ${numericIntent.number}`,
          category: 'جزء',
          targetJuz: numericIntent.number
        });
      }
    }

    // Surah matches
    const surahMatches = await this.searchSurahs(query);
    for (const s of surahMatches) {
      suggestions.push({
        text: `سورة ${getCleanSurahName(s.name)}`,
        category: 'سورة',
        targetSurah: s.number
      });
    }

    return suggestions;
  }
}
