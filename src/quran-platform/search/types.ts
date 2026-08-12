/**
 * Quran Search Engine - Types & Abstraction Layer
 * Defines interfaces and data structures for PWA (IndexedDB) and APK (SQLite) search engine.
 */

export type SearchResultType = 'all' | 'surah' | 'ayah' | 'page' | 'juz' | 'hizb' | 'rub';

export type MatchType = 'smart' | 'exact' | 'partial';

export interface SearchOptions {
  scope?: SearchResultType;
  matchType?: MatchType;
  limit?: number;
  offset?: number;
  surahNumber?: number;
}

export interface SurahSearchResult {
  number: number;
  name: string;
  cleanName: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
  startPage: number;
  score?: number;
}

export interface AyahSearchResult {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  ayahNumberInQuran: number;
  text: string;
  cleanText: string;
  page: number;
  juz: number;
  hizb: number;
  rub: number;
  score?: number;
  matchRanges?: [number, number][];
}

export interface PageSearchResult {
  pageNumber: number;
  startSurahName: string;
  startAyahNumber: number;
  juzNumber: number;
}

export interface JuzSearchResult {
  juzNumber: number;
  startSurahName: string;
  startAyahNumber: number;
  startPage: number;
}

export interface HizbSearchResult {
  hizbNumber: number;
  startSurahName: string;
  startAyahNumber: number;
  startPage: number;
}

export interface RubSearchResult {
  rubNumber: number;
  startSurahName: string;
  startAyahNumber: number;
  startPage: number;
}

export interface UnifiedSearchResult {
  query: string;
  cleanQuery: string;
  totalMatches: number;
  executionTimeMs: number;
  providerType: 'IndexedDB' | 'SQLite';
  surahs: SurahSearchResult[];
  ayahs: AyahSearchResult[];
  pages: PageSearchResult[];
  juzs: JuzSearchResult[];
  hizbs: HizbSearchResult[];
  rubs: RubSearchResult[];
}

export interface SearchSuggestion {
  text: string;
  category: 'سورة' | 'عبارة' | 'صفحة' | 'جزء' | 'رقم';
  targetSurah?: number;
  targetPage?: number;
  targetJuz?: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultsCount: number;
}

/**
 * Interface for Quran Search Provider
 * Abstract interface implemented by IndexedDBQuranSearchProvider (PWA) and SQLiteQuranSearchProvider (APK)
 */
export interface IQuranSearchProvider {
  init(): Promise<void>;
  getProviderName(): 'IndexedDB' | 'SQLite';
  searchSurahs(query: string, options?: SearchOptions): Promise<SurahSearchResult[]>;
  searchAyahs(query: string, options?: SearchOptions): Promise<AyahSearchResult[]>;
  searchPages(pageNumber: number): Promise<PageSearchResult[]>;
  searchJuz(juzNumber: number): Promise<JuzSearchResult[]>;
  searchHizb(hizbNumber: number): Promise<HizbSearchResult[]>;
  searchRub(rubNumber: number): Promise<RubSearchResult[]>;
  searchByKeywords(query: string, options?: SearchOptions): Promise<AyahSearchResult[]>;
  searchExact(query: string, options?: SearchOptions): Promise<AyahSearchResult[]>;
  searchPartial(query: string, options?: SearchOptions): Promise<AyahSearchResult[]>;
  searchUnified(query: string, options?: SearchOptions): Promise<UnifiedSearchResult>;
  getSuggestions(query: string): Promise<SearchSuggestion[]>;
  isDataReady(): Promise<boolean>;
}
