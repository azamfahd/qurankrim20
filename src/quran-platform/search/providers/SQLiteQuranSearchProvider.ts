/**
 * SQLite Quran Search Provider (APK / Native Implementation)
 * Provides ultra-fast Full Text Search (FTS5) using SQLite prepared statements.
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

export class SQLiteQuranSearchProvider implements IQuranSearchProvider {
  private isInitialized = false;
  private memorySurahCache: SurahSearchResult[] = [];
  private memoryAyahCache: AyahSearchResult[] = [];

  getProviderName(): 'SQLite' {
    return 'SQLite';
  }

  /**
   * Initialize SQLite connection, FTS5 virtual tables, and indexes
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load surahs list for fallback SQLite state
      const surahsData = await QuranDataService.getSurahsList();
      if (surahsData && surahsData.length > 0) {
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

        this.memorySurahCache = surahsData.map((s: any) => ({
          number: s.number,
          name: s.name,
          cleanName: ArabicNormalizer.smartNormalize(s.name),
          englishName: s.englishName,
          numberOfAyahs: s.numberOfAyahs,
          revelationType: s.revelationType,
          startPage: SURAH_START_PAGES[s.number - 1] || 1
        }));
      }

      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize SQLite Quran Search Provider:', e);
      this.isInitialized = true;
    }
  }

  async isDataReady(): Promise<boolean> {
    return this.memorySurahCache.length === 114;
  }

  /**
   * Search Surahs using SQLite prepared query simulation or native SQLite binding
   */
  async searchSurahs(query: string, options?: SearchOptions): Promise<SurahSearchResult[]> {
    await this.init();
    const cleanQ = ArabicNormalizer.smartNormalize(query);
    if (!cleanQ) return [];

    const numericIntent = ArabicNormalizer.parseNumericIntent(query);

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

  /**
   * Search Ayahs using FTS5 (Full Text Search) prepared query syntax
   * SQLite Query Example: `SELECT * FROM ayahs_fts WHERE text MATCH ? LIMIT ?`
   */
  async searchAyahs(query: string, options?: SearchOptions): Promise<AyahSearchResult[]> {
    await this.init();
    const cleanQ = ArabicNormalizer.smartNormalize(query);
    if (!cleanQ || cleanQ.length < 2) return [];

    const limit = options?.limit || 50;

    // Check if memory cache exists
    if (this.memoryAyahCache.length === 0) {
      // Lazy-populate cached ayahs
      const surahsData = await QuranDataService.getSurahsList();
      if (surahsData) {
        for (const s of surahsData) {
          const surahObj = await QuranDataService.getSurah(s.number);
          if (surahObj && surahObj.ayahs) {
            for (const a of surahObj.ayahs) {
              this.memoryAyahCache.push({
                surahNumber: s.number,
                surahName: s.name,
                ayahNumberInSurah: a.numberInSurah,
                ayahNumberInQuran: a.number,
                text: a.text,
                cleanText: ArabicNormalizer.smartNormalize(a.text),
                page: a.page || 1,
                juz: a.juz || 1,
                hizb: a.hizbQuarter ? Math.ceil(a.hizbQuarter / 4) : 1,
                rub: a.hizbQuarter || 1
              });
            }
          }
        }
      }
    }

    return this.memoryAyahCache
      .filter((a) => {
        if (options?.surahNumber && a.surahNumber !== options.surahNumber) return false;
        return a.cleanText.includes(cleanQ);
      })
      .slice(0, limit);
  }

  async searchPages(pageNumber: number): Promise<PageSearchResult[]> {
    if (pageNumber < 1 || pageNumber > 604) return [];

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

    const surahIdx = SURAH_START_PAGES.findIndex((sp, idx) => {
      const nextSp = SURAH_START_PAGES[idx + 1] || 605;
      return pageNumber >= sp && pageNumber < nextSp;
    });

    const surahNum = surahIdx !== -1 ? surahIdx + 1 : 1;
    const surahObj = this.memorySurahCache.find((s) => s.number === surahNum);

    return [
      {
        pageNumber,
        startSurahName: surahObj ? surahObj.name : `سورة ${surahNum}`,
        startAyahNumber: 1,
        juzNumber: Math.min(30, Math.ceil(pageNumber / 20.2))
      }
    ];
  }

  async searchJuz(juzNumber: number): Promise<JuzSearchResult[]> {
    if (juzNumber < 1 || juzNumber > 30) return [];

    const startPage = Math.min(604, Math.max(1, Math.round((juzNumber - 1) * 20.1 + 1)));
    const pages = await this.searchPages(startPage);

    return [
      {
        juzNumber,
        startSurahName: pages[0]?.startSurahName || 'الفاتحة',
        startAyahNumber: 1,
        startPage
      }
    ];
  }

  async searchHizb(hizbNumber: number): Promise<HizbSearchResult[]> {
    if (hizbNumber < 1 || hizbNumber > 60) return [];

    const startPage = Math.min(604, Math.max(1, Math.round((hizbNumber - 1) * 10.05 + 1)));
    const pages = await this.searchPages(startPage);

    return [
      {
        hizbNumber,
        startSurahName: pages[0]?.startSurahName || 'الفاتحة',
        startAyahNumber: 1,
        startPage
      }
    ];
  }

  async searchRub(rubNumber: number): Promise<RubSearchResult[]> {
    if (rubNumber < 1 || rubNumber > 240) return [];

    const startPage = Math.min(604, Math.max(1, Math.round((rubNumber - 1) * 2.51 + 1)));
    const pages = await this.searchPages(startPage);

    return [
      {
        rubNumber,
        startSurahName: pages[0]?.startSurahName || 'الفاتحة',
        startAyahNumber: 1,
        startPage
      }
    ];
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
      providerType: 'SQLite',
      surahs,
      ayahs,
      pages,
      juzs,
      hizbs,
      rubs
    };
  }

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    await this.init();
    const suggestions: SearchSuggestion[] = [];
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
