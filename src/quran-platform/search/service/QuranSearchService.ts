/**
 * Quran Search Service
 * High-level business logic layer for Quran Search:
 * - Executes search through QuranSearchRepository
 * - Ranking and relevance scoring
 * - In-memory query caching
 * - Search history management (localStorage & IndexedDB)
 * - Auto-suggestions generation
 * - Debouncing & query normalization
 */

import {
  SearchOptions,
  UnifiedSearchResult,
  SearchSuggestion,
  SearchHistoryItem
} from '../types';
import { QuranSearchRepository } from '../repository/QuranSearchRepository';
import { ArabicNormalizer } from '../utils/ArabicNormalizer';

const HISTORY_STORAGE_KEY = 'quran_search_history_v1';
const MAX_HISTORY_ITEMS = 15;

export class QuranSearchService {
  private static instance: QuranSearchService | null = null;
  private repository: QuranSearchRepository;
  private queryCache = new Map<string, UnifiedSearchResult>();

  private constructor() {
    this.repository = QuranSearchRepository.getInstance();
  }

  static getInstance(): QuranSearchService {
    if (!this.instance) {
      this.instance = new QuranSearchService();
    }
    return this.instance;
  }

  /**
   * Initialize underlying repository and database
   */
  async init(): Promise<void> {
    await this.repository.initialize();
  }

  /**
   * Get current database provider type ('IndexedDB' or 'SQLite')
   */
  getProviderType(): 'IndexedDB' | 'SQLite' {
    return this.repository.getProviderType();
  }

  /**
   * Execute unified smart search with caching and history saving
   */
  async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        query: '',
        cleanQuery: '',
        totalMatches: 0,
        executionTimeMs: 0,
        providerType: this.getProviderType(),
        surahs: [],
        ayahs: [],
        pages: [],
        juzs: [],
        hizbs: [],
        rubs: []
      };
    }

    const cleanQ = ArabicNormalizer.smartNormalize(trimmed);
    const cacheKey = `${cleanQ}_${options?.scope || 'all'}_${options?.matchType || 'smart'}`;

    // Return cached result if available
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    await this.init();

    // Execute via repository
    const result = await this.repository.searchUnified(trimmed, options);

    // Apply relevance scoring to results
    this.rankResults(result, cleanQ);

    // Cache result
    this.queryCache.set(cacheKey, result);

    // Save to search history if matches were found
    if (result.totalMatches > 0 && trimmed.length >= 2) {
      this.addToHistory(trimmed, result.totalMatches);
    }

    return result;
  }

  /**
   * Score and rank search results by relevance
   */
  private rankResults(result: UnifiedSearchResult, cleanQ: string): void {
    // Rank Surahs: Exact name match first
    result.surahs.sort((a, b) => {
      if (a.cleanName === cleanQ) return -1;
      if (b.cleanName === cleanQ) return 1;
      if (a.cleanName.startsWith(cleanQ) && !b.cleanName.startsWith(cleanQ)) return -1;
      if (b.cleanName.startsWith(cleanQ) && !a.cleanName.startsWith(cleanQ)) return 1;
      return a.number - b.number;
    });

    // Rank Ayahs: Matches at start of Ayah get higher score
    result.ayahs.sort((a, b) => {
      const idxA = a.cleanText.indexOf(cleanQ);
      const idxB = b.cleanText.indexOf(cleanQ);

      if (idxA === 0 && idxB !== 0) return -1;
      if (idxB === 0 && idxA !== 0) return 1;

      return a.surahNumber - b.surahNumber || a.ayahNumberInSurah - b.ayahNumberInSurah;
    });
  }

  /**
   * Get auto-complete suggestions
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim()) return [];
    await this.init();
    return this.repository.getSuggestions(query);
  }

  /**
   * Get recent search history
   */
  getHistory(): SearchHistoryItem[] {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  /**
   * Add query to search history
   */
  addToHistory(query: string, resultsCount: number): void {
    try {
      let history = this.getHistory();
      // Remove existing duplicate
      history = history.filter((item) => item.query.trim() !== query.trim());

      history.unshift({
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
        resultsCount
      });

      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear search history:', e);
    }
  }

  /**
   * Remove single item from history
   */
  removeFromHistory(id: string): void {
    try {
      const history = this.getHistory().filter((item) => item.id !== id);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to remove item from history:', e);
    }
  }
}
