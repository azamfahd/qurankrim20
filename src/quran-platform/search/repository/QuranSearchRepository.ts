/**
 * Quran Search Repository
 * Abstracts storage access from business logic and components.
 * Interacts only with IQuranSearchProvider provided by QuranSearchProviderFactory.
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
import { QuranSearchProviderFactory } from '../factory/QuranSearchProviderFactory';

export class QuranSearchRepository {
  private static instance: QuranSearchRepository | null = null;

  private constructor() {}

  static getInstance(): QuranSearchRepository {
    if (!this.instance) {
      this.instance = new QuranSearchRepository();
    }
    return this.instance;
  }

  private getProvider(): IQuranSearchProvider {
    return QuranSearchProviderFactory.getProvider();
  }

  async initialize(): Promise<void> {
    const provider = this.getProvider();
    await provider.init();
  }

  async isReady(): Promise<boolean> {
    const provider = this.getProvider();
    return provider.isDataReady();
  }

  getProviderType(): 'IndexedDB' | 'SQLite' {
    return this.getProvider().getProviderName();
  }

  async searchSurahs(query: string, options?: SearchOptions): Promise<SurahSearchResult[]> {
    const provider = this.getProvider();
    return provider.searchSurahs(query, options);
  }

  async searchAyahs(query: string, options?: SearchOptions): Promise<AyahSearchResult[]> {
    const provider = this.getProvider();
    return provider.searchAyahs(query, options);
  }

  async searchPages(pageNumber: number): Promise<PageSearchResult[]> {
    const provider = this.getProvider();
    return provider.searchPages(pageNumber);
  }

  async searchJuz(juzNumber: number): Promise<JuzSearchResult[]> {
    const provider = this.getProvider();
    return provider.searchJuz(juzNumber);
  }

  async searchHizb(hizbNumber: number): Promise<HizbSearchResult[]> {
    const provider = this.getProvider();
    return provider.searchHizb(hizbNumber);
  }

  async searchRub(rubNumber: number): Promise<RubSearchResult[]> {
    const provider = this.getProvider();
    return provider.searchRub(rubNumber);
  }

  async searchUnified(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const provider = this.getProvider();
    return provider.searchUnified(query, options);
  }

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const provider = this.getProvider();
    return provider.getSuggestions(query);
  }
}
